// Centralized state management
export const state = {
    nodes: [],
    nodeIdCounter: 0,
    selectedNodeId: null,
    currentLinkingAnswer: null,
    currentLinkingNode: null,
    currentLinkingRuleIndex: null, // For linking rules
    // Survey metadata
    surveyTitle: '',
    surveyDescription: '',
    // Survey state
    currentSurveyNodeId: null,
    surveyHistory: [],
    navigationStack: [], // Stack để track navigation path: [{nodeId, historyIndex}]
    isPathModified: false    // Flag: có thay đổi lựa chọn từ điểm back không
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
    state.navigationStack = [];
    state.isPathModified = false;
}

export function addToSurveyHistory(entry) {
    state.surveyHistory.push(entry);
    state.isPathModified = false;
}

// Navigation stack operations
export function pushToNavigationStack(nodeId) {
    // Find the history index for this nodeId (should be the last entry with this nodeId)
    let historyIndex = -1;
    for (let i = state.surveyHistory.length - 1; i >= 0; i--) {
        if (state.surveyHistory[i].questionId === nodeId) {
            historyIndex = i;
            break;
        }
    }
    // If not found, use the last history index (the entry we just added)
    if (historyIndex < 0) {
        historyIndex = state.surveyHistory.length - 1;
    }
    state.navigationStack.push({
        nodeId: nodeId,
        historyIndex: historyIndex
    });
}

export function popFromNavigationStack() {
    if (state.navigationStack.length > 0) {
        return state.navigationStack.pop();
    }
    return null;
}

export function peekNavigationStack() {
    if (state.navigationStack.length > 0) {
        return state.navigationStack[state.navigationStack.length - 1];
    }
    return null;
}

export function canGoBack() {
    return state.navigationStack.length > 0;
}

export function truncateNavigationStackFromIndex(index) {
    if (index >= 0 && index < state.navigationStack.length) {
        state.navigationStack = state.navigationStack.slice(0, index + 1);
    }
}

export function getHistoryEntryByNodeId(nodeId) {
    return state.surveyHistory.find(entry => entry.questionId === nodeId) || null;
}

export function truncateHistoryFromIndex(index) {
    if (index >= 0 && index < state.surveyHistory.length) {
        state.surveyHistory = state.surveyHistory.slice(0, index + 1);
        // Also truncate navigation stack to match
        const stackIndex = state.navigationStack.findIndex(item => item.historyIndex > index);
        if (stackIndex >= 0) {
            state.navigationStack = state.navigationStack.slice(0, stackIndex);
        }
    }
}

export function setPathModified(modified) {
    state.isPathModified = modified;
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

// Survey metadata operations
export function updateSurveyTitle(title) {
    state.surveyTitle = title || '';
}

export function updateSurveyDescription(description) {
    state.surveyDescription = description || '';
}

export function getSurveyTitle() {
    return state.surveyTitle || '';
}

export function getSurveyDescription() {
    return state.surveyDescription || '';
}
