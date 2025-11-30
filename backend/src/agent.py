import logging
import json
import os
from datetime import datetime
from typing import List, Dict, Optional

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    WorkerOptions,
    cli,
    metrics,
    tokenize,
    function_tool,
    RunContext,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# ------------------------------------------------------------------------------------
# JSON FILE HELPERS
# ------------------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRODUCTS_FILE = os.path.join(BASE_DIR, "products.json")
ORDERS_FILE = os.path.join(BASE_DIR, "orders.json")


def load_json(path):
    """Load JSON from file; if missing, return empty list"""
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []


def save_json(path, data):
    """Write JSON safely to file"""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)


# Load product + order data
PRODUCTS: List[Dict] = load_json(PRODUCTS_FILE)
ORDERS: List[Dict] = load_json(ORDERS_FILE)


# ------------------------------------------------------------------------------------
# PRODUCT FILTERING + ORDER CREATION
# ------------------------------------------------------------------------------------

def filter_products(filters: dict | None = None) -> List[Dict]:
    if not filters:
        return PRODUCTS

    result = PRODUCTS

    if "category" in filters:
        result = [p for p in result if p["category"] == filters["category"]]

    if "color" in filters:
        result = [p for p in result if p.get("color") == filters["color"]]

    if "max_price" in filters:
        result = [p for p in result if p["price"] <= filters["max_price"]]

    return result


def create_order(items: list) -> dict:
    """
    items = [{ "product_id": "...", "quantity": 1 }]
    """
    product_id = items[0]["product_id"]
    quantity = items[0]["quantity"]

    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        return {"error": "Product not found"}

    order = {
        "id": f"order-{len(ORDERS) + 1}",
        "items": items,
        "total": product["price"] * quantity,
        "currency": product["currency"],
        "created_at": datetime.now().isoformat(),
    }

    # append + save to file
    ORDERS.append(order)
    save_json(ORDERS_FILE, ORDERS)

    return order


def get_last_order() -> Optional[dict]:
    return ORDERS[-1] if ORDERS else None


# ------------------------------------------------------------------------------------
# MAIN SHOPPING AGENT
# ------------------------------------------------------------------------------------

logger = logging.getLogger("agent")
load_dotenv(".env.local")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""
You are a voice-based shopping assistant.

You ALWAYS use the available tools for shopping:
- list_products(filters)
- place_order(items)
- last_order()

NEVER fabricate product data. ALWAYS call the tool.

Filters may include: category, color, max_price.

Be concise and natural.
            """,
        )

    @function_tool
    async def list_products(self, ctx: RunContext, filters: dict):
        products = filter_products(filters)
        return {"products": products}

    @function_tool
    async def place_order(self, ctx: RunContext, items: list):
        return create_order(items)

    @function_tool
    async def last_order(self, ctx: RunContext):
        return get_last_order() or {"message": "No orders yet."}


# ------------------------------------------------------------------------------------
# LIVEKIT SESSION
# ------------------------------------------------------------------------------------

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    session = AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=google.LLM(model="gemini-2.5-flash"),
        tts=murf.TTS(
            voice="en-US-matthew",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
