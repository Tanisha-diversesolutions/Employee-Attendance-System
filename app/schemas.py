from pydantic import BaseModel
from datetime import datetime, date

class AttendanceResponse(BaseModel):
    employee_id: int
    check_in: datetime
    status: str
    late_by_minutes: int

    class Config:
        orm_mode = True   # lets Pydantic read data straight from SQLAlchemy objects


class WorkLogCreate(BaseModel):
    """Shape of what the EMPLOYEE sends in when submitting their end-of-day update."""
    employee_id: int
    completed_work: str
    pending_work: str = ""
    blockers: str = ""


class WorkLogResponse(BaseModel):
    """Shape of what comes back — used both to confirm submission and for the admin's list."""
    id: int
    employee_id: int
    log_date: date
    completed_work: str
    pending_work: str
    blockers: str
    submitted_at: datetime

    class Config:
        orm_mode = True