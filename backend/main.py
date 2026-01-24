from fastapi import FastAPI, Request
from modelcontextprotocol.server import McpServer

app = FastAPI()

# -------------------
# 1) NORMAL REST API
# -------------------

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/users/{user_id}")
def get_user(user_id: str):
    return {"id": user_id, "name": "Alice", "age": 22}

# -------------------
# 2) MCP SERVER
# -------------------

mcp = McpServer(
    name="my-python-mcp",
    version="1.0.0",
)

@mcp.tool(
    name="get_user",
    description="Get a user by ID from the backend",
    input_schema={
        "type": "object",
        "properties": {
            "id": {"type": "string", "description": "User ID"}
        },
        "required": ["id"]
    }
)
async def get_user_tool(id: str):
    return {"id": id, "name": "Alice", "age": 22}

@app.post("/mcp")
async def mcp_endpoint(request: Request):
    body = await request.json()
    result = await mcp.handle_request(body)
    return result