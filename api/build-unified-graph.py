#!/usr/bin/env python3
"""
Build the unified investigation graph for clutch.primals.eco.

Merges:
- detroit.primals.eco graph (91 nodes, 140 edges)
- barry.primals.eco actors + evidence connections
- Shared enforcement nodes (AGC, JTC, SCAO)
- Cross-investigation edges

Output: site/static/api/graph.json
"""

import json
from pathlib import Path
from datetime import datetime, timezone

SCRIPT_DIR = Path(__file__).parent
REPO_ROOT = SCRIPT_DIR.parent
DETROIT_GRAPH = REPO_ROOT.parent / 'publicRecord-detroit' / 'site' / 'static' / 'graph.json'
OUTPUT = REPO_ROOT / 'site' / 'static' / 'api' / 'graph.json'

# Node type mapping from detroit graph types
TYPE_MAP = {
    'actor': 'actor',
    'entity': 'entity',
    'institution': 'institutional',
}

def load_detroit_graph():
    """Load and tag all detroit nodes with investigation='detroit'."""
    with open(DETROIT_GRAPH, encoding='utf-8') as f:
        data = json.load(f)

    nodes = []
    for n in data.get('nodes', []):
        node = {
            'id': n['id'],
            'label': n['label'],
            'type': TYPE_MAP.get(n.get('type', ''), n.get('type', 'actor')),
            'tier': n.get('tier', 3),
            'investigation': 'detroit',
            'detail': n.get('role', ''),
        }
        if n.get('page'):
            node['url'] = f"https://detroit.primals.eco{n['page']}"
        # Detect node types from detroit config
        if 'judge' in node['label'].lower() or node['detail'].lower().startswith('judicial'):
            node['type'] = 'judge'
        if any(k in node['detail'].lower() for k in ['political', 'mayor', 'council', 'state rep', 'ombudsman', 'chief']):
            node['type'] = 'political'
        if any(k in node['label'].lower() for k in ['charter', 'academy', 'preparatory', 'school']):
            node['type'] = 'school'
        nodes.append(node)

    edges = []
    for e in data.get('edges', []):
        edge = {
            'source': e['source'],
            'target': e['target'],
            'type': e.get('type', 'connection'),
            'flow': e.get('flow', 'influence'),
            'label': e.get('label', e.get('note', e.get('role', ''))),
        }
        if e.get('amount'):
            edge['amount'] = e['amount']
        if e.get('source_doc'):
            edge['source_doc'] = e['source_doc']
        edges.append(edge)

    return nodes, edges


