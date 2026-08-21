import os
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo
from pydantic import BaseModel
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas
from .database import engine, get_db

# Configure Timezone (default: Asia/Kolkata / IST UTC+5:30)
TIMEZONE_NAME = os.getenv("APP_TIMEZONE", "Asia/Kolkata")
try:
    APP_TZ = ZoneInfo(TIMEZONE_NAME)
except Exception:
    APP_TZ = ZoneInfo("Asia/Kolkata")

def get_current_time() -> datetime:
    """Returns current naive datetime in the application's timezone."""
    return datetime.now(APP_TZ).replace(tzinfo=None)

def get_current_date():
    """Returns current date in the application's timezone."""
    return datetime.now(APP_TZ).date()

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Employee Attendance System API")

@app.get("/")
def home():
    return {"message": "Employee Attendance System API is running"}

# Allow the React dev server and deployed Vercel frontend to call this API.
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://employee-attendance-system-phi-one.vercel.app"
]
configured_origins = os.getenv("CORS_ORIGINS", "")
if configured_origins:
    allowed_origins.extend(
        origin.strip() for origin in configured_origins.split(",") if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_employee_by_identifier(identifier: str, db: Session):
    """
    Look up an employee by numeric ID, exact name, or partial name match.
    """
    clean_id = str(identifier).strip()
    # 1. Try as numeric ID
    if clean_id.isdigit():
        emp = db.query(models.Employee).filter(models.Employee.id == int(clean_id)).first()
        if emp:
            return emp

    # 2. Try exact name match (case-insensitive)
    emp = db.query(models.Employee).filter(models.Employee.name.ilike(clean_id)).first()
    if emp:
        return emp

    # 3. Try partial name match (case-insensitive)
    emp = db.query(models.Employee).filter(models.Employee.name.ilike(f"%{clean_id}%")).first()
    return emp


# ==========================================
# EMPLOYEE MANAGEMENT ENDPOINTS
# ==========================================

@app.get("/employees", response_model=list[schemas.EmployeeResponse])
def get_all_employees(db: Session = Depends(get_db)):
    """Fetch all registered employees sorted by ID."""
    return db.query(models.Employee).order_by(models.Employee.id.asc()).all()


@app.post("/employees", response_model=schemas.EmployeeResponse)
def create_employee(payload: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    """Admin creates a new employee with required custom ID and email."""
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Employee name is required.")

    if payload.id is None or payload.id <= 0:
        raise HTTPException(status_code=400, detail="A valid positive Employee ID is required.")

    email = payload.email.strip()
    if not email:
        raise HTTPException(status_code=400, detail="Employee email address is required.")

    # Check for duplicate ID
    existing_id = db.query(models.Employee).filter(models.Employee.id == payload.id).first()
    if existing_id:
        raise HTTPException(status_code=400, detail=f"Employee ID #{payload.id} is already taken by '{existing_id.name}'.")

    # Check for duplicate email
    existing_email = db.query(models.Employee).filter(models.Employee.email.ilike(email)).first()
    if existing_email:
        raise HTTPException(status_code=400, detail=f"Email '{email}' is already registered to '{existing_email.name}' (ID: #{existing_email.id}).")

    new_emp = models.Employee(id=payload.id, name=name, email=email)
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp


# ==========================================
# ATTENDANCE & PUNCH ENDPOINTS
# ==========================================

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


@app.post("/attendance/checkin/{identifier}", response_model=schemas.AttendanceResponse)
def check_in(identifier: str, db: Session = Depends(get_db)):
    """
    Punch in by Employee ID (e.g. 1, 102) OR Employee Name (e.g. 'Ananya Rout').
    """
    emp = get_employee_by_identifier(identifier, db)
    if not emp:
        raise HTTPException(
            status_code=404,
            detail=f"Employee '{identifier}' not found. Please verify your ID/Name or ask Admin to register you in the Admin Panel."
        )

    now = get_current_time()

    # Get the shift rule
    rule = db.query(models.ShiftRule).first()
    if rule is None:
        reporting_time = time(9, 30)
        grace_minutes = 0
    else:
        reporting_time = rule.reporting_time
        grace_minutes = rule.grace_minutes

    status, late_by = calculate_status(now, reporting_time, grace_minutes)

    record = models.Attendance(
        employee_id=emp.id,
        check_in=now,
        status=status,
        late_by_minutes=late_by
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "employee_id": emp.id,
        "employee_name": emp.name,
        "check_in": record.check_in,
        "status": record.status,
        "late_by_minutes": record.late_by_minutes
    }


@app.get("/attendance/late-today")
def get_late_today(db: Session = Depends(get_db)):
    today = get_current_date()
    start_of_today = datetime.combine(today, time.min)
    end_of_today = datetime.combine(today, time.max)
    records = db.query(models.Attendance).filter(
        models.Attendance.status == "late",
        models.Attendance.check_in >= start_of_today,
        models.Attendance.check_in <= end_of_today
    ).order_by(models.Attendance.check_in.desc()).all()
    employees = {e.id: e.name for e in db.query(models.Employee).all()}
    return [
        {
            "id": r.id,
            "employee_id": r.employee_id,
            "employee_name": employees.get(r.employee_id, f"Employee #{r.employee_id}"),
            "check_in": r.check_in,
            "status": r.status,
            "late_by_minutes": r.late_by_minutes
        }
        for r in records
    ]


@app.get("/attendance/today")
def get_all_today(db: Session = Depends(get_db)):
    today = get_current_date()
    start_of_today = datetime.combine(today, time.min)
    end_of_today = datetime.combine(today, time.max)
    records = db.query(models.Attendance).filter(
        models.Attendance.check_in >= start_of_today,
        models.Attendance.check_in <= end_of_today
    ).order_by(models.Attendance.check_in.desc()).all()
    employees = {e.id: e.name for e in db.query(models.Employee).all()}
    return [
        {
            "id": r.id,
            "employee_id": r.employee_id,
            "employee_name": employees.get(r.employee_id, f"Employee #{r.employee_id}"),
            "check_in": r.check_in,
            "status": r.status,
            "late_by_minutes": r.late_by_minutes
        }
        for r in records
    ]


# ==========================================
# WORK LOG / STANDUP ENDPOINTS
# ==========================================

class WorkLogSubmit(BaseModel):
    completed_work: str
    pending_work: str = ""
    blockers: str = ""


@app.post("/worklog/submit/{identifier}")
def submit_worklog(identifier: str, entry: WorkLogSubmit, db: Session = Depends(get_db)):
    """Employee submits today's work update by ID or Name."""
    emp = get_employee_by_identifier(identifier, db)
    if not emp:
        raise HTTPException(
            status_code=404,
            detail=f"Employee '{identifier}' not found. Please verify your ID/Name or ask Admin to register you."
        )
    now = get_current_time()

    record = models.WorkLog(
        employee_id=emp.id,
        log_date=get_current_date(),
        completed_work=entry.completed_work.strip(),
        pending_work=entry.pending_work.strip(),
        blockers=entry.blockers.strip(),
        submitted_at=now,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"message": "Work update submitted.", "id": record.id}


@app.get("/worklog/today")
def get_worklogs_today(db: Session = Depends(get_db)):
    """Admin-only view — every employee's work update for today."""
    today = get_current_date()
    start_of_today = datetime.combine(today, time.min)
    end_of_today = datetime.combine(today, time.max)
    logs = db.query(models.WorkLog).filter(
        models.WorkLog.submitted_at >= start_of_today,
        models.WorkLog.submitted_at <= end_of_today
    ).order_by(models.WorkLog.submitted_at.desc()).all()
    employees = {e.id: e.name for e in db.query(models.Employee).all()}
    return [
        {
            "employee_id": l.employee_id,
            "employee_name": employees.get(l.employee_id, f"Employee #{l.employee_id}"),
            "completed_work": l.completed_work,
            "pending_work": l.pending_work,
            "blockers": l.blockers,
            "submitted_at": l.submitted_at,
        }
        for l in logs
    ]


# ==========================================
# DEMO & TESTING CONTROLS
# ==========================================

@app.post("/demo/reset")
def reset_demo(db: Session = Depends(get_db)):
    """
    Wipes attendance records, ensures demo employees exist,
    and resets the shift rule to 9:30 AM.
    """
    db.query(models.Attendance).delete()

    rule = db.query(models.ShiftRule).first()
    if rule:
        rule.reporting_time = time(9, 30, 0)
        rule.grace_minutes = 0
    else:
        rule = models.ShiftRule(reporting_time=time(9, 30, 0), grace_minutes=0)
        db.add(rule)

    if not db.query(models.Employee).filter_by(id=1).first():
        db.add(models.Employee(id=1, name="Ananya Rout", email="ananya@company.com"))
    if not db.query(models.Employee).filter_by(id=2).first():
        db.add(models.Employee(id=2, name="Rohit Sahoo", email="rohit@company.com"))

    db.commit()
    return {"message": "Demo reset — demo employees ready, shift rule set to 09:30, records cleared."}
