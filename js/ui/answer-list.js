import { state, getNode } from '../state/store.js';
import { getQuestionPreview } from '../models/node.js';
import { handleAnswerDragStart, handleAnswerDragEnd, handleAnswerDragOver, handleAnswerDragEnter, handleAnswerDragLeave, handleAnswerDrop } from '../features/drag-drop.js';
import { openLinkModal } from '../services/link-service.js';
import { deleteAnswer } from '../services/answer-service.js';
import { updateAnswer } from '../services/answer-service.js';

// Render an answer
export function renderAnswer(nodeId, answerIndex) {
    const node = getNode(nodeId);
    if (!node || !node.answers[answerIndex]) return;
    
    const answersList = document.getElementById(`answers-${nodeId}`);
    if (!answersList) return;
    
    const answer = node.answers[answerIndex];
    const answerElement = document.createElement('div');
    answerElement.className = 'mb-3 p-3 bg-gray-50 rounded-lg transition-all cursor-grab border-2 border-transparent hover:bg-gray-100';
    answerElement.id = `answer-${nodeId}-${answerIndex}`;
    answerElement.dataset.nodeId = nodeId;
    answerElement.dataset.answerIndex = answerIndex;
    
    const linkedToText = answer.linkedTo 
        ? getQuestionPreview(answer.linkedTo)
        : '';
    
    answerElement.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="cursor-grab text-gray-500 text-base p-1 flex items-center justify-center flex-shrink-0 select-none" 
                 draggable="true"
                 title="Kéo để sắp xếp">⋮⋮</div>
            <input type="text" 
                   class="flex-1 px-3 py-3 border-2 border-gray-300 rounded-md text-sm font-sans transition-colors focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200" 
                   placeholder="Nhập câu trả lời..." 
                   value="${answer.text}"
                   oninput="window.updateAnswerHandler('${nodeId}', ${answerIndex}, this.value)">
            <button class="bg-teal-700 hover:bg-teal-800 ${answer.linkedTo ? 'bg-teal-600' : ''} text-white w-8 h-8 rounded-md cursor-pointer text-base flex items-center justify-center transition-colors flex-shrink-0" 
                    onclick="window.openLinkModalHandler('${nodeId}', ${answerIndex})" 
                    title="Liên kết tới câu hỏi khác">
                🔗
            </button>
            <button class="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-md cursor-pointer text-sm flex items-center justify-center transition-colors flex-shrink-0" 
                    onclick="window.deleteAnswerHandler('${nodeId}', ${answerIndex})" 
                    title="Xóa câu trả lời">
                ×
            </button>
        </div>
        ${answer.linkedTo ? `<div class="text-xs text-teal-700 mt-2 ml-9 italic">→ ${linkedToText}</div>` : ''}
    `;
    
    // Remove old answer element if exists
    const oldElement = document.getElementById(`answer-${nodeId}-${answerIndex}`);
    if (oldElement) {
        oldElement.remove();
    }
    
    // Add drag and drop handlers to the handle and the item itself
    const dragHandle = answerElement.querySelector('[draggable="true"]');
    if (dragHandle) {
        dragHandle.addEventListener('dragstart', handleAnswerDragStart);
        dragHandle.addEventListener('dragend', handleAnswerDragEnd);
    }
    
    // Add drop handlers to the answer item
    answerElement.addEventListener('dragover', handleAnswerDragOver);
    answerElement.addEventListener('drop', handleAnswerDrop);
    answerElement.addEventListener('dragenter', handleAnswerDragEnter);
    answerElement.addEventListener('dragleave', handleAnswerDragLeave);
    
    answersList.appendChild(answerElement);
}

// Re-render all answers for a node
export function renderAllAnswers(nodeId) {
    const node = getNode(nodeId);
    if (!node) return;
    
    const answersList = document.getElementById(`answers-${nodeId}`);
    if (answersList) {
        answersList.innerHTML = '';
        node.answers.forEach((_, index) => {
            renderAnswer(nodeId, index);
        });
    }
}

