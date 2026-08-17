from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from . import models, schemas
from .database import engine, get_db

# This line reads your models.py and actually creates the tables
# in PostgreSQL the first time you run the app.
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow the React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    status, late_by = calculate_status(now, rule.reporting_time, rule.grace_minutes)

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


ADMIN_PASSWORD = "admin123"  # simple demo password — replace with env var + hashing later


@app.post("/admin/login")
def admin_login(payload: dict):
    """
    Checks the submitted password against the admin password.
    This is intentionally simple for a demo — a real system would
    hash the password and issue a proper session/JWT token instead.
    """
    if payload.get("password") == ADMIN_PASSWORD:
        return {"success": True}
    return {"success": False}


@app.post("/demo/reset")
def reset_demo(db: Session = Depends(get_db)):
    """
    Wipes attendance records, makes sure two demo employees exist,
    and resets the shift rule to 9:30 AM. Safe to call as many times as needed.
    """
    # Clear all previous punches
    db.query(models.Attendance).delete()

    # Reset (or create) the shift rule
    rule = db.query(models.ShiftRule).first()
    if rule:
        rule.reporting_time = datetime.strptime("09:30:00", "%H:%M:%S").time()
        rule.grace_minutes = 0
    else:
        rule = models.ShiftRule(
            reporting_time=datetime.strptime("09:30:00", "%H:%M:%S").time(),
            grace_minutes=0
        )
        db.add(rule)

    # Make sure two demo employees exist
    if not db.query(models.Employee).filter_by(id=1).first():
        db.add(models.Employee(id=1, name="Ananya Rout", email="ananya@company.com"))
    if not db.query(models.Employee).filter_by(id=2).first():
        db.add(models.Employee(id=2, name="Rohit Sahoo", email="rohit@company.com"))

    db.commit()
    return {"message": "Demo reset — 2 employees ready, shift rule set to 09:30, records cleared."}


@app.post("/demo/simulate-late")
def simulate_late(db: Session = Depends(get_db)):
    """
    Sets the shift rule's reporting_time to a few minutes before right now,
    so the NEXT check-in you make will read as late — without waiting for
    real clock time or editing SQL by hand.
    """
    rule = db.query(models.ShiftRule).first()
    target = (datetime.now() - timedelta(minutes=1)).time()
    if rule:
        rule.reporting_time = target
    else:
        rule = models.ShiftRule(reporting_time=target, grace_minutes=0)
        db.add(rule)
    db.commit()
    return {"message": f"Reporting time set to {target} — next check-in will be marked late."}


@app.get("/attendance/late-today")
def get_late_today(db: Session = Depends(get_db)):
    today = datetime.now().date()
    records = db.query(models.Attendance).filter(models.Attendance.status == "late").all()
    return [r for r in records if r.check_in.date() == today]


@app.post("/worklog/submit", response_model=schemas.WorkLogResponse)
def submit_worklog(payload: schemas.WorkLogCreate, db: Session = Depends(get_db)):
    """
    EMPLOYEE-facing endpoint. Employee sends their completed_work, pending_work,
    and optional blockers, tagged with their own employee_id.
    Nobody else's data is touched or visible through this endpoint.
    """
    entry = models.WorkLog(
        employee_id=payload.employee_id,
        completed_work=payload.completed_work,
        pending_work=payload.pending_work,
        blockers=payload.blockers
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@app.get("/worklog/today", response_model=list[schemas.WorkLogResponse])
def get_worklogs_today(db: Session = Depends(get_db)):
    """
    ADMIN-facing endpoint. Returns every employee's update submitted today,
    across all employee_ids — this is what only the admin view should call.
    """
    today = datetime.now().date()
    logs = db.query(models.WorkLog).all()
    return [l for l in logs if l.submitted_at.date() == today]