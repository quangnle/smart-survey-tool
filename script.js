// State management
let nodes = [];
let nodeIdCounter = 0;
let currentLinkingAnswer = null;
let currentLinkingNode = null;

// DOM elements
const contentPanel = document.getElementById('contentPanel');
const questionEditor = document.getElementById('questionEditor');
const emptyState = document.getElementById('emptyState');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const playBtn = document.getElementById('playBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const loadFileInput = document.getElementById('loadFileInput');
const chartBtn = document.getElementById('chartBtn');
const chartModal = document.getElementById('chartModal');
const closeChartBtn = document.getElementById('closeChartBtn');
const linkModal = document.getElementById('linkModal');
const surveyModal = document.getElementById('surveyModal');
const questionList = document.getElementById('questionList');
const surveyBody = document.getElementById('surveyBody');
const closeModal = document.querySelector('.close-modal');
const closeSurveyBtn = document.getElementById('closeSurveyBtn');
const questionsList = document.getElementById('questionsList');

// Current selected question
let selectedNodeId = null;

// Survey state
let currentSurveyNodeId = null;
let surveyHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    addQuestionBtn.addEventListener('click', createNewNode);
    playBtn.addEventListener('click', startSurvey);
    saveBtn.addEventListener('click', exportSurvey);
    loadBtn.addEventListener('click', () => loadFileInput.click());
    loadFileInput.addEventListener('change', handleFileLoad);
    chartBtn.addEventListener('click', openChartModal);
    closeChartBtn.addEventListener('click', closeChartModal);
    closeModal.addEventListener('click', closeLinkModal);
    closeSurveyBtn.addEventListener('click', closeSurvey);
    
    // Close modal when clicking outside
    linkModal.addEventListener('click', (e) => {
        if (e.target === linkModal) {
            closeLinkModal();
        }
    });
    
    surveyModal.addEventListener('click', (e) => {
        if (e.target === surveyModal) {
            closeSurvey();
        }
    });
    
    chartModal.addEventListener('click', (e) => {
        if (e.target === chartModal) {
            closeChartModal();
        }
    });
    
    updateEmptyState();
    updateQuestionsList();
});

// Create a new question node
function createNewNode() {
    const nodeId = `node-${nodeIdCounter++}`;
    const node = {
        id: nodeId,
        question: '',
        answers: [],
        nextQuestion: null, // Link to next question directly
        isInfoNode: false, // Node chỉ hiển thị thông báo, không phải câu hỏi
        position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 }
    };
    
    nodes.push(node);
    updateEmptyState();
    updateQuestionsList();
    // Auto-select the newly created question
    selectQuestion(node.id);
}

// Select and display a question in the editor
function selectQuestion(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    selectedNodeId = nodeId;
    const nodeIndex = nodes.indexOf(node);
    
    const nextQuestionPreview = node.nextQuestion 
        ? getQuestionPreview(node.nextQuestion)
        : '';
    
    questionEditor.innerHTML = `
        <div class="bg-teal-800 text-white px-5 py-4 flex justify-between items-center border-b-2 border-teal-900 shadow-md">
            <div class="text-lg font-semibold flex-1">${node.isInfoNode ? 'Thông báo' : 'Câu hỏi'} #${nodeIndex + 1}</div>
            <button class="bg-transparent text-white border-2 border-white border-opacity-30 w-8 h-8 rounded-full cursor-pointer text-lg flex items-center justify-center transition-all hover:bg-red-500 hover:border-red-500 hover:scale-110 p-0 leading-none" onclick="deleteNode('${node.id}')" title="Xóa câu hỏi">×</button>
        </div>
        <div class="flex-1 p-8 overflow-y-auto">
            <div class="mb-5 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <label class="flex items-center gap-2.5 cursor-pointer text-sm text-yellow-900 font-medium">
                    <input type="checkbox" class="w-[18px] h-[18px] cursor-pointer accent-yellow-500" ${node.isInfoNode ? 'checked' : ''} onchange="toggleNodeType('${node.id}', this.checked)">
                    <span>Đây là node thông báo (chỉ hiển thị nội dung, không có câu trả lời)</span>
                </label>
            </div>
            <div class="mb-8">
                <label class="text-sm font-semibold text-teal-900 mb-2.5 block">${node.isInfoNode ? 'Nội dung thông báo:' : 'Nội dung câu hỏi:'}</label>
                <textarea class="w-full min-h-[120px] p-4 border-2 border-gray-300 rounded-lg text-[15px] font-sans resize-y transition-colors focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200 leading-relaxed" placeholder="${node.isInfoNode ? 'Nhập nội dung thông báo...' : 'Nhập nội dung câu hỏi...'}" oninput="updateQuestion('${node.id}', this.value)">${node.question}</textarea>
            </div>
            <div class="mt-8 p-5 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div class="flex justify-between items-center mb-2.5">
                    <label class="text-sm font-semibold text-teal-900">Câu hỏi tiếp theo mặc định:</label>
                    <div class="flex items-center gap-2.5">
                        <button class="bg-gray-500 hover:bg-gray-600 ${node.nextQuestion ? 'bg-teal-700 hover:bg-teal-800' : ''} text-white px-4 py-2 rounded-md text-xs transition-colors flex items-center gap-1.5" 
                                onclick="openNextQuestionModal('${node.id}')" 
                                title="Link tới câu hỏi tiếp theo">
                            ${node.nextQuestion ? '🔗 Đã link' : '🔗 Link câu hỏi'}
                        </button>
                        ${node.nextQuestion ? `
                            <span class="text-xs text-teal-700 italic max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">→ ${nextQuestionPreview}</span>
                            <button class="bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full cursor-pointer text-sm flex items-center justify-center transition-colors flex-shrink-0" onclick="unlinkNextQuestion('${node.id}')" title="Bỏ link">×</button>
                        ` : ''}
                    </div>
                </div>
                <p class="text-xs text-gray-500 m-0 italic">${node.isInfoNode ? 'Sau khi hiển thị thông báo, survey sẽ tự động chuyển đến câu hỏi này' : 'Nếu không có câu trả lời nào được chọn, survey sẽ chuyển đến câu hỏi này'}</p>
            </div>
            ${!node.isInfoNode ? `
            <div class="mt-8">
                <div class="text-sm text-teal-900 mb-4 font-semibold">Câu trả lời:</div>
                <div class="answers-list" id="answers-${node.id}"></div>
                <button class="bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-md text-sm w-full mt-2.5 transition-colors font-medium" onclick="addAnswer('${node.id}')">
                    <span>+</span> Thêm câu trả lời
                </button>
            </div>
            ` : ''}
        </div>
    `;
    
    // Render existing answers
    node.answers.forEach((answer, index) => {
        renderAnswer(node.id, index);
    });
    
    questionEditor.classList.remove('hidden');
    questionEditor.classList.add('flex');
    emptyState.classList.add('hidden');
    
    // Update active state in sidebar
    updateQuestionsList();
}

