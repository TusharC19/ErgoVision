import sqlite3
import os
from contextlib import contextmanager

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "ergovision.db")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                duration_seconds INTEGER DEFAULT 0,
                good_posture_seconds INTEGER DEFAULT 0,
                slouch_seconds INTEGER DEFAULT 0,
                slouch_count INTEGER DEFAULT 0,
                average_score REAL DEFAULT 100.0,
                status TEXT DEFAULT 'active'
            )
        """)
        
        # Posture events log
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS posture_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                neck_angle REAL,
                shoulder_tilt REAL,
                head_forward_ratio REAL,
                FOREIGN KEY (session_id) REFERENCES sessions (id)
            )
        """)
        
        # User settings
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                slouch_angle_threshold REAL DEFAULT 25.0,
                slouch_grace_seconds INTEGER DEFAULT 3,
                sound_alert_enabled INTEGER DEFAULT 1,
                break_reminder_mins INTEGER DEFAULT 30
            )
        """)
        
        # Default settings if not exists
        cursor.execute("""
            INSERT OR IGNORE INTO user_settings (id, slouch_angle_threshold, slouch_grace_seconds, sound_alert_enabled, break_reminder_mins)
            VALUES (1, 25.0, 3, 1, 30)
        """)
