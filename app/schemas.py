from pydantic import BaseModel, ConfigDict
from datetime import datetime, date

class AttendanceResponse(BaseModel):
    employee_id: int
    check_in: datetime
    status: str
    late_by_minutes: int

    model_config = ConfigDict(from_attributes=True)