// Update question content
function updateQuestion(nodeId, question) {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        node.question = question;
        updateQuestionsList();
        // If this is the selected question, update the editor title if needed
        if (nodeId === selectedNodeId) {
            const nodeIndex = nodes.indexOf(node);
            const titleElement = questionEditor.querySelector('.question-editor-title');
        if (titleElement) {
            titleElement.textContent = `${node.isInfoNode ? 'Thông báo' : 'Câu hỏi'} #${nodeIndex + 1}`;
        }
        }
    }
}

// Add answer to a node
function addAnswer(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
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
                const input = newAnswerElement.querySelector('.answer-input');
                if (input) input.focus();
            }, 100);
        }
    }
}

// Render an answer
function renderAnswer(nodeId, answerIndex) {
    const node = nodes.find(n => n.id === nodeId);
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
                   oninput="updateAnswer('${nodeId}', ${answerIndex}, this.value)">
            <button class="bg-teal-700 hover:bg-teal-800 ${answer.linkedTo ? 'bg-teal-600' : ''} text-white w-8 h-8 rounded-md cursor-pointer text-base flex items-center justify-center transition-colors flex-shrink-0" 
                    onclick="openLinkModal('${nodeId}', ${answerIndex})" 
                    title="Liên kết tới câu hỏi khác">
                🔗
            </button>
            <button class="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-md cursor-pointer text-sm flex items-center justify-center transition-colors flex-shrink-0" 
                    onclick="deleteAnswer('${nodeId}', ${answerIndex})" 
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

// Update answer text
function updateAnswer(nodeId, answerIndex, text) {
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.answers[answerIndex]) {
        node.answers[answerIndex].text = text;
    }
}

// Delete an answer
function deleteAnswer(nodeId, answerIndex) {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        node.answers.splice(answerIndex, 1);
        const answersList = document.getElementById(`answers-${nodeId}`);
        if (answersList) {
            answersList.innerHTML = '';
            node.answers.forEach((_, index) => {
                renderAnswer(nodeId, index);
            });
        }
    }
}

// Answer drag and drop handlers
let draggedAnswerItem = null;
let draggedAnswerFromIndex = null;
let draggedAnswerNodeId = null;

function handleAnswerDragStart(e) {
    // Find the parent answer-item (this is the handle, parent is the item)
    const answerItem = this.closest('.answer-item');
    if (!answerItem) return;
    
    draggedAnswerItem = answerItem;
    draggedAnswerFromIndex = parseInt(answerItem.dataset.answerIndex);
    draggedAnswerNodeId = answerItem.dataset.nodeId;
    answerItem.classList.add('dragging', 'opacity-50', 'cursor-grabbing', 'bg-teal-100', 'border-teal-500', 'border-dashed');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', answerItem.innerHTML);
}

