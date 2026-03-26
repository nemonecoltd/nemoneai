import os
from sqlalchemy import text
from database import engine

def upgrade():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'google'"))
            conn.commit()
            print("✅ users table updated with password_hash and auth_provider")
        except Exception as e:
            print(f"❌ Error updating users table: {e}")

if __name__ == "__main__":
    upgrade()
