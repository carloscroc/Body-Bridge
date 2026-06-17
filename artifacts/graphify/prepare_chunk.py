#!/usr/bin/env python3
"""Process semantic extraction chunks with file persistence"""

import json
import sys
from pathlib import Path

# Load chunks
with open('.graphify_chunks.json', 'r') as f:
    chunks = json.load(f)

chunk_num = int(sys.argv[1]) if len(sys.argv) > 1 else 1
chunk = chunks[chunk_num - 1]

print(f"Processing chunk {chunk_num} with {len(chunk)} files")

# Prepare file list for semantic extraction
files_to_process = []
for item in chunk:
    files_to_process.append(item['path'])

print(f"Files: {files_to_process[:5]}...")

# Save chunk task file
task_file = f'.graphify_chunk{chunk_num}_task.json'
with open(task_file, 'w') as f:
    json.dump({
        'chunk_num': chunk_num,
        'files': files_to_process,
        'total_files': len(files_to_process)
    }, f, indent=2)

print(f"Task saved to {task_file}")
print(f"Ready for semantic extraction")
