import { state, generateNodeId } from '../state/store.js';

// Node model and utilities
export function createNode(question = '', isInfoNode = false) {
    return {
        id: generateNodeId(),
        question: question,
        answers: [],
        nextQuestion: null,
        isInfoNode: isInfoNode,
        isMultipleChoice: false, // Allow multiple answer selection
        rules: [], // Link rules for multiple choice: [{answerIndices: [0,1], linkedTo: 'node-id', order: 0}]
        position: { 
            x: 100 + state.nodes.length * 50, 
            y: 100 + state.nodes.length * 50 
        }
    };
}

export function validateNode(node) {
    if (!node || !node.id) {
        return { valid: false, error: 'Node must have an id' };
    }
    return { valid: true };
}

export function hasAnyLink(node) {
    // Check if has nextQuestion
    if (node.nextQuestion) return true;
    
    // Check if any answer has link
    const hasAnswerLink = node.answers.some(answer => 
        answer.linkedTo && answer.text.trim() !== ''
    );
    
    return hasAnswerLink;
}

export function getQuestionPreview(nodeId) {
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return '';
    
    const text = node.question.trim() || 'Câu hỏi chưa có nội dung';
    return text.length > 30 ? text.substring(0, 30) + '...' : text;
}

export function removeAllLinksToNode(nodeId) {
    // Remove all links pointing to this node
    state.nodes.forEach(node => {
        node.answers.forEach(answer => {
            if (answer.linkedTo === nodeId) {
                answer.linkedTo = null;
            }
        });
        // Remove nextQuestion links
        if (node.nextQuestion === nodeId) {
            node.nextQuestion = null;
        }
    });
}

