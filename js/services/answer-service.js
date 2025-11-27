import { state, getNode, updateNode } from '../state/store.js';
import { renderAnswer, renderAllAnswers } from '../ui/answer-list.js';
import { renderQuestionEditor } from '../ui/question-editor.js';

// Add answer to a node
export function addAnswer(nodeId) {
    const node = getNode(nodeId);
    if (node) {
        node.answers.push({
            text: '',
            linkedTo: null
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

// Get "Other" answer if exists
export function getOtherAnswer(nodeId) {
    const node = getNode(nodeId);
    if (!node) return null;
    return node.answers.find((answer, index) => answer.isOther === true) || null;
}

// Toggle "Other" answer option
export function toggleOtherAnswer(nodeId, enabled) {
    const node = getNode(nodeId);
    if (!node) return;
    
    const existingOther = getOtherAnswer(nodeId);
    
    if (enabled && !existingOther) {
        // Add "Other" answer
        node.answers.push({
            text: 'Khác',
            linkedTo: null,
            isOther: true,
            placeholder: 'ý kiến khác',
            maxLength: 80
        });
    } else if (!enabled && existingOther) {
        // Remove "Other" answer
        const otherIndex = node.answers.indexOf(existingOther);
        if (otherIndex >= 0) {
            node.answers.splice(otherIndex, 1);
        }
    }
    
    renderQuestionEditor(nodeId, true); // Preserve scroll
}

// Update "Other" answer properties
export function updateOtherAnswer(nodeId, updates) {
    const node = getNode(nodeId);
    if (!node) return;
    
    const otherAnswer = getOtherAnswer(nodeId);
    if (otherAnswer) {
        Object.assign(otherAnswer, updates);
        renderQuestionEditor(nodeId, true); // Preserve scroll
    }
}

