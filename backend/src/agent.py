import json
import asyncio
import logging
import traceback
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from typing import Annotated, Optional, Dict, Any, List

from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    RoomInputOptions,
    WorkerOptions,
    cli,
    function_tool,
    RunContext,
    llm,
    metrics,
)

from livekit.plugins import murf, deepgram, google, silero, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

env = Path(__file__).parent.parent / ".env.local"
load_dotenv(env)


# ============================================================
# JSON STORAGE HELPERS
# ============================================================

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "shared-data"
CONTENT_PATH = DATA_DIR / "day4_tutor_content.json"

def load_json(path: Path, default):
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(default, f, indent=2)
        return default
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception:
        return default

def save_json(path: Path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


# ============================================================
# ACTIVE RECALL COACH AGENT
# ============================================================

class ActiveRecallCoach(Agent):

    def __init__(self):
        self.content = load_json(CONTENT_PATH, [])

        self.current_mode = "learn"
        self.current_concept_id: Optional[str] = None

        # voices for each mode
        self.voice_ids = {
            "learn": "en-US-matthew",
            "quiz": "en-US-alicia",
            "teach_back": "en-US-ken",
        }

        super().__init__(instructions=self._build_instructions())

        # livekit session reference (assigned later)
        self.session_ref: Optional[AgentSession] = None

    # ---------------------------------------------------------
    # JSON Concept Handling
    # ---------------------------------------------------------
    def _get_concept(self, name: str):
        """Return concept dict if exists."""
        name_lower = name.strip().lower()
        for c in self.content:
            if c["id"].lower() == name_lower:
                return c
            if c["title"].lower() == name_lower:
                return c
        return None

    def _add_concept(self, name: str):
        """Create concept dynamically if not present."""
        new_id = name.lower().replace(" ", "_")
        concept = {
            "id": new_id,
            "title": name,
            "summary": f"This is an auto-generated summary for {name}.",
            "sample_question": f"What is {name}?"
        }
        self.content.append(concept)
        save_json(CONTENT_PATH, self.content)
        return concept

    # ---------------------------------------------------------
    # Instructions Generator (LLM system prompt)
    # ---------------------------------------------------------
    def _build_instructions(self) -> str:
        return f"""
You are an **Active Recall Coach** (like Physics Wallah, but English only).

Current Mode: {self.current_mode.upper()}
Current Concept: {self.current_concept_id}

Rules:
- ALWAYS teach with high energy.
- Keep responses short (voice assistant).
- If user mentions a concept name, call switch_mode(concept_name=...).
- If user says "quiz me" → switch_mode("quiz")
- If user says "teach back" → switch_mode("teach_back")
- If user says "explain" or "teach me" → switch_mode("learn")

Concept Database:
{json.dumps(self.content, indent=2)}
"""

    # ---------------------------------------------------------
    # TOOL: SWITCH MODE + CONCEPT
    # ---------------------------------------------------------
    @function_tool
    async def switch_mode(
        self,
        ctx: RunContext,
        mode: Annotated[Optional[str], "learn | quiz | teach_back"] = None,
        concept_name: Annotated[Optional[str], "Any concept name, no ID needed"] = None,
    ):
        try:
            # --- set mode ---
            if mode:
                self.current_mode = mode

            # --- set concept by NAME, create if needed ---
            if concept_name:
                existing = self._get_concept(concept_name)
                if not existing:
                    existing = self._add_concept(concept_name)
                self.current_concept_id = existing["id"]

            # if no concept chosen yet → auto-select first
            if not self.current_concept_id and self.content:
                self.current_concept_id = self.content[0]["id"]

            # --- change voice ---
            if self.session_ref and self.session_ref.tts:
                try:
                    new_voice = self.voice_ids.get(self.current_mode, "en-US-matthew")
                    await asyncio.to_thread(
                        self.session_ref.tts.update_options,
                        voice=new_voice
                    )
                except Exception as e:
                    logger.error(f"Voice switch error: {e}")

            # update instructions
            self.instructions = self._build_instructions()

            return f"Mode → {self.current_mode}, Concept → {self.current_concept_id}"

        except Exception as e:
            logger.error(traceback.format_exc())
            return f"Error switching mode: {e}"

    # ---------------------------------------------------------
    # TOOL: Teach-back evaluation
    # ---------------------------------------------------------
    @function_tool
    async def evaluate_teach_back(
        self,
        ctx: RunContext,
        user_explanation: str,
    ):
        return "Evaluate the user explanation now."


# ============================================================
# LIVEKIT ENTRYPOINT
# ============================================================

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    try:
        coach = ActiveRecallCoach()

        session = AgentSession(
            stt=deepgram.STT(model="nova-3"),
            llm=google.LLM(model="gemini-2.0-flash"),
            tts=murf.TTS(voice=coach.voice_ids["learn"]),
            vad=ctx.proc.userdata["vad"],
            turn_detection=MultilingualModel(),
            preemptive_generation=True,
        )

        coach.session_ref = session

        await session.start(
            agent=coach,
            room=ctx.room,
            room_input_options=RoomInputOptions(
                noise_cancellation=noise_cancellation.BVC(),
            ),
        )

        await ctx.connect()

    except Exception:
        logger.error(traceback.format_exc())
        raise


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
