# Clutch Justice — Agent Architecture

## Overview

clutch.primals.eco is a collaborative investigation platform with three layers:

1. **Static Layer** (Zola) — public-facing case explorer + graph walker
2. **Agent Layer** — AI agents process investigation data, cross-reference, find patterns
3. **Data Layer** — unified graph connecting all investigation nodes

## How Rita Feeds Investigations

### Investigation Submission Format

Rita submits investigation data as structured markdown files with TOML frontmatter:

```toml
+++
title = "Investigation Title"
date = "2026-10-07"
investigation = "detroit"  # or "saginaw", "barry", "new-case-id"
status = "active"          # active, tracking, closed
county = "Wayne"

[extra]
source_type = "court_record"  # court_record, foia, campaign_finance, lara, published
source_id = "2026-4301-CZ"
confidence = "record"         # record, corroborated, inference, allegation

# New nodes this investigation adds
[[extra.nodes]]
id = "new_actor_id"
label = "Full Name"
type = "actor"  # actor, judge, political, school, entity, enforcement
tier = 3
detail = "One-line description"
source = "LARA 802112914"

# New edges this investigation adds
[[extra.edges]]
source = "new_actor_id"
target = "existing_node_id"
type = "payment"
flow = "money"
amount = "5000"
label = "$5K campaign contribution"
source_doc = "TransparencyUSA"
+++

## Narrative

Full investigation writeup here. Sources inline.
```

### Agent Processing Pipeline

```
Rita submits .md file
    ↓
Agent validates:
  - Every node has a source
  - Every edge has a type and flow
  - Confidence levels are appropriate
  - No PII violations
    ↓
Agent cross-references:
  - Does this node already exist in another investigation?
  - Do any edges create new cross-investigation connections?
  - Does this trigger a pattern match (same defense playbook, same enforcement gap)?
    ↓
Agent outputs:
  - Updated graph.json for the graph walker
  - New/updated content pages for the static site
  - Cross-reference alerts if new connections found
  - Data feed for caseDB (SQL updates)
```

### Data Flow

```
clutchjustice.com (published journalism)
    ↓ investigation data
clutch.primals.eco/agents/ (processing)
    ↓ validated + cross-referenced
clutch.primals.eco/api/graph.json (unified graph)
    ↓ feeds
detroit.primals.eco (Detroit evidence)
barry.primals.eco (Barry/Saginaw evidence)
tuebor.primals.eco (statewide shield)
    ↓ closed cases
justice.primals.eco (accountability record)
```

## Privacy Constraints

- Rita Williams' relationship to site operators is PRIVATE
- Platform presents as Clutch Justice infrastructure
- Contact: hello@clutchjustice.com only
- No visitor tracking, no cookies, no identifying data
- Kevin Mok's name must NOT appear on public-facing pages
- Rita's children's names must NOT be published
- Roeiah Ahmaliah Epps-Ward must NOT be published

## Graph Data Schema

### Node

```json
{
  "id": "unique_string_id",
  "label": "Display Name",
  "type": "actor|judge|political|school|entity|enforcement|institutional",
  "tier": 1-5,
  "investigation": "detroit|saginaw|barry|eastpointe|shared",
  "url": "https://evidence-site.primals.eco/path/to/page/",
  "detail": "One-line summary",
  "nexus": ["education", "political", "enforcement"],
  "dynasty": "optional_dynasty_id",
  "source": "LARA/ICHAT/PACER/etc"
}
```

### Edge

```json
{
  "source": "node_id",
  "target": "node_id",
  "type": "employment|ownership|board|payment|family|corruption|complaint|authorization",
  "flow": "money|power|influence|position",
  "label": "Human-readable description",
  "amount": "optional_dollar_amount",
  "source_doc": "Citation",
  "epistemic_status": "record|corroborated|inference|allegation"
}
```

## Deployment

Same infrastructure as other primals.eco nodes:
- Zola static site generator
- Hosted on primals.eco infrastructure
- Git-signed commits
- BLAKE3 content manifests
