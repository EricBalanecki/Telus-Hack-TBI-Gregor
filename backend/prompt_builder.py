import json
from schemas import BaseInput, NotesInput, ChatMessage
from exercises import EXERCISES

def build_plan_prompt(input: BaseInput):
    """
    Builds a prompt that:
    1. Chooses the most appropriate exercises based on motor/visual levels and descriptions.
    2. Fills numeric fields for the chosen exercise.
    Returns ONLY the JSON ARRAY of the selected exercises.
    """

    return f"""
You are helping select and configure an 8-week therapy exercise plan for a user in TBI rehab.

Motor skill level: {input.motor_level} (1 = easiest, 10 = hardest)
Visual skill level: {input.visual_level} (1 = easiest, 10 = hardest)
Does the user get dizzy when tracking moving objects: {input.dizzy_tracking_movement}
Does the user get tired quickly when using screens: {input.tired_using_screens}

You are given a list of exercises. Each exercise has placeholders for numeric fields:
- "dot_size": True = fill with a number from 1 (smallest) to 3 (largest), False = null
- "speed": True = fill with a number from 1 (slowest) to 3 (fastest), False = null
- "rest_time": True = fill with a number from 5 to 30 seconds (easy = more rest time), False = null
- "target_size": True = fill with a number from 0.5 (smallest) to 3 (largest), False = null
- "num_targets": True = fill with a number from 5 (least) to 20 (most), False = null
- "days": True = fill with a number from 1 to 7 days (easy = less days), False = null

Steps:
1. Select exactly 8 exercises that form a progressive 8-week plan.
2. Start easy and gradually increase difficulty.
3. Replace True values with appropriate numbers.
4. Replace False values with null.

CRITICAL OUTPUT RULES:

- Return ONLY a JSON ARRAY
- The top-level output MUST start with [ and end with ]
- Each item in the array must be a JSON object
- No markdown
- No backticks
- No explanation
- No extra text

Example output shape:

[
  {{
    "exercise": "Example Exercise",
    "description": "Example description",
    "dot_size": 2,
    "speed": 1,
    "rest_time": 20,
    "target_size": null,
    "num_targets": null,
    "days": 3
  }},
  ...
]

Exercise options (full JSON list):
{json.dumps(EXERCISES, indent=2)}
"""

def build_notes_prompt(input: NotesInput):
    return f"""
You are a Traumatic Brain Injury rehab assistant.

The user just performed the exercise "{input.exercise}".
Exercise description: {input.description}
Accuracy score: {input.accuracy}%

Write a short, encouraging feedback sentence or two about how well they are progressing.
Keep it concise and positive, but honest.
"""

def build_coach_prompt(messages: list[ChatMessage], db: dict):
    records = db.get("records", [])
    records_json = json.dumps(records, indent=2)
    exercises_json = json.dumps(EXERCISES, indent=2)      

    conversation = "\n".join(
        [f"{msg.role.upper()}: {msg.content}" for msg in messages]
    )

    return f"""
You are Coach Gregor, a friendly TBI rehab coach.
You help users understand their progress, analytics, and how exercises support recovery.
Answer using the data below when relevant. If data is missing, say so and provide general guidance.

Format requirements:
- Plain text only (no markdown, no backticks, no bold/italics).
- If giving steps, use a simple numbered list like "1) ...".
- Keep responses concise and supportive.
- Do not include role labels like "ASSISTANT:" or "USER:".

User records (JSON):
{records_json}

Exercise catalog (JSON):
{exercises_json}

Conversation:
{conversation}

Reply with a concise, supportive response in plain text.
"""
