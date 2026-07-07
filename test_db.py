from app.db.supabase import db
if db:
    print("Auth Users:", db.auth.admin.list_users())
