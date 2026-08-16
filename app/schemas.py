from pydantic import BaseModel
from datetime import datetime

class AttendanceResponse(BaseModel):
    employee_id: int

    check_in: datetime
    status: str
    late_by_minutes: int
    # Pydantic v2: use `model_config` and `from_attributes` instead of `Config.orm_mode`
    model_config = {
        "from_attributes": True,
    }