import { state, getNode, setLinkingState, clearLinkingState, updateNode } from '../state/store.js';
import { dom } from '../config/dom-elements.js';
import { getQuestionPreview } from '../models/node.js';
import { renderAnswer } from '../ui/answer-list.js';
import { renderQuestionEditor } from '../ui/question-editor.js';
import { showModal, hideModal } from '../ui/modals.js';

// Open modal to link answer to a question
export function openLinkModal(nodeId, answerIndex) {
    setLinkingState(nodeId, answerIndex);
    
    // Populate question list
    dom.questionList.innerHTML = '';
    
    const node = getNode(nodeId);
    if (!node) return;
    
    // Filter out current node and nodes without questions
    const availableNodes = state.nodes.filter(n => 
        n.id !== nodeId && n.question.trim() !== ''
    );
    
    if (availableNodes.length === 0) {
        dom.questionList.innerHTML = '<p class="text-center text-gray-500 p-5">Chưa có câu hỏi nào để liên kết</p>';
    } else {
        availableNodes.forEach(targetNode => {
            const questionItem = document.createElement('div');
            questionItem.className = 'p-4 border-2 border-gray-200 rounded-md cursor-pointer transition-all hover:border-teal-600 hover:bg-gray-50';
            questionItem.onclick = () => linkAnswer(targetNode.id);
            
            const preview = getQuestionPreview(targetNode.id);
            questionItem.innerHTML = `<div class="text-sm text-teal-900">${preview}</div>`;
            
            dom.questionList.appendChild(questionItem);
        });
    }
    
    showModal(dom.linkModal);
}

// Link answer to a question
function linkAnswer(targetNodeId) {
    if (state.currentLinkingNode && state.currentLinkingAnswer !== null) {
        const node = getNode(state.currentLinkingNode);
        if (node && node.answers[state.currentLinkingAnswer]) {
            node.answers[state.currentLinkingAnswer].linkedTo = targetNodeId;
            renderAnswer(state.currentLinkingNode, state.currentLinkingAnswer);
        }
    }
    
    closeLinkModal();
}

// Close link modal
export function closeLinkModal() {
    hideModal(dom.linkModal);
    clearLinkingState();
}

// Open modal to link next question
export function openNextQuestionModal(nodeId) {
    setLinkingState(nodeId, null); // null means linking question directly
    
    // Populate question list
    dom.questionList.innerHTML = '';
    
    const node = getNode(nodeId);
    if (!node) return;
    
    // Filter out current node and nodes without questions
    const availableNodes = state.nodes.filter(n => 
        n.id !== nodeId && n.question.trim() !== ''
    );
    
    if (availableNodes.length === 0) {
        dom.questionList.innerHTML = '<p class="text-center text-gray-500 p-5">Chưa có câu hỏi nào để liên kết</p>';
    } else {
        availableNodes.forEach(targetNode => {
            const questionItem = document.createElement('div');
            questionItem.className = 'p-4 border-2 border-gray-200 rounded-md cursor-pointer transition-all hover:border-teal-600 hover:bg-gray-50';
            questionItem.onclick = () => linkNextQuestion(targetNode.id);
            
            const preview = getQuestionPreview(targetNode.id);
            questionItem.innerHTML = `<div class="text-sm text-teal-900">${preview}</div>`;
            
            dom.questionList.appendChild(questionItem);
        });
    }
    
    showModal(dom.linkModal);
}

// Link next question
function linkNextQuestion(targetNodeId) {
    if (state.currentLinkingNode) {
        updateNode(state.currentLinkingNode, { nextQuestion: targetNodeId });
        renderQuestionEditor(state.currentLinkingNode); // Refresh editor
    }
    
    closeLinkModal();
}

// Unlink next question
export function unlinkNextQuestion(nodeId) {
    updateNode(nodeId, { nextQuestion: null });
    renderQuestionEditor(nodeId); // Refresh editor
}

