from pydantic import BaseModel
from typing import List

class RecordInput(BaseModel):
    date: str
    exercise: str
    score: int
    notes: str

class BaseInput(BaseModel):
    motor_level: int
    visual_level: int
    dizzy_tracking_movement: bool
    tired_using_screens: bool

class NotesInput(BaseModel):
    exercise: str
    description: str
    accuracy: int

class ChatMessage(BaseModel):
    role: str
    content: str

class CoachInput(BaseModel):
    messages: List[ChatMessage]

class PlanCompletionInput(BaseModel):
    item_id: str
    completed: bool
