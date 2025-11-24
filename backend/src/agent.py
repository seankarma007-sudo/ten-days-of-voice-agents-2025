import logging
import json
import os
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
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

def load_content():
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        content_path = os.path.join(base_dir, "shared-data", "day4_tutor_content.json")
        with open(content_path, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load content: {e}")
        return []

CONTENT = load_content()

def get_voice_for_mode(mode: str):
    if mode == "learn":
        return "en-US-matthew"
    elif mode == "quiz":
        return "en-US-alicia"
    elif mode == "teach_back":
        return "en-US-ken"
    return "en-US-matthew"

class BaseTutorAgent(Agent):
    def __init__(self, instructions: str):
        super().__init__(instructions=instructions)

    @function_tool
    async def switch_mode(self, session: AgentSession, mode: str):
        """Switch to a different learning mode. Available modes: 'learn', 'quiz', 'teach_back'."""
        logger.info(f"Switching to mode: {mode}")
        
        voice = get_voice_for_mode(mode)
        # Update TTS voice
        session.tts = murf.TTS(
            voice=voice,
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True
        )
        
        if mode == "learn":
            return LearnAgent()
        elif mode == "quiz":
            return QuizAgent()
        elif mode == "teach_back":
            return TeachBackAgent()
        else:
            return "Invalid mode. Please choose learn, quiz, or teach_back."

class LearnAgent(BaseTutorAgent):
    def __init__(self):
        content_str = json.dumps(CONTENT, indent=2)
        super().__init__(
            instructions=f"""You are a knowledgeable tutor in LEARN mode. 
            Your goal is to explain the following concepts clearly to the user:
            {content_str}
            
            Use the 'summary' field to explain. Be patient and clear.
            If the user wants to switch modes, use the switch_mode tool.
            """
        )

class QuizAgent(BaseTutorAgent):
    def __init__(self):
        content_str = json.dumps(CONTENT, indent=2)
        super().__init__(
            instructions=f"""You are a quiz master in QUIZ mode.
            Your goal is to ask the user questions based on these concepts:
            {content_str}
            
            Use the 'sample_question' field to ask questions. Wait for the user's answer and give feedback.
            If the user wants to switch modes, use the switch_mode tool.
            """
        )

class TeachBackAgent(BaseTutorAgent):
    def __init__(self):
        content_str = json.dumps(CONTENT, indent=2)
        super().__init__(
            instructions=f"""You are a student in TEACH-BACK mode.
            Your goal is to ask the user to explain concepts to YOU.
            Concepts:
            {content_str}
            
            Ask the user to explain a concept (e.g. "Can you explain Variables to me?").
            Listen to their explanation and give qualitative feedback based on the 'summary'.
            If the user wants to switch modes, use the switch_mode tool.
            """
        )

class GreeterAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="""You are a friendly tutor assistant.
            Greet the user and ask them which learning mode they would like to start with:
            1. Learn (I will explain concepts)
            2. Quiz (I will test your knowledge)
            3. Teach-back (You explain to me)
            
            Wait for their response and then use the switch_mode tool to start the session.
            """
        )

    @function_tool
    async def switch_mode(self, session: AgentSession, mode: str):
        """Start the session in the chosen mode. Available modes: 'learn', 'quiz', 'teach_back'."""
        logger.info(f"Starting mode: {mode}")
        
        voice = get_voice_for_mode(mode)
        session.tts = murf.TTS(
            voice=voice,
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True
        )

        if mode == "learn":
            return LearnAgent()
        elif mode == "quiz":
            return QuizAgent()
        elif mode == "teach_back":
            return TeachBackAgent()
        else:
            return "Please choose a valid mode: learn, quiz, or teach_back."

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

async def entrypoint(ctx: JobContext):
    # Logging setup
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

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

    await session.start(
        agent=GreeterAgent(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await ctx.connect()

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