def build_barry_nodes():
    """Barry/Saginaw/Eastpointe investigation nodes."""
    nodes = [
        {
            'id': 'ellison', 'label': 'Philip L. Ellison', 'type': 'actor', 'tier': 1,
            'investigation': 'saginaw',
            'url': 'https://barry.primals.eco/actors/ellison/',
            'detail': 'OLC PLC, Hemlock. $74K federal sanctions. SCOTUS 9-0 win (Pung). Fabricated witness. 153 domains. FOIAworks operator.'
        },
        {
            'id': 'aljouny', 'label': 'Samantha Aljouny (Ghost)', 'type': 'entity', 'tier': 1,
            'investigation': 'saginaw',
            'url': 'https://barry.primals.eco/evidence/ghost-witness-aljouny/',
            'detail': 'Fabricated witness. 13 convergence points confirm non-existence. Aljouny Media Consulting.'
        },
        {
            'id': 'lindke', 'label': 'Kevin Lindke', 'type': 'actor', 'tier': 2,
            'investigation': 'saginaw',
            'url': 'https://barry.primals.eco/actors/lindke/',
            'detail': 'Ellison client. Convicted: computer crime, 272 days. 21K-member Facebook group. Domains in minor child name.'
        },
        {
            'id': 'gafkay', 'label': 'Judge Julie A. Gafkay', 'type': 'judge', 'tier': 2,
            'investigation': 'saginaw',
            'url': 'https://barry.primals.eco/actors/gafkay/',
            'detail': 'Chief Judge 10th Circuit. SVSU colleague of Ellison (6yr overlap). 3 simultaneous Ellison cases.'
        },
        {
            'id': 'borrello', 'label': 'Judge Andre R. Borrello', 'type': 'judge', 'tier': 2,
            'investigation': 'saginaw',
            'url': 'https://barry.primals.eco/actors/borrello/',
            'detail': 'Signed contempt order based on ghost witness, then recused himself.'
        },
        {
            'id': 'ellsworth', 'label': 'Kelly D. Ellsworth', 'type': 'actor', 'tier': 3,
            'investigation': 'saginaw',
            'url': 'https://barry.primals.eco/actors/ellsworth/',
            'detail': 'Briefly represented Rita. Dissuaded her. SCBA insider, family in bar since 1986.'
        },
        {
            'id': 'schipper', 'label': 'Judge Michael Schipper', 'type': 'judge', 'tier': 2,
            'investigation': 'barry',
            'url': 'https://barry.primals.eco/actors/schipper/',
            'detail': 'Active JTC investigation. 6-10x guideline sentencing. ADA retaliation. Disappeared from bench.'
        },
        {
            'id': 'nakfoor_pratt', 'label': 'Julie Nakfoor Pratt', 'type': 'actor', 'tier': 2,
            'investigation': 'barry',
            'url': 'https://barry.primals.eco/actors/nakfoor-pratt/',
            'detail': 'Private ADB admonishment (MRPC 3.4(e)). Brady/Giglio failures. FOIA obstruction.'
        },
        {
            'id': 'galen', 'label': 'Judge Kathleen G. Galen', 'type': 'judge', 'tier': 2,
            'investigation': 'eastpointe',
            'url': 'https://barry.primals.eco/actors/galen/',
            'detail': '38th District Court. JTC admonition. Jailed pregnant woman (reversed). Campaign staff = court staff.'
        },
        {
            'id': 'makoski', 'label': 'Mark Makoski', 'type': 'actor', 'tier': 3,
            'investigation': 'eastpointe',
            'detail': 'Galen campaign treasurer → magistrate in her courtroom. Wine pub attorney.'
        },
        {
            'id': 'foiaworks', 'label': 'FOIAworks.com', 'type': 'entity', 'tier': 3,
            'investigation': 'saginaw',
            'url': 'https://barry.primals.eco/evidence/foiaworks-honeypot/',
            'detail': 'FOIA platform run by fabricated-witness attorney. No privacy policy. Quagmire Solutions LLC.'
        },
        {
            'id': 'quagmire', 'label': 'Quagmire Solutions LLC', 'type': 'entity', 'tier': 3,
            'investigation': 'saginaw',
            'detail': 'Ellison entity. 153 domains. Registered harassment domains. info@quagmiresolutions.com.'
        },
        {
            'id': 'olc_plc', 'label': 'Outside Legal Counsel PLC', 'type': 'entity', 'tier': 2,
            'investigation': 'saginaw',
            'detail': 'Ellison law firm. Hemlock, MI. FOIA enforcement, class actions, SLAPP suits.'
        },
        {
            'id': 'katie_ellison', 'label': 'Katherine Ellison', 'type': 'political', 'tier': 3,
            'investigation': 'saginaw',
            'detail': 'Hemlock School Board President. Philip Ellison wife. Anderson localization anchor.'
        },
    ]
    return nodes


