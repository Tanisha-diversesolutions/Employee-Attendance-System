from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional 
class AttendanceResponse(BaseModel):
    employee_id: int
    check_in: datetime
    status: str
    late_by_minutes: int

class EmployeeCreate(BaseModel):
    name: str
    email: Optional[str] = None
    id: Optional[int] = None

class EmployeeResponse(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


