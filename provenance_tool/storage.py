import sqlite3
import os
from contextlib import contextmanager
from typing import Generator

def get_db_connection(db_path: str) -> sqlite3.Connection:
    """Returns a sqlite3 connection with row factory set to Row."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def db_session(db_path: str) -> Generator[sqlite3.Connection, None, None]:
    """Context manager for database sessions."""
    conn = get_db_connection(db_path)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def init_db(db_path: str) -> None:
    """Initializes the SQLite database with the required schema."""
    with db_session(db_path) as conn:
        cursor = conn.cursor()
        
        # Domains table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS domains (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain TEXT UNIQUE NOT NULL
            )
        """)
        
        # Policy snapshots table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS policy_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain_id INTEGER NOT NULL,
                robots_txt TEXT,
                llms_txt TEXT,
                fetched_at TEXT NOT NULL,
                dataset_id TEXT NOT NULL,
                FOREIGN KEY (domain_id) REFERENCES domains (id)
            )
        """)
        
        # Runs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL,
                description TEXT,
                code_version TEXT
            )
        """)
        
        # Run artifacts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS run_artifacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                artifact_id TEXT NOT NULL,
                artifact_type TEXT NOT NULL,
                FOREIGN KEY (run_id) REFERENCES runs (run_id)
            )
        """)
