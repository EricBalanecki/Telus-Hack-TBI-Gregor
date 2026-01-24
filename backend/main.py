from fastapi import FastAPI, Request
from pydantic import BaseModel
from json_service import add_record, get_records
from fastapi.middleware.cors import CORSMiddleware

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
