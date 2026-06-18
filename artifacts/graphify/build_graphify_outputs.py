import json
from pathlib import Path
from collections import Counter

import networkx as nx


ROOT = Path(__file__).parent
OUT = ROOT / "graphify-out"
OUT.mkdir(exist_ok=True)


def load_json_with_preamble(path: Path):
    text = path.read_text(encoding="utf-8", errors="ignore")
    start = text.find('{\n  "chunk_num"')
    if start == -1:
        start = text.find('{"chunk_num"')
    if start == -1:
        start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"Could not find JSON payload in {path.name}")
    return json.loads(text[start:end + 1])


def make_semantic_node_id(item):
    stem = Path(item.get("path", item.get("name", "unknown"))).stem.lower().replace(" ", "_")
    return f"semantic_{stem}"


def main():
    ast = json.loads((ROOT / ".graphify_ast.json").read_text(encoding="utf-8"))

    semantic_files = sorted(ROOT.glob(".graphify_chunk*_semantic.json"))
    semantic_results = []
    for path in semantic_files:
        payload = load_json_with_preamble(path)
        semantic_results.extend(payload.get("results", []))

    nodes = list(ast.get("nodes", []))
    edges = list(ast.get("edges", []))

    existing_ids = {n["id"] for n in nodes}

    for item in semantic_results:
        node_id = make_semantic_node_id(item)
        if node_id not in existing_ids:
            nodes.append({
                "id": node_id,
                "label": item.get("name", item.get("path", node_id)),
                "file_type": item.get("type", "semantic"),
                "source_file": item.get("path", ""),
                "source_location": "semantic",
                "size": item.get("size", 0),
            })
            existing_ids.add(node_id)

        source_file = item.get("path", "")
        file_stem = Path(source_file).stem.lower().replace(" ", "_")
        related = [n for n in nodes if n["id"].startswith(file_stem) or Path(n.get("source_file", "")).stem.lower() == file_stem]
        if related:
            edges.append({
                "source": node_id,
                "target": related[0]["id"],
                "relation": "documents",
                "confidence": "INFERRED",
                "source_file": source_file,
                "source_location": "semantic",
                "weight": 0.6,
            })

    graph_payload = {
        "nodes": nodes,
        "edges": edges,
        "input_tokens": ast.get("input_tokens", 0),
        "output_tokens": ast.get("output_tokens", 0),
    }
    (OUT / "graph.json").write_text(json.dumps(graph_payload, indent=2), encoding="utf-8")

    G = nx.DiGraph()
    for n in nodes:
        G.add_node(n["id"], **n)
    for e in edges:
        G.add_edge(e["source"], e["target"], **e)

    weak = G.to_undirected()
    communities = list(nx.connected_components(weak))
    degree = sorted(G.degree(), key=lambda x: x[1], reverse=True)
    top_nodes = degree[:15]
    file_types = Counter(n.get("file_type", "unknown") for n in nodes)

    report = [
        "# GRAPH_REPORT",
        "",
        f"- Nodes: {G.number_of_nodes()}",
        f"- Edges: {G.number_of_edges()}",
        f"- Communities: {len(communities)}",
        f"- File types: {dict(file_types)}",
        "",
        "## Highest-degree nodes",
        "",
    ]
    for node_id, deg in top_nodes:
        node = G.nodes[node_id]
        report.append(f"- {node.get('label', node_id)} (`{node_id}`): degree {deg}")

    report.append("")
    report.append("## Largest communities")
    report.append("")
    for idx, community in enumerate(sorted(communities, key=len, reverse=True)[:10], 1):
        sample = list(community)[:8]
        report.append(f"- Community {idx}: {len(community)} nodes; sample: {', '.join(sample)}")

    (OUT / "GRAPH_REPORT.md").write_text("\n".join(report), encoding="utf-8")

    html = f"""<!doctype html>
<html><head><meta charset=\"utf-8\"><title>Graphify Output</title></head>
<body>
<h1>Forge Graph</h1>
<p>Nodes: {G.number_of_nodes()} | Edges: {G.number_of_edges()} | Communities: {len(communities)}</p>
<p>See <code>graph.json</code> and <code>GRAPH_REPORT.md</code> for details.</p>
</body></html>"""
    (OUT / "graph.html").write_text(html, encoding="utf-8")

    print(json.dumps({
        "nodes": G.number_of_nodes(),
        "edges": G.number_of_edges(),
        "communities": len(communities),
        "out_dir": str(OUT),
    }))


if __name__ == "__main__":
    main()
