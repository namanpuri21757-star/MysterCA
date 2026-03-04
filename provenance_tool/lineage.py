from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from .storage import db_session

def create_run(
    db_path: str,
    run_id: str,
    description: str,
    code_version: Optional[str],
    inputs: List[str],
    outputs: List[str],
    model_ids: Optional[List[str]] = None
) -> None:
    """
    Records a new run and its associated artifacts in the database.
    """
    created_at = datetime.now(timezone.utc).isoformat()
    
    with db_session(db_path) as conn:
        cursor = conn.cursor()
        
        # Insert run
        cursor.execute("""
            INSERT INTO runs (run_id, created_at, description, code_version)
            VALUES (?, ?, ?, ?)
        """, (run_id, created_at, description, code_version))
        
        # Insert input artifacts
        for artifact_id in inputs:
            cursor.execute("""
                INSERT INTO run_artifacts (run_id, artifact_id, artifact_type)
                VALUES (?, ?, ?)
            """, (run_id, artifact_id, "dataset_input"))
            
        # Insert output artifacts
        for artifact_id in outputs:
            cursor.execute("""
                INSERT INTO run_artifacts (run_id, artifact_id, artifact_type)
                VALUES (?, ?, ?)
            """, (run_id, artifact_id, "dataset_output"))
            
        # Insert model artifacts
        if model_ids:
            for artifact_id in model_ids:
                cursor.execute("""
                    INSERT INTO run_artifacts (run_id, artifact_id, artifact_type)
                    VALUES (?, ?, ?)
                """, (run_id, artifact_id, "model_output"))

def get_lineage_for_artifact(db_path: str, artifact_id: str) -> Dict[str, Any]:
    """
    Retrieves the immediate upstream lineage for a given artifact.
    """
    with db_session(db_path) as conn:
        cursor = conn.cursor()
        
        # Find runs that produced this artifact as output
        cursor.execute("""
            SELECT r.run_id, r.created_at, r.description, r.code_version
            FROM runs r
            JOIN run_artifacts ra ON r.run_id = ra.run_id
            WHERE ra.artifact_id = ? AND ra.artifact_type IN ('dataset_output', 'model_output')
        """, (artifact_id,))
        
        producing_runs = [dict(row) for row in cursor.fetchall()]
        
        lineage = {
            "artifact_id": artifact_id,
            "produced_by": []
        }
        
        for run in producing_runs:
            run_id = run["run_id"]
            
            # Find inputs for this run
            cursor.execute("""
                SELECT artifact_id, artifact_type
                FROM run_artifacts
                WHERE run_id = ? AND artifact_type = 'dataset_input'
            """, (run_id,))
            
            inputs = [row["artifact_id"] for row in cursor.fetchall()]
            
            lineage["produced_by"].append({
                "run_metadata": run,
                "upstream_inputs": inputs
            })
            
        return lineage
