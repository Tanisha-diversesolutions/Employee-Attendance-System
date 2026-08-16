# Employee Attendance System — README

## 1. What this project does (one line)

Employees "punch in" through a web page. The system compares their check-in time against the company's official reporting time (9:30 AM) and automatically marks them **present** or **late**, saving the result to a database.

---

## 2. The 3 Layers (say this first when explaining to anyone)

| Layer | Technology | Job |
|---|---|---|
| **Database** | PostgreSQL | Stores employees, the shift rule, and every check-in record permanently |
| **Backend** | Python + FastAPI | The "brain" — receives punch requests, does the late/on-time math, talks to the database |
| **Frontend** | React (Vite) | The "face" — the punch-in button and live ledger table employees/admins see |

**Memory hook:** Database = *memory*, Backend = *logic*, Frontend = *face*.

---

## 3. Project folder structure

```
attendance-system/
├── venv/                  → isolated Python environment
├── app/
│   ├── database.py        → connects Python to PostgreSQL
│   ├── models.py          → defines tables as Python classes
│   ├── schemas.py         → defines API input/output shape
│   └── main.py            → the API itself (routes + late-detection logic)
├── frontend/
│   └── src/
│       ├── App.jsx        → the UI (punch card + ledger + demo controls)
│       └── App.css         → styling
```

---

## 4. The 3 Database Tables

| Table | Purpose | Key columns |
|---|---|---|
| `employees` | Who works here | id, name, email |
| `shift_rules` | The official reporting time | reporting_time (09:30:00), grace_minutes |
| `attendance` | Every punch-in record | employee_id, check_in, status, late_by_minutes |

**Memory hook:** *Who* (employees) → *Rule* (shift_rules) → *What happened* (attendance).

---

## 5. The Core Logic — `calculate_status()`

This one function is the heart of the entire project. Everything else just calls it.

```python
def calculate_status(check_in, reporting_time, grace_minutes=0):
    scheduled = datetime.combine(check_in.date(), reporting_time) + timedelta(minutes=grace_minutes)

    if check_in <= scheduled:
        return "present", 0

    late_minutes = int((check_in - scheduled).total_seconds() // 60)
    return "late", late_minutes
```

**Explain it in 3 steps:**
1. Combine today's date + the reporting time (e.g. 9:30 AM) = the deadline (`scheduled`)
2. If check-in happened at or before the deadline → `"present"`
3. If after → calculate the exact minutes late → `"late"`

---

## 6. The Request Flow (walk through this end-to-end when demoing)

```
Employee clicks "Punch In"
        ↓
React sends:  POST /attendance/checkin/{employee_id}
        ↓
FastAPI grabs current time + shift rule from database
        ↓
calculate_status() compares the two
        ↓
Result saved as a new row in the "attendance" table
        ↓
API sends back JSON: { status, late_by_minutes, check_in }
        ↓
React updates the screen: green stamp (on time) or amber stamp (late)
```

**Memory hook:** Click → Send → Compare → Save → Show.

---

## 7. Key API Endpoints

| Method | Endpoint | What it does |
|---|---|---|
| POST | `/attendance/checkin/{employee_id}` | Employee punches in; returns present/late status |
| GET | `/attendance/late-today` | Lists everyone who was late today |
| POST | `/demo/reset` | Clears records, creates 2 demo employees, resets shift rule to 9:30 |
| POST | `/demo/simulate-late` | Sets reporting time to "1 minute ago" so the next punch is guaranteed late |

---

## 8. How to Run It (every time)

```bash
# Terminal 1 — backend
cd attendance-system
venv\Scripts\activate        (Windows)   or   source venv/bin/activate   (Mac/Linux)
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd attendance-system/frontend
npm run dev
```

Then open: `http://localhost:5173`

Backend API docs (for testing without the UI): `http://127.0.0.1:8000/docs`

---

## 9. The Demo Script (for showing your mentor)

Say this out loud, in order:

1. **"The reporting time, 9:30 AM, is stored in the database — not hardcoded."**
   → Click **Reset Demo**. This clears old data and sets everything to a clean state.

2. **"Let's punch in employee 1."**
   → Enter `1`, click **Punch In**. Point at the green stamp: **ON TIME**.

3. **"Now let's simulate someone arriving late — without waiting for real time to pass."**
   → Click **Simulate Late Arrival**. Explain: this quietly moves the reporting-time rule to "1 minute ago," so the next punch will read as late.

4. **"Let's punch in employee 2."**
   → Enter `2`, click **Punch In**. Point at the amber stamp: **LATE**, with exact minutes shown.

5. **"And here's the ledger updating live"** → point at the table on the right: both punches, color-coded, with timestamps.

6. **(Optional strong finish)** Open `http://127.0.0.1:8000/docs`, run `GET /attendance/late-today`, show the raw JSON — proves the backend, not just the UI, is doing the work.

---

## 10. Anticipated Questions from Your Mentor (and short answers)

| Question | Answer |
|---|---|
| "Why separate `models.py` and `schemas.py`?" | Models define database tables; schemas define what the API exposes. Keeps database internals from leaking into responses. |
| "What if two people share a shift rule but have different reporting times?" | Currently one rule for the whole company. Next step: add a `department_id` to `shift_rules` for per-team times. |
| "What happens if the database is down?" | The API call fails and the frontend shows an error message ("Punch failed — check backend is running"). |
| "How is 'late' calculated exactly?" | Check-in time minus reporting time, in whole minutes, only if positive. |
| "Why FastAPI over Flask/Django?" | Auto-generates interactive docs (`/docs`), built-in request validation via Pydantic, and async support out of the box. |

---

## 11. What's Not Built Yet (say this proactively — shows awareness)

- Employee login/authentication (currently anyone can punch in as any ID)
- Check-out tracking and total hours worked
- Per-department shift rules
- Monthly attendance reports/exports
- Email/Slack alerts for repeated lateness

---

## 12. One-Sentence Summary (memorize this)

> "Every punch-in is timestamped, compared against a stored reporting-time rule, and logged as present or late — with the whole flow visible live in a React dashboard."