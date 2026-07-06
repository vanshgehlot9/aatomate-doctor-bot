import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from app.db.supabase import db
except ImportError:
    print("Error: Could not import app.db.supabase. Make sure you are in the project root and have the correct virtual environment activated.")
    sys.exit(1)

def create_super_admin(email, password, name="Super Admin"):
    print(f"Creating super admin: {email}")
    
    try:
        # Create user in Auth
        auth_response = db.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"name": name, "role": "super_admin"}
        })
        
        user_id = auth_response.user.id
        print(f"Auth user created successfully! ID: {user_id}")
        
        # Create user in the public.users table
        user_data = {
            "id": user_id,
            "email": email,
            "name": name,
            "role": "super_admin"
        }
        
        db.table("users").insert(user_data).execute()
        print("Super admin added to the public.users table successfully!")
        print("\nYou can now log in at /login with these credentials.")
        
    except Exception as e:
        print(f"Error creating super admin: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_superadmin.py <email> <password>")
        sys.exit(1)
        
    email = sys.argv[1]
    password = sys.argv[2]
    
    create_super_admin(email, password)
