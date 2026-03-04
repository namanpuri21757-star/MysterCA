import json
from typing import Dict, Any
from .storage import db_session
from .lineage import get_lineage_for_artifact

def generate_artifact_report(db_path: str, artifact_id: str) -> Dict[str, Any]:
    """
    Assembles a comprehensive report for an artifact, including lineage and scraping signals.
    """
    lineage = get_lineage_for_artifact(db_path, artifact_id)
    
    report = {
        "artifact_id": artifact_id,
        "lineage": lineage["produced_by"],
        "scraping_signals": []
    }
    
    # Collect all dataset IDs mentioned in lineage (inputs and the artifact itself if it's a dataset)
    dataset_ids = {artifact_id}
    for run in lineage["produced_by"]:
        for input_id in run["upstream_inputs"]:
            dataset_ids.add(input_id)
            
    with db_session(db_path) as conn:
        cursor = conn.cursor()
        
        for ds_id in dataset_ids:
            cursor.execute("""
                SELECT d.domain, ps.fetched_at, ps.robots_txt, ps.llms_txt
                FROM policy_snapshots ps
                JOIN domains d ON ps.domain_id = d.id
                WHERE ps.dataset_id = ?
            """, (ds_id,))
            
            snapshots = cursor.fetchall()
            for snap in snapshots:
                report["scraping_signals"].append({
                    "dataset_id": ds_id,
                    "domain": snap["domain"],
                    "fetched_at": snap["fetched_at"],
                    "has_robots_txt": snap["robots_txt"] is not None,
                    "has_llms_txt": snap["llms_txt"] is not None,
                    "robots_txt_preview": (snap["robots_txt"][:200] + "...") if snap["robots_txt"] else None,
                    "llms_txt_preview": (snap["llms_txt"][:200] + "...") if snap["llms_txt"] else None
                })
                
    return report

def export_artifact_report_as_json(db_path: str, artifact_id: str, output_path: str) -> None:
    """
    Generates an artifact report and exports it to a JSON file.
    """
    report = generate_artifact_report(db_path, artifact_id)
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)
