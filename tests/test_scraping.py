import pytest
import os
import sqlite3
from provenance_tool.storage import init_db, get_db_connection
from provenance_tool.scraping import record_policies_for_dataset

def test_init_db(tmp_path):
    db_path = str(tmp_path / "test.db")
    init_db(db_path)
    
    assert os.path.exists(db_path)
    
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    # Check if tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='domains'")
    assert cursor.fetchone() is not None
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='policy_snapshots'")
    assert cursor.fetchone() is not None
    
    conn.close()

def test_snapshot_policies(tmp_path, requests_mock):
    db_path = str(tmp_path / "test.db")
    init_db(db_path)
    
    test_url = "https://example.com"
    requests_mock.get("https://example.com/robots.txt", text="User-agent: *")
    requests_mock.get("https://example.com/llms.txt", status_code=404)
    
    record_policies_for_dataset(db_path, "ds-123", test_url)
    
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM domains WHERE domain = 'example.com'")
    domain = cursor.fetchone()
    assert domain is not None
    
    cursor.execute("SELECT * FROM policy_snapshots WHERE dataset_id = 'ds-123'")
    snapshot = cursor.fetchone()
    assert snapshot is not None
    assert snapshot["robots_txt"] == "User-agent: *"
    assert snapshot["llms_txt"] is None
    
    conn.close()