function handleAnswerDragEnd(e) {
    // Find the parent answer-item
    const answerItem = this.closest('.answer-item') || draggedAnswerItem;
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

function handleAnswerDragOver(e) {
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

function handleAnswerDragEnter(e) {
    // Only highlight if it's from the same node
    if (this !== draggedAnswerItem && this.dataset.nodeId === draggedAnswerNodeId) {
        this.classList.add('drag-over', 'border-teal-600', 'bg-teal-100', '-translate-y-0.5');
    }
}

function handleAnswerDragLeave(e) {
    this.classList.remove('drag-over', 'border-teal-600', 'bg-teal-100', '-translate-y-0.5');
}

function handleAnswerDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Only allow drop if it's from the same node
    if (draggedAnswerItem !== this && this.dataset.nodeId === draggedAnswerNodeId) {
        const draggedToIndex = parseInt(this.dataset.answerIndex);
        
        const node = nodes.find(n => n.id === draggedAnswerNodeId);
        if (node) {
            // Reorder answers array
            const [movedAnswer] = node.answers.splice(draggedAnswerFromIndex, 1);
            node.answers.splice(draggedToIndex, 0, movedAnswer);
            
            // Re-render all answers to update indices
            const answersList = document.getElementById(`answers-${draggedAnswerNodeId}`);
            if (answersList) {
                answersList.innerHTML = '';
                node.answers.forEach((_, index) => {
                    renderAnswer(draggedAnswerNodeId, index);
                });
            }
        }
    }
    
    this.classList.remove('drag-over');
    return false;
}

// Open modal to link answer to a question
function openLinkModal(nodeId, answerIndex) {
    currentLinkingNode = nodeId;
    currentLinkingAnswer = answerIndex;
    
    // Populate question list
    questionList.innerHTML = '';
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Filter out current node and nodes without questions
    const availableNodes = nodes.filter(n => 
        n.id !== nodeId && n.question.trim() !== ''
    );
    
    if (availableNodes.length === 0) {
        questionList.innerHTML = '<p class="text-center text-gray-500 p-5">Chưa có câu hỏi nào để liên kết</p>';
    } else {
        availableNodes.forEach(targetNode => {
            const questionItem = document.createElement('div');
            questionItem.className = 'p-4 border-2 border-gray-200 rounded-md cursor-pointer transition-all hover:border-teal-600 hover:bg-gray-50';
            questionItem.onclick = () => linkAnswer(targetNode.id);
            
            const preview = getQuestionPreview(targetNode.id);
            questionItem.innerHTML = `<div class="text-sm text-teal-900">${preview}</div>`;
            
            questionList.appendChild(questionItem);
        });
    }
    
    linkModal.classList.remove('hidden');
    linkModal.classList.add('flex');
}

// Get question preview (first 30 characters)
function getQuestionPreview(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return '';
    
    const text = node.question.trim() || 'Câu hỏi chưa có nội dung';
    return text.length > 30 ? text.substring(0, 30) + '...' : text;
}

// Link answer to a question
function linkAnswer(targetNodeId) {
    if (currentLinkingNode && currentLinkingAnswer !== null) {
        const node = nodes.find(n => n.id === currentLinkingNode);
        if (node && node.answers[currentLinkingAnswer]) {
            node.answers[currentLinkingAnswer].linkedTo = targetNodeId;
            renderAnswer(currentLinkingNode, currentLinkingAnswer);
        }
    }
    
    closeLinkModal();
}

// Close link modal
function closeLinkModal() {
    linkModal.classList.add('hidden');
    linkModal.classList.remove('flex');
    currentLinkingAnswer = null;
    currentLinkingNode = null;
}

// Open modal to link next question
function openNextQuestionModal(nodeId) {
    currentLinkingNode = nodeId;
    currentLinkingAnswer = null; // null means linking question directly
    
    // Populate question list
    questionList.innerHTML = '';
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Filter out current node and nodes without questions
    const availableNodes = nodes.filter(n => 
        n.id !== nodeId && n.question.trim() !== ''
    );
    
    if (availableNodes.length === 0) {
        questionList.innerHTML = '<p class="text-center text-gray-500 p-5">Chưa có câu hỏi nào để liên kết</p>';
    } else {
        availableNodes.forEach(targetNode => {
            const questionItem = document.createElement('div');
            questionItem.className = 'p-4 border-2 border-gray-200 rounded-md cursor-pointer transition-all hover:border-teal-600 hover:bg-gray-50';
            questionItem.onclick = () => linkNextQuestion(targetNode.id);
            
            const preview = getQuestionPreview(targetNode.id);
            questionItem.innerHTML = `<div class="text-sm text-teal-900">${preview}</div>`;
            
            questionList.appendChild(questionItem);
        });
    }
    
    linkModal.classList.remove('hidden');
    linkModal.classList.add('flex');
}

// Link next question
function linkNextQuestion(targetNodeId) {
    if (currentLinkingNode) {
        const node = nodes.find(n => n.id === currentLinkingNode);
        if (node) {
            node.nextQuestion = targetNodeId;
            selectQuestion(currentLinkingNode); // Refresh editor
        }
    }
    
    closeLinkModal();
}

// Unlink next question
function unlinkNextQuestion(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        node.nextQuestion = null;
        selectQuestion(nodeId); // Refresh editor
    }
}

