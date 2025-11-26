import os
import json
import logging

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
    RunContext
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

FAQ_PATH = "shared-data/blue_tokai_faq.json"
LEADS_PATH = "shared-data/leads.json"


# --------------------------
# Ensure shared-data folder
# --------------------------
def ensure_paths():
    if not os.path.exists("shared-data"):
        os.makedirs("shared-data")

    if not os.path.exists(FAQ_PATH):
        with open(FAQ_PATH, "w") as f:
            json.dump([], f)

    if not os.path.exists(LEADS_PATH):
        with open(LEADS_PATH, "w") as f:
            json.dump([], f)


ensure_paths()


# --------------------------
# SDR Assistant with Tools
# --------------------------
class Assistant(Agent):
    def __init__(self):
        super().__init__(
            instructions="""
You are an SDR (Sales Development Representative) voice agent for Blue Tokai Coffee Roasters.

Your responsibilities:
- Greet warmly.
- Understand what the user is looking for.
- Answer company/product/pricing questions ONLY using the FAQ content provided via load_faq tool.
- Never invent answers outside the FAQ.

FAQ lookup:
- Call load_faq to retrieve stored FAQ entries.
- Match user questions by keyword and respond concisely.

Lead collection:
You must gather these fields naturally:
- name
- company
- email
- role
- use_case
- team_size
- timeline

When the user signals the end (e.g., “that's all”, “done”, “thanks”), do this:
- Summarize the lead.
- Call save_lead with the dictionary of collected fields.

Rules:
- Stay friendly and concise.
- Keep conversation focused on identifying user needs.
- DO NOT produce code or symbols.
""",
        )

    # --------------------------
    # Load FAQ Tool
    # --------------------------
    @function_tool
    async def load_faq(self, ctx: RunContext):
        """Load Blue Tokai FAQ from JSON file."""
        ensure_paths()
        with open(FAQ_PATH, "r") as f:
            return json.load(f)

    # --------------------------
    # Save Lead Tool
    # --------------------------
    @function_tool
    async def save_lead(self, ctx: RunContext, lead: dict):
        """Append a lead entry to leads.json."""
        ensure_paths()

        try:
            with open(LEADS_PATH, "r") as f:
                data = json.load(f)
        except:
            data = []

        data.append(lead)

        with open(LEADS_PATH, "w") as f:
            json.dump(data, f, indent=2)

        return "Lead saved successfully."


# --------------------------
# Prewarm VAD
# --------------------------
def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


# --------------------------
# Entry point — unchanged
# --------------------------
async def entrypoint(ctx: JobContext):

    ctx.log_context_fields = {"room": ctx.room.name}

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
    def _on_metrics(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        logger.info(f"Usage: {usage_collector.get_summary()}")

    ctx.add_shutdown_callback(log_usage)

    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC()
        ),
    )

    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
