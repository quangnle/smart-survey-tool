import { state, getNode, addNode, removeNode, setSelectedNodeId, generateNodeId } from '../state/store.js';
import { createNode, removeAllLinksToNode } from '../models/node.js';
import { renderQuestionEditor } from '../ui/question-editor.js';
import { showEmptyState } from '../ui/question-editor.js';
import { updateQuestionsList } from '../ui/sidebar.js';

// Create a new question node
export function createNewNode() {
    const node = createNode('', false);
    addNode(node);
    showEmptyState();
    updateQuestionsList();
    // Auto-select the newly created question
    renderQuestionEditor(node.id);
}

// Delete a node
export function deleteNode(nodeId) {
    if (confirm('Are you sure you want to delete this question?')) {
        // Remove all links pointing to this node
        removeAllLinksToNode(nodeId);
        
        removeNode(nodeId);
        
        // If deleted question was selected, select another or show empty state
        if (state.selectedNodeId === nodeId) {
            if (state.nodes.length > 0) {
                renderQuestionEditor(state.nodes[0].id);
            } else {
                setSelectedNodeId(null);
                showEmptyState();
            }
        }
        
        updateQuestionsList();
    }
}

// Toggle node type (question vs info node)
export function toggleNodeType(nodeId, isInfoNode) {
    const node = getNode(nodeId);
    if (node) {
        node.isInfoNode = isInfoNode;
        // Clear answers if switching to info node
        if (isInfoNode) {
            node.answers = [];
            // Set default infoType if not set
            if (!node.infoType) {
                node.infoType = 'warning';
            }
        }
        renderQuestionEditor(nodeId); // Refresh editor
        updateQuestionsList(); // Update sidebar
    }
}

// Update info node type
export function updateInfoType(nodeId, infoType) {
    const node = getNode(nodeId);
    if (node && node.isInfoNode) {
        node.infoType = infoType;
        renderQuestionEditor(nodeId, true); // Preserve scroll
    }
}

