import { state, getNode, reorderNodes } from '../state/store.js';
import { renderAllAnswers } from '../ui/answer-list.js';
import { updateQuestionsList } from '../ui/sidebar.js';
import { renderQuestionEditor } from '../ui/question-editor.js';

// Answer drag and drop state
let draggedAnswerItem = null;
let draggedAnswerFromIndex = null;
let draggedAnswerNodeId = null;

// Question list drag and drop state
let draggedListItem = null;
let draggedFromIndex = null;

// Answer drag handlers
export function handleAnswerDragStart(e) {
    const answerItem = this.closest('[data-node-id]');
    if (!answerItem) return;
    
    draggedAnswerItem = answerItem;
    draggedAnswerFromIndex = parseInt(answerItem.dataset.answerIndex);
    draggedAnswerNodeId = answerItem.dataset.nodeId;
    answerItem.classList.add('dragging', 'opacity-50', 'cursor-grabbing', 'bg-teal-100', 'border-teal-500', 'border-dashed');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', answerItem.innerHTML);
}

export function handleAnswerDragEnd(e) {
    const answerItem = this.closest('[data-node-id]') || draggedAnswerItem;
    if (answerItem) {
        answerItem.classList.remove('dragging', 'opacity-50', 'cursor-grabbing', 'bg-teal-100', 'border-teal-500', 'border-dashed');
        // Remove drag-over class from all answer items in the same node
        const answersList = document.getElementById(`answers-${answerItem.dataset.nodeId}`);
        if (answersList) {
            answersList.querySelectorAll('[data-node-id]').forEach(item => {
                item.classList.remove('drag-over', 'border-teal-600', 'bg-teal-100', '-translate-y-0.5');
            });
        }
    }
}

export function handleAnswerDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    // Only allow drop if it's from the same node
    if (this.dataset.nodeId === draggedAnswerNodeId) {
        e.dataTransfer.dropEffect = 'move';
    } else {
        e.dataTransfer.dropEffect = 'none';
    }
    return false;
}

export function handleAnswerDragEnter(e) {
    // Only highlight if it's from the same node
    if (this !== draggedAnswerItem && this.dataset.nodeId === draggedAnswerNodeId) {
        this.classList.add('drag-over', 'border-teal-600', 'bg-teal-100', '-translate-y-0.5');
    }
}

export function handleAnswerDragLeave(e) {
    this.classList.remove('drag-over', 'border-teal-600', 'bg-teal-100', '-translate-y-0.5');
}

export function handleAnswerDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Only allow drop if it's from the same node
    if (draggedAnswerItem !== this && this.dataset.nodeId === draggedAnswerNodeId) {
        const draggedToIndex = parseInt(this.dataset.answerIndex);
        
        const node = getNode(draggedAnswerNodeId);
        if (node) {
            // Reorder answers array
            const [movedAnswer] = node.answers.splice(draggedAnswerFromIndex, 1);
            node.answers.splice(draggedToIndex, 0, movedAnswer);
            
            // Re-render all answers to update indices
            renderAllAnswers(draggedAnswerNodeId);
        }
    }
    
    this.classList.remove('drag-over', 'border-teal-600', 'bg-teal-100', '-translate-y-0.5');
    return false;
}

// Question list drag handlers
export function handleDragStart(e) {
    draggedListItem = this;
    draggedFromIndex = parseInt(this.dataset.index);
    this.classList.add('dragging', 'opacity-50', 'cursor-grabbing', 'border-teal-600', 'bg-teal-100');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

export function handleDragEnd(e) {
    this.classList.remove('dragging', 'opacity-50', 'cursor-grabbing', 'border-teal-600', 'bg-teal-100');
    // Remove drag-over class from all items
    document.querySelectorAll('[data-node-id]').forEach(item => {
        item.classList.remove('drag-over', 'border-teal-600', 'bg-teal-100', 'scale-105');
    });
}

export function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

export function handleDragEnter(e) {
    if (this !== draggedListItem) {
        this.classList.add('drag-over', 'border-teal-600', 'bg-teal-100', 'scale-105');
    }
}

export function handleDragLeave(e) {
    this.classList.remove('drag-over', 'border-teal-600', 'bg-teal-100', 'scale-105');
}

export function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedListItem !== this) {
        const draggedToIndex = parseInt(this.dataset.index);
        
        // Reorder nodes array
        reorderNodes(draggedFromIndex, draggedToIndex);
        
        // Update questions list and re-select if needed
        updateQuestionsList();
        if (state.selectedNodeId) {
            renderQuestionEditor(state.selectedNodeId);
        }
    }
    
    this.classList.remove('drag-over', 'border-teal-600', 'bg-teal-100', 'scale-105');
    return false;
}

