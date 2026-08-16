from sqlalchemy import Column, Integer, String, DateTime, Time
from sqlalchemy.sql import func
from .database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)


class ShiftRule(Base):
    __tablename__ = "shift_rules"

    id = Column(Integer, primary_key=True, index=True)
    reporting_time = Column(Time, nullable=False)   # e.g. 09:30:00
    grace_minutes = Column(Integer, default=0)


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)
    check_in = Column(DateTime, server_default=func.now())
    status = Column(String)              # "present" or "late"
    late_by_minutes = Column(Integer, default=0)