import pytest
import json
from provenance_tool.storage import init_db
from provenance_tool.scraping import record_policies_for_dataset
from provenance_tool.lineage import create_run
from provenance_tool.reporting import generate_artifact_report

def test_generate_artifact_report(tmp_path, requests_mock):
    db_path = str(tmp_path / "test.db")
    init_db(db_path)
    
    # Snapshot policies for input
    requests_mock.get("https://data-source.com/robots.txt", text="Allow: /")
    requests_mock.get("https://data-source.com/llms.txt", text="LLM friendly")
    record_policies_for_dataset(db_path, "raw-data", "https://data-source.com")
    
    # Create run
    create_run(
        db_path=db_path,
        run_id="train-run",
        description="Training model",
        code_version="v1.0",
        inputs=["raw-data"],
        outputs=[],
        model_ids=["final-model"]
    )
    
    report = generate_artifact_report(db_path, "final-model")
    
    assert report["artifact_id"] == "final-model"
    assert len(report["lineage"]) == 1
    assert report["lineage"][0]["run_metadata"]["run_id"] == "train-run"
    
    assert len(report["scraping_signals"]) == 1
    signal = report["scraping_signals"][0]
    assert signal["dataset_id"] == "raw-data"
    assert signal["domain"] == "data-source.com"
    assert signal["has_robots_txt"] is True
    assert signal["has_llms_txt"] is True