// Toggle node type (question vs info node)
function toggleNodeType(nodeId, isInfoNode) {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        node.isInfoNode = isInfoNode;
        // Clear answers if switching to info node
        if (isInfoNode) {
            node.answers = [];
        }
        selectQuestion(nodeId); // Refresh editor
        updateQuestionsList(); // Update sidebar
    }
}

// Delete a node
function deleteNode(nodeId) {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
        nodes = nodes.filter(n => n.id !== nodeId);
        
        // Remove all links pointing to this node
        nodes.forEach(node => {
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
        
        // If deleted question was selected, select another or show empty state
        if (selectedNodeId === nodeId) {
            if (nodes.length > 0) {
                selectQuestion(nodes[0].id);
            } else {
                selectedNodeId = null;
                updateEmptyState();
            }
        }
        
        updateQuestionsList();
    }
}

// Update empty state
function updateEmptyState() {
    if (nodes.length === 0) {
        emptyState.classList.remove('hidden');
        questionEditor.classList.add('hidden');
        questionEditor.classList.remove('flex');
        selectedNodeId = null;
    } else {
        if (!selectedNodeId) {
            // If no question is selected, select the first one
            selectQuestion(nodes[0].id);
        }
    }
}

// Update questions list in sidebar
function updateQuestionsList() {
    questionsList.innerHTML = '';
    
    if (nodes.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'text-xs text-gray-500 italic p-5 text-center';
        emptyItem.textContent = 'Chưa có câu hỏi nào';
        questionsList.appendChild(emptyItem);
        return;
    }
    
    nodes.forEach((node, index) => {
        const listItem = document.createElement('div');
        const isActive = node.id === selectedNodeId;
        listItem.className = `bg-gray-50 border-2 ${isActive ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-200'} rounded-md p-3 mb-2 cursor-pointer transition-all select-none hover:border-teal-600 hover:bg-teal-50`;
        listItem.draggable = true;
        listItem.dataset.nodeId = node.id;
        listItem.dataset.index = index;
        
        const preview = node.question.trim() || 'Câu hỏi chưa có nội dung';
        const previewText = preview.length > 40 ? preview.substring(0, 40) + '...' : preview;
        
        listItem.innerHTML = `
            <div class="flex items-center">
                <span class="inline-flex items-center justify-center w-6 h-6 ${isActive ? 'bg-white text-teal-600' : 'bg-teal-600 text-white'} rounded-full text-xs font-bold mr-2.5 flex-shrink-0">${index + 1}</span>
                <span class="flex-1 text-xs ${isActive ? 'text-white' : 'text-teal-900'} break-words">${previewText}</span>
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
            // Don't trigger if dragging
            if (listItem.classList.contains('dragging')) {
                return;
            }
            selectQuestion(node.id);
        });
        
        questionsList.appendChild(listItem);
    });
}

// Drag and drop handlers
let draggedListItem = null;
let draggedFromIndex = null;

function handleDragStart(e) {
    draggedListItem = this;
    draggedFromIndex = parseInt(this.dataset.index);
    this.classList.add('dragging', 'opacity-50', 'cursor-grabbing', 'border-teal-600', 'bg-teal-100');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging', 'opacity-50', 'cursor-grabbing', 'border-teal-600', 'bg-teal-100');
    // Remove drag-over class from all items
    document.querySelectorAll('[data-node-id]').forEach(item => {
        item.classList.remove('drag-over', 'border-teal-600', 'bg-teal-100', 'scale-105');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedListItem) {
        this.classList.add('drag-over', 'border-teal-600', 'bg-teal-100', 'scale-105');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over', 'border-teal-600', 'bg-teal-100', 'scale-105');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedListItem !== this) {
        const draggedToIndex = parseInt(this.dataset.index);
        
        // Reorder nodes array
        const [movedNode] = nodes.splice(draggedFromIndex, 1);
        nodes.splice(draggedToIndex, 0, movedNode);
        
        // Update questions list and re-select if needed
        updateQuestionsList();
        if (selectedNodeId) {
            selectQuestion(selectedNodeId);
        }
    }
    
    this.classList.remove('drag-over');
    return false;
}

// Start survey
function startSurvey() {
    if (nodes.length === 0) {
        alert('Vui lòng tạo ít nhất một câu hỏi trước khi chạy survey!');
        return;
    }
    
    // Check if at least one question has content
    const validQuestions = nodes.filter(n => n.question.trim() !== '');
    if (validQuestions.length === 0) {
        alert('Vui lòng nhập nội dung cho ít nhất một câu hỏi!');
        return;
    }
    
    // Start from the first question
    currentSurveyNodeId = nodes[0].id;
    surveyHistory = [];
    showSurveyQuestion(currentSurveyNodeId);
    surveyModal.classList.remove('hidden');
    surveyModal.classList.add('flex');
}

// Check if node has any links
function hasAnyLink(node) {
    // Check if has nextQuestion
    if (node.nextQuestion) return true;
    
    // Check if any answer has link
    const hasAnswerLink = node.answers.some(answer => 
        answer.linkedTo && answer.text.trim() !== ''
    );
    
    return hasAnswerLink;
}

// Show survey question
function showSurveyQuestion(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
        showSurveyEnd();
        return;
    }
    
    // Check if this is an end node (no links)
    const isEndNode = !hasAnyLink(node);
    
    // Handle info node (content only, no answers)
    if (node.isInfoNode) {
        if (isEndNode) {
            // End node - show end button
            surveyBody.innerHTML = `
                <div class="mb-8 text-center p-10">
                    <div class="text-xl text-yellow-900 bg-yellow-50 p-5 rounded-lg border-2 border-yellow-400 mb-8">${node.question || 'Thông báo chưa có nội dung'}</div>
                    <div class="mt-8">
                        <button class="bg-teal-700 hover:bg-teal-800 border-2 border-teal-700 hover:border-teal-800 text-white w-full rounded-lg px-5 py-4 text-base cursor-pointer transition-all font-semibold text-base px-8 py-4" onclick="showSurveyEnd()">
                            ✓ Kết thúc survey
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Has nextQuestion link
            surveyBody.innerHTML = `
                <div class="mb-8 text-center p-10">
                    <div class="text-xl text-yellow-900 bg-yellow-50 p-5 rounded-lg border-2 border-yellow-400 mb-8">${node.question || 'Thông báo chưa có nội dung'}</div>
                    <div class="mt-8">
                        <button class="bg-teal-800 hover:bg-teal-900 border-2 border-teal-800 hover:border-teal-900 text-white w-full rounded-lg px-5 py-4 text-base cursor-pointer transition-all hover:translate-x-1 text-left font-sans" onclick="goToNextQuestion('${nodeId}')">
                            Tiếp tục →
                        </button>
                    </div>
                </div>
            `;
            
            // Auto-advance after 3 seconds if nextQuestion exists
            if (node.nextQuestion) {
                setTimeout(() => {
                    if (currentSurveyNodeId === nodeId) { // Only if still on this node
                        goToNextQuestion(nodeId);
                    }
                }, 3000);
            }
        }
        return;
    }
    
    // Filter out empty answers
    const validAnswers = node.answers.filter(a => a.text.trim() !== '');
    
    // If no answers, check for nextQuestion link
    if (validAnswers.length === 0) {
        if (isEndNode) {
            // End node - show end button
            surveyBody.innerHTML = `
                <div class="mb-8">
                    <div class="text-2xl font-semibold text-teal-900 mb-6 leading-snug">${node.question || 'Câu hỏi chưa có nội dung'}</div>
                    <div class="mt-8">
                        <button class="bg-teal-700 hover:bg-teal-800 border-2 border-teal-700 hover:border-teal-800 text-white w-full rounded-lg px-5 py-4 text-base cursor-pointer transition-all font-semibold text-base px-8 py-4" onclick="showSurveyEnd()">
                            ✓ Kết thúc survey
                        </button>
                    </div>
                </div>
            `;
        } else if (node.nextQuestion) {
            // Auto-advance to next question
            currentSurveyNodeId = node.nextQuestion;
            showSurveyQuestion(node.nextQuestion);
            return;
        }
        return;
    }
    
    // Has answers
    // Check which answers have links
    const answersWithLinks = validAnswers.filter(answer => answer.linkedTo);
    const answersWithoutLinks = validAnswers.filter(answer => !answer.linkedTo);
    const hasAnswerLinks = answersWithLinks.length > 0;
    
    // Show hint if some answers have links and question also has nextQuestion
    const showNextQuestionHint = node.nextQuestion && hasAnswerLinks && answersWithoutLinks.length > 0;
    
    surveyBody.innerHTML = `
        <div class="mb-8">
            <div class="text-2xl font-semibold text-teal-900 mb-6 leading-snug">${node.question || 'Câu hỏi chưa có nội dung'}</div>
            <div class="flex flex-col gap-3">
                ${validAnswers.map((answer, index) => {
                    const hasLink = answer.linkedTo;
                    const answerIndex = node.answers.indexOf(answer);
                    return `
                    <button class="bg-gray-50 hover:bg-teal-800 hover:border-teal-800 hover:text-white border-2 border-gray-300 hover:border-teal-800 rounded-lg px-5 py-4 text-base text-teal-900 hover:text-white cursor-pointer transition-all hover:translate-x-1 text-left font-sans ${!hasLink ? 'opacity-90' : ''}" onclick="selectSurveyAnswer('${nodeId}', ${answerIndex})">
                        ${answer.text}
                        ${hasLink ? '<span class="text-xs opacity-70 ml-2">→</span>' : ''}
                    </button>
                `;
                }).join('')}
            </div>
            ${showNextQuestionHint ? `
                <div class="mt-4 p-2.5 bg-teal-50 border-l-4 border-teal-600 rounded text-xs text-teal-900">
                    <strong>Lưu ý:</strong> Các câu trả lời có mũi tên (→) sẽ đi theo link riêng. Các câu trả lời khác sẽ đi theo link mặc định.
                </div>
            ` : ''}
            ${node.nextQuestion && !hasAnswerLinks ? `
                <div class="mt-5 pt-5 border-t border-gray-300">
                    <button class="bg-gray-500 hover:bg-gray-600 border-2 border-gray-500 hover:border-gray-600 text-white rounded-lg px-5 py-4 text-base cursor-pointer transition-all hover:translate-x-1 text-left font-sans" onclick="goToNextQuestion('${nodeId}')">
                        Bỏ qua → Câu hỏi tiếp theo
                    </button>
                </div>
            ` : ''}
            ${isEndNode ? `
                <div class="mt-5 pt-5 border-t-2 border-teal-700">
                    <button class="bg-teal-700 hover:bg-teal-800 border-2 border-teal-700 hover:border-teal-800 text-white w-full rounded-lg px-5 py-4 text-base cursor-pointer transition-all font-semibold text-base px-8 py-4" onclick="showSurveyEnd()">
                        ✓ Kết thúc survey
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// Go to next question (when nextQuestion link exists)
function goToNextQuestion(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.nextQuestion) return;
    
    // Add to history
    surveyHistory.push({
        questionId: nodeId,
        question: node.question,
        answer: '(Bỏ qua)',
        answerIndex: -1
    });
    
    currentSurveyNodeId = node.nextQuestion;
    showSurveyQuestion(node.nextQuestion);
}

// Select survey answer
function selectSurveyAnswer(nodeId, answerIndex) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.answers[answerIndex]) return;
    
    const answer = node.answers[answerIndex];
    
    // Add to history
    surveyHistory.push({
        questionId: nodeId,
        question: node.question,
        answer: answer.text,
        answerIndex: answerIndex
    });
    
    // Priority: Answer link > NextQuestion link
    // 1. If answer has a link, use it (highest priority)
    if (answer.linkedTo) {
        currentSurveyNodeId = answer.linkedTo;
        showSurveyQuestion(answer.linkedTo);
    } 
    // 2. If answer has no link but question has nextQuestion, use nextQuestion
    else if (node.nextQuestion) {
        currentSurveyNodeId = node.nextQuestion;
        showSurveyQuestion(node.nextQuestion);
    } 
    // 3. No link at all - this is an end node
    else {
        // Show the same question again but with end button
        showSurveyQuestion(nodeId);
    }
}

