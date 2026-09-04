from typing import Optional
from pydantic import BaseModel, Field

class SimulatorSessionCreate(BaseModel):
    target_email: str = Field(..., json_schema_extra={"example": "demo@example.test"})

class SimulatorSessionResponse(BaseModel):
    session_id: str
    target_email: str
    status: str
    created_at: str

class SimulatorEventCreate(BaseModel):
    session_id: str = Field(..., json_schema_extra={"example": "sim-demo123"})
    event_type: str = Field(..., json_schema_extra={"example": "login_submitted"})
    username_entered: Optional[str] = Field(None, json_schema_extra={"example": "demo@example.test"})
    password_entered: bool = Field(..., description="Boolean: was the password field filled?")
    password_value: Optional[str] = Field(None, description="The actual typed password (educational demo only, never persisted to DB).")

class SimulatorEventResponse(BaseModel):
    id: str
    session_id: str
    event_type: str
    username_entered: Optional[str]
    password_entered: bool
    password_value: Optional[str] = None
    timestamp: str

class SimulatorResetResponse(BaseModel):
    status: str
    message: str
