from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional

class EmployeeCreate(BaseModel):
    id: int
    name: str
    email: str

class EmployeeResponse(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)

class AttendanceResponse(BaseModel):
    id: Optional[int] = None
    employee_id: int
    employee_name: Optional[str] = None
    check_in: datetime
    status: str
    late_by_minutes: int
    model_config = ConfigDict(from_attributes=True)
