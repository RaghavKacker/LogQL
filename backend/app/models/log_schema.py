from typing import Optional
from pydantic import BaseModel

class NormalizedLogRecord(BaseModel):
    timestamp: str
    service: str
    level: str
    status: Optional[int] = 0
    response_time: Optional[float] = 0.0
    path: Optional[str] = ""
    ip: Optional[str] = ""
    message: str
