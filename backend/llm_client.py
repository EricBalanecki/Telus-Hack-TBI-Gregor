from openai import OpenAI
import os
from dotenv import load_dotenv

from schemas import BaseInput, NotesInput, ChatMessage
from prompt_builder import build_plan_prompt, build_notes_prompt, build_coach_prompt

load_dotenv()

GEMMA_API_KEY = os.getenv("GEMMA_API_KEY")
if not GEMMA_API_KEY:
    raise RuntimeError("GEMMA_API_KEY not set")

MODEL_NAME = "google/gemma-3-27b-it"
BASE_URL = "https://gemma-3-27b-3ca9s.paas.ai.telus.com/v1"

client = OpenAI(api_key=GEMMA_API_KEY, base_url=BASE_URL)

def call_llm(prompt):
    response = client.completions.create(
        model=MODEL_NAME,
        prompt=prompt,
        max_tokens=1500,
        temperature=0.2
    )

    return response.choices[0].text.strip()

def get_plan(input: BaseInput):
    prompt = build_plan_prompt(input)

    return call_llm(prompt)

def get_notes(input: NotesInput):
    prompt = build_notes_prompt(input)

    return call_llm(prompt)

def get_coach_response(messages: list[ChatMessage], db: dict):
    prompt = build_coach_prompt(messages, db)

    response = call_llm(prompt)
    if response:
        return response.lstrip().removeprefix("ASSISTANT:").removeprefix("assistant:").strip()

    # Retry once with a stronger instruction to avoid empty responses.
    retry_prompt = f"{prompt}\n\nIMPORTANT: Return a non-empty response."
    retry_response = call_llm(retry_prompt)
    if retry_response:
        return retry_response.lstrip().removeprefix("ASSISTANT:").removeprefix("assistant:").strip()
    return retry_response