def build_barry_edges():
    """Barry/Saginaw/Eastpointe investigation edges."""
    edges = [
        { 'source': 'ellison', 'target': 'aljouny', 'type': 'fabrication', 'flow': 'influence', 'label': 'Submitted ghost witness affidavit' },
        { 'source': 'ellison', 'target': 'olc_plc', 'type': 'ownership', 'flow': 'power', 'label': 'Principal', 'source_doc': 'LARA' },
        { 'source': 'ellison', 'target': 'quagmire', 'type': 'ownership', 'flow': 'power', 'label': '153 domains', 'source_doc': 'LARA, WHOIS' },
        { 'source': 'ellison', 'target': 'foiaworks', 'type': 'ownership', 'flow': 'power', 'label': 'Operates via Quagmire Solutions', 'source_doc': 'LARA' },
        { 'source': 'lindke', 'target': 'ellison', 'type': 'client', 'flow': 'money', 'label': 'Client — Lindke v Freed (SCOTUS)', 'source_doc': 'PACER' },
        { 'source': 'ellison', 'target': 'gafkay', 'type': 'professional', 'flow': 'influence', 'label': 'SVSU colleague (6yr overlap)', 'source_doc': 'LinkedIn, MLive' },
        { 'source': 'borrello', 'target': 'aljouny', 'type': 'judicial', 'flow': 'power', 'label': 'Signed contempt based on ghost witness, recused', 'source_doc': 'Court docket' },
        { 'source': 'gafkay', 'target': 'borrello', 'type': 'succession', 'flow': 'power', 'label': 'Successor judge after recusal', 'source_doc': 'Court records' },
        { 'source': 'ellsworth', 'target': 'ellison', 'type': 'professional', 'flow': 'influence', 'label': 'SCBA insider, family connections', 'source_doc': 'Bar records' },
        { 'source': 'katie_ellison', 'target': 'ellison', 'type': 'family', 'flow': 'influence', 'label': 'Married', 'source_doc': 'Public record' },
        { 'source': 'schipper', 'target': 'nakfoor_pratt', 'type': 'professional', 'flow': 'power', 'label': 'Judge-prosecutor partnership', 'source_doc': 'Court records' },
        { 'source': 'galen', 'target': 'makoski', 'type': 'appointment', 'flow': 'position', 'label': 'Campaign treasurer → magistrate', 'source_doc': 'SoO filing, SCAO' },
    ]
    return edges


def build_shared_nodes():
    """Cross-investigation enforcement nodes."""
    return [
        {
            'id': 'agc', 'label': 'Attorney Grievance Commission', 'type': 'enforcement', 'tier': 3,
            'investigation': 'shared',
            'detail': 'Dismisses 94% of complaints (2024 Annual Report). Same commission handles Detroit, Saginaw, Barry.'
        },
        {
            'id': 'jtc', 'label': 'Judicial Tenure Commission', 'type': 'enforcement', 'tier': 3,
            'investigation': 'shared',
            'detail': 'Years-long timelines. Confidential proceedings. Same commission, every case.'
        },
        {
            'id': 'scao', 'label': 'State Court Administrative Office', 'type': 'enforcement', 'tier': 3,
            'investigation': 'shared',
            'detail': 'Notified of structural failures in Barry + Detroit. Response: silence.'
        },
        {
            'id': 'state_bar_upl', 'label': 'State Bar UPL Department', 'type': 'enforcement', 'tier': 3,
            'investigation': 'shared',
            'detail': 'Handles non-lawyers. Emmons closure letter Sep 30. One day before AGC kickback.'
        },
    ]


def build_mi7_nodes():
    """MI-7 Congressional District — Barrett/Lawrence signal scan nodes."""
    return [
        {
            'id': 'barrett', 'label': 'Rep. Tom Barrett', 'type': 'political', 'tier': 2,
            'investigation': 'mi7',
            'detail': 'U.S. Rep MI-7 (R-Charlotte). "Convicted felon" smear. Wrong-date voter suppression ad. $1.48M PAC money.'
        },
        {
            'id': 'lawrence', 'label': 'Will Lawrence', 'type': 'actor', 'tier': 2,
            'investigation': 'mi7',
            'detail': 'Dem challenger. Co-founder Sunrise Movement + MI RITDH. Expunged 2013 pipeline protest conviction.'
        },
        {
            'id': 'ritdh', 'label': 'MI Rent Is Too Damn High', 'type': 'entity', 'tier': 3,
            'investigation': 'mi7',
            'detail': 'Statewide tenant rights coalition. Founded 2023. 350+ at first demo. Building unionization.'
        },
        {
            'id': 'roe_strategic', 'label': 'Roe Strategic', 'type': 'entity', 'tier': 3,
            'investigation': 'mi7',
            'detail': 'Barrett campaign strategist. Bloomfield Hills. $364,986 paid. Jason Roe spokesperson.'
        },
        {
            'id': 'musk_pac', 'label': 'Musk Super PAC', 'type': 'entity', 'tier': 3,
            'investigation': 'mi7',
            'detail': '$869,400 supporting Barrett in 2024. Elon Musk affiliated.'
        },
    ]


