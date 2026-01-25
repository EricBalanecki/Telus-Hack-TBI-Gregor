from pydantic import BaseModel

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
