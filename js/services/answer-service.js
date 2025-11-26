import { state, getNode, updateNode } from '../state/store.js';
import { renderAnswer, renderAllAnswers } from '../ui/answer-list.js';

// Add answer to a node
export function addAnswer(nodeId) {
    const node = getNode(nodeId);
    if (node) {
        node.answers.push({
            text: '',
            linkedTo: null,
            priority: 0 // Priority for multiple choice (higher = more priority)
        });
        renderAnswer(nodeId, node.answers.length - 1);
        // Scroll to the new answer
        const newAnswerElement = document.getElementById(`answer-${nodeId}-${node.answers.length - 1}`);
        if (newAnswerElement) {
            setTimeout(() => {
                newAnswerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                const input = newAnswerElement.querySelector('input[type="text"]');
                if (input) input.focus();
            }, 100);
        }
    }
}

// Update answer text
export function updateAnswer(nodeId, answerIndex, text) {
    const node = getNode(nodeId);
    if (node && node.answers[answerIndex]) {
        node.answers[answerIndex].text = text;
    }
}

// Delete an answer
export function deleteAnswer(nodeId, answerIndex) {
    const node = getNode(nodeId);
    if (node) {
        node.answers.splice(answerIndex, 1);
        renderAllAnswers(nodeId);
    }
}

// Update answer priority
export function updateAnswerPriority(nodeId, answerIndex, priority) {
    const node = getNode(nodeId);
    if (node && node.answers[answerIndex]) {
        node.answers[answerIndex].priority = parseInt(priority) || 0;
    }
}

