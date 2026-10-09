# clutch.primals.eco — Clutch Justice Investigation Platform

**109 nodes. 157 edges. 4 investigations. 1 walkable graph.**

Collaborative investigation platform for [Clutch Justice](https://clutchjustice.com). Walk the corruption network, find the paths, help solve cases that Michigan's institutions won't touch.

## For AI Agents — Quick Start

If you're an AI agent pointed at this repo by Rita or a Clutch Justice patron, here's what you need:

### The Graph

**File:** `site/static/api/graph.json`

This is the unified investigation graph. 109 nodes, 157 edges, 5 investigations merged into one network.

```
Node schema:
  id          — unique identifier
  label       — display name
  type        — actor | judge | political | school | entity | enforcement | institutional
  tier        — 1 (principals) to 5 (historical)
  investigation — detroit | saginaw | barry | eastpointe | shared
  url         — link to evidence page (if exists)
  detail      — one-line description

Edge schema:
  source      — source node id
  target      — target node id
  type        — employment | ownership | board | payment | family | corruption | complaint | etc.
  flow        — money | power | influence | position
  label       — human-readable description
  source_doc  — citation
```

### What You Can Do With It

**Find a node:**
```python
# All judges in the detroit investigation
judges = [n for n in graph['nodes'] if n['type'] == 'judge' and n['investigation'] == 'detroit']
```

**Trace connections from a node:**
```python
# All edges touching Brian Banks
banks_edges = [e for e in graph['edges'] if e['source'] == 'banks' or e['target'] == 'banks']
```

**Find cross-investigation connections:**
```python
# Nodes that appear in 'shared' investigation = appear in multiple cases
shared = [n for n in graph['nodes'] if n['investigation'] == 'shared']
# → AGC, JTC, SCAO, State Bar UPL
```

**Trace money flows:**
```python
money = [e for e in graph['edges'] if e.get('flow') == 'money']
```

**Find shortest path between two nodes:**
```python
# Build adjacency, then BFS/DFS from source to target
# Example: path from Ellison (saginaw) to Banks (detroit)
# → ellison → agc → moreland (detroit) [via AGC complaints]
```

### Investigations

| ID | Name | Nodes | Status | Evidence |
|----|------|-------|--------|----------|
| `detroit` | Cash for Kids 2 | 91 | Active | [detroit.primals.eco](https://detroit.primals.eco) |
| `saginaw` | Ghost Witness | 10 | Active | [barry.primals.eco](https://barry.primals.eco) |
| `barry` | Disappeared Judge | 2 | Tracking | [barry.primals.eco](https://barry.primals.eco) |
| `eastpointe` | 38th District: Galen | 2 | Tracking | [barry.primals.eco](https://barry.primals.eco) |
| `shared` | Cross-Investigation | 4 | Active | This platform |

### Key Cross-Investigation Findings

1. **AGC** receives complaints from Detroit (Moreland, Perkins), Saginaw (Ellison), and Barry (Nakfoor Pratt). Same commission, 94% dismissal rate. Same outcome every time.

2. **JTC** receives complaints from Detroit (Miller, Yancey), Barry (Schipper), and Eastpointe (Galen). Years-long timelines, confidential proceedings.

3. **SLAPP playbook** appears in both Detroit (PPO against journalist via V. Hall) and Saginaw (contempt against journalist via Ellison, domains in victim names).

4. **Anderson localization** pattern: Detroit (Banks controls school board through entity network) and Hemlock (Ellison wife Katie is school board president while Ellison operates ISP/FOIA infrastructure).

---

## Site Structure

```
site/
├── config.toml                          # Zola config, investigation registry
├── content/
│   ├── _index.md                        # Landing page — Walk the Case
│   ├── graph/_index.md                  # Graph Walker page
│   ├── cases/
│   │   ├── detroit/_index.md            # Detroit investigation entry
│   │   ├── saginaw/_index.md            # Saginaw investigation entry
│   │   └── barry/_index.md              # Barry investigation entry
│   ├── contribute/_index.md             # How to help
│   └── about/_index.md                  # About + transmission + braid architecture
├── static/
│   ├── api/graph.json                   # THE UNIFIED GRAPH (109 nodes, 157 edges)
│   ├── js/graph-walker.js               # Interactive graph visualization
│   ├── css/main.css                     # Dark-first minimal UI
│   └── llms.txt                         # AI agent context
└── templates/                           # Zola HTML templates

agents/
└── AGENTS.md                            # Agent architecture + data schema

api/
├── build-unified-graph.py               # Merges detroit + barry → unified graph
└── ingest.py                            # Investigation ingestion pipeline
```

## Submitting New Investigation Data

Create a markdown file with TOML frontmatter:

```toml
+++
title = "Investigation Title"
date = "2026-10-07"
investigation = "saginaw"
status = "active"
county = "Saginaw"
+++

## Findings

Narrative with sourced claims here.
```

Run the ingestion pipeline:
```bash
python api/ingest.py path/to/investigation.md
```

The pipeline validates sources, checks PII, cross-references against the graph, and merges new nodes/edges.

## Rebuilding the Graph

When upstream evidence sites update:
```bash
python api/build-unified-graph.py
```

This pulls the latest from `publicRecord-detroit/site/static/graph.json` and `publicRecord-barry` actor data, merges them into the unified graph at `site/static/api/graph.json`.

## Privacy

- Contact: hello@clutchjustice.com
- No visitor tracking. No cookies. No identifying data.
- Court filings and public records: public domain.
- Investigation content: CC-BY-SA 4.0.

## Evidence Network

This is one node in the [primals.eco](https://primals.eco) investigation network:

| Surface | URL | Description |
|---------|-----|-------------|
| **Clutch Justice** | [clutchjustice.com](https://clutchjustice.com) | Walkable investigation graph (this repo) |
| **Tuebor** | [tuebor.primals.eco](https://tuebor.primals.eco) | Michigan court accountability |
| **Barry** | [barry.primals.eco](https://barry.primals.eco) | Barry County mirror + desk workbench |
| **Detroit** | [detroit.primals.eco](https://detroit.primals.eco) | Detroit public schools investigation |
| **Thesis** | [thesis.primals.eco](https://thesis.primals.eco) | Live research — Stomachs With No Eyes |
| **sporePrint** | [sporeprint.primals.eco](https://sporeprint.primals.eco) | Ecosystem documentation + philosophy |
| **Signal** | [signal.primals.eco](https://signal.primals.eco) | Live behavioral topology monitor |
| **Gorilla** | [gorilla.primals.eco](https://gorilla.primals.eco) | Real-time fleet observation |
| **Source** | [git.primals.eco](https://git.primals.eco) | Sovereign Forgejo — AGPL source |

### Repositories

- **This repo:** [github.com/amicusContra/clutch](https://github.com/amicusContra/clutch) — 109 nodes, 157 edges
- **Tuebor:** [github.com/amicusContra/tuebor](https://github.com/amicusContra/tuebor) — statewide investigation
- **Detroit:** [github.com/defendDetroit/publicRecord](https://github.com/defendDetroit/publicRecord) — Detroit schools
- **Full source:** [git.primals.eco/ecoPrimals](https://git.primals.eco/ecoPrimals) (AGPL-3.0-or-later)

---

<p align="center"><i>hello world — Artisan</i></p>
<p align="center"><sub><a href="https://sporeprint.primals.eco/philosophy/the-elements-of-style/">φ design system</a> · 55 repos · 6 orgs · 9 surfaces · <a href="https://primals.eco">primals.eco</a></sub></p>
