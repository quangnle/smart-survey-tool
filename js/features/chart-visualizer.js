import { state, getNode } from '../state/store.js';
import { dom } from '../config/dom-elements.js';
import { renderQuestionEditor } from '../ui/question-editor.js';
import { showModal, hideModal } from '../ui/modals.js';

// Open chart modal
export function openChartModal() {
    if (state.nodes.length === 0) {
        alert('Chưa có câu hỏi nào để hiển thị chart!');
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
    
    // Create arrow markers for different link types
    const markers = svg.append('defs');
    
    // Arrow marker for answer links (gray)
    markers.append('marker')
        .attr('id', 'arrowhead-answer')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#64748b');
    
    // Arrow marker for rule links (purple)
    markers.append('marker')
        .attr('id', 'arrowhead-rule')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#9333ea'); // purple-600
    
    // Arrow marker for nextQuestion links (teal)
    markers.append('marker')
        .attr('id', 'arrowhead-next')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#14b8a6');
    
    // Prepare data for D3.js
    const nodeMap = new Map();
    state.nodes.forEach((node, index) => {
        nodeMap.set(node.id, {
            id: node.id,
            label: node.isInfoNode ? `I${index + 1}` : `Q${index + 1}`,
            question: node.question || 'Chưa có nội dung',
            index: index,
            isInfoNode: node.isInfoNode || false
        });
    });
    
    const nodes_data = Array.from(nodeMap.values());
    
    // Create links from answers
    const links_data = [];
    state.nodes.forEach(node => {
        node.answers.forEach(answer => {
            if (answer.linkedTo && answer.text.trim() !== '') {
                links_data.push({
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
                            return answer.text.trim() || `Câu ${idx + 1}`;
                        })
                        .join(' + ');
                    
                    links_data.push({
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
                source: node.id,
                target: node.nextQuestion,
                answerText: '(Mặc định)',
                type: 'next'
            });
        }
    });
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes_data)
        .force('link', d3.forceLink(links_data).id(d => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(60));
    
    // Create curved link generator
    const linkGenerator = d3.link(d3.curveBasis)
        .x(d => d.x)
        .y(d => d.y);
    
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
    
    // Add link labels (answer text)
    const linkLabels = svg.append('g')
        .attr('class', 'link-labels')
        .selectAll('text')
        .data(links_data)
        .enter().append('text')
        .attr('class', 'link-label')
        .text(d => {
            const text = d.answerText.length > 20 ? d.answerText.substring(0, 20) + '...' : d.answerText;
            return text;
        })
        .style('font-size', d => d.type === 'rule' ? '9px' : '10px')
        .style('fill', d => {
            if (d.type === 'next') return '#14b8a6';
            if (d.type === 'rule') return '#9333ea';
            return '#64748b';
        })
        .style('font-weight', d => d.type === 'rule' ? 'bold' : 'normal')
        .style('pointer-events', 'none');
    
    // Create nodes
    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes_data)
        .enter().append('g')
        .attr('class', 'chart-node')
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
        .text(d => d.label);
    
    // Add question preview below node
    node.append('text')
        .attr('class', 'node-label')
        .attr('dy', 45)
        .style('text-anchor', 'middle')
        .text(d => {
            const text = d.question;
            return text.length > 20 ? text.substring(0, 20) + '...' : text;
        });
    
    // Update positions on tick
    simulation.on('tick', () => {
        // Update curved paths
        link.attr('d', d => {
            return linkGenerator({
                source: { x: d.source.x, y: d.source.y },
                target: { x: d.target.x, y: d.target.y }
            });
        });
        
        // Update link labels position (on the curve)
        linkLabels.attr('transform', d => {
            const midX = (d.source.x + d.target.x) / 2;
            const midY = (d.source.y + d.target.y) / 2;
            return `translate(${midX},${midY})`;
        });
        
        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

