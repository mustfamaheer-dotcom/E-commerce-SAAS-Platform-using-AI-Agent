#!/usr/bin/env python3
"""
Qwen2.5-Coder-3B QLoRA Fine-Tuning Script (TASK-A-04).
Fine-tunes Qwen/Qwen2.5-Coder-3B-Instruct on Egyptian Arabic T-SQL pairs.
Uses HuggingFace PEFT / SFTTrainer with 4-bit NF4 quantization.
"""
import os
import sys
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
TRAIN_DATA = REPO_ROOT / "training" / "dataset" / "train_dataset.json"
OUTPUT_DIR = REPO_ROOT / "training" / "lora_adapter"

CHAT_TEMPLATE = """<|im_start|>system
You are a Microsoft SQL Server T-SQL database expert specializing in Egyptian Arabic natural language queries for AdventureWorks2019. Always output clean, valid, dialect-aware T-SQL queries.
<|im_end|>
<|im_start|>user
Database Schema:
{schema_context}

Question:
{input_prompt}
<|im_end|>
<|im_start|>assistant
```sql
{output_sql}
```
<|im_end|>"""


def format_dataset():
    if not TRAIN_DATA.exists():
        raise FileNotFoundError(f"Training data not found at {TRAIN_DATA}")
    with open(TRAIN_DATA, "r", encoding="utf-8") as f:
        samples = json.load(f)

    formatted = []
    for sample in samples:
        text = CHAT_TEMPLATE.format(
            schema_context=sample["schema_context"],
            input_prompt=sample["input_prompt"],
            output_sql=sample["output_sql"],
        )
        formatted.append({"text": text, "domain": sample["domain"]})
    return formatted


def train():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    formatted_data = format_dataset()
    print(f"Loaded {len(formatted_data)} training samples formatted with ChatML.")

    # Check for torch / transformers / peft / trl
    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TrainingArguments
        from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
        from trl import SFTTrainer
        from datasets import Dataset

        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Executing QLoRA training on: {device.upper()}")

        model_id = "Qwen/Qwen2.5-Coder-3B-Instruct"
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
        )

        tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
        tokenizer.pad_token = tokenizer.eos_token

        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            quantization_config=bnb_config if device == "cuda" else None,
            device_map="auto" if device == "cuda" else None,
            trust_remote_code=True,
        )

        peft_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM",
        )

        dataset = Dataset.from_list(formatted_data)

        training_args = TrainingArguments(
            output_dir=str(OUTPUT_DIR),
            num_train_epochs=3,
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            learning_rate=2e-4,
            lr_scheduler_type="cosine",
            logging_steps=10,
            save_strategy="epoch",
            fp16=(device == "cuda"),
        )

        trainer = SFTTrainer(
            model=model,
            train_dataset=dataset,
            peft_config=peft_config,
            dataset_text_field="text",
            max_seq_length=1024,
            tokenizer=tokenizer,
            args=training_args,
        )

        trainer.train()
        model.save_pretrained(str(OUTPUT_DIR))
        tokenizer.save_pretrained(str(OUTPUT_DIR))
        print(f"LoRA adapter weights successfully saved to: {OUTPUT_DIR}")

    except ImportError as e:
        print(f"HuggingFace fine-tuning libraries not installed ({e}).")
        print("Saving training metadata and adapter manifest for execution in GPU environment...")
        manifest = {
            "model_id": "Qwen/Qwen2.5-Coder-3B-Instruct",
            "lora_r": 16,
            "lora_alpha": 32,
            "lora_dropout": 0.05,
            "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            "epochs": 3,
            "learning_rate": 2e-4,
            "batch_size": 2,
            "gradient_accumulation_steps": 4,
            "train_samples_count": len(formatted_data),
            "status": "ready_for_gpu_training",
        }
        with open(OUTPUT_DIR / "adapter_config.json", "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)
        print(f"Config and training plan written to: {OUTPUT_DIR / 'adapter_config.json'}")


if __name__ == "__main__":
    train()
