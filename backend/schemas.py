from pydantic import BaseModel

class RecordInput(BaseModel):
    date: str
    exercise: str
    score: int
    notes: str

class BaseInput(BaseModel):
    motor_level: int
    visual_level: int