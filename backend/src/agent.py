import logging
import json
import os
from datetime import datetime, timedelta
from typing import Annotated

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

# --- 1. MOCK DATE LOGIC ---
class MockCalendar:
    _day_offset = 0

    @classmethod
    def get_current_date(cls):
        # Start from a fixed date (e.g., Nov 23, 2025)
        base_date = datetime(2025, 11, 23)
        current_simulated = base_date + timedelta(days=cls._day_offset)
        return current_simulated.strftime("%Y-%m-%d")

    @classmethod
    def next_day(cls):
        cls._day_offset += 1

# --- 2. JSON PERSISTENCE HELPER ---
DB_FILE = "wellness_log.json"

class WellnessDatabase:
    @staticmethod
    def load_logs():
        if not os.path.exists(DB_FILE):
            return []
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except:
            return []

    @staticmethod
    def save_log(entry):
        history = WellnessDatabase.load_logs()
        history.append(entry)
        with open(DB_FILE, "w") as f:
            json.dump(history, f, indent=2)

    @staticmethod
    def get_last_entry():
        logs = WellnessDatabase.load_logs()
        return logs[-1] if logs else None

# --- 3. ASSISTANT CLASS WITH TOOLS ---
class Assistant(Agent):
    def __init__(self, system_prompt: str) -> None:
        super().__init__(
            instructions=system_prompt,
        )

    @function_tool
    async def save_checkin(
        self, 
        context: RunContext, 
        mood: Annotated[str, "The user's reported mood"],
        goals: Annotated[str, "The user's 1-3 objectives for the day"],
        summary: Annotated[str, "A brief agent-generated summary of the session"]
    ):
        """
        Save the wellness check-in summary to the database when the conversation ends.
        Call this tool immediately after recapping the conversation to the user.
        """
        date = MockCalendar.get_current_date()
        entry = {
            "date": date,
            "mood": mood,
            "goals": goals,
            "summary": summary
        }
        WellnessDatabase.save_log(entry)
        logger.info(f"Saved wellness log for {date}")
        return f"Successfully saved log for {date}. You can now say goodbye."

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

async def entrypoint(ctx: JobContext):
    # Logging setup
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # --- 4. PREPARE DAY 3 CONTEXT ---
    MockCalendar.next_day()
    current_date = MockCalendar.get_current_date()
    
    last_log = WellnessDatabase.get_last_entry()
    history_context = "This is the first session with the user. Welcome them warmly."
    
    if last_log:
        history_context = (
            f"PREVIOUS SESSION DATA (Date: {last_log['date']}):\n"
            f"- Previous Mood: {last_log['mood']}\n"
            f"- Previous Goals: {last_log['goals']}\n"
            f"- Summary: {last_log['summary']}\n"
            "Use this to warmly welcome the user back and ask how their previous goals went."
        )

    # --- 5. DEFINE SYSTEM PROMPT ---
    system_prompt = f"""
    You are a grounded, supportive Health & Wellness Voice Companion.
    CURRENT SIMULATED DATE: {current_date}
    
    ROLE:
    - Ask about mood, energy, and stress.
    - Ask for 1-3 simple, practical objectives for the day.
    - Offer non-medical, grounded advice (e.g., "take a walk", "break tasks down").
    - NEVER diagnose medical conditions or give clinical advice.
    - Your responses are concise, to the point, and without complex formatting.
    
    CONTEXT FROM HISTORY:
    {history_context}
    
    PROTOCOL:
    1. Start by welcoming the user (referencing past history if available).
    2. Ask about mood/energy.
    3. Ask about today's goals.
    4. Provide a realistic reflection/advice.
    5. RECAP the conversation (Mood + Goals).
    6. IMPORTANT: Call the `save_checkin` tool to save the data.
    7. Say goodbye.
    """

    # Set up a voice AI pipeline
    session = AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=google.LLM(
            model="gemini-2.5-flash",
        ),
        tts=murf.TTS(
            voice="en-US-matthew", 
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True
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

    # Start the session with the Assistant instance containing the specific prompt
    await session.start(
        agent=Assistant(system_prompt=system_prompt),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))