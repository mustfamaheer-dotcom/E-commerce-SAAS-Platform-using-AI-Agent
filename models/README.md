# Edge & Offline AI Models

This directory holds the quantized GGUF models for offline Text-to-SQL inference on edge devices / local GPUs.

### Included Runtime Models:
- **`qwen2.5-coder-3b-egyptian.Q4_K_M.gguf`**: 4-bit quantized GGUF weights fine-tuned for Egyptian Arabic Text-to-SQL queries against AdventureWorks2019.

### How to Build / Acquire:
1. Run local quantization:
   ```bash
   python training/convert_to_gguf.py
   ```
2. Or pull via Ollama runtime:
   ```bash
   ollama pull qwen2.5-coder:1.5b
   ```