// Show survey end
function showSurveyEnd() {
    surveyBody.innerHTML = `
        <div class="text-center p-10">
            <h3 class="text-2xl text-teal-700 mb-4">✓ Survey hoàn thành!</h3>
            <p class="text-base text-gray-500 mb-6">Cảm ơn bạn đã tham gia survey.</p>
            <div class="flex gap-4 justify-center mt-6">
                <button class="bg-teal-700 hover:bg-teal-800 text-white px-8 py-3 rounded-md text-base cursor-pointer transition-colors" onclick="showReviewAnswers()">📋 Xem lại câu trả lời</button>
                <button class="bg-teal-800 hover:bg-teal-900 text-white px-8 py-3 rounded-md text-base cursor-pointer transition-colors" onclick="startSurvey()">Chạy lại</button>
            </div>
        </div>
    `;
    currentSurveyNodeId = null;
}

// Show review answers
function showReviewAnswers() {
    if (surveyHistory.length === 0) {
        alert('Không có câu trả lời nào để xem lại!');
        return;
    }
    
    const reviewHTML = surveyHistory.map((item, index) => {
        const node = nodes.find(n => n.id === item.questionId);
        const nodeIndex = node ? nodes.indexOf(node) + 1 : index + 1;
        const isInfoNode = node ? node.isInfoNode : false;
        
        return `
            <div class="bg-white border-2 border-gray-200 rounded-lg p-5 transition-all hover:border-teal-600 hover:shadow-md">
                <div class="flex items-center gap-2.5 mb-4 pb-2.5 border-b border-gray-200">
                    <span class="inline-flex items-center justify-center w-8 h-8 bg-teal-800 text-white rounded-full font-bold text-sm flex-shrink-0">${index + 1}</span>
                    <span class="text-xs text-gray-500 font-semibold uppercase">${isInfoNode ? 'Thông báo' : 'Câu hỏi'} #${nodeIndex}</span>
                </div>
                <div class="text-base font-semibold text-teal-900 mb-3 leading-relaxed">${item.question || 'Chưa có nội dung'}</div>
                <div class="text-sm text-teal-800 leading-relaxed p-3 bg-gray-50 rounded-md border-l-4 border-teal-700">
                    <strong class="text-teal-700 mr-2">${isInfoNode ? 'Nội dung:' : 'Đã chọn:'}</strong> 
                    <span>${item.answer}</span>
                </div>
            </div>
        `;
    }).join('');
    
    surveyBody.innerHTML = `
        <div class="p-5">
            <div class="text-center mb-8 pb-5 border-b-2 border-gray-200">
                <h3 class="text-2xl text-teal-900 mb-2.5">📋 Xem lại câu trả lời</h3>
                <p class="text-sm text-gray-500 m-0">Tổng cộng: ${surveyHistory.length} ${surveyHistory.length === 1 ? 'câu trả lời' : 'câu trả lời'}</p>
            </div>
            <div class="flex flex-col gap-5 max-h-[calc(90vh-250px)] overflow-y-auto p-2.5">
                ${reviewHTML}
            </div>
            <div class="text-center mt-8">
                <button class="bg-teal-800 hover:bg-teal-900 text-white px-8 py-3 rounded-md text-base cursor-pointer transition-colors" onclick="showSurveyEnd()">Quay lại</button>
            </div>
        </div>
    `;
}

