from datetime import datetime, timezone
from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator
from detector import analyze

app = FastAPI(title="E.D.I.T.H. Detection Engine", version="1.1.0")


class AppInfo(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    category: str = Field(min_length=1, max_length=40)
    expected_permissions: list[str] = Field(max_length=5)

    @field_validator("expected_permissions")
    @classmethod
    def valid_expected_permissions(cls, value):
        allowed = {"camera", "location", "contacts", "microphone", "storage"}
        if len(set(value)) != len(value) or any(v not in allowed for v in value):
            raise ValueError("Unsupported or duplicate permission")
        return value


class Event(BaseModel):
    resource: str
    authorized: bool
    timestamp: datetime

    @field_validator("resource")
    @classmethod
    def valid_resource(cls, value):
        if value not in {"camera", "location", "contacts", "microphone", "storage"}:
            raise ValueError("Unsupported resource")
        return value

    @field_validator("timestamp")
    @classmethod
    def timezone_aware(cls, value):
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


class AnalyzeRequest(BaseModel):
    app: AppInfo
    events: list[Event] = Field(max_length=500)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze_endpoint(req: AnalyzeRequest):
    return analyze(req.app.model_dump(), [e.model_dump() for e in req.events])
