"""Ingestion CLI.

  python -m scripts.ingest --source all           # everything (incremental)
  python -m scripts.ingest --source 03_test_cases # one source
  python -m scripts.ingest --source all --force   # re-index even unchanged files
  python -m scripts.ingest --jira                 # fetch JIRA via REST + JQL first
"""
import argparse

from app.config import SOURCES
from app.ingestion.pipeline import ingest_all, ingest_source


def main():
    parser = argparse.ArgumentParser(description="QABuddy.ai ingestion")
    parser.add_argument("--source", default="all", help="'all' or a source folder id")
    parser.add_argument("--force", action="store_true", help="ignore change detection")
    parser.add_argument("--jira", action="store_true", help="fetch JIRA tickets first")
    args = parser.parse_args()

    if args.jira:
        from app.ingestion.jira_ingest import fetch_jira
        fetch_jira()

    if args.source == "all":
        ingest_all(force=args.force)
    elif args.source in SOURCES:
        stats = ingest_source(args.source, force=args.force)
        print(stats)
    else:
        raise SystemExit(f"Unknown source '{args.source}'. Options: all, {', '.join(SOURCES)}")


if __name__ == "__main__":
    main()
