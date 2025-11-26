import { state, getNode, getNodeIndex, setSelectedNodeId, updateNode } from '../state/store.js';
import { dom } from '../config/dom-elements.js';
import { getQuestionPreview } from '../models/node.js';
import { renderAnswer } from './answer-list.js';
import { updateQuestionsList } from './sidebar.js';

// Render question editor
export function renderQuestionEditor(nodeId) {
    const node = getNode(nodeId);
    if (!node) return;
    
    setSelectedNodeId(nodeId);
    const nodeIndex = getNodeIndex(nodeId);
    
    const nextQuestionPreview = node.nextQuestion 
        ? getQuestionPreview(node.nextQuestion)
        : '';
    
    dom.questionEditor.innerHTML = `
        <div class="bg-teal-800 text-white px-5 py-4 flex justify-between items-center border-b-2 border-teal-900 shadow-md">
            <div class="text-lg font-semibold flex-1">${node.isInfoNode ? 'Thông báo' : 'Câu hỏi'} #${nodeIndex + 1}</div>
        </div>
        <div class="flex-1 p-8 overflow-y-auto">
            <div class="mb-5 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <label class="flex items-center gap-2.5 cursor-pointer text-sm text-yellow-900 font-medium">
                    <input type="checkbox" class="w-[18px] h-[18px] cursor-pointer accent-yellow-500" ${node.isInfoNode ? 'checked' : ''} onchange="window.toggleNodeTypeHandler('${node.id}', this.checked)">
                    <span>Đây là node thông báo (chỉ hiển thị nội dung, không có câu trả lời)</span>
                </label>
            </div>
            <div class="mb-8">
                <label class="text-sm font-semibold text-teal-900 mb-2.5 block">${node.isInfoNode ? 'Nội dung thông báo:' : 'Nội dung câu hỏi:'}</label>
                <textarea class="w-full min-h-[120px] p-4 border-2 border-gray-300 rounded-lg text-[15px] font-sans resize-y transition-colors focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200 leading-relaxed" placeholder="${node.isInfoNode ? 'Nhập nội dung thông báo...' : 'Nhập nội dung câu hỏi...'}" oninput="window.updateQuestionHandler('${node.id}', this.value)">${node.question}</textarea>
            </div>
            <div class="mt-8 p-5 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div class="flex justify-between items-center mb-2.5">
                    <label class="text-sm font-semibold text-teal-900">Câu hỏi tiếp theo mặc định:</label>
                    <div class="flex items-center gap-2.5">
                        <button class="bg-gray-500 hover:bg-gray-600 ${node.nextQuestion ? 'bg-teal-700 hover:bg-teal-800' : ''} text-white px-4 py-2 rounded-md text-xs transition-colors flex items-center gap-1.5" 
                                onclick="window.openNextQuestionModalHandler('${node.id}')" 
                                title="Link tới câu hỏi tiếp theo">
                            ${node.nextQuestion ? '🔗 Đã link' : '🔗 Link câu hỏi'}
                        </button>
                        ${node.nextQuestion ? `
                            <span class="text-xs text-teal-700 italic max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">→ ${nextQuestionPreview}</span>
                            <button class="bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full cursor-pointer text-sm flex items-center justify-center transition-colors flex-shrink-0" onclick="window.unlinkNextQuestionHandler('${node.id}')" title="Bỏ link">×</button>
                        ` : ''}
                    </div>
                </div>
                <p class="text-xs text-gray-500 m-0 italic">
                    ${node.isInfoNode ? 'Sau khi hiển thị thông báo, survey sẽ tự động chuyển đến câu hỏi này' : 'Nếu câu trả lời được chọn không link đến câu hỏi nào tiếp theo, survey sẽ chuyển đến câu hỏi này'}
                </p>
            </div>
            ${!node.isInfoNode ? `
            <div class="mt-8">
                <div class="text-sm text-teal-900 mb-4 font-semibold">Câu trả lời:</div>
                <div class="answers-list" id="answers-${node.id}"></div>
                <button class="bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-md text-sm w-full mt-2.5 transition-colors font-medium" onclick="window.addAnswerHandler('${node.id}')">
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
    
    dom.questionEditor.classList.remove('hidden');
    dom.questionEditor.classList.add('flex');
    dom.emptyState.classList.add('hidden');
    
    // Update active state in sidebar
    updateQuestionsList();
}

// Update question content
export function updateQuestionContent(nodeId, question) {
    updateNode(nodeId, { question });
    updateQuestionsList();
    
    // If this is the selected question, update the editor title if needed
    if (nodeId === state.selectedNodeId) {
        const node = getNode(nodeId);
        const nodeIndex = getNodeIndex(nodeId);
        const titleElement = dom.questionEditor.querySelector('.text-lg');
        if (titleElement && node) {
            titleElement.textContent = `${node.isInfoNode ? 'Thông báo' : 'Câu hỏi'} #${nodeIndex + 1}`;
        }
    }
}

// Show empty state
export function showEmptyState() {
    if (state.nodes.length === 0) {
        dom.emptyState.classList.remove('hidden');
        dom.questionEditor.classList.add('hidden');
        dom.questionEditor.classList.remove('flex');
        setSelectedNodeId(null);
    } else {
        if (!state.selectedNodeId) {
            // If no question is selected, select the first one
            renderQuestionEditor(state.nodes[0].id);
        }
    }
}