def build_mi7_edges():
    """MI-7 investigation edges — including Dykema cross-investigation bridge."""
    return [
        { 'source': 'barrett', 'target': 'lawrence', 'type': 'attack', 'flow': 'influence', 'label': 'Called "convicted felon" (expunged record)', 'source_doc': 'MLive Aug 2026' },
        { 'source': 'lawrence', 'target': 'ritdh', 'type': 'governance', 'flow': 'influence', 'label': 'Co-founder + coalition coordinator', 'source_doc': 'mirentistoodamnhigh.com' },
        { 'source': 'barrett', 'target': 'roe_strategic', 'type': 'payment', 'flow': 'money', 'label': '$364,986 campaign strategist', 'source_doc': 'FEC' },
        { 'source': 'musk_pac', 'target': 'barrett', 'type': 'payment', 'flow': 'money', 'label': '$869,400 (2024)', 'source_doc': 'OpenSecrets' },
        # THE BRIDGE EDGE — Dykema connects detroit to mi7
        { 'source': 'dykema', 'target': 'barrett', 'type': 'payment', 'flow': 'money', 'label': '$4,000 Dykema Gossett Federal PAC (Jun 2026)', 'source_doc': 'FEC Schedule A 11C' },
        # Dykema already connected to SDJ in detroit edges (dykema → sdj formation)
    ]


def build_cross_investigation_edges():
    """Edges connecting investigations through shared enforcement nodes."""
    edges = [
        # Detroit → shared enforcement
        { 'source': 'moreland', 'target': 'agc', 'type': 'complaint', 'flow': 'power', 'label': 'Complaint filed Sep 2026 (returned — separate forms required)' },
        { 'source': 'miller', 'target': 'jtc', 'type': 'complaint', 'flow': 'power', 'label': 'Complaint filed Oct 2026' },
        { 'source': 'banks', 'target': 'state_bar_upl', 'type': 'complaint', 'flow': 'power', 'label': 'Complaint filed (non-lawyer practicing law)' },
        # Saginaw → shared enforcement
        { 'source': 'ellison', 'target': 'agc', 'type': 'complaint', 'flow': 'power', 'label': 'Complaint filed (fabricated witness)' },
        # Barry → shared enforcement
        { 'source': 'schipper', 'target': 'jtc', 'type': 'investigation', 'flow': 'power', 'label': 'Active JTC investigation' },
        { 'source': 'nakfoor_pratt', 'target': 'agc', 'type': 'admonishment', 'flow': 'power', 'label': 'Private ADB admonishment (MRPC 3.4(e))' },
        # Eastpointe → shared enforcement
        { 'source': 'galen', 'target': 'jtc', 'type': 'admonition', 'flow': 'power', 'label': 'JTC confidential admonition' },
        # SLAPP playbook connection (cross-investigation pattern)
        { 'source': 'v_hall', 'target': 'ellison', 'type': 'pattern', 'flow': 'influence', 'label': 'Same playbook: PPO against journalist' },
    ]
    return edges


