from pydantic import BaseModel, Field
from typing import Optional, List

class SessionStart(BaseModel):
    pass

class SessionUpdate(BaseModel):
    duration_seconds: int
    good_posture_seconds: int
    slouch_seconds: int
    slouch_count: int
    average_score: float

class PostureEventCreate(BaseModel):
    session_id: int
    event_type: str
    neck_angle: Optional[float] = None
    shoulder_tilt: Optional[float] = None
    head_forward_ratio: Optional[float] = None

class SettingsUpdate(BaseModel):
    slouch_angle_threshold: float = Field(ge=10.0, le=50.0)
    slouch_grace_seconds: int = Field(ge=1, le=15)
    sound_alert_enabled: bool
    break_reminder_mins: int = Field(ge=5, le=120)
