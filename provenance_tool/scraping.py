import requests
from urllib.parse import urlparse
from datetime import datetime, timezone
from typing import Dict, Optional
from .storage import db_session

def fetch_policies_for_url(url: str) -> Dict[str, Optional[str]]:
    """
    Extracts the domain from the URL and fetches robots.txt and llms.txt.
    """
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    if not domain:
        raise ValueError(f"Invalid URL: {url}")
    
    scheme = parsed_url.scheme if parsed_url.scheme else "https"
    base_url = f"{scheme}://{domain}"
    
    robots_url = f"{base_url}/robots.txt"
    llms_url = f"{base_url}/llms.txt"
    
    def fetch_text(target_url: str) -> Optional[str]:
        try:
            response = requests.get(target_url, timeout=10)
            if response.status_code == 200:
                return response.text
        except requests.RequestException:
            pass
        return None

    robots_txt = fetch_text(robots_url)
    llms_txt = fetch_text(llms_url)
    
    return {
        "domain": domain,
        "robots_txt": robots_txt,
        "llms_txt": llms_txt,
        "fetched_at": datetime.now(timezone.utc).isoformat()
    }

def record_policies_for_dataset(db_path: str, dataset_id: str, url: str) -> None:
    """
    Fetches policies for a URL and records them in the database for a given dataset_id.
    """
    policy_data = fetch_policies_for_url(url)
    domain = policy_data["domain"]
    
    with db_session(db_path) as conn:
        cursor = conn.cursor()
        
        # Get or create domain
        cursor.execute("INSERT OR IGNORE INTO domains (domain) VALUES (?)", (domain,))
        cursor.execute("SELECT id FROM domains WHERE domain = ?", (domain,))
        domain_id = cursor.fetchone()["id"]
        
        # Insert policy snapshot
        cursor.execute("""
            INSERT INTO policy_snapshots (domain_id, robots_txt, llms_txt, fetched_at, dataset_id)
            VALUES (?, ?, ?, ?, ?)
        """, (
            domain_id,
            policy_data["robots_txt"],
            policy_data["llms_txt"],
            policy_data["fetched_at"],
            dataset_id
        ))
