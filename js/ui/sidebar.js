import { state, getNode, getNodeIndex, setSelectedNodeId } from '../state/store.js';
import { dom } from '../config/dom-elements.js';
import { renderQuestionEditor } from './question-editor.js';
import { handleDragStart, handleDragEnd, handleDragOver, handleDragEnter, handleDragLeave, handleDrop } from '../features/drag-drop.js';
import { deleteNode } from '../services/node-service.js';

// Update questions list in sidebar
export function updateQuestionsList() {
    dom.questionsList.innerHTML = '';
    
    if (state.nodes.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'text-xs text-gray-500 italic p-5 text-center';
        emptyItem.textContent = 'Chưa có câu hỏi nào';
        dom.questionsList.appendChild(emptyItem);
        return;
    }
    
    state.nodes.forEach((node, index) => {
        const listItem = document.createElement('div');
        const isActive = node.id === state.selectedNodeId;
        listItem.className = `bg-gray-50 border-2 ${isActive ? 'border-teal-600 bg-teal-600 text-white hover:bg-teal-500' : 'border-gray-200 hover:border-teal-600 hover:bg-teal-50'} rounded-md p-3 mb-2 cursor-pointer transition-all select-none`;
        listItem.draggable = true;
        listItem.dataset.nodeId = node.id;
        listItem.dataset.index = index;
        
        const preview = node.question.trim() || 'Câu hỏi chưa có nội dung';
        const previewText = preview.length > 40 ? preview.substring(0, 40) + '...' : preview;
        
        listItem.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center flex-1 min-w-0" style="flex: 1;">
                    <span class="inline-flex items-center justify-center w-6 h-6 ${isActive ? 'bg-white text-teal-600' : 'bg-teal-600 text-white'} rounded-full text-xs font-bold mr-2.5 flex-shrink-0">${index + 1}</span>
                    <span class="flex-1 text-xs ${isActive ? 'text-white' : 'text-teal-900'} break-words truncate">${previewText}</span>
                </div>
                <button class="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full cursor-pointer text-xs flex items-center justify-center transition-all hover:scale-110 flex-shrink-0 ml-2" 
                        onclick="event.stopPropagation(); window.deleteNodeHandler('${node.id}')" 
                        title="Xóa câu hỏi">
                    ×
                </button>
            </div>
        `;
        
        // Drag and drop handlers
        listItem.addEventListener('dragstart', handleDragStart);
        listItem.addEventListener('dragend', handleDragEnd);
        listItem.addEventListener('dragover', handleDragOver);
        listItem.addEventListener('drop', handleDrop);
        listItem.addEventListener('dragenter', handleDragEnter);
        listItem.addEventListener('dragleave', handleDragLeave);
        
        // Click to select question
        listItem.addEventListener('click', (e) => {
            // Don't trigger if clicking delete button or dragging
            if (e.target.closest('button') || listItem.classList.contains('dragging')) {
                return;
            }
            renderQuestionEditor(node.id);
        });
        
        dom.questionsList.appendChild(listItem);
    });
}

