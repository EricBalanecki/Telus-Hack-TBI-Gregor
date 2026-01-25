from openai import OpenAI
import os
from dotenv import load_dotenv

from schemas import BaseInput, NotesInput
from prompt_builder import build_base_exercise_prompt, build_notes_prompt

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

def get_base_exercise(input: BaseInput):
    prompt = build_base_exercise_prompt(input)

    return call_llm(prompt)

def get_notes(input: NotesInput):
    prompt = build_notes_prompt(input)

    return call_llm(prompt)
