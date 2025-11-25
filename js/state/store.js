// Centralized state management
export const state = {
    nodes: [],
    nodeIdCounter: 0,
    selectedNodeId: null,
    currentLinkingAnswer: null,
    currentLinkingNode: null,
    // Survey state
    currentSurveyNodeId: null,
    surveyHistory: []
};

// Node operations
export function getNode(nodeId) {
    return state.nodes.find(n => n.id === nodeId);
}

export function getNodeIndex(nodeId) {
    return state.nodes.findIndex(n => n.id === nodeId);
}

export function addNode(node) {
    state.nodes.push(node);
}

export function removeNode(nodeId) {
    state.nodes = state.nodes.filter(n => n.id !== nodeId);
}

export function updateNode(nodeId, updates) {
    const node = getNode(nodeId);
    if (node) {
        Object.assign(node, updates);
    }
}

export function reorderNodes(fromIndex, toIndex) {
    const [movedNode] = state.nodes.splice(fromIndex, 1);
    state.nodes.splice(toIndex, 0, movedNode);
}

export function generateNodeId() {
    return `node-${state.nodeIdCounter++}`;
}

export function setSelectedNodeId(nodeId) {
    state.selectedNodeId = nodeId;
}

export function getSelectedNode() {
    return state.selectedNodeId ? getNode(state.selectedNodeId) : null;
}

// Survey state operations
export function resetSurveyState() {
    state.currentSurveyNodeId = null;
    state.surveyHistory = [];
}

export function addToSurveyHistory(entry) {
    state.surveyHistory.push(entry);
}

// Linking state
export function setLinkingState(nodeId, answerIndex) {
    state.currentLinkingNode = nodeId;
    state.currentLinkingAnswer = answerIndex;
}

export function clearLinkingState() {
    state.currentLinkingNode = null;
    state.currentLinkingAnswer = null;
}

