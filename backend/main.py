from fastapi import FastAPI, Request

app = FastAPI()

# REST API
@app.get("/api/users/{user_id}")
def get_user(user_id: str):
    return {"id": user_id, "name": "Alice", "age": 22}

# MCP endpoint (manual)
@app.post("/mcp")
async def mcp_endpoint(request: Request):
    body = await request.json()
    # Manually parse MCP message
    # Here we only implement a single "get_user" tool
    tool_name = body.get("tool")
    args = body.get("args", {})
    
    if tool_name == "get_message":
        return {"result": {"message": "we love gregor"}}
    else:
        return {"error": f"Unknown tool {tool_name}"}
