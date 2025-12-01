import logging
import random
import asyncio
from typing import List, Optional, Dict
from dataclasses import dataclass, asdict

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
    stt,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# --- Game Data & State ---

@dataclass
class Scenario:
    role: str
    setting: str
    conflict: str
    twist: str

    def to_prompt(self) -> str:
        return f"Role: {self.role}. Setting: {self.setting}. Conflict: {self.conflict}. Twist: {self.twist}"

SCENARIOS = [
    Scenario("Time Traveler", "A busy Victorian street", "Explaining a smartphone to a skeptical chimney sweep", "You must pretend it's magic to avoid being arrested."),
    Scenario("Barista", "Interdimensional Coffee Shop", "Customer's latte is actually a portal", "The customer is late for a meeting inside the latte."),
    Scenario("Waiter", "Fancy French Restaurant", "Telling a customer their order escaped the kitchen", "The order was a live lobster that is now holding the chef hostage."),
    Scenario("Tech Support", "Hell's IT Department", "Helping a demon reset their pitchfork password", "The demon is very polite but keeps accidentally setting things on fire."),
    Scenario("Real Estate Agent", "Haunted House Open House", "Selling a house while ghosts are throwing furniture", "You must convince the buyers it's a 'feature'."),
    Scenario("Astronaut", "Mars Colony Customs", "Smuggling a pet rock onto Mars", "The rock has started singing opera."),
    Scenario("Teacher", "Kindergarten for Supervillains", "Teaching sharing to mini-Lex Luthors", "One kid just built a death ray out of macaroni."),
    Scenario("Uber Driver", "Getaway Car", "Driving bank robbers who rated you 1 star previously", "You are refusing to drive fast until they update the rating."),
    Scenario("Chef", "Alien Cooking Show", "Cooking a dish that tries to eat the judges", "You must narrate it like a calm PBS show."),
    Scenario("Detective", "Crime Scene at a Clown College", "Interrogating a mime witness", "You have to translate their invisible box gestures."),
]

class ImprovGame:
    def __init__(self):
        self.player_name: Optional[str] = None
        self.current_round: int = 0
        self.max_rounds: int = 3
        self.phase: str = "intro"  # intro, awaiting_improv, reacting, done
        self.rounds: List[Dict] = []
        self.current_scenario: Optional[Scenario] = None
        self.used_scenarios: List[int] = []

    def get_next_scenario(self) -> Scenario:
        available_indices = [i for i in range(len(SCENARIOS)) if i not in self.used_scenarios]
        if not available_indices:
            self.used_scenarios = [] # Reset if we run out
            available_indices = range(len(SCENARIOS))
        
        idx = random.choice(available_indices)
        self.used_scenarios.append(idx)
        self.current_scenario = SCENARIOS[idx]
        return self.current_scenario

    def next_phase(self):
        if self.phase == "intro":
            self.phase = "awaiting_improv"
            self.current_round = 1
            self.get_next_scenario()
        elif self.phase == "awaiting_improv":
            self.phase = "reacting"
        elif self.phase == "reacting":
            if self.current_round >= self.max_rounds:
                self.phase = "done"
            else:
                self.phase = "awaiting_improv"
                self.current_round += 1
                self.get_next_scenario()

