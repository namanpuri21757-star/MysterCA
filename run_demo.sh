#!/bin/bash

# 1. Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# 2. Initialize the database
echo "Initializing database..."
python3 -m provenance_tool.cli init-db --db demo.db

# 3. Snapshot policies for a domain
echo "Snapshotting policies for example.com..."
python3 -m provenance_tool.cli snapshot-policies --db demo.db --dataset-id raw_data_v1 --url https://example.com

# 4. Record a transformation run
echo "Recording a transformation run..."
python3 -m provenance_tool.cli create-run \
  --db demo.db \
  --run-id clean_job_001 \
  --description "Cleaned raw data" \
  --code-version "v1.0.0" \
  --input raw_data_v1 \
  --output clean_data_v1

# 5. Generate a transparency report
echo "Generating transparency report for clean_data_v1..."
python3 -m provenance_tool.cli generate-report --db demo.db --artifact-id clean_data_v1 --out report.json

echo "Demo complete! View 'report.json' to see the provenance data."
