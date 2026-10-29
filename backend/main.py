from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from schemas import SessionStart, SessionUpdate, PostureEventCreate, SettingsUpdate
from typing import List, Dict, Any

app = FastAPI(title="ErgoVision API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "ErgoVision Posture Guardian"}

@app.get("/api/settings")
def get_settings():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_settings WHERE id = 1")
        row = cursor.fetchone()
        if not row:
            return {
                "slouch_angle_threshold": 22.0,
                "slouch_grace_seconds": 3,
                "sound_alert_enabled": True,
                "break_reminder_mins": 30
            }
        return {
            "slouch_angle_threshold": row["slouch_angle_threshold"],
            "slouch_grace_seconds": row["slouch_grace_seconds"],
            "sound_alert_enabled": bool(row["sound_alert_enabled"]),
            "break_reminder_mins": row["break_reminder_mins"]
        }

@app.post("/api/settings")
def update_settings(settings: SettingsUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE user_settings
            SET slouch_angle_threshold = ?,
                slouch_grace_seconds = ?,
                sound_alert_enabled = ?,
                break_reminder_mins = ?
            WHERE id = 1
        """, (
            settings.slouch_angle_threshold,
            settings.slouch_grace_seconds,
            1 if settings.sound_alert_enabled else 0,
            settings.break_reminder_mins
        ))
        return {"status": "updated", "settings": settings}

@app.get("/api/sessions")
def get_sessions():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, started_at, ended_at, duration_seconds, 
                   good_posture_seconds, slouch_seconds, slouch_count, average_score, status
            FROM sessions
            ORDER BY id DESC
            LIMIT 50
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@app.post("/api/sessions")
def save_session(session: Dict[str, Any]):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sessions (
                started_at, ended_at, duration_seconds, 
                good_posture_seconds, slouch_seconds, slouch_count, average_score, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session.get("started_at"),
            session.get("ended_at"),
            session.get("duration_seconds", 0),
            session.get("good_posture_seconds", 0),
            session.get("slouch_seconds", 0),
            session.get("slouch_count", 0),
            session.get("average_score", 100.0),
            session.get("status", "completed")
        ))
        session_id = cursor.lastrowid
        return {"status": "created", "id": session_id}

@app.post("/api/events")
def log_event(event: PostureEventCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO posture_events (
                session_id, timestamp, event_type, 
                neck_angle, shoulder_tilt, head_forward_ratio
            ) VALUES (?, datetime('now'), ?, ?, ?, ?)
        """, (
            event.session_id,
            event.event_type,
            event.neck_angle,
            event.shoulder_tilt,
            event.head_forward_ratio
        ))
        return {"status": "logged", "id": cursor.lastrowid}
