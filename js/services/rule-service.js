import { state, getNode, updateNode } from '../state/store.js';
import { renderQuestionEditor } from '../ui/question-editor.js';

// Toggle multiple choice mode
export function toggleMultipleChoice(nodeId, isMultipleChoice) {
    const node = getNode(nodeId);
    if (node) {
        node.isMultipleChoice = isMultipleChoice;
        // If switching to single choice, clear all rules
        if (!isMultipleChoice) {
            node.rules = [];
        }
        renderQuestionEditor(nodeId, true); // Preserve scroll
    }
}

// Add a new rule
export function addRule(nodeId) {
    const node = getNode(nodeId);
    if (!node || !node.isMultipleChoice) return;
    
    if (!node.rules) {
        node.rules = [];
    }
    
    // Create new rule with empty selections
    const newRule = {
        answerIndices: [], // Array of answer indices
        linkedTo: null, // Target node ID
        order: node.rules.length // Order in the list
    };
    
    node.rules.push(newRule);
    renderQuestionEditor(nodeId, true); // Preserve scroll
}

// Delete a rule
export function deleteRule(nodeId, ruleIndex) {
    const node = getNode(nodeId);
    if (!node || !node.rules) return;
    
    node.rules.splice(ruleIndex, 1);
    // Reorder remaining rules
    node.rules.forEach((rule, index) => {
        rule.order = index;
    });
    renderQuestionEditor(nodeId, true); // Preserve scroll
}

// Add answer index to a rule
export function addAnswerToRule(nodeId, ruleIndex, answerIndex) {
    const node = getNode(nodeId);
    if (!node || !node.rules || !node.rules[ruleIndex]) return;
    
    const rule = node.rules[ruleIndex];
    // Don't add if already exists
    if (!rule.answerIndices.includes(answerIndex)) {
        rule.answerIndices.push(answerIndex);
        renderQuestionEditor(nodeId, true); // Preserve scroll
    }
}

// Remove answer index from a rule
export function removeAnswerFromRule(nodeId, ruleIndex, answerIndexToRemove) {
    const node = getNode(nodeId);
    if (!node || !node.rules || !node.rules[ruleIndex]) return;
    
    const rule = node.rules[ruleIndex];
    rule.answerIndices = rule.answerIndices.filter(idx => idx !== answerIndexToRemove);
    renderQuestionEditor(nodeId, true); // Preserve scroll
}

// Update answer in rule by array index
export function updateRuleAnswerByIndex(nodeId, ruleIndex, arrayIndex, newAnswerIndex) {
    const node = getNode(nodeId);
    if (!node || !node.rules || !node.rules[ruleIndex]) return;
    
    const rule = node.rules[ruleIndex];
    if (arrayIndex >= 0 && arrayIndex < rule.answerIndices.length) {
        // Don't allow duplicate (unless it's the same index being updated)
        const isDuplicate = rule.answerIndices.includes(newAnswerIndex) && rule.answerIndices[arrayIndex] !== newAnswerIndex;
        if (!isDuplicate && newAnswerIndex >= 0) {
            rule.answerIndices[arrayIndex] = newAnswerIndex;
            renderQuestionEditor(nodeId, true); // Preserve scroll
        }
    }
}

// Remove answer from rule by array index
export function removeAnswerFromRuleByIndex(nodeId, ruleIndex, arrayIndex) {
    const node = getNode(nodeId);
    if (!node || !node.rules || !node.rules[ruleIndex]) return;
    
    const rule = node.rules[ruleIndex];
    if (arrayIndex >= 0 && arrayIndex < rule.answerIndices.length) {
        rule.answerIndices.splice(arrayIndex, 1);
        renderQuestionEditor(nodeId, true); // Preserve scroll
    }
}

// Add dropdown for selecting answer to rule (adds empty slot)
export function addAnswerToRuleDropdown(nodeId, ruleIndex) {
    const node = getNode(nodeId);
    if (!node || !node.rules || !node.rules[ruleIndex]) return;
    
    const rule = node.rules[ruleIndex];
    // Add a placeholder index (-1) to indicate a new dropdown slot
    // This will be replaced when user selects an answer
    rule.answerIndices.push(-1);
    renderQuestionEditor(nodeId, true); // Preserve scroll
}

// Update rule link
export function updateRuleLink(nodeId, ruleIndex, linkedTo) {
    const node = getNode(nodeId);
    if (!node || !node.rules || !node.rules[ruleIndex]) return;
    
    node.rules[ruleIndex].linkedTo = linkedTo;
    renderQuestionEditor(nodeId, true); // Preserve scroll
}

// Reorder rule (move up)
export function moveRuleUp(nodeId, ruleIndex) {
    const node = getNode(nodeId);
    if (!node || !node.rules || ruleIndex <= 0) return;
    
    const temp = node.rules[ruleIndex];
    node.rules[ruleIndex] = node.rules[ruleIndex - 1];
    node.rules[ruleIndex - 1] = temp;
    
    // Update orders
    node.rules.forEach((rule, index) => {
        rule.order = index;
    });
    
    renderQuestionEditor(nodeId, true); // Preserve scroll
}

// Reorder rule (move down)
export function moveRuleDown(nodeId, ruleIndex) {
    const node = getNode(nodeId);
    if (!node || !node.rules || ruleIndex >= node.rules.length - 1) return;
    
    const temp = node.rules[ruleIndex];
    node.rules[ruleIndex] = node.rules[ruleIndex + 1];
    node.rules[ruleIndex + 1] = temp;
    
    // Update orders
    node.rules.forEach((rule, index) => {
        rule.order = index;
    });
    
    renderQuestionEditor(nodeId, true); // Preserve scroll
}

