# AI Data Provenance Tool

A minimal Python package and CLI for single-developer AI data provenance tracking.

## Features

1.  **Point-in-time Scraping Signals**: Automatically fetch and store `robots.txt` and `llms.txt` when scraping, proving respect for site policies at the exact time of data ingestion.
2.  **Simple Lineage Graph**: Record runs that link input datasets to output datasets or models, creating a verifiable chain of provenance.
3.  **Transparency Reports**: Generate JSON reports for any artifact (dataset or model) that combine lineage and scraping signals.

## Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## CLI Usage

### 1. Initialize the Database
```bash
python -m provenance_tool.cli init-db --db my_project.db
```

### 2. Snapshot Scraping Policies
Record the `robots.txt` and `llms.txt` for a domain associated with a dataset:
```bash
python -m provenance_tool.cli snapshot-policies --db my_project.db --dataset-id raw_scraped_v1 --url https://example.com
```

### 3. Record a Transformation or Training Run
Link inputs to outputs:
```bash
python -m provenance_tool.cli create-run \
  --db my_project.db \
  --run-id train_001 \
  --description "Fine-tuning on scraped data" \
  --code-version $(git rev-parse HEAD) \
  --input raw_scraped_v1 \
  --model-id my_awesome_model_v1
```

### 4. Generate a Provenance Report
Create a JSON report for your model or dataset:
```bash
python -m provenance_tool.cli generate-report --db my_project.db --artifact-id my_awesome_model_v1 --out report.json
```

## Testing
Run the test suite:
```bash
pytest
```

## Disclaimer
This tool is for technical provenance logging only. It does not ensure legal or regulatory compliance.
