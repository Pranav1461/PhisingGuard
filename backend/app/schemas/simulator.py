from typing import Optional, List
from pydantic import BaseModel, Field

class SimulatorTemplateItem(BaseModel):
    id: str
    name: str
    category: str
    scenario_type: str = "login"       # login | subscription | storage | delivery | reward | support | document
    difficulty: str
    subject: str
    sender_name: str
    sender_email_display: str
    fictional_org: str = ""
    manipulation: List[str] = []
    red_flags: List[str] = []
    safe_action: str = ""
    lure_description: str

class EmailDispatchCreate(BaseModel):
    target_email: str = Field(..., json_schema_extra={"example": "test.victim@example.com"})
    template_id: str = Field(default="nordvault-security", json_schema_extra={"example": "nordvault-security"})
    custom_subject: Optional[str] = None

class EmailDispatchResponse(BaseModel):
    success: bool
    provider: str
    session_id: str
    target_email: str
    template_id: str
    tracking_url: str
    message: str

class SimulatorSessionCreate(BaseModel):
    target_email: str = Field(..., json_schema_extra={"example": "demo@example.test"})
    template_id: Optional[str] = "nordvault-security"

class SimulatorSessionResponse(BaseModel):
    session_id: str
    target_email: str
    template_id: Optional[str] = "nordvault-security"
    status: str
    created_at: str

class SimulatorEventCreate(BaseModel):
    session_id: str = Field(..., json_schema_extra={"example": "sim-demo123"})
    event_type: str = Field(..., json_schema_extra={"example": "login_submitted"})
    username_entered: Optional[str] = Field(None, json_schema_extra={"example": "demo@example.test"})
    password_entered: bool = Field(..., description="Boolean: was the password field filled?")
    password_value: Optional[str] = Field(None, description="The actual typed password for telemetry display (not persisted to DB).")
    user_agent: Optional[str] = None

class SimulatorEventResponse(BaseModel):
    id: str
    session_id: str
    event_type: str
    username_entered: Optional[str]
    password_entered: bool
    password_value: Optional[str] = None
    timestamp: str

class SimulatorEventItem(BaseModel):
    id: str
    session_id: str
    event_type: str
    username_entered: Optional[str] = None
    password_entered: bool = False
    password_value: Optional[str] = None
    timestamp: str

class SimulatorSessionDetailResponse(BaseModel):
    session_id: str
    target_email: str
    template_id: Optional[str] = "nordvault-security"
    status: str
    created_at: str
    updated_at: Optional[str] = None
    events: List[SimulatorEventItem] = []

class SimulatorResetResponse(BaseModel):
    status: str
    message: str

class CredentialCaptureRequest(BaseModel):
    """Schema for capturing credentials from the fake login page."""
    session_id: str = Field(..., json_schema_extra={"example": "sim-abc12345"})
    username: str = Field(..., json_schema_extra={"example": "victim@example.com"})
    password: str = Field(..., description="The actual password typed for telemetry display (not stored permanently)")
    user_agent: Optional[str] = None

class CredentialCaptureResponse(BaseModel):
    """Response after credentials are captured."""
    success: bool
    session_id: str
    message: str
    captured_username: str
    captured_password_length: int  # Return length instead of actual password
    timestamp: str
