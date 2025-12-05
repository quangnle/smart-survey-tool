import { state, getNode } from '../state/store.js';
import { dom } from '../config/dom-elements.js';
import { renderQuestionEditor } from '../ui/question-editor.js';
import { showModal, hideModal } from '../ui/modals.js';

// Open chart modal
export function openChartModal() {
    if (state.nodes.length === 0) {
        alert('No questions to display in chart!');
        return;
    }
    
    showModal(dom.chartModal);
    renderChart();
}

// Close chart modal
export function closeChartModal() {
    hideModal(dom.chartModal);
}

// Render D3.js chart
export function renderChart() {
    const svg = d3.select('#chartSvg');
    svg.selectAll('*').remove(); // Clear previous chart
    
    if (state.nodes.length === 0) return;
    
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    
    // Initialize default positions for nodes that don't have positions
    // Use a grid layout as default
    const nodesPerRow = Math.ceil(Math.sqrt(state.nodes.length));
    const nodeSpacing = 200;
    const startX = 150;
    const startY = 150;
    
    state.nodes.forEach((node, index) => {
        if (!node.position || !node.position.x || !node.position.y) {
            const row = Math.floor(index / nodesPerRow);
            const col = index % nodesPerRow;
            node.position = {
                x: startX + col * nodeSpacing,
                y: startY + row * nodeSpacing
            };
        }
        // Ensure position is within bounds
        node.position.x = Math.max(50, Math.min(width - 50, node.position.x));
        node.position.y = Math.max(50, Math.min(height - 50, node.position.y));
    });
    
    // Create arrow markers for different link types
    const markers = svg.append('defs');
    
    // Arrow marker for answer links (gray)
    markers.append('marker')
        .attr('id', 'arrowhead-answer')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 30) // Adjusted to account for node radius
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#64748b');
    
    // Arrow marker for rule links (purple)
    markers.append('marker')
        .attr('id', 'arrowhead-rule')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 30) // Adjusted to account for node radius
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#9333ea'); // purple-600
    
    // Arrow marker for nextQuestion links (teal)
    markers.append('marker')
        .attr('id', 'arrowhead-next')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 30) // Adjusted to account for node radius
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#14b8a6');
    
    // Prepare data for D3.js - use positions from nodes
    const nodeMap = new Map();
    state.nodes.forEach((node, index) => {
        nodeMap.set(node.id, {
            id: node.id,
            label: node.isInfoNode ? `I${index + 1}` : `Q${index + 1}`,
            question: node.question || 'No content',
            index: index,
            isInfoNode: node.isInfoNode || false,
            x: node.position.x,
            y: node.position.y
        });
    });
    
    const nodes_data = Array.from(nodeMap.values());
    
    // Helper function to get node position by ID
    function getNodePosition(nodeId) {
        const node = nodes_data.find(n => n.id === nodeId);
        if (node) {
            return { x: node.x, y: node.y };
        }
        // Fallback: find in state.nodes
        const stateNode = state.nodes.find(n => n.id === nodeId);
        if (stateNode && stateNode.position) {
            return { x: stateNode.position.x, y: stateNode.position.y };
        }
        return { x: 0, y: 0 };
    }
    
    // Create links from answers
    const links_data = [];
    state.nodes.forEach(node => {
        node.answers.forEach((answer, answerIndex) => {
            if (answer.linkedTo && answer.text.trim() !== '') {
                links_data.push({
                    id: `link-${node.id}-answer-${answerIndex}`, // Unique ID for this link
                    source: node.id,
                    target: answer.linkedTo,
                    answerText: answer.text,
                    type: 'answer'
                });
            }
        });
        
        // Add rule links (for multiple choice)
        if (node.rules && node.rules.length > 0) {
            node.rules.forEach((rule, ruleIndex) => {
                if (rule.linkedTo && rule.answerIndices && rule.answerIndices.length > 0) {
                    // Create label showing which answers are in this rule
                    const answerLabels = rule.answerIndices
                        .filter(idx => idx >= 0 && node.answers[idx]) // Filter out placeholder indices
                        .map(idx => {
                            const answer = node.answers[idx];
                            return answer.text.trim() || `Answer ${idx + 1}`;
                        })
                        .join(' + ');
                    
                    links_data.push({
                        id: `link-${node.id}-rule-${ruleIndex}`, // Unique ID for this link
                        source: node.id,
                        target: rule.linkedTo,
                        answerText: `Rule ${ruleIndex + 1}: ${answerLabels}`,
                        type: 'rule',
                        ruleIndex: ruleIndex
                    });
                }
            });
        }
        
        // Add nextQuestion links
        if (node.nextQuestion) {
            links_data.push({
                id: `link-${node.id}-next`, // Unique ID for this link
                source: node.id,
                target: node.nextQuestion,
                answerText: '(Default)',
                type: 'next'
            });
        }
    });
    
    // Initialize label positions for links (stored in state or local map)
    // Use a map to store label positions, keyed by link ID
    if (!state.linkLabelPositions) {
        state.linkLabelPositions = {};
    }
    
    // Initialize default positions for labels that don't have positions
    links_data.forEach(link => {
        if (!state.linkLabelPositions[link.id]) {
            const sourcePos = getNodePosition(link.source);
            const targetPos = getNodePosition(link.target);
            // Place label at midpoint between source and target
            state.linkLabelPositions[link.id] = {
                x: (sourcePos.x + targetPos.x) / 2,
                y: (sourcePos.y + targetPos.y) / 2
            };
        }
        // Ensure position is within bounds
        state.linkLabelPositions[link.id].x = Math.max(50, Math.min(width - 50, state.linkLabelPositions[link.id].x));
        state.linkLabelPositions[link.id].y = Math.max(50, Math.min(height - 50, state.linkLabelPositions[link.id].y));
    });
    
    // Create curved link generator (not used for multi-point paths, but kept for reference)
    const linkGenerator = d3.link(d3.curveBasis)
        .x(d => d.x)
        .y(d => d.y);
    
    // Helper function to get label position by link ID
    function getLabelPosition(linkId) {
        if (state.linkLabelPositions && state.linkLabelPositions[linkId]) {
            return state.linkLabelPositions[linkId];
        }
        // Fallback: calculate midpoint
        const link = links_data.find(l => l.id === linkId);
        if (link) {
            const sourcePos = getNodePosition(link.source);
            const targetPos = getNodePosition(link.target);
            return {
                x: (sourcePos.x + targetPos.x) / 2,
                y: (sourcePos.y + targetPos.y) / 2
            };
        }
        return { x: 0, y: 0 };
    }
    
    // Helper function to calculate point on edge of node
    function getPointOnNodeEdge(nodePos, labelPos, nodeRadius = 30) {
        const dx = labelPos.x - nodePos.x;
        const dy = labelPos.y - nodePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return nodePos;
        
        // Calculate point on edge of node
        const ratio = nodeRadius / distance;
        return {
            x: nodePos.x + dx * ratio,
            y: nodePos.y + dy * ratio
        };
    }
    
    // Function to update links (now split into 2 straight line segments: source->label, label->target)
    function updateLinks() {
        // Update paths - each link has 2 straight line segments
        link.attr('d', d => {
            const sourcePos = getNodePosition(d.source);
            const targetPos = getNodePosition(d.target);
            const labelPos = getLabelPosition(d.id);
            
            // Calculate points on edges of nodes to avoid arrows being hidden
            const sourceEdge = getPointOnNodeEdge(sourcePos, labelPos, 30);
            const targetEdge = getPointOnNodeEdge(targetPos, labelPos, 30);
            
            // Create path with 2 straight lines: source edge -> label -> target edge
            return `M ${sourceEdge.x},${sourceEdge.y} L ${labelPos.x},${labelPos.y} L ${targetEdge.x},${targetEdge.y}`;
        });
    }
    
    // Create links as paths (curved)
    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('path')
        .data(links_data)
        .enter().append('path')
        .attr('class', d => `link link-${d.type}`)
        .attr('fill', 'none')
        .attr('stroke-width', d => {
            if (d.type === 'next') return 3;
            if (d.type === 'rule') return 2.5;
            return 2;
        })
        .attr('stroke-dasharray', d => {
            if (d.type === 'next') return '5,5';
            if (d.type === 'rule') return '3,3';
            return '0';
        })
        .attr('stroke', d => {
            if (d.type === 'next') return '#14b8a6'; // teal-500
            if (d.type === 'rule') return '#9333ea'; // purple-600
            return '#64748b'; // gray-500
        })
        .attr('marker-end', d => {
            if (d.type === 'next') return 'url(#arrowhead-next)';
            if (d.type === 'rule') return 'url(#arrowhead-rule)';
            return 'url(#arrowhead-answer)';
        });
    
    // Create label rectangles (draggable)
    const labelGroup = svg.append('g')
        .attr('class', 'link-labels')
        .selectAll('g')
        .data(links_data)
        .enter().append('g')
        .attr('class', d => `link-label-group link-label-${d.type}`)
        .attr('transform', d => {
            const pos = getLabelPosition(d.id);
            return `translate(${pos.x},${pos.y})`;
        })
        .call(d3.drag()
            .on('start', labelDragstarted)
            .on('drag', labelDragged)
            .on('end', labelDragended));
    
    // Add text first (to measure it later)
    const labelTexts = labelGroup.append('text')
        .attr('class', 'link-label-text')
        .attr('dy', 3)
        .style('text-anchor', 'middle')
        .style('font-size', d => d.type === 'rule' ? '9px' : '10px')
        .style('fill', d => {
            if (d.type === 'next') return '#14b8a6';
            if (d.type === 'rule') return '#9333ea';
            return '#64748b';
        })
        .style('font-weight', d => d.type === 'rule' ? 'bold' : 'normal')
        .style('pointer-events', 'none')
        .text(d => {
            const text = d.answerText.length > 20 ? d.answerText.substring(0, 20) + '...' : d.answerText;
            return text;
        });
    
    // Add rectangle background for labels (sized based on measured text)
    labelGroup.each(function(d) {
        const textNode = d3.select(this).select('text').node();
        let textWidth = 60; // Default width
        let textHeight = 14; // Default height
        
        if (textNode) {
            const bbox = textNode.getBBox();
            textWidth = bbox.width;
            textHeight = bbox.height;
        } else {
            // Fallback calculation
            const text = d.answerText.length > 20 ? d.answerText.substring(0, 20) + '...' : d.answerText;
            const fontSize = d.type === 'rule' ? 9 : 10;
            textWidth = text.length * (fontSize * 0.6);
            textHeight = fontSize;
        }
        
        d3.select(this).insert('rect', 'text')
            .attr('x', -textWidth / 2 - 6)
            .attr('y', -textHeight / 2 - 4)
            .attr('width', textWidth + 12)
            .attr('height', textHeight + 8)
            .attr('rx', 4)
            .attr('ry', 4)
            .style('fill', d => {
                if (d.type === 'next') return '#e0f2f1'; // teal-50
                if (d.type === 'rule') return '#f3e8ff'; // purple-50
                return '#f1f5f9'; // gray-50
            })
            .style('stroke', d => {
                if (d.type === 'next') return '#14b8a6'; // teal-500
                if (d.type === 'rule') return '#9333ea'; // purple-600
                return '#64748b'; // gray-500
            })
            .style('stroke-width', 1.5)
            .style('cursor', 'move');
    });
    
    // Create nodes
    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes_data)
        .enter().append('g')
        .attr('class', 'chart-node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Add circles for nodes
    node.append('circle')
        .attr('r', 30)
        .style('fill', d => {
            if (d.id === state.selectedNodeId) return '#0d9488'; // teal-600 for selected
            if (d.isInfoNode) return '#14b8a6'; // teal-500 for info nodes
            return '#0f766e'; // teal-700 for regular nodes
        })
        .style('stroke', d => {
            if (d.id === state.selectedNodeId) return '#0d9488';
            if (d.isInfoNode) return '#0d9488';
            return '#115e59'; // teal-800
        })
        .style('stroke-width', d => d.id === state.selectedNodeId ? 3 : 2)
        .style('cursor', 'move')
        .on('click', function(event, d) {
            // Select and edit this node
            renderQuestionEditor(d.id);
            closeChartModal();
        });
    
    // Add labels (Q1, Q2, ...)
    node.append('text')
        .attr('dy', 5)
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .style('pointer-events', 'none')
        .text(d => d.label);
    
    // Add question preview below node
    node.append('text')
        .attr('class', 'node-label')
        .attr('dy', 45)
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .text(d => {
            const text = d.question;
            return text.length > 20 ? text.substring(0, 20) + '...' : text;
        });
    
    // Initial render of links
    updateLinks();
    
    // Node drag functions
    function dragstarted(event, d) {
        // Highlight the node being dragged
        d3.select(this).raise().select('circle')
            .style('stroke-width', 4);
    }
    
    function dragged(event, d) {
        // Update node position
        d.x = event.x;
        d.y = event.y;
        
        // Update the node's position in state
        const stateNode = state.nodes.find(n => n.id === d.id);
        if (stateNode) {
            stateNode.position = { x: d.x, y: d.y };
        }
        
        // Update visual position
        d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
        
        // Update links connected to this node
        updateLinks();
    }
    
    function dragended(event, d) {
        // Reset highlight
        d3.select(this).select('circle')
            .style('stroke-width', d.id === state.selectedNodeId ? 3 : 2);
        
        // Ensure position is saved
        const stateNode = state.nodes.find(n => n.id === d.id);
        if (stateNode) {
            stateNode.position = { x: d.x, y: d.y };
        }
    }
    
    // Label drag functions
    function labelDragstarted(event, d) {
        // Highlight the label being dragged
        d3.select(this).raise().select('rect')
            .style('stroke-width', 2.5)
            .style('opacity', 0.9);
    }
    
    function labelDragged(event, d) {
        // Update label position
        const newX = event.x;
        const newY = event.y;
        
        // Update position in state
        if (!state.linkLabelPositions) {
            state.linkLabelPositions = {};
        }
        state.linkLabelPositions[d.id] = {
            x: Math.max(50, Math.min(width - 50, newX)),
            y: Math.max(50, Math.min(height - 50, newY))
        };
        
        // Update visual position
        d3.select(this).attr('transform', `translate(${state.linkLabelPositions[d.id].x},${state.linkLabelPositions[d.id].y})`);
        
        // Update links connected to this label
        updateLinks();
    }
    
    function labelDragended(event, d) {
        // Reset highlight
        d3.select(this).select('rect')
            .style('stroke-width', 1.5)
            .style('opacity', 1);
        
        // Ensure position is saved
        if (!state.linkLabelPositions) {
            state.linkLabelPositions = {};
        }
        const pos = state.linkLabelPositions[d.id];
        if (pos) {
            pos.x = Math.max(50, Math.min(width - 50, pos.x));
            pos.y = Math.max(50, Math.min(height - 50, pos.y));
        }
    }
}