// Close survey
function closeSurvey() {
    surveyModal.classList.add('hidden');
    surveyModal.classList.remove('flex');
    currentSurveyNodeId = null;
    surveyHistory = [];
}

// Open chart modal
function openChartModal() {
    if (nodes.length === 0) {
        alert('Chưa có câu hỏi nào để hiển thị chart!');
        return;
    }
    
    chartModal.classList.remove('hidden');
    chartModal.classList.add('flex');
    renderChart();
}

// Close chart modal
function closeChartModal() {
    chartModal.classList.add('hidden');
    chartModal.classList.remove('flex');
}

// Render D3.js chart
function renderChart() {
    const svg = d3.select('#chartSvg');
    svg.selectAll('*').remove(); // Clear previous chart
    
    if (nodes.length === 0) return;
    
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    
    // Create arrow marker for links
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#64748b');
    
    // Prepare data for D3.js
    const nodeMap = new Map();
    nodes.forEach((node, index) => {
        nodeMap.set(node.id, {
            id: node.id,
            label: node.isInfoNode ? `I${index + 1}` : `Q${index + 1}`,
            question: node.question || 'Chưa có nội dung',
            index: index,
            isInfoNode: node.isInfoNode || false
        });
    });
    
    const nodes_data = Array.from(nodeMap.values());
    
    // Create links from answers
    const links_data = [];
    nodes.forEach(node => {
        node.answers.forEach(answer => {
            if (answer.linkedTo && answer.text.trim() !== '') {
                links_data.push({
                    source: node.id,
                    target: answer.linkedTo,
                    answerText: answer.text,
                    type: 'answer'
                });
            }
        });
        // Add nextQuestion links
        if (node.nextQuestion) {
            links_data.push({
                source: node.id,
                target: node.nextQuestion,
                answerText: '(Mặc định)',
                type: 'next'
            });
        }
    });
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes_data)
        .force('link', d3.forceLink(links_data).id(d => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(60));
    
    // Create links
    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links_data)
        .enter().append('line')
        .attr('class', d => `link link-${d.type}`)
        .attr('stroke-width', d => d.type === 'next' ? 3 : 2)
        .attr('stroke-dasharray', d => d.type === 'next' ? '5,5' : '0')
        .attr('stroke', d => d.type === 'next' ? '#14b8a6' : '#64748b');
    
    // Add link labels (answer text)
    const linkLabels = svg.append('g')
        .attr('class', 'link-labels')
        .selectAll('text')
        .data(links_data)
        .enter().append('text')
        .attr('class', 'link-label')
        .text(d => d.answerText.length > 15 ? d.answerText.substring(0, 15) + '...' : d.answerText)
        .style('font-size', '10px')
        .style('fill', '#64748b')
        .style('pointer-events', 'none');
    
    // Create nodes
    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes_data)
        .enter().append('g')
        .attr('class', 'chart-node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Add circles for nodes
    node.append('circle')
        .attr('r', 30)
        .style('fill', d => {
            if (d.id === selectedNodeId) return '#0d9488'; // teal-600 for selected
            if (d.isInfoNode) return '#14b8a6'; // teal-500 for info nodes
            return '#0f766e'; // teal-700 for regular nodes
        })
        .style('stroke', d => {
            if (d.id === selectedNodeId) return '#0d9488';
            if (d.isInfoNode) return '#0d9488';
            return '#115e59'; // teal-800
        })
        .style('stroke-width', d => d.id === selectedNodeId ? 3 : 2)
        .on('click', function(event, d) {
            // Select and edit this node
            selectQuestion(d.id);
            closeChartModal();
        });
    
    // Add labels (Q1, Q2, ...)
    node.append('text')
        .attr('dy', 5)
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .text(d => d.label);
    
    // Add question preview below node
    node.append('text')
        .attr('class', 'node-label')
        .attr('dy', 45)
        .style('text-anchor', 'middle')
        .text(d => {
            const text = d.question;
            return text.length > 20 ? text.substring(0, 20) + '...' : text;
        });
    
    // Update positions on tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        linkLabels
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2);
        
        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// Export survey to JSON file
