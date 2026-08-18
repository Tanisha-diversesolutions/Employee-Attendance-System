# from app.database import SessionLocal
# from app.models import Employee

# db = SessionLocal()

# # Insert sample employees
# employees = [
#     Employee(name="John Doe", email="john@example.com"),
#     Employee(name="Jane Smith", email="jane@example.com"),
#     Employee(name="Mike Johnson", email="mike@example.com"),
#     Employee(name="Sarah Williams", email="sarah@example.com"),
#     Employee(name="David Brown", email="david@example.com"),
# ]

# db.add_all(employees)
# db.commit()

# # Verify
# all_employees = db.query(Employee).all()
# print("✅ Employees inserted successfully!")
# print("\nEmployees in database:")
# for emp in all_employees:
#     print(f"  ID: {emp.id}, Name: {emp.name}, Email: {emp.email}")

# db.close()
