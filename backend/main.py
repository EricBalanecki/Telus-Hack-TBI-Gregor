from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from json_service import add_record, get_records, set_progress, get_progress

app = FastAPI()

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
    


# for testing 

# records endpoints
class Record(BaseModel):
    date: str
    exercise: str
    notes: str

@app.get("/records")
def read_records():
    return get_records()


@app.post("/records")
def create_record(record: Record):
    return add_record(record.model_dump())

# progress endpoints
class Progress(BaseModel):
    value: int

@app.get("/progress")
def read_progress():
    return {"progress": get_progress()}


@app.post("/progress")
def update_progress(progress: Progress):
    try:
        value = set_progress(progress.value)
        return {"progress": value}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
