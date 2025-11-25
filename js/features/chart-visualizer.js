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
    
    // Create arrow marker for links
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#64748b');
    
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
    
    // Create links
    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links_data)
        .enter().append('line')
        .attr('class', d => `link link-${d.type}`)
        .attr('stroke-width', d => d.type === 'next' ? 3 : 2)
        .attr('stroke-dasharray', d => d.type === 'next' ? '5,5' : '0')
        .attr('stroke', d => d.type === 'next' ? '#14b8a6' : '#64748b');
    
    // Add link labels (answer text)
    const linkLabels = svg.append('g')
        .attr('class', 'link-labels')
        .selectAll('text')
        .data(links_data)
        .enter().append('text')
        .attr('class', 'link-label')
        .text(d => d.answerText.length > 15 ? d.answerText.substring(0, 15) + '...' : d.answerText)
        .style('font-size', '10px')
        .style('fill', '#64748b')
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
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        linkLabels
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2);
        
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

