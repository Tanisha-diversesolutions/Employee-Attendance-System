# from app.database import engine
# from sqlalchemy import inspect, text

# # Check all tables in public schema
# inspector = inspect(engine)
# tables = inspector.get_table_names(schema='public')

# print("✅ Tables in public schema:")
# for table in tables:
#     print(f"  - {table}")

# # Also check if there are any other schemas
# schemas = inspector.get_schema_names()
# print(f"\n✅ Available schemas: {schemas}")

# # List tables in each schema
# for schema in schemas:
#     try:
#         tables_in_schema = inspector.get_table_names(schema=schema)
#         if tables_in_schema:
#             print(f"\nTables in '{schema}' schema:")
#             for table in tables_in_schema:
#                 print(f"  - {table}")
#     except:
#         pass
