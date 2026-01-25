import json
from schemas import BaseInput, NotesInput
from exercises import EXERCISES

def build_base_exercise_prompt(input: BaseInput):
    """
    Builds a prompt that:
    1. Chooses the most appropriate exercise based on motor/visual levels and descriptions.
    2. Fills numeric fields for the chosen exercise.
    Returns ONLY the JSON of the selected exercise.
    """

    return f"""
You are helping select and configure a therapy exercise for a user in TBI rehab.

Motor skill level: {input.motor_level} (1 = easiest, 10 = hardest)
Visual skill level: {input.visual_level} (1 = easiest, 10 = hardest)

You are given a list of exercises. Each exercise has placeholders for numeric fields:
- "dot_size": True = fill with a number from 1 (smallest) to 3 (largest), False = null
- "speed": True = fill with a number from 1 (slowest) to 3 (fastest), False = null
- "rest_time": True = fill with a number from 5 to 30 seconds (easy = more rest time), False = null

Step 1: Choose the ONE exercise that best matches the user's skill levels and descriptions.
Step 2: Fill in the numeric values for the chosen exercise only. Leave False fields as null.

Return ONLY the JSON object for the selected exercise.
Do not include extra text, explanation, or punctuation.

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
