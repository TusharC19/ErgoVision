from database import init_db, get_db
import sqlite3

def test_database_initialization():
    print("Testing SQLite initialization...")
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT count(*) FROM user_settings")
        count = cursor.fetchone()[0]
        assert count == 1, f"Expected 1 settings row, got {count}"
        print("PASS: User settings initialized successfully.")
        
        # Test inserting sample session
        cursor.execute("""
            INSERT INTO sessions (started_at, ended_at, duration_seconds, good_posture_seconds, slouch_seconds, slouch_count, average_score)
            VALUES (datetime('now'), datetime('now'), 1800, 1500, 300, 4, 83.5)
        """)
        session_id = cursor.lastrowid
        assert session_id is not None
        print(f"PASS: Session inserted successfully with ID: {session_id}")

        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        assert row["duration_seconds"] == 1800
        print(f"PASS: Retrieved session successfully. Posture score: {row['average_score']}%")

if __name__ == "__main__":
    test_database_initialization()
    print("\nAll database & model tests passed successfully!")