# --- Agent Implementation ---

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are the high-energy, witty, fast-thinking TV host of a show called 'Improv Battle'.
            Your role is to guide the player through improv scenarios, create fun setups, and react realistically.
            
            TONE:
            - Energetic, charismatic, humorous.
            - Lightly teasing but never mean.
            - Varied reactions: Supportive (40%), Neutral (35%), Mildly Critical (25%).
            
            STRUCTURE:
            - Intro: Welcome the player. If name is unknown, ask for it. Explain rules briefly.
            - Rounds: Announce the scenario clearly. Say "Start your improv!". Wait for user.
            - Reaction: React to what they said. Be specific. Then move to next round or end.
            - Summary: After 3 rounds, summarize their performance and say goodbye.
            
            SAFETY:
            - No abusive comments.
            - Keep it fun and safe.
            """,
        )
        self.game = ImprovGame()
        self._session: Optional[AgentSession] = None

    async def on_start(self, session: AgentSession):
        self._session = session
        # Start the intro immediately
        await self.speak_intro()

    async def speak_intro(self):
        intro_text = "Welcome to the Improv Battle Arena! I'm your host, the AI with the wry eye. Let's get this show on the road! First things first, what's your name, challenger?"
        await self._session.response.say(intro_text)

    async def start_round(self):
        scenario = self.game.current_scenario
        prompt = f"Round {self.game.current_round}! Here is your scenario: {scenario.to_prompt()} ... And... ACTION!"
        await self._session.response.say(prompt)

    async def provide_reaction(self, user_text: str):
        # Generate reaction using LLM context (handled by standard Agent logic, but we guide it via instructions)
        # We trigger a response which will naturally use the LLM with the system prompt + user input
        # The system prompt instructs the agent to react based on the user's performance.
        pass # The actual generation happens in the standard response loop, but we might want to inject context

    async def end_show(self):
        summary = "That's a wrap! You were fantastic. I loved the energy. Thanks for playing Improv Battle! Goodnight!"
        await self._session.response.say(summary)
        # We'll disconnect after the speech is done in on_agent_speech_stopped

    def update_context_for_phase(self):
        # Update LLM instructions or context based on phase if needed
        pass

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}
    await ctx.connect()

    session = AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=google.LLM(model="gemini-2.5-flash"),
        tts=murf.TTS(
            voice="en-US-matthew", 
            style="Promo", # Changed to Promo for more energy
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    assistant = Assistant()
    
    # --- Event Handlers ---

    @session.on("user_speech_committed")
    def on_user_speech_committed(msg):
        # We use this to capture the user's name in the intro phase if needed
        # or just log what they said.
        # The actual turn completion is better for game flow.
        pass

    @session.on("user_turn_completed")
    def on_user_turn_completed(msg):
        asyncio.create_task(handle_user_turn(msg))

    async def handle_user_turn(msg):
        user_text = msg.segments[0].text if msg.segments else ""
        logger.info(f"User turn completed: {user_text} | Phase: {assistant.game.phase}")

        # 1. Early Exit Check
        if any(keyword in user_text.lower() for keyword in ["stop game", "end show", "quit", "stop"]):
            assistant.game.phase = "done"
            await session.response.say("Alright, stopping the game. Thanks for playing!")
            return

        # 2. Phase Logic
        if assistant.game.phase == "intro":
            # Assume the user just gave their name
            if not assistant.game.player_name:
                assistant.game.player_name = user_text
                # Transition to first round
                assistant.game.next_phase()
                await assistant.start_round()
            else:
                # If name was already set (e.g. from UI), just move on
                assistant.game.next_phase()
                await assistant.start_round()

        elif assistant.game.phase == "awaiting_improv":
            # User just finished their scene
            assistant.game.next_phase() # Move to reacting
            # The Agent base class automatically generates a response to the user's input.
            # Our system prompt ensures this response is a "Reaction".
            # We just let it happen.
            session.response.create()

        elif assistant.game.phase == "reacting":
            # User spoke during reaction phase? Usually shouldn't happen if we handle turns right.
            # But if they do, we might just ignore or let the agent respond naturally.
            pass

    @session.on("agent_speech_stopped")
    def on_agent_speech_stopped(ev):
        asyncio.create_task(handle_agent_speech_stopped(ev))

    async def handle_agent_speech_stopped(ev):
        # Handle transitions AFTER the agent finishes speaking
        logger.info(f"Agent speech stopped. Phase: {assistant.game.phase}")
        
        if assistant.game.phase == "reacting":
            # Agent just finished reacting. Move to next round.
            assistant.game.next_phase()
            
            if assistant.game.phase == "done":
                await assistant.end_show()
            else:
                await assistant.start_round()
        
        elif assistant.game.phase == "done":
             # Wait a moment then disconnect
            await asyncio.sleep(2)
            await ctx.disconnect()

    # Start the session
    await session.start(
        agent=assistant,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Trigger on_start manually since the event might not fire exactly how we want with the custom setup
    # Actually, session.start() doesn't trigger on_start on the agent instance automatically in this structure
    # unless we register it.
    await assistant.on_start(session)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
