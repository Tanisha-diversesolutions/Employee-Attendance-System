import os
from datetime import datetime, timedelta, time
from pydantic import BaseModel
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas
from .database import engine, get_db

# This line reads your models.py and actually creates the tables
# in PostgreSQL the first time you run the app.
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Employee Attendance System API is running"}

# Allow the React dev server and deployed Vercel frontend to call this API.
allowed_origins = ["http://localhost:5173", "https://employee-attendance-system-sepia.vercel.app"]
configured_origins = os.getenv("CORS_ORIGINS", "")
if configured_origins:   
    allowed_origins.extend(
        origin.strip() for origin in configured_origins.split(",") if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  test comment test

def calculate_status(check_in: datetime, reporting_time, grace_minutes: int = 0):
    """
    Compares the check-in time against the official reporting time.
    Returns ('present', 0) or ('late', minutes_late).
    """
    scheduled = datetime.combine(check_in.date(), reporting_time) + timedelta(minutes=grace_minutes)

    if check_in <= scheduled:
        return "present", 0

    late_minutes = int((check_in - scheduled).total_seconds() // 60)
    return "late", late_minutes


@app.post("/attendance/checkin/{employee_id}", response_model=schemas.AttendanceResponse)
def check_in(employee_id: int, db: Session = Depends(get_db)):
    now = datetime.now()

    # Get the shift rule (for now, assume one rule for the whole company)
    rule = db.query(models.ShiftRule).first()

    # If no shift rule is configured, fall back to a sensible default
    if rule is None:
        reporting_time = time(9, 0)
        grace_minutes = 0
    else:
        reporting_time = rule.reporting_time
        grace_minutes = rule.grace_minutes

    status, late_by = calculate_status(now, reporting_time, grace_minutes)

    record = models.Attendance(
        employee_id=employee_id,
        check_in=now,
        status=status,
        late_by_minutes=late_by
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get("/attendance/late-today")
def get_late_today(db: Session = Depends(get_db)):
    today = datetime.now().date()
    records = db.query(models.Attendance).filter(models.Attendance.status == "late").all()
    return [r for r in records if r.check_in.date() == today]

class WorkLogSubmit(BaseModel):
    completed_work: str
    pending_work: str = ""
    blockers: str = ""


@app.post("/worklog/submit/{employee_id}")
def submit_worklog(employee_id: int, entry: WorkLogSubmit, db: Session = Depends(get_db)):
    """Employee submits today's work update. Admin-only to read — enforced in the frontend for now."""
    record = models.WorkLog(
        employee_id=employee_id,
        completed_work=entry.completed_work,
        pending_work=entry.pending_work,
        blockers=entry.blockers,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"message": "Work update submitted.", "id": record.id}


@app.get("/worklog/today")
def get_worklogs_today(db: Session = Depends(get_db)):
    """Admin-only view — every employee's work update for today."""
    today = datetime.now().date()
    logs = db.query(models.WorkLog).all()
    return [
        {
            "employee_id": l.employee_id,
            "completed_work": l.completed_work,
            "pending_work": l.pending_work,
            "blockers": l.blockers,
            "submitted_at": l.submitted_at,
        }
        for l in logs if l.submitted_at.date() == today
    ]