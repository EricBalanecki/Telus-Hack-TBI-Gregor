from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas import BaseInput, NotesInput, RecordInput
from llm_client import get_base_exercise, get_notes
from json_service import add_record, get_records
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
    
@app.post("/base-exercise")
def generate_exercise(data: BaseInput):
    result = get_base_exercise(data)

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

    # Successfully parsed JSON
    return result_json

@app.post("/notes")
def generate_notes(data: NotesInput):
    result = get_notes(data)
    return {
        "notes": result
    }

    
@app.get("/records")
def read_records():
    return get_records()


@app.post("/records")
def create_record(record: RecordInput):
    return add_record(record.model_dump())
