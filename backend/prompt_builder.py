import json
from schemas import BaseInput
from exercises import EXERCISES

def build_base_exercise_prompt(input: BaseInput):
    # Include full JSON for each exercise in the prompt
    exercise_jsons = {
        key: data  # full object including dot_size, speed, rest_time, description
        for key, data in EXERCISES.items()
    }

    return f"""
You are selecting a vision therapy exercise.

Motor skill level: {input.motor_level} (1 = easiest, 10 = hardest)
Visual skill level: {input.visual_level} (1 = easiest, 10 = hardest)

Choose ONE exercise KEY from the list below. 

You can see the full details for each exercise to help you make the decision.
Return ONLY the key name exactly as written.
No punctuation, no explanation, no extra words.

Important:
- "dot_size" ranges from 1 (smallest) to 3 (largest)
- "speed" ranges from 1 (slowest) to 3 (fastest)
- "rest_time" is the number of seconds the user should rest between repetitions

Exercise options (full JSON for each key):
{json.dumps(exercise_jsons, indent=2)}
"""
