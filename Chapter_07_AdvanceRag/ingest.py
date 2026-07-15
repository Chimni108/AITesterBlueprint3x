"""CLI ingestion, for scripting/CI use instead of the /upload + /ingest UI.

Usage:
    python ingest.py testcase/vwo_test_cases.csv \\
        --text-cols title,steps,expected,tags \\
        --meta-cols id,jira_id,priority,module
"""

import argparse
import sys

from rag import ingestion


def main():
    parser = argparse.ArgumentParser(description="Ingest a CSV/XLSX of test cases into Qdrant.")
    parser.add_argument("path", help="Path to a .csv, .xlsx, or .xls file.")
    parser.add_argument("--text-cols", required=True, help="Comma-separated columns to embed (e.g. title,steps,expected,tags).")
    parser.add_argument("--meta-cols", default="", help="Comma-separated columns to keep as filterable payload metadata.")
    args = parser.parse_args()

    text_cols = [c.strip() for c in args.text_cols.split(",") if c.strip()]
    meta_cols = [c.strip() for c in args.meta_cols.split(",") if c.strip()]

    for event in ingestion.run_ingestion(args.path, text_cols, meta_cols):
        stage, status = event.get("stage"), event.get("status")
        if status == "start":
            print(f"[{stage}] starting...")
        elif status == "progress":
            print(f"[{stage}] {event.get('done')}/{event.get('total')}")
        elif status == "done":
            details = {k: v for k, v in event.items() if k not in ("stage", "status", "sample", "preview")}
            print(f"[{stage}] done - {details}")

    print("\nIngestion complete.")


if __name__ == "__main__":
    sys.exit(main())
