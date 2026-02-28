"""
convert_to_onnx.py — Export v2 models to ONNX using pipeline wrapper.

The score model (RandomForestRegressor) needs a simple Pipeline wrapping
to suppress the class_weight issue. Role model (Classifier) is handled similarly.
"""

import json, shutil, sys, warnings
from pathlib import Path

warnings.filterwarnings("ignore")

try:
    import joblib
    import numpy as np
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler
    from skl2onnx import to_onnx
except ImportError as e:
    print(f"[ERROR] {e} — pip install skl2onnx onnxruntime skl2onnx")
    sys.exit(1)

ROOT   = Path(__file__).resolve().parent
MODELS = ROOT / "models"
DEST   = ROOT.parent / "frontend" / "public" / "models"
DEST.mkdir(parents=True, exist_ok=True)

# ── Vocabulary ────────────────────────────────────────────────────────────────
vocab_obj  = joblib.load(MODELS / "vocabulary_v2.pkl")
vocab_list = sorted(vocab_obj) if isinstance(vocab_obj, (set, frozenset)) else list(vocab_obj)
n_features = len(vocab_list) + 5

print(f"[INFO] vocab={len(vocab_list)}, features={n_features}")

with open(MODELS / "vocabulary_v2_list.json", "w") as f:
    json.dump(vocab_list, f)
shutil.copy(MODELS / "vocabulary_v2_list.json", DEST / "vocabulary_v2_list.json")
print("[OK] vocabulary_v2_list.json copied")

X_dummy = np.zeros((3, n_features), dtype=np.float32)

def try_convert(pkl_name: str, onnx_name: str, is_classifier: bool = False):
    path = MODELS / pkl_name
    if not path.exists():
        print(f"[SKIP] {pkl_name} not found")
        return False
    
    model = joblib.load(path)
    
    # Wrap in a passthrough pipeline (sometimes resolves shape-calc errors)
    pipe = Pipeline([("model", model)])
    
    try:
        if is_classifier:
            onnx_model = to_onnx(pipe, X_dummy, target_opset=15,
                                 options={id(model): {"zipmap": False}})
        else:
            onnx_model = to_onnx(pipe, X_dummy, target_opset=15)
        
        out = MODELS / onnx_name
        out.write_bytes(onnx_model.SerializeToString())
        shutil.copy(out, DEST / onnx_name)
        print(f"[OK] {onnx_name} → {DEST}")
        return True
    except Exception as e:
        print(f"[WARN] {pkl_name} conversion: {e}")
        
        # Fallback: convert the estimator directly (without pipeline)
        try:
            onnx_model = to_onnx(model, X_dummy, target_opset=15,
                                 options={id(model): {"zipmap": False}} if is_classifier else {})
            out = MODELS / onnx_name
            out.write_bytes(onnx_model.SerializeToString())
            shutil.copy(out, DEST / onnx_name)
            print(f"[OK] {onnx_name} (direct) → {DEST}")
            return True
        except Exception as e2:
            print(f"[FAIL] {pkl_name}: {e2}")
            return False

score_ok = try_convert("score_model_v2.pkl", "score_model_v2.onnx", is_classifier=False)
role_ok  = try_convert("role_model_v2.pkl",  "role_model_v2.onnx",  is_classifier=True)

# ── Metadata ──────────────────────────────────────────────────────────────────
meta = MODELS / "metadata_v2.json"
if meta.exists():
    shutil.copy(meta, DEST / "metadata_v2.json")
    print("[OK] metadata_v2.json copied")

print(f"\n{'✅' if score_ok or role_ok else '⚠'} Conversion done!")
if not score_ok:
    print("   Score model ONNX not available — server-side inference fallback will be used")
if not role_ok:
    print("   Role model ONNX not available — server-side inference fallback will be used")
print(f"   Public dir: {DEST}")
