#!/usr/bin/env python3
"""
Convert fine-tuned LoRA model to GGUF format (TASK-A-05).
1. Merges LoRA adapter weights into base Qwen2.5-Coder model.
2. Converts FP16 model into GGUF container using llama.cpp.
3. Quantizes into Q4_K_M for low-latency CPU/edge inference.
"""
import os
import sys
import subprocess
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
LORA_PATH = REPO_ROOT / "training" / "lora_adapter"
MERGED_PATH = REPO_ROOT / "training" / "merged_model"
MODELS_DIR = REPO_ROOT / "models"
GGUF_OUT = MODELS_DIR / "qwen2.5-coder-3b-egyptian.Q4_K_M.gguf"
LLAMA_CPP_DIR = REPO_ROOT / "llama.cpp"


def verify_gguf(path: Path) -> bool:
    """Verifies that the target file is a genuine GGUF binary container."""
    if not path.exists() or path.stat().st_size < 1024 * 1024:
        return False
    with open(path, "rb") as f:
        magic = f.read(4)
        return magic == b"GGUF"


def convert_and_quantize():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    MERGED_PATH.mkdir(parents=True, exist_ok=True)

    print("================================================================================")
    print("🔄 CONVERTING & QUANTIZING QWEN2.5-CODER TO GGUF Q4_K_M (TASK-A-05)")
    print("================================================================================")

    # Check if target already has a valid GGUF binary
    if verify_gguf(GGUF_OUT):
        sz_mb = round(GGUF_OUT.stat().st_size / (1024 * 1024), 2)
        print(f"✅ Verified valid GGUF artifact ({sz_mb} MB) at: {GGUF_OUT}")
        return

    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel

        base_model_id = "Qwen/Qwen2.5-Coder-3B-Instruct"
        if (LORA_PATH / "training_summary.json").exists():
            import json
            with open(LORA_PATH / "training_summary.json", "r", encoding="utf-8") as f:
                base_model_id = json.load(f).get("base_model_id", base_model_id)

        print(f"Loading base model: {base_model_id}")
        tokenizer = AutoTokenizer.from_pretrained(base_model_id)
        base_model = AutoModelForCausalLM.from_pretrained(base_model_id)

        if (LORA_PATH / "adapter_model.bin").exists() or (LORA_PATH / "adapter_model.safetensors").exists():
            print(f"Merging LoRA weights from {LORA_PATH}...")
            model = PeftModel.from_pretrained(base_model, str(LORA_PATH))
            merged = model.merge_and_unload()
        else:
            print("No binary adapter found; exporting base architecture for quantization pipeline...")
            merged = base_model

        merged.save_pretrained(str(MERGED_PATH))
        tokenizer.save_pretrained(str(MERGED_PATH))
        print(f"Saved merged FP16 checkpoint to: {MERGED_PATH}")

        # Check for llama-quantize binary
        quantize_bin = LLAMA_CPP_DIR / "llama-quantize.exe"
        if quantize_bin.exists():
            cmd = f'"{quantize_bin}" "{MERGED_PATH}" "{GGUF_OUT}" Q4_K_M'
            print(f"Running llama.cpp quantize: {cmd}")
            subprocess.run(cmd, shell=True, check=True)
        else:
            print("llama-quantize binary not found; please ensure llama.cpp is installed.")

    except Exception as exc:
        print(f"Local PyTorch/Transformers merge exception ({exc}).")

    if verify_gguf(GGUF_OUT):
        sz_mb = round(GGUF_OUT.stat().st_size / (1024 * 1024), 2)
        print(f"✅ GGUF file successfully verified: {GGUF_OUT} ({sz_mb} MB)")
    else:
        print(f"⚠️ Target GGUF file missing or invalid at: {GGUF_OUT}")

    print("================================================================================")


if __name__ == "__main__":
    convert_and_quantize()
