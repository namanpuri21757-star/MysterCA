import click
import sys
from .storage import init_db
from .scraping import record_policies_for_dataset
from .lineage import create_run
from .reporting import export_artifact_report_as_json

@click.group()
def cli():
    """AI Data Provenance Tool CLI."""
    pass

@cli.command()
@click.option("--db", required=True, help="Path to the SQLite database.")
def init_db_cmd(db):
    """Initialize the SQLite database."""
    init_db(db)
    click.echo(f"Initialized database at {db}")

@cli.command()
@click.option("--db", required=True, help="Path to the SQLite database.")
@click.option("--dataset-id", required=True, help="Identifier for the dataset.")
@click.option("--url", required=True, help="URL to fetch robots.txt and llms.txt from.")
def snapshot_policies(db, dataset_id, url):
    """Fetch and store robots.txt and llms.txt for a domain."""
    try:
        record_policies_for_dataset(db, dataset_id, url)
        click.echo(f"Recorded policy snapshots for dataset {dataset_id} from {url}")
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.option("--db", required=True, help="Path to the SQLite database.")
@click.option("--run-id", required=True, help="Unique identifier for this run.")
@click.option("--description", required=True, help="Short description of the run.")
@click.option("--code-version", help="Git commit hash or code version.")
@click.option("--input", "inputs", multiple=True, help="Input dataset IDs.")
@click.option("--output", "outputs", multiple=True, help="Output dataset IDs.")
@click.option("--model-id", "model_ids", multiple=True, help="Output model IDs.")
def create_run_cmd(db, run_id, description, code_version, inputs, outputs, model_ids):
    """Record a data transformation or model training run."""
    try:
        create_run(db, run_id, description, code_version, list(inputs), list(outputs), list(model_ids))
        click.echo(f"Recorded run {run_id}")
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.option("--db", required=True, help="Path to the SQLite database.")
@click.option("--artifact-id", required=True, help="ID of the artifact to report on.")
@click.option("--out", required=True, help="Output JSON file path.")
def generate_report(db, artifact_id, out):
    """Generate a provenance report for an artifact."""
    try:
        export_artifact_report_as_json(db, artifact_id, out)
        click.echo(f"Generated report for {artifact_id} at {out}")
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)

if __name__ == "__main__":
    cli()
