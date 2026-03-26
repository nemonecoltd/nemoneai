from database import engine
from sqlalchemy import text

def check_english_data():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT title, title_en FROM seongsu_places LIMIT 10")).fetchall()
        for idx, row in enumerate(res):
            print(f"[{idx}] KO: {row[0]} | EN: {row[1]}")

if __name__ == "__main__":
    check_english_data()
