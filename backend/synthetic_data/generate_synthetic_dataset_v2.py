"""
generate_synthetic_dataset_v2.py — CLI for Synthetic Dataset v2.

Usage:
    python -m synthetic_data.generate_synthetic_dataset_v2 --count 2000
    python -m synthetic_data.generate_synthetic_dataset_v2 --count 2000 --seed 99 --dry-run
"""

from __future__ import annotations
import argparse
import random
import statistics
import sys
import os
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from synthetic_data.generator_v2 import generate_dataset_v2
from synthetic_data.exporter     import export_to_supabase

TABLE_V2 = "resume_analysis_synthetic_v2"


def print_summary(records: list[dict], seed: int) -> None:
    scores      = [r["final_score"] for r in records]
    roles       = Counter(r["role"] for r in records)
    readiness   = Counter(r["readiness_category"] for r in records)
    miss_any    = sum(1 for r in records if r["missing_core_skills"])
    miss_multi  = sum(1 for r in records if len(r["missing_core_skills"]) >= 2)
    avg_skills  = sum(len(r["detected_skills"]) for r in records) / len(records)
    noise_count = sum(1 for r in records if r["data_type"] == "synthetic_v2"
                      and r["role"] not in [r["role"]])   # approximate — logged at gen time

    print("\n" + "═" * 57)
    print("  SYNTHETIC DATASET v2 — GENERATION SUMMARY")
    print("═" * 57)
    print(f"  Seed              : {seed}")
    print(f"  Total records     : {len(records)}")

    print(f"\n  Role Distribution:")
    for role in sorted(roles):
        bar = "█" * (roles[role] // 20)
        print(f"    {role:<26} {roles[role]:>4}  {bar}")

    print(f"\n  Score Statistics:")
    print(f"    Mean            : {statistics.mean(scores):.1f}")
    print(f"    Std Deviation   : {statistics.stdev(scores):.1f}")
    print(f"    Min             : {min(scores)}")
    print(f"    Max             : {max(scores)}")

    print(f"\n  Core Skill Gaps:")
    print(f"    ≥1 missing      : {miss_any:>4}  ({miss_any/len(records)*100:.1f}%)")
    print(f"    ≥2 missing      : {miss_multi:>4}  ({miss_multi/len(records)*100:.1f}%)")

    print(f"\n  Avg skills/resume : {avg_skills:.1f}")

    print(f"\n  Readiness:")
    for cat in ["Job Ready", "Improving", "Needs Development"]:
        c = readiness.get(cat, 0)
        print(f"    {cat:<22} {c:>4}  ({c/len(records)*100:.1f}%)")

    print("═" * 57 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate Synthetic Dataset v2 (high-ambiguity, realistic)"
    )
    parser.add_argument("--count",   type=int,  default=2000, help="Number of records")
    parser.add_argument("--seed",    type=int,  default=None, help="Random seed")
    parser.add_argument("--dry-run", action="store_true",     help="Skip DB insertion")
    args = parser.parse_args()

    seed = args.seed if args.seed is not None else random.randrange(2 ** 32)
    rng  = random.Random(seed)

    print(f"\n🎲  Seed: {seed}")
    print(f"📦  Generating {args.count} v2 records (with ambiguity + label noise)…")

    records = generate_dataset_v2(count=args.count, rng=rng)
    print_summary(records, seed)

    if args.dry_run:
        print("ℹ️   Dry-run mode — skipping Supabase insertion.\n")
        return

    print(f"🚀  Exporting to Supabase table: {TABLE_V2}\n")
    result = export_to_supabase(records, table_name=TABLE_V2)

    print(f"\n{'═' * 57}")
    print(f"  EXPORT COMPLETE")
    print(f"    ✅ Inserted  : {result['success']}")
    print(f"    ❌ Failed    : {result['failures']}")
    if result["failed_batches"]:
        print(f"    Failed batches: {result['failed_batches']}")
    print(f"{'═' * 57}\n")

    if result["failures"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
