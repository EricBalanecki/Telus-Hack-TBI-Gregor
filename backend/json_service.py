import json
from pathlib import Path

DB_FILE = Path("data.json")

# Initialize DB if not exists
if not DB_FILE.exists():
    DB_FILE.write_text(json.dumps({"records": [], "plan": []}, indent=2))


def read_db():
    """Read the entire database from JSON file."""
    with DB_FILE.open("r") as f:
        return json.load(f)


def write_db(data):
    """Write the entire database to JSON file."""
    with DB_FILE.open("w") as f:
        json.dump(data, f, indent=2)


def add_record(record: dict):
    """
    Add a new record.
    record should be a dict with keys: 'date', 'exercise', 'score', 'notes'
    """
    db = read_db()
    db["records"].append(record)
    write_db(db)
    return record


def read_records():
    db = read_db()
    return db["records"]


def save_plan(plan: list):
    """
    Overwrites the current workout plan.
    plan should be a list of exercise JSON objects.
    """
    db = read_db()
    db["plan"] = plan
    write_db(db)
    return plan


def read_plan():
    db = read_db()
    return db.get("plan", [])


def read_plan_completions():
    db = read_db()
    return db.get("plan_completions", {})


def save_plan_completion(item_id: str, completed: bool):
    db = read_db()
    if "plan_completions" not in db:
        db["plan_completions"] = {}
    db["plan_completions"][item_id] = completed
    write_db(db)
    return {"id": item_id, "completed": completed}
