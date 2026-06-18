#!/usr/bin/env python3
"""Re-run semantic extraction with file persistence"""

import json
import sys
from pathlib import Path

# Load detection results
with open('.graphify_detect.json', 'r') as f:
    detect = json.load(f)

# Get files by type
doc_files = detect['files'].get('doc', [])
image_files = detect['files'].get('image', [])

# Create chunks for semantic extraction
all_semantic = []
for f in doc_files:
    all_semantic.append({'path': f, 'type': 'doc'})
for f in image_files:
    all_semantic.append({'path': f, 'type': 'image'})

chunks = []
chunk_size = 20
for i in range(0, len(all_semantic), chunk_size):
    chunk = all_semantic[i:i + chunk_size]
    chunks.append(chunk)

print(f"Total chunks: {len(chunks)}")
print(f"Total files: {len(all_semantic)}")

# Save chunk configuration
with open('.graphify_chunks.json', 'w') as f:
    json.dump(chunks, f, indent=2)

print("Chunks saved to .graphify_chunks.json")
