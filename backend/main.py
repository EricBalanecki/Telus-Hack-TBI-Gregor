from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas import BaseInput, NotesInput, RecordInput, CoachInput
from llm_client import get_plan, get_notes, get_coach_response
from json_service import add_record, read_records, save_plan, read_plan, read_db
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

    try:
        # Attempt to parse the LLM response as JSON
        result_json = json.loads(result)
    except json.JSONDecodeError:
        # If parsing fails, return an error with the raw text
        return JSONResponse(
            status_code=500,
            content={
                "error": "Model did not return valid JSON",
                "raw": result
            }
        )
    
    # Save to local db
    save_plan(result_json)

    # Successfully parsed JSON
    return result_json

@app.get("/plan")
def read_plan():
    return read_plan()

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
    return read_records()


@app.post("/records")
def create_record(record: RecordInput):
    return add_record(record.model_dump())