function exportSurvey() {
    if (nodes.length === 0) {
        alert('Không có dữ liệu survey để lưu!');
        return;
    }
    
    // Prepare survey data
    const surveyData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        questions: nodes.map((node, index) => ({
            id: node.id,
            order: index + 1,
            question: node.question,
            isInfoNode: node.isInfoNode || false,
            nextQuestion: node.nextQuestion || null,
            nextQuestionText: node.nextQuestion ? nodes.find(n => n.id === node.nextQuestion)?.question || null : null,
            answers: node.answers.map((answer, answerIndex) => ({
                id: `answer-${node.id}-${answerIndex}`,
                text: answer.text,
                linkedTo: answer.linkedTo || null,
                linkedToQuestion: answer.linkedTo ? nodes.find(n => n.id === answer.linkedTo)?.question || null : null
            }))
        }))
    };
    
    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(surveyData, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `survey-${timestamp}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    // Show success message
    alert('Survey đã được lưu thành công!');
}

// Load survey from JSON file
function handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        alert('Vui lòng chọn file JSON!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            loadSurvey(jsonData);
        } catch (error) {
            alert('Lỗi khi đọc file JSON: ' + error.message);
            console.error('Parse error:', error);
        }
    };
    
    reader.onerror = function() {
        alert('Lỗi khi đọc file!');
    };
    
    reader.readAsText(file);
    
    // Reset input để có thể chọn lại cùng file
    event.target.value = '';
}

// Load survey data
function loadSurvey(surveyData) {
    // Validate data structure
    if (!surveyData.questions || !Array.isArray(surveyData.questions)) {
        alert('File JSON không đúng định dạng!');
        return;
    }
    
    // Confirm before loading (will overwrite current data)
    if (nodes.length > 0) {
        if (!confirm('Load survey mới sẽ thay thế survey hiện tại. Bạn có chắc muốn tiếp tục?')) {
            return;
        }
    }
    
    try {
        // Clear current nodes
        nodes = [];
        nodeIdCounter = 0;
        selectedNodeId = null;
        
        // Restore nodes from JSON
        surveyData.questions.forEach((qData, index) => {
            // Create new node with original ID or generate new one
            const nodeId = qData.id || `node-${nodeIdCounter++}`;
            const node = {
                id: nodeId,
                question: qData.question || '',
                answers: [],
                nextQuestion: qData.nextQuestion || null,
                isInfoNode: qData.isInfoNode || false,
                position: { x: 100 + index * 50, y: 100 + index * 50 }
            };
            
            // Restore answers
            if (qData.answers && Array.isArray(qData.answers)) {
                qData.answers.forEach((aData) => {
                    node.answers.push({
                        text: aData.text || '',
                        linkedTo: aData.linkedTo || null
                    });
                });
            }
            
            nodes.push(node);
            
            // Update nodeIdCounter to avoid conflicts
            const match = nodeId.match(/node-(\d+)/);
            if (match) {
                const num = parseInt(match[1]);
                if (num >= nodeIdCounter) {
                    nodeIdCounter = num + 1;
                }
            }
        });
        
        // Restore links between answers and questions
        // We need to map old IDs to new IDs if they changed
        surveyData.questions.forEach((qData, qIndex) => {
            const node = nodes[qIndex];
            if (!node) return;
            
            if (qData.answers && Array.isArray(qData.answers)) {
                qData.answers.forEach((aData, aIndex) => {
                    if (aData.linkedTo && node.answers[aIndex]) {
                        // Find the target node by ID or by order
                        let targetNode = null;
                        if (aData.linkedTo) {
                            // Try to find by ID first
                            targetNode = nodes.find(n => n.id === aData.linkedTo);
                            
                            // If not found, try to find by linkedToQuestion text
                            if (!targetNode && aData.linkedToQuestion) {
                                targetNode = nodes.find(n => n.question === aData.linkedToQuestion);
                            }
                            
                            // If still not found, try by order (if linkedTo was an index)
                            if (!targetNode && !isNaN(aData.linkedTo)) {
                                const orderIndex = parseInt(aData.linkedTo) - 1;
                                if (orderIndex >= 0 && orderIndex < nodes.length) {
                                    targetNode = nodes[orderIndex];
                                }
                            }
                        }
                        
                        if (targetNode) {
                            node.answers[aIndex].linkedTo = targetNode.id;
                        }
                    }
                });
            }
            
            // Restore nextQuestion links
            if (qData.nextQuestion) {
                let targetNode = nodes.find(n => n.id === qData.nextQuestion);
                if (!targetNode && qData.nextQuestionText) {
                    targetNode = nodes.find(n => n.question === qData.nextQuestionText);
                }
                if (targetNode) {
                    node.nextQuestion = targetNode.id;
                }
            }
        });
        
        // Update UI
        updateEmptyState();
        updateQuestionsList();
        
        // Select first question if available
        if (nodes.length > 0) {
            selectQuestion(nodes[0].id);
        }
        
        alert(`Đã load thành công ${nodes.length} câu hỏi!`);
        
    } catch (error) {
        alert('Lỗi khi load survey: ' + error.message);
        console.error('Load error:', error);
    }
}
