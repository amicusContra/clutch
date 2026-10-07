// Graph Walker — Clutch Justice Investigation Explorer
// The traveling salesman problem applied to corruption networks.
//
// Loads graph data from multiple investigation nodes and renders
// a unified, interactive force-directed graph that visitors can walk.

(function() {
  'use strict';

  var INVESTIGATION_COLORS = {
    detroit: '#ef4444',
    saginaw: '#f59e0b',
    barry: '#60a5fa',
    eastpointe: '#a855f7',
    shared: '#10b981'
  };

  var NODE_COLORS = {
    actor: '#e74c3c',
    judge: '#f1c40f',
    political: '#9b59b6',
    school: '#3498db',
    entity: '#1abc9c',
    bmf: '#e67e22',
    institutional: '#95a5a6',
    enforcement: '#e74c3c'
  };

  var FLOW_COLORS = {
    money: '#2ecc71',
    power: '#e74c3c',
    influence: '#f39c12',
    position: '#3498db'
  };

  var FLOW_ICONS = {
    money: '💰',
    power: '⚡',
    influence: '🔗',
    position: '📍'
  };

  // Active filters
  var activeInvestigation = null; // null = all
  var activeFlows = null;
  var searchQuery = '';
  var hoveredNode = null;
  var selectedNode = null;

  // Graph data — will be populated from API or inline
  var graphData = { nodes: [], edges: [] };

  function loadGraphData() {
    // Try loading from the unified graph API first
    return fetch('/api/graph.json')
      .then(function(r) { return r.ok ? r.json() : Promise.reject('no local API'); })
      .catch(function() {
        // Fallback: load from detroit.primals.eco
        return fetch('https://detroit.primals.eco/graph.json')
          .then(function(r) { return r.ok ? r.json() : Promise.reject('no detroit API'); });
      })
      .catch(function() {
        // Final fallback: embedded minimal data
        return {
          nodes: [
            { id: 'banks', label: 'Brian Roderick Banks', type: 'actor', tier: 1, investigation: 'detroit', url: 'https://detroit.primals.eco/network/actors/brian-banks/', detail: '9 convictions. Enterprise leader.' },
            { id: 'holland', label: 'Joseph Holland Jr.', type: 'actor', tier: 1, investigation: 'detroit', url: 'https://detroit.primals.eco/network/actors/joseph-holland/', detail: 'Financial gatekeeper. Drug offender.' },
            { id: 'miller', label: 'Judge Cylenthia Miller', type: 'judge', tier: 2, investigation: 'detroit', url: 'https://detroit.primals.eco/network/judges/cylenthia-miller/', detail: 'PCA Board Chair. Election Nov 2026.' },
            { id: 'pca', label: 'Purpose Charter Academy', type: 'school', tier: 2, investigation: 'detroit', url: 'https://detroit.primals.eco/network/entities/purpose-charter-academy/', detail: 'K-8, DPSCD authorized.' },
            { id: 'macdowell', label: 'MacDowell Prep', type: 'school', tier: 2, investigation: 'detroit', url: 'https://detroit.primals.eco/network/entities/macdowell-prep/', detail: '3% math, $4.9M revenue.' },
            { id: 'purpose_group', label: 'Purpose Group LLC', type: 'entity', tier: 2, investigation: 'detroit', url: 'https://detroit.primals.eco/network/entities/purpose-group-llc/', detail: 'CMO, 72.67% extraction.' },
            { id: 'yancey', label: 'Judge Tenisha Yancey', type: 'judge', tier: 2, investigation: 'detroit', url: 'https://detroit.primals.eco/network/judges/tenisha-yancey/', detail: 'Campaign paid Banks Strategy.' },
            { id: 'moreland', label: 'Lisa Moreland', type: 'judge', tier: 2, investigation: 'detroit', detail: 'AAG → PCA Board Director.' },
            { id: 'agc', label: 'Attorney Grievance Commission', type: 'enforcement', tier: 3, investigation: 'shared', detail: '94% dismissal rate. Same commission, every case.' },
            { id: 'jtc', label: 'Judicial Tenure Commission', type: 'enforcement', tier: 3, investigation: 'shared', detail: 'Years-long timelines. Same commission.' },
            { id: 'ellison', label: 'Philip L. Ellison', type: 'actor', tier: 1, investigation: 'saginaw', url: 'https://barry.primals.eco/actors/ellison/', detail: '$74K sanctions. 153 domains. Fabricated witness.' },
            { id: 'aljouny', label: 'Samantha Aljouny', type: 'entity', tier: 1, investigation: 'saginaw', url: 'https://barry.primals.eco/evidence/ghost-witness-aljouny/', detail: 'Ghost witness. 13 convergence points.' },
            { id: 'schipper', label: 'Judge Michael Schipper', type: 'judge', tier: 2, investigation: 'barry', url: 'https://barry.primals.eco/actors/schipper/', detail: 'Active JTC investigation.' },
            { id: 'nakfoor_pratt', label: 'Julie Nakfoor Pratt', type: 'actor', tier: 2, investigation: 'barry', url: 'https://barry.primals.eco/actors/nakfoor-pratt/', detail: 'Private admonishment. Brady failures.' },
            { id: 'galen', label: 'Judge Kathleen Galen', type: 'judge', tier: 2, investigation: 'eastpointe', url: 'https://barry.primals.eco/actors/galen/', detail: 'JTC admonition. Nov 2026 election.' },
          ],
          edges: [
            { source: 'banks', target: 'pca', type: 'employment', flow: 'position', label: 'Superintendent' },
            { source: 'banks', target: 'macdowell', type: 'employment', flow: 'position', label: 'Superintendent' },
            { source: 'banks', target: 'purpose_group', type: 'ownership', flow: 'power', label: 'Sole member' },
            { source: 'miller', target: 'pca', type: 'board', flow: 'position', label: 'Board Chair' },
            { source: 'moreland', target: 'pca', type: 'board', flow: 'position', label: 'Board Vice Chair' },
            { source: 'yancey', target: 'banks', type: 'payment', flow: 'money', label: '$383.82' },
            { source: 'macdowell', target: 'purpose_group', type: 'money_flow', flow: 'money', label: '72.67% revenue' },
            { source: 'purpose_group', target: 'banks', type: 'money_flow', flow: 'money', label: 'Management fee' },
            { source: 'holland', target: 'banks', type: 'co-resident', flow: 'influence', label: '1968 Severn Rd' },
            { source: 'banks', target: 'agc', type: 'complaint', flow: 'power', label: 'Complaint filed' },
            { source: 'miller', target: 'jtc', type: 'complaint', flow: 'power', label: 'Complaint filed' },
            { source: 'ellison', target: 'aljouny', type: 'fabrication', flow: 'influence', label: 'Submitted ghost witness' },
            { source: 'ellison', target: 'agc', type: 'complaint', flow: 'power', label: 'Complaint filed' },
            { source: 'schipper', target: 'jtc', type: 'investigation', flow: 'power', label: 'Active investigation' },
            { source: 'nakfoor_pratt', target: 'agc', type: 'complaint', flow: 'power', label: 'Private admonishment' },
            { source: 'galen', target: 'jtc', type: 'admonition', flow: 'power', label: 'JTC admonition' },
          ]
        };
      });
  }

  function renderGraph(container, data) {
    var width = container.clientWidth || 900;
    var height = Math.max(700, width * 0.7);

    // Clear existing
    var existingSvg = container.querySelector('svg');
    if (existingSvg) existingSvg.remove();

    // Build controls
    var controls = container.querySelector('.walker-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'walker-controls';
      controls.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;padding:8px;background:rgba(0,0,0,0.3);border-radius:8px;';

      // Investigation filter
      var invLabel = document.createElement('span');
      invLabel.textContent = 'Investigation:';
      invLabel.style.cssText = 'font-size:11px;font-weight:600;opacity:0.7;';
      controls.appendChild(invLabel);

      ['all', 'detroit', 'saginaw', 'barry', 'eastpointe'].forEach(function(inv) {
        var btn = document.createElement('button');
        btn.textContent = inv === 'all' ? 'All Cases' : inv.charAt(0).toUpperCase() + inv.slice(1);
        btn.dataset.inv = inv;
        var color = inv === 'all' ? '#fff' : INVESTIGATION_COLORS[inv];
        btn.style.cssText = 'padding:4px 12px;border:2px solid ' + color +
          ';border-radius:14px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;' +
          (inv === 'all' ? 'background:#fff;color:#000;' : 'background:transparent;color:' + color + ';');
        btn.addEventListener('click', function() {
          activeInvestigation = inv === 'all' ? null : inv;
          controls.querySelectorAll('button[data-inv]').forEach(function(b) {
            var c2 = b.dataset.inv === 'all' ? '#fff' : INVESTIGATION_COLORS[b.dataset.inv];
            var isActive = (b.dataset.inv === 'all' && !activeInvestigation) ||
                           (b.dataset.inv === activeInvestigation);
            b.style.background = isActive ? c2 : 'transparent';
            b.style.color = isActive ? (b.dataset.inv === 'all' ? '#000' : '#fff') : c2;
          });
          renderGraph(container, data);
        });
        controls.appendChild(btn);
      });

      // Flow separator
      var sep = document.createElement('span');
      sep.textContent = '│';
      sep.style.cssText = 'opacity:0.3;margin:0 4px;';
      controls.appendChild(sep);

      // Flow type filters
      var flowLabel = document.createElement('span');
      flowLabel.textContent = 'Flows:';
      flowLabel.style.cssText = 'font-size:11px;font-weight:600;opacity:0.7;';
      controls.appendChild(flowLabel);

      ['money', 'power', 'influence', 'position'].forEach(function(ft) {
        var btn = document.createElement('button');
        btn.textContent = FLOW_ICONS[ft] + ' ' + ft.charAt(0).toUpperCase() + ft.slice(1);
        btn.dataset.flow = ft;
        btn.style.cssText = 'padding:4px 10px;border:2px solid ' + FLOW_COLORS[ft] +
          ';border-radius:14px;font-size:10px;font-weight:600;cursor:pointer;transition:all 0.2s;' +
          'background:transparent;color:' + FLOW_COLORS[ft] + ';';
        btn.addEventListener('click', function() {
          if (!activeFlows) activeFlows = { money: false, power: false, influence: false, position: false };
          activeFlows[ft] = !activeFlows[ft];
          var anyActive = Object.values(activeFlows).some(function(v) { return v; });
          if (!anyActive) activeFlows = null;
          btn.style.background = (activeFlows && activeFlows[ft]) ? FLOW_COLORS[ft] : 'transparent';
          btn.style.color = (activeFlows && activeFlows[ft]) ? '#fff' : FLOW_COLORS[ft];
          renderGraph(container, data);
        });
        controls.appendChild(btn);
      });

      container.insertBefore(controls, container.firstChild);
    }

    // Filter nodes
    var filteredNodes = data.nodes.filter(function(n) {
      if (activeInvestigation && n.investigation !== activeInvestigation && n.investigation !== 'shared') return false;
      if (searchQuery && n.label.toLowerCase().indexOf(searchQuery.toLowerCase()) === -1) return false;
      return true;
    });

    var visibleIds = {};
    filteredNodes.forEach(function(n) { visibleIds[n.id] = true; });

    var filteredEdges = data.edges.filter(function(e) {
      return visibleIds[e.source] && visibleIds[e.target];
    });

    // SVG
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', height);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Investigation network — ' + filteredNodes.length + ' nodes');
    svg.style.cssText = 'background:rgba(0,0,0,0.05);border-radius:8px;';
    container.appendChild(svg);

    // Arrow defs
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    Object.keys(FLOW_COLORS).forEach(function(ft) {
      var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'walker-arrow-' + ft);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '28');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '5');
      marker.setAttribute('markerHeight', '5');
      marker.setAttribute('orient', 'auto');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
      path.setAttribute('fill', FLOW_COLORS[ft]);
      path.setAttribute('opacity', '0.8');
      marker.appendChild(path);
      defs.appendChild(marker);
    });
    svg.appendChild(defs);

    // Force layout
    var nodes = filteredNodes.map(function(n, i) {
      var angle = (2 * Math.PI * i) / filteredNodes.length;
      var radius = Math.min(width, height) * 0.35;
      var tierOffset = (n.tier || 3) * 0.15;
      return Object.assign({}, n, {
        x: width / 2 + radius * Math.cos(angle) * (0.4 + tierOffset),
        y: height / 2 + radius * Math.sin(angle) * (0.4 + tierOffset),
        vx: 0, vy: 0
      });
    });

    var nodeMap = {};
    nodes.forEach(function(n) { nodeMap[n.id] = n; });

    // Physics simulation
    for (var iter = 0; iter < 120; iter++) {
      var damping = 0.78;
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[j].x - nodes[i].x;
          var dy = nodes[j].y - nodes[i].y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var force = 22000 / (dist * dist);
          var fx = (dx / dist) * force;
          var fy = (dy / dist) * force;
          nodes[i].vx -= fx; nodes[i].vy -= fy;
          nodes[j].vx += fx; nodes[j].vy += fy;
        }
      }
      filteredEdges.forEach(function(edge) {
        var s = nodeMap[edge.source];
        var t = nodeMap[edge.target];
        if (!s || !t) return;
        var dx = t.x - s.x;
        var dy = t.y - s.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var force = (dist - 200) * 0.015;
        var fx = (dx / dist) * force;
        var fy = (dy / dist) * force;
        s.vx += fx; s.vy += fy;
        t.vx -= fx; t.vy -= fy;
      });
      nodes.forEach(function(n) {
        n.vx += (width / 2 - n.x) * 0.005;
        n.vy += (height / 2 - n.y) * 0.005;
        n.x += n.vx * 0.3;
        n.y += n.vy * 0.3;
        n.vx *= damping; n.vy *= damping;
        n.x = Math.max(80, Math.min(width - 80, n.x));
        n.y = Math.max(50, Math.min(height - 50, n.y));
      });
    }

    // Adjacency for hover highlighting
    var adjacency = {};
    nodes.forEach(function(n) { adjacency[n.id] = new Set(); });
    filteredEdges.forEach(function(e) {
      if (adjacency[e.source]) adjacency[e.source].add(e.target);
      if (adjacency[e.target]) adjacency[e.target].add(e.source);
    });

    // Draw edges
    var edgeElements = [];
    filteredEdges.forEach(function(edge) {
      var s = nodeMap[edge.source];
      var t = nodeMap[edge.target];
      if (!s || !t) return;

      var isFlowMatch = !activeFlows || (activeFlows && activeFlows[edge.flow]);
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', s.x); line.setAttribute('y1', s.y);
      line.setAttribute('x2', t.x); line.setAttribute('y2', t.y);

      if (activeFlows && isFlowMatch) {
        line.setAttribute('stroke', FLOW_COLORS[edge.flow] || '#888');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('stroke-opacity', '0.8');
        line.setAttribute('marker-end', 'url(#walker-arrow-' + edge.flow + ')');
      } else if (activeFlows && !isFlowMatch) {
        line.setAttribute('stroke', '#444');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-opacity', '0.1');
      } else {
        line.setAttribute('stroke', '#666');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-opacity', '0.4');
      }

      line.dataset.source = edge.source;
      line.dataset.target = edge.target;
      line.dataset.flow = edge.flow || '';
      svg.appendChild(line);
      edgeElements.push(line);

      // Edge label for money flows
      if (edge.flow === 'money' && edge.label) {
        var mx = (s.x + t.x) / 2;
        var my = (s.y + t.y) / 2;
        var eLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        eLabel.setAttribute('x', mx); eLabel.setAttribute('y', my - 4);
        eLabel.setAttribute('text-anchor', 'middle');
        eLabel.setAttribute('fill', FLOW_COLORS.money);
        eLabel.setAttribute('font-size', '8');
        eLabel.setAttribute('font-weight', '600');
        eLabel.setAttribute('pointer-events', 'none');
        eLabel.textContent = edge.label;
        svg.appendChild(eLabel);
      }
    });

    // Draw nodes
    var nodeElements = {};
    var nodeDegree = {};
    nodes.forEach(function(n) { nodeDegree[n.id] = 0; });
    filteredEdges.forEach(function(e) {
      if (nodeDegree[e.source] !== undefined) nodeDegree[e.source]++;
      if (nodeDegree[e.target] !== undefined) nodeDegree[e.target]++;
    });

    nodes.forEach(function(n) {
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');
      g.style.transition = 'opacity 0.2s';

      var deg = nodeDegree[n.id] || 0;
      var r = Math.max(10, Math.min(35, 10 + Math.sqrt(deg) * 5));
      var invColor = INVESTIGATION_COLORS[n.investigation] || '#888';

      // Investigation ring
      var ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('r', r + 4);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', invColor);
      ring.setAttribute('stroke-width', '2');
      ring.setAttribute('stroke-opacity', '0.5');
      g.appendChild(ring);

      // Node circle
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', r);
      circle.setAttribute('fill', NODE_COLORS[n.type] || '#95a5a6');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', r > 20 ? '2.5' : '1.5');
      circle.style.transition = 'r 0.2s';
      circle.style.cursor = 'pointer';
      g.appendChild(circle);

      // Degree badge
      if (deg >= 3) {
        var badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        badge.setAttribute('text-anchor', 'middle');
        badge.setAttribute('dy', '4');
        badge.setAttribute('fill', '#fff');
        badge.setAttribute('font-size', r > 20 ? '11' : '9');
        badge.setAttribute('font-weight', '700');
        badge.setAttribute('pointer-events', 'none');
        badge.textContent = deg;
        g.appendChild(badge);
      }

      // Label
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('dy', deg >= 5 ? -(r + 8) : (r + 14));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'currentColor');
      text.setAttribute('font-size', deg >= 8 ? '12' : (deg >= 3 ? '10' : '9'));
      text.setAttribute('font-weight', deg >= 5 ? '700' : '500');
      text.textContent = n.label;
      g.appendChild(text);

      // Tooltip
      var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = n.label + ' (' + deg + ' connections)\n' + (n.detail || '') + '\n' + (n.investigation || '');
      g.appendChild(title);

      // Click handler
      if (n.url) {
        g.style.cursor = 'pointer';
        g.addEventListener('click', function(e) {
          e.stopPropagation();
          window.open(n.url, '_blank');
        });
      }

      // Hover handlers
      g.addEventListener('mouseenter', function() {
        highlightNode(n.id, nodeElements, edgeElements, adjacency, nodeMap);
        showNodeInfo(n, deg, adjacency[n.id], filteredEdges, container);
      });
      g.addEventListener('mouseleave', function() {
        clearHighlight(nodeElements, edgeElements);
        hideNodeInfo(container);
      });

      svg.appendChild(g);
      nodeElements[n.id] = { group: g, circle: circle, ring: ring, radius: r };
    });

    // Summary
    var countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    countText.setAttribute('x', width - 10); countText.setAttribute('y', height - 10);
    countText.setAttribute('text-anchor', 'end');
    countText.setAttribute('fill', 'currentColor');
    countText.setAttribute('font-size', '10');
    countText.setAttribute('opacity', '0.4');
    countText.textContent = nodes.length + ' nodes · ' + filteredEdges.length + ' edges' +
      (activeInvestigation ? ' · ' + activeInvestigation : ' · all investigations');
    svg.appendChild(countText);

    // Legend
    var legendY = 20;
    var legend = [
      { color: NODE_COLORS.actor, label: 'Key actors' },
      { color: NODE_COLORS.judge, label: 'Judges' },
      { color: NODE_COLORS.political, label: 'Political enablers' },
      { color: NODE_COLORS.school, label: 'Schools' },
      { color: NODE_COLORS.entity, label: 'Entities' },
      { color: NODE_COLORS.enforcement, label: 'Enforcement' },
    ];
    legend.forEach(function(item) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', 20); c.setAttribute('cy', legendY);
      c.setAttribute('r', 6); c.setAttribute('fill', item.color);
      svg.appendChild(c);
      var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', 32); t.setAttribute('y', legendY + 4);
      t.setAttribute('fill', 'currentColor');
      t.setAttribute('font-size', '10');
      t.textContent = item.label;
      svg.appendChild(t);
      legendY += 18;
    });

    // Investigation ring legend
    legendY += 10;
    Object.keys(INVESTIGATION_COLORS).forEach(function(inv) {
      if (inv === 'shared') return;
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', 20); c.setAttribute('cy', legendY);
      c.setAttribute('r', 8); c.setAttribute('fill', 'none');
      c.setAttribute('stroke', INVESTIGATION_COLORS[inv]);
      c.setAttribute('stroke-width', '2');
      svg.appendChild(c);
      var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', 32); t.setAttribute('y', legendY + 4);
      t.setAttribute('fill', 'currentColor');
      t.setAttribute('font-size', '10');
      t.textContent = inv.charAt(0).toUpperCase() + inv.slice(1);
      svg.appendChild(t);
      legendY += 18;
    });
  }

  function highlightNode(id, nodeElements, edgeElements, adjacency, nodeMap) {
    var neighbors = adjacency[id] || new Set();
    Object.keys(nodeElements).forEach(function(nid) {
      var el = nodeElements[nid];
      if (nid === id) {
        el.group.style.opacity = '1';
        el.circle.setAttribute('stroke-width', '4');
        el.circle.setAttribute('r', el.radius + 4);
      } else if (neighbors.has(nid)) {
        el.group.style.opacity = '1';
        el.circle.setAttribute('stroke-width', '3');
      } else {
        el.group.style.opacity = '0.12';
      }
    });
    edgeElements.forEach(function(line) {
      if (line.dataset.source === id || line.dataset.target === id) {
        line.setAttribute('stroke-opacity', '0.9');
        line.setAttribute('stroke-width', '3');
      } else {
        line.setAttribute('stroke-opacity', '0.05');
      }
    });
  }

  function clearHighlight(nodeElements, edgeElements) {
    Object.keys(nodeElements).forEach(function(nid) {
      var el = nodeElements[nid];
      el.group.style.opacity = '1';
      el.circle.setAttribute('stroke-width', el.radius > 20 ? '2.5' : '1.5');
      el.circle.setAttribute('r', el.radius);
    });
    edgeElements.forEach(function(line) {
      line.setAttribute('stroke-opacity', activeFlows ? '0.8' : '0.4');
      line.setAttribute('stroke-width', activeFlows ? '3' : '1.5');
    });
  }

  function showNodeInfo(n, deg, neighbors, edges, container) {
    var panel = container.querySelector('.walker-info');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'walker-info';
      panel.style.cssText = 'position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.9);' +
        'color:#fff;padding:16px 20px;border-radius:10px;font-size:12px;max-width:320px;' +
        'pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:10;line-height:1.6;' +
        'border:1px solid rgba(255,255,255,0.1);';
      container.style.position = 'relative';
      container.appendChild(panel);
    }

    var invColor = INVESTIGATION_COLORS[n.investigation] || '#888';
    var invLabel = n.investigation ? n.investigation.charAt(0).toUpperCase() + n.investigation.slice(1) : 'Unknown';

    // Count flows
    var flowIn = {}, flowOut = {};
    edges.forEach(function(e) {
      if (e.flow) {
        if (e.target === n.id) flowIn[e.flow] = (flowIn[e.flow] || 0) + 1;
        if (e.source === n.id) flowOut[e.flow] = (flowOut[e.flow] || 0) + 1;
      }
    });

    var flowHtml = '';
    Object.keys(FLOW_COLORS).forEach(function(ft) {
      if (flowIn[ft] || flowOut[ft]) {
        var parts = [];
        if (flowIn[ft]) parts.push(flowIn[ft] + ' in');
        if (flowOut[ft]) parts.push(flowOut[ft] + ' out');
        flowHtml += '<span style="color:' + FLOW_COLORS[ft] + '">' + FLOW_ICONS[ft] + ' ' + ft + ': ' + parts.join(', ') + '</span> ';
      }
    });

    panel.innerHTML =
      '<div style="margin-bottom:4px;">' +
        '<strong style="font-size:15px;">' + n.label + '</strong>' +
        '<span style="float:right;color:' + invColor + ';font-size:10px;font-weight:600;border:1px solid ' + invColor + ';padding:1px 6px;border-radius:8px;">' + invLabel + '</span>' +
      '</div>' +
      '<div style="opacity:0.7;margin-bottom:6px;">' + (n.detail || '') + '</div>' +
      '<div style="opacity:0.5;font-size:10px;margin-bottom:4px;">' + deg + ' connections</div>' +
      (flowHtml ? '<div style="font-size:10px;margin-bottom:4px;">' + flowHtml + '</div>' : '') +
      (n.url ? '<div style="opacity:0.4;font-size:10px;">Click to view evidence page →</div>' : '');
    panel.style.opacity = '1';
  }

  function hideNodeInfo(container) {
    var panel = container.querySelector('.walker-info');
    if (panel) panel.style.opacity = '0';
  }

  // Initialize
  function init() {
    var container = document.getElementById('investigation-graph');
    if (!container) return;

    container.innerHTML = '<div style="padding:40px;text-align:center;opacity:0.5;">Loading investigation graph…</div>';

    loadGraphData().then(function(data) {
      graphData = data;
      container.innerHTML = '';
      renderGraph(container, data);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
