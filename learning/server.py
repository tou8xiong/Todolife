"""
Todolife AI Backend — FastAPI + Gemini
Run: uvicorn server:app --reload --port 8000
Set env: GEMINI_API_KEY=your_key
"""

import os
import asyncio
from typing import Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

# ── Config ───────────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="Todolife AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to your domain in production
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ── Models ───────────────────────────────────────────────────────────────────

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class AgentRequest(BaseModel):
    messages: list[Message]

class SummarizeRequest(BaseModel):
    text: str

class SuggestTasksRequest(BaseModel):
    goal: str
    context: str = ""

# ── Helpers ──────────────────────────────────────────────────────────────────

async def generate(prompt: str, retries: int = 3) -> str:
    """Try each model in order, retry on quota/overload errors."""
    last_error = Exception("No models available")

    for attempt in range(retries):
        for model_name in MODELS:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                text = response.text
                if text:
                    return text
            except Exception as e:
                msg = str(e).lower()
                if "quota" in msg or "429" in msg or "resource_exhausted" in msg:
                    wait = (attempt + 1) * 5
                    print(f"Quota exceeded, waiting {wait}s...")
                    await asyncio.sleep(wait)
                    break  # retry all models after wait
                if "503" in msg or "overloaded" in msg:
                    await asyncio.sleep(2)
                    continue  # try next model
                if "404" in msg or "not found" in msg:
                    continue  # model doesn't exist, try next
                last_error = e
                raise HTTPException(status_code=500, detail=str(e))

    raise HTTPException(status_code=503, detail=str(last_error))


def build_prompt(messages: list[Message]) -> str:
    """Assemble system + history + last user message into a single prompt."""
    system = next((m.content for m in messages if m.role == "system"), "")
    chat = [m for m in messages if m.role != "system"]
    history = chat[:-1]
    last_user = chat[-1] if chat else None

    if not last_user:
        raise HTTPException(status_code=400, detail="No user message found")

    prompt = system
    if history:
        prompt += "\n\nConversation history:\n"
        for m in history:
            label = "User" if m.role == "user" else "Assistant"
            prompt += f"{label}: {m.content}\n"
    prompt += f"\n\nUser: {last_user.content}"
    return prompt

# ── Routes ───────────────────────────────────────────────────────────────────

@app.post("/api/agent")
async def agent(req: AgentRequest):
    """General chat — used by the Next.js frontend when PYTHON_BACKEND_URL is set."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages are required")

    prompt = build_prompt(req.messages)
    result = await generate(prompt)
    return {"result": result}


@app.post("/api/summarize")
async def summarize(req: SummarizeRequest):
    """Summarize any text into 3–5 bullet points."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    prompt = (
        "You are an expert summarization assistant with deep reading comprehension across all domains — "
        "articles, research papers, code docs, news, books, legal text, and more.\n\n"
        "Given the text below, extract the most important information as 3 to 5 clear bullet points.\n\n"
        "Rules:\n"
        "- Respond in the SAME language the user writes in (English or Lao)\n"
        "- Output ONLY the bullet points — no intro, no outro, no labels like 'Summary:'\n"
        "- Each bullet must be one clear sentence\n"
        "- Preserve important numbers, dates, and names accurately\n"
        "- If the text is code or technical: summarize what it does, not how\n\n"
        f"Text to summarize:\n{req.text}"
    )
    result = await generate(prompt)
    return {"result": result}


@app.post("/api/suggest-tasks")
async def suggest_tasks(req: SuggestTasksRequest):
    """Break a goal into numbered actionable tasks with priorities."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    if not req.goal.strip():
        raise HTTPException(status_code=400, detail="Goal is required")

    context_block = f"\n\nUser context:\n{req.context}" if req.context else ""
    prompt = (
        "You are a world-class productivity coach and strategic planner.\n\n"
        "Break the following goal into a numbered action plan the user can start today.\n\n"
        "For each task include:\n"
        "- A specific, actionable title (verb + outcome)\n"
        "- Priority: High / Medium / Low\n"
        "- Suggested time to complete (e.g. '30 min', '2 hours')\n"
        "- Deadline hint (e.g. 'today', 'by end of week', 'Day 3')\n\n"
        "Rules:\n"
        "- Respond in the SAME language the user writes in (English or Lao)\n"
        "- Make tasks concrete and completable in one session (max 2–3 hours each)\n"
        "- Order tasks logically (dependencies first)\n"
        "- Add a short motivational note at the end (1 sentence)\n"
        f"{context_block}\n\n"
        f"Goal: {req.goal}"
    )
    result = await generate(prompt)
    return {"result": result}


@app.get("/health")
def health():
    return {"status": "ok", "models": MODELS}