def build_unified_graph():
    """Build the complete unified graph."""
    # Load detroit
    detroit_nodes, detroit_edges = load_detroit_graph()

    # Build barry
    barry_nodes = build_barry_nodes()
    barry_edges = build_barry_edges()

    # Build MI-7
    mi7_nodes = build_mi7_nodes()
    mi7_edges = build_mi7_edges()

    # Shared enforcement
    shared_nodes = build_shared_nodes()
    cross_edges = build_cross_investigation_edges()

    # Merge — detroit nodes first, skip duplicates
    all_node_ids = set()
    all_nodes = []

    for n in detroit_nodes:
        if n['id'] not in all_node_ids:
            all_nodes.append(n)
            all_node_ids.add(n['id'])

    for n in barry_nodes:
        if n['id'] not in all_node_ids:
            all_nodes.append(n)
            all_node_ids.add(n['id'])

    for n in mi7_nodes:
        if n['id'] not in all_node_ids:
            all_nodes.append(n)
            all_node_ids.add(n['id'])

    for n in shared_nodes:
        if n['id'] not in all_node_ids:
            all_nodes.append(n)
            all_node_ids.add(n['id'])

    # Merge edges — skip exact duplicates
    edge_keys = set()
    all_edges = []

    for edges_list in [detroit_edges, barry_edges, mi7_edges, cross_edges]:
        for e in edges_list:
            key = (e['source'], e['target'], e.get('type', ''))
            if key not in edge_keys and e['source'] in all_node_ids and e['target'] in all_node_ids:
                all_edges.append(e)
                edge_keys.add(key)

    # Investigation metadata
    investigations = {
        'detroit': {
            'label': 'Cash for Kids 2: Detroit Charter Schools',
            'status': 'active',
            'county': 'Wayne',
            'evidence_url': 'https://detroit.primals.eco',
        },
        'saginaw': {
            'label': 'Ghost Witness: Aljouny Fabrication',
            'status': 'active',
            'county': 'Saginaw',
            'evidence_url': 'https://barry.primals.eco',
        },
        'barry': {
            'label': 'Barry County: The Disappeared Judge',
            'status': 'tracking',
            'county': 'Barry',
            'evidence_url': 'https://barry.primals.eco',
        },
        'eastpointe': {
            'label': '38th District Court: Galen',
            'status': 'tracking',
            'county': 'Macomb',
        },
        'mi7': {
            'label': 'MI-7: Barrett vs. Lawrence',
            'status': 'scanning',
            'county': 'Ingham',
            'note': 'Signal scan initiated Oct 7 2026. Dykema Gossett bridge edge to Detroit.',
        },
        'shared': {
            'label': 'Cross-Investigation Enforcement',
            'status': 'active',
            'note': 'Nodes appearing in multiple investigations',
        },
    }

    # Count per investigation
    for inv_id in investigations:
        inv_nodes = [n for n in all_nodes if n.get('investigation') == inv_id]
        inv_edges = [e for e in all_edges
                     if any(n['id'] == e['source'] and n.get('investigation') == inv_id for n in all_nodes)
                     or any(n['id'] == e['target'] and n.get('investigation') == inv_id for n in all_nodes)]
        investigations[inv_id]['node_count'] = len(inv_nodes)

    graph = {
        '_generated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        '_source': 'clutch-primals build-unified-graph.py — merged from detroit + barry + shared',
        '_schema_version': '1.0',
        'investigations': investigations,
        'nodes': all_nodes,
        'edges': all_edges,
        'cross_investigation_notes': [
            'AGC receives complaints from Detroit (Moreland/Perkins), Saginaw (Ellison), and Barry (Nakfoor Pratt). Same commission, 94% dismissal rate.',
            'JTC receives complaints from Detroit (Miller/Yancey), Barry (Schipper), and Eastpointe (Galen). Years-long timelines.',
            'SLAPP playbook appears in Detroit (PPO against journalist) AND Saginaw (contempt against journalist, domains in victim names).',
            'Anderson localization pattern: Detroit (Banks controls school board) AND Hemlock (Ellison wife is school board president).',
            'Dykema Gossett bridge: formed SDJ (Detroit dark money) AND donated $4K to Barrett (MI-7). Same firm, both sides.',
            'Weaponized criminal record pattern: Detroit (Banks IS felon, institutions protect) AND MI-7 (Barrett CALLS opponents felons, weaponizes expunged records).',
        ],
    }

    return graph


def main():
    graph = build_unified_graph()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)

    print(f'Unified graph built:')
    print(f'  Nodes: {len(graph["nodes"])}')
    print(f'  Edges: {len(graph["edges"])}')
    print(f'  Investigations: {len(graph["investigations"])}')
    for inv_id, inv in graph['investigations'].items():
        print(f'    {inv_id}: {inv.get("node_count", "?")} nodes — {inv["label"]}')
    print(f'  Output: {OUTPUT}')


if __name__ == '__main__':
    main()
