from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas import BaseInput, NotesInput, RecordInput, CoachInput, PlanCompletionInput
from llm_client import get_plan, get_notes, get_coach_response
from json_service import (
    add_record,
    read_records as read_records_db,
    save_plan,
    read_plan as read_plan_db,
    read_db,
    read_plan_completions,
    save_plan_completion,
)
import json


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST API
@app.get("/api/users/{user_id}")
def get_user(user_id: str):
    return {"id": user_id, "name": "Alice", "age": 22}

# MCP endpoint (manual)
@app.post("/mcp")
async def mcp_endpoint(request: Request):
    body = await request.json()
    tool_name = body.get("tool")
    args = body.get("args", {})
    
    print(f"Got MCP request: {tool_name}")

    if tool_name == "get_message":
        return {"result": {"message": "we love gregor"}}
    else:
        return {"error": f"Unknown tool {tool_name}"}
    
@app.post("/plan")
def generate_plan(data: BaseInput):
    result = get_plan(data)
    result_json = None

    def extract_json_array(text: str):
        start = text.find("[")
        end = text.rfind("]")
        if start == -1 or end == -1 or end <= start:
            return None
        candidate = text[start : end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            return None

    try:
        # Attempt to parse the LLM response as JSON
        result_json = json.loads(result)
    except json.JSONDecodeError:
        result_json = extract_json_array(result)
        if result_json is None:
            # If parsing fails, return an error with the raw text
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Model did not return valid JSON",
                    "raw": result
                }
            )

    if not isinstance(result_json, list):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Model did not return a JSON array",
                "raw": result
            }
        )
    
    # Save to local db
    save_plan(result_json)

    # Successfully parsed JSON
    return result_json

@app.get("/plan")
def read_plan():
    return read_plan_db()

@app.get("/plan/completions")
def get_plan_completions():
    return read_plan_completions()

@app.post("/plan/completions")
def set_plan_completion(data: PlanCompletionInput):
    return save_plan_completion(data.item_id, data.completed)

@app.post("/notes")
def generate_notes(data: NotesInput):
    result = get_notes(data)
    return {
        "notes": result
    }

@app.post("/coach")
def coach_chat(data: CoachInput):
    db = read_db()
    reply = get_coach_response(data.messages, db)
    if not reply or not reply.strip():
        raise HTTPException(status_code=502, detail="Empty coach response")
    return {
        "reply": reply
    }

    
@app.get("/records")
def read_records():
    return read_records_db()


@app.post("/records")
def create_record(record: RecordInput):
    return add_record(record.model_dump())
