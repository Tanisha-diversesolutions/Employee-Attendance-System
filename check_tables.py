# from app.database import engine
# from sqlalchemy import text

# # Query all tables in public schema
# query = text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
# with engine.connect() as connection:
#     result = connection.execute(query)
#     tables = [row[0] for row in result]
#     print("✅ Tables in Supabase:")
#     for table in tables:
#         print(f"  - {table}")
