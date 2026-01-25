import json
from pathlib import Path

DB_FILE = Path("data.json")

# Initialize DB if not exists
if not DB_FILE.exists():
    DB_FILE.write_text(json.dumps({"records": [], "progress": 0}, indent=2))


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


def get_records():
    db = read_db()
    return db["records"]
