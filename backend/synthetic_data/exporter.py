"""
exporter.py — insert synthetic records into Supabase in batches.

Table: resume_analysis_synthetic
Batch size: 100 rows per insert (Supabase REST API limit)
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import get_supabase

DEFAULT_TABLE = "resume_analysis_synthetic"
BATCH_SIZE    = 100


def export_to_supabase(records: list[dict], table_name: str = DEFAULT_TABLE) -> dict:
    """
    Insert all records into Supabase in batches of BATCH_SIZE.

    Returns:
        {"success": int, "failures": int, "failed_batches": [int]}
    """
    sb            = get_supabase()
    success       = 0
    failures      = 0
    failed_batches = []

    total_batches = (len(records) + BATCH_SIZE - 1) // BATCH_SIZE

    for batch_num, start in enumerate(range(0, len(records), BATCH_SIZE), 1):
        batch = records[start : start + BATCH_SIZE]
        try:
            sb.table(table_name).insert(batch).execute()
            success += len(batch)
            print(
                f"  ✅ Batch {batch_num}/{total_batches} "
                f"({len(batch)} rows) inserted.",
                flush=True,
            )
        except Exception as e:
            failures += len(batch)
            failed_batches.append(batch_num)
            print(
                f"  ❌ Batch {batch_num}/{total_batches} FAILED: {e}",
                flush=True,
            )

    return {
        "success":       success,
        "failures":      failures,
        "failed_batches": failed_batches,
    }
