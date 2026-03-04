import pytest
from provenance_tool.storage import init_db
from provenance_tool.lineage import create_run, get_lineage_for_artifact

def test_create_run_and_lineage(tmp_path):
    db_path = str(tmp_path / "test.db")
    init_db(db_path)
    
    create_run(
        db_path=db_path,
        run_id="run-1",
        description="Test run",
        code_version="abc123",
        inputs=["ds-in-1", "ds-in-2"],
        outputs=["ds-out-1"],
        model_ids=["model-1"]
    )
    
    # Test lineage for output dataset
    lineage_ds = get_lineage_for_artifact(db_path, "ds-out-1")
    assert lineage_ds["artifact_id"] == "ds-out-1"
    assert len(lineage_ds["produced_by"]) == 1
    assert lineage_ds["produced_by"][0]["run_metadata"]["run_id"] == "run-1"
    assert set(lineage_ds["produced_by"][0]["upstream_inputs"]) == {"ds-in-1", "ds-in-2"}
    
    # Test lineage for model
    lineage_model = get_lineage_for_artifact(db_path, "model-1")
    assert lineage_model["artifact_id"] == "model-1"
    assert len(lineage_model["produced_by"]) == 1
    assert lineage_model["produced_by"][0]["run_metadata"]["run_id"] == "run-1"
