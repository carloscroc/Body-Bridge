#!/usr/bin/env python3
"""Semantic extraction for a chunk of files"""

import json
import sys
from pathlib import Path
import base64

def extract_semantic_from_image(image_path):
    """Extract semantic information from an image"""
    try:
        # Read image file
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')

        # Extract basic metadata
        path = Path(image_path)
        return {
            'type': 'image',
            'path': str(path),
            'name': path.name,
            'size': path.stat().st_size if path.exists() else 0,
            'data': image_data[:1000]  # Truncated for efficiency
        }
    except Exception as e:
        return {
            'type': 'image',
            'path': image_path,
            'error': str(e)
        }

def extract_semantic_from_doc(doc_path):
    """Extract semantic information from a document"""
    try:
        with open(doc_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract entities and relationships from content
        lines = content.split('\n')
        entities = []
        relationships = []

        for i, line in enumerate(lines):
            # Simple entity extraction (headings, code blocks, etc.)
            if line.startswith('#'):
                entities.append({
                    'type': 'heading',
                    'text': line.strip(),
                    'line': i
                })
            elif '```' in line:
                entities.append({
                    'type': 'code_block',
                    'line': i
                })

        return {
            'type': 'doc',
            'path': doc_path,
            'entities': entities,
            'relationships': relationships,
            'content_length': len(content)
        }
    except Exception as e:
        return {
            'type': 'doc',
            'path': doc_path,
            'error': str(e)
        }

# Load chunk task
chunk_num = int(sys.argv[1]) if len(sys.argv) > 1 else 1
task_file = f'.graphify_chunk{chunk_num}_task.json'

with open(task_file, 'r') as f:
    task = json.load(f)

print(f"Processing chunk {chunk_num} with {task['total_files']} files")

# Extract semantic information for each file
results = []
for file_path in task['files']:
    full_path = Path(file_path)
    if not full_path.exists():
        full_path = Path.cwd() / file_path

    if full_path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.svg']:
        result = extract_semantic_from_image(str(full_path))
    else:
        result = extract_semantic_from_doc(str(full_path))

    results.append(result)
    print(f"  Processed: {file_path}")

# Save results
output_file = f'.graphify_chunk{chunk_num}_semantic.json'
with open(output_file, 'w') as f:
    json.dump({
        'chunk_num': chunk_num,
        'total_files': len(results),
        'results': results
    }, f, indent=2)

print(f"Results saved to {output_file}")
print(f"Extracted {len(results)} files")
