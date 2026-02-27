"""
generate_synthetic_dataset.py — CLI entry point.

Usage:
    python generate_synthetic_dataset.py --count 2000
    python generate_synthetic_dataset.py --count 500 --seed 42 --dry-run

Options:
    --count     Number of records to generate (default: 2000)
    --seed      Random seed for reproducibility (default: random)
    --dry-run   Generate records but do NOT insert into Supabase
"""

import argparse
import random
import statistics
import sys
import os
from collections import Counter

# Allow imports from backend/ root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from synthetic_data.generator import generate_dataset
from synthetic_data.exporter  import export_to_supabase


# ── Summary printer ────────────────────────────────────────────────────────────

def print_summary(records: list[dict]) -> None:
    final_scores = [r["final_score"] for r in records]
    role_dist    = Counter(r["role"] for r in records)
    missing_core = sum(1 for r in records if r["missing_core_skills"])
    avg_skills   = sum(len(r["detected_skills"]) for r in records) / len(records)
    readiness    = Counter(r["readiness_category"] for r in records)

    print("\n" + "=" * 55)
    print("  SYNTHETIC DATASET — GENERATION SUMMARY")
    print("=" * 55)

    print(f"\n  Total records       : {len(records)}")
    print(f"  Random seed         : {records[0].get('_seed', 'N/A')}")

    print("\n  Role Distribution:")
    for role in sorted(role_dist):
        bar   = "█" * (role_dist[role] // 20)
        print(f"    {role:<26} {role_dist[role]:>4}  {bar}")

    print(f"\n  Score Statistics:")
    print(f"    Mean              : {statistics.mean(final_scores):.1f}")
    print(f"    Std Deviation     : {statistics.stdev(final_scores):.1f}")
    print(f"    Min / Max         : {min(final_scores)} / {max(final_scores)}")

    print(f"\n  Avg skills / resume : {avg_skills:.1f}")
    print(f"  Missing ≥1 core     : {missing_core} ({missing_core/len(records)*100:.1f}%)")

    print(f"\n  Readiness Distribution:")
    for cat in ["Job Ready", "Improving", "Needs Development"]:
        count = readiness.get(cat, 0)
        print(f"    {cat:<22} {count:>4}  ({count/len(records)*100:.1f}%)")

    print("=" * 55 + "\n")


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate synthetic resume analysis dataset for ML training."
    )
    parser.add_argument(
        "--count",   type=int, default=2000,
        help="Number of synthetic records to generate (default: 2000)"
    )
    parser.add_argument(
        "--seed",    type=int, default=None,
        help="Random seed for reproducibility (default: random)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Generate records but skip Supabase insertion"
    )
    args = parser.parse_args()

    # ── Seed ──────────────────────────────────────────────────────────────────
    seed = args.seed if args.seed is not None else random.randrange(2**32)
    rng  = random.Random(seed)
    print(f"\n🎲  Using seed: {seed}")
    print(f"📦  Generating {args.count} records...")

    # ── Generate ───────────────────────────────────────────────────────────────
    records = generate_dataset(count=args.count, rng=rng)

    # Tag seed for summary display
    for r in records:
        r["_seed"] = seed

    print_summary(records)

    # Remove internal tag before export
    for r in records:
        r.pop("_seed", None)

    # ── Export ─────────────────────────────────────────────────────────────────
    if args.dry_run:
        print("ℹ️   Dry-run mode — skipping Supabase insertion.\n")
        return

    print(f"🚀  Exporting {len(records)} records to Supabase...")
    print(f"    Table: resume_analysis_synthetic\n")

    result = export_to_supabase(records)

    print(f"\n{'=' * 55}")
    print(f"  EXPORT COMPLETE")
    print(f"    ✅ Inserted : {result['success']}")
    print(f"    ❌ Failed   : {result['failures']}")
    if result["failed_batches"]:
        print(f"    Failed batches: {result['failed_batches']}")
    print(f"{'=' * 55}\n")

    if result["failures"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
