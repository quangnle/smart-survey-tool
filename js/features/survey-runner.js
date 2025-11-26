import { state, getNode, resetSurveyState, addToSurveyHistory } from '../state/store.js';
import { dom } from '../config/dom-elements.js';
import { hasAnyLink } from '../models/node.js';
import { showModal, hideModal } from '../ui/modals.js';

// Helper function to format text with line breaks
function formatTextWithLineBreaks(text) {
    if (!text) return '';
    // Escape HTML and convert line breaks to <br>
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}

// Helper function to check if two arrays match exactly (same elements, same order)
function arraysMatchExactly(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort((a, b) => a - b);
    const sorted2 = [...arr2].sort((a, b) => a - b);
    return sorted1.every((val, idx) => val === sorted2[idx]);
}

// Process multiple choice selection with rules → nextQuestion logic
// Note: If no rule matches, use nextQuestion default (NOT answer links)
function processMultipleChoiceSelection(nodeId, selectedAnswerIndices) {
    const node = getNode(nodeId);
    if (!node) return null;
    
    // If no selection, end survey
    if (!selectedAnswerIndices || selectedAnswerIndices.length === 0) {
        return 'end';
    }
    
    // Sort selected indices for comparison (exact match requires same elements)
    const sortedSelected = [...selectedAnswerIndices].sort((a, b) => a - b);
    
    // 1. Check Rules (exact match only)
    if (node.rules && node.rules.length > 0) {
        // Sort rules by order
        const sortedRules = [...node.rules].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        for (const rule of sortedRules) {
            if (rule.answerIndices && rule.answerIndices.length > 0) {
                // Filter out placeholder indices (-1)
                const validRuleIndices = rule.answerIndices.filter(idx => idx >= 0);
                if (validRuleIndices.length === 0) continue;
                
                const sortedRuleIndices = [...validRuleIndices].sort((a, b) => a - b);
                
                // Exact match check: selected must match rule exactly (same elements, same count)
                if (arraysMatchExactly(sortedSelected, sortedRuleIndices)) {
                    if (rule.linkedTo) {
                        return rule.linkedTo;
                    }
                }
            }
        }
    }
    
    // 2. No rule match → use nextQuestion default (NOT answer links)
    if (node.nextQuestion) {
        return node.nextQuestion;
    }
    
    // 3. No match and no nextQuestion → end survey
    return 'end';
}

// Start survey
export function startSurvey() {
    if (state.nodes.length === 0) {
        alert('Vui lòng tạo ít nhất một câu hỏi trước khi chạy survey!');
        return;
    }
    
    // Check if at least one question has content
    const validQuestions = state.nodes.filter(n => n.question.trim() !== '');
    if (validQuestions.length === 0) {
        alert('Vui lòng nhập nội dung cho ít nhất một câu hỏi!');
        return;
    }
    
    // Reset survey state first
    resetSurveyState();
    
    // Start from the first question
    const firstNodeId = state.nodes[0].id;
    console.log('Starting survey with node:', firstNodeId, 'Total nodes:', state.nodes.length);
    state.currentSurveyNodeId = firstNodeId;
    showSurveyQuestion(firstNodeId);
    showModal(dom.surveyModal);
}

// Show survey question
export function showSurveyQuestion(nodeId) {
    console.log('showSurveyQuestion called with nodeId:', nodeId);
    console.log('Current state.nodes:', state.nodes.length, 'nodes');
    const node = getNode(nodeId);
    if (!node) {
        console.error('❌ Node not found!', {
            nodeId,
            availableIds: state.nodes.map(n => n.id),
            availableQuestions: state.nodes.map(n => n.question.substring(0, 30))
        });
        showSurveyEnd();
        return;
    }
    console.log('✅ Node found:', node.question.substring(0, 30));
    
    // Check if this is an end node (no links)
    const isEndNode = !hasAnyLink(node);
    
    // Handle info node (content only, no answers)
    if (node.isInfoNode) {
        if (isEndNode) {
            // End node - show end button
    const surveyBody = document.getElementById('surveyBody');
    if (!surveyBody) {
        console.error('surveyBody element not found!');
        return;
    }
    surveyBody.innerHTML = `
        <div class="mb-8 text-center p-10">
            <div class="text-xl text-yellow-900 bg-yellow-50 p-5 rounded-lg border-2 border-yellow-400 mb-8 whitespace-pre-wrap">${formatTextWithLineBreaks(node.question || 'Thông báo chưa có nội dung')}</div>
            <div class="mt-8">
                <button class="bg-teal-700 hover:bg-teal-800 border-2 border-teal-700 hover:border-teal-800 text-white w-full rounded-lg px-5 py-4 text-base cursor-pointer transition-all font-semibold text-base px-8 py-4" onclick="window.showSurveyEndHandler()">
                    ✓ Kết thúc survey
                </button>
            </div>
        </div>
    `;
        } else {
            // Has nextQuestion link
            const surveyBody = document.getElementById('surveyBody');
            if (!surveyBody) {
                console.error('surveyBody element not found!');
                return;
            }
            surveyBody.innerHTML = `
                <div class="mb-8 text-center p-10">
                    <div class="text-xl text-yellow-900 bg-yellow-50 p-5 rounded-lg border-2 border-yellow-400 mb-8 whitespace-pre-wrap">${formatTextWithLineBreaks(node.question || 'Thông báo chưa có nội dung')}</div>
                    <div class="mt-8">
                        <button class="bg-teal-800 hover:bg-teal-900 border-2 border-teal-800 hover:border-teal-900 text-white w-full rounded-lg px-5 py-4 text-base cursor-pointer transition-all hover:translate-x-1 text-left font-sans" onclick="window.goToNextQuestionHandler('${nodeId}')">
                            Tiếp tục →
                        </button>
                    </div>
                </div>
            `;
            
            // Auto-advance after 3 seconds if nextQuestion exists
            if (node.nextQuestion) {
                setTimeout(() => {
                    if (state.currentSurveyNodeId === nodeId) { // Only if still on this node
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
            const surveyBody = document.getElementById('surveyBody');
            if (!surveyBody) {
                console.error('surveyBody element not found!');
                return;
            }
            surveyBody.innerHTML = `
                <div class="mb-8">
                    <div class="text-2xl font-semibold text-teal-900 mb-6 leading-snug whitespace-pre-wrap">${formatTextWithLineBreaks(node.question || 'Câu hỏi chưa có nội dung')}</div>
                    <div class="mt-8">
                        <button class="bg-teal-700 hover:bg-teal-800 border-2 border-teal-700 hover:border-teal-800 text-white w-full rounded-lg px-5 py-4 text-base cursor-pointer transition-all font-semibold text-base px-8 py-4" onclick="window.showSurveyEndHandler()">
                            ✓ Kết thúc survey
                        </button>
                    </div>
                </div>
            `;
        } else if (node.nextQuestion) {
            // Auto-advance to next question
            state.currentSurveyNodeId = node.nextQuestion;
            showSurveyQuestion(node.nextQuestion);
            return;
        }
        return;
    }
    
    // Has answers
    // Check if multiple choice
    const isMultipleChoice = node.isMultipleChoice || false;
    
    // Check which answers have links
    const answersWithLinks = validAnswers.filter(answer => answer.linkedTo);
    const answersWithoutLinks = validAnswers.filter(answer => !answer.linkedTo);
    const hasAnswerLinks = answersWithLinks.length > 0;
    
    // Show hint if some answers have links and question also has nextQuestion
    const showNextQuestionHint = node.nextQuestion && hasAnswerLinks && answersWithoutLinks.length > 0;
    
    const surveyBody = document.getElementById('surveyBody');
    if (!surveyBody) {
        console.error('surveyBody element not found!');
        return;
    }
    
    // Render based on multiple choice or single choice
    if (isMultipleChoice) {
        // Multiple choice: use checkboxes
        surveyBody.innerHTML = `
            <div class="mb-8">
                <div class="text-2xl font-semibold text-teal-900 mb-6 leading-snug whitespace-pre-wrap">${formatTextWithLineBreaks(node.question || 'Câu hỏi chưa có nội dung')}</div>
                <p class="text-sm text-gray-600 mb-4 italic">Bạn có thể chọn nhiều câu trả lời:</p>
                <div class="flex flex-col gap-3 mb-6">
                    ${validAnswers.map((answer, index) => {
                        const answerIndex = node.answers.indexOf(answer);
                        return `
                        <label class="flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-all">
                            <input type="checkbox" 
                                   class="w-5 h-5 cursor-pointer accent-teal-600" 
                                   value="${answerIndex}"
                                   data-answer-index="${answerIndex}">
                            <span class="flex-1 text-base text-teal-900">${answer.text}</span>
                        </label>
                    `;
                    }).join('')}
                </div>
                <button class="bg-teal-700 hover:bg-teal-800 text-white w-full rounded-lg px-5 py-4 text-base cursor-pointer transition-all font-semibold" 
                        onclick="window.submitMultipleChoiceHandler('${nodeId}')">
                    Tiếp tục →
                </button>
            </div>
        `;
    } else {
        // Single choice: use radio buttons (original behavior)
        surveyBody.innerHTML = `
            <div class="mb-8">
                <div class="text-2xl font-semibold text-teal-900 mb-6 leading-snug whitespace-pre-wrap">${formatTextWithLineBreaks(node.question || 'Câu hỏi chưa có nội dung')}</div>
                <div class="flex flex-col gap-3">
                    ${validAnswers.map((answer, index) => {
                        const hasLink = answer.linkedTo;
                        const answerIndex = node.answers.indexOf(answer);
                        return `
                        <button class="bg-gray-50 hover:bg-teal-800 hover:border-teal-800 hover:text-white border-2 border-gray-300 hover:border-teal-800 rounded-lg px-5 py-4 text-base text-teal-900 hover:text-white cursor-pointer transition-all hover:translate-x-1 text-left font-sans ${!hasLink ? 'opacity-90' : ''}" onclick="window.selectSurveyAnswerHandler('${nodeId}', ${answerIndex})">
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
                        <button class="bg-gray-500 hover:bg-gray-600 border-2 border-gray-500 hover:border-gray-600 text-white rounded-lg px-5 py-4 text-base cursor-pointer transition-all hover:translate-x-1 text-left font-sans" onclick="window.goToNextQuestionHandler('${nodeId}')">
                            Bỏ qua → Câu hỏi tiếp theo
                        </button>
                    </div>
                ` : ''}
                ${isEndNode ? `
                    <div class="mt-5 pt-5 border-t-2 border-teal-700">
                        <button class="bg-teal-700 hover:bg-teal-800 border-2 border-teal-700 hover:border-teal-800 text-white w-full rounded-lg px-5 py-4 text-base cursor-pointer transition-all font-semibold text-base px-8 py-4" onclick="window.showSurveyEndHandler()">
                            ✓ Kết thúc survey
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

// Go to next question (when nextQuestion link exists)
export function goToNextQuestion(nodeId) {
    const node = getNode(nodeId);
    if (!node || !node.nextQuestion) return;
    
    // Add to history
    addToSurveyHistory({
        questionId: nodeId,
        question: node.question,
        answer: '(Bỏ qua)',
        answerIndex: -1
    });
    
    state.currentSurveyNodeId = node.nextQuestion;
    showSurveyQuestion(node.nextQuestion);
}

// Select survey answer (single choice)
export function selectSurveyAnswer(nodeId, answerIndex) {
    const node = getNode(nodeId);
    if (!node || !node.answers[answerIndex]) return;
    
    const answer = node.answers[answerIndex];
    
    // Add to history
    addToSurveyHistory({
        questionId: nodeId,
        question: node.question,
        answer: answer.text,
        answerIndex: answerIndex
    });
    
    // Priority: Answer link > NextQuestion link
    // 1. If answer has a link, use it (highest priority)
    if (answer.linkedTo) {
        state.currentSurveyNodeId = answer.linkedTo;
        showSurveyQuestion(answer.linkedTo);
    } 
    // 2. If answer has no link but question has nextQuestion, use nextQuestion
    else if (node.nextQuestion) {
        state.currentSurveyNodeId = node.nextQuestion;
        showSurveyQuestion(node.nextQuestion);
    } 
    // 3. No link at all - this is an end node
    else {
        // Show the same question again but with end button
        showSurveyQuestion(nodeId);
    }
}

// Submit multiple choice selection
export function submitMultipleChoice(nodeId) {
    const node = getNode(nodeId);
    if (!node) return;
    
    // Get selected checkboxes
    const checkboxes = document.querySelectorAll(`input[type="checkbox"][data-answer-index]`);
    const selectedIndices = [];
    const selectedAnswers = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const answerIndex = parseInt(checkbox.dataset.answerIndex);
            selectedIndices.push(answerIndex);
            if (node.answers[answerIndex]) {
                selectedAnswers.push(node.answers[answerIndex].text);
            }
        }
    });
    
    // Add to history
    addToSurveyHistory({
        questionId: nodeId,
        question: node.question,
        answer: selectedAnswers.join(', '),
        answerIndex: selectedIndices
    });
    
    // Process selection with rules → priority → nextQuestion logic
    const nextNodeId = processMultipleChoiceSelection(nodeId, selectedIndices);
    
    if (nextNodeId === 'end') {
        showSurveyEnd();
    } else if (nextNodeId) {
        state.currentSurveyNodeId = nextNodeId;
        showSurveyQuestion(nextNodeId);
    } else {
        showSurveyEnd();
    }
}

// Show survey end
export function showSurveyEnd() {
    const surveyBody = document.getElementById('surveyBody');
    if (!surveyBody) {
        console.error('surveyBody element not found!');
        return;
    }
    surveyBody.innerHTML = `
        <div class="text-center p-10">
            <h3 class="text-2xl text-teal-700 mb-4">✓ Survey hoàn thành!</h3>
            <p class="text-base text-gray-500 mb-6">Cảm ơn bạn đã tham gia survey.</p>
            <div class="flex gap-4 justify-center mt-6">
                <button class="bg-teal-700 hover:bg-teal-800 text-white px-8 py-3 rounded-md text-base cursor-pointer transition-colors" onclick="window.showReviewAnswersHandler()">📋 Xem lại câu trả lời</button>
                <button class="bg-teal-800 hover:bg-teal-900 text-white px-8 py-3 rounded-md text-base cursor-pointer transition-colors" onclick="window.startSurveyHandler()">Chạy lại</button>
            </div>
        </div>
    `;
    state.currentSurveyNodeId = null;
}

// Show review answers
export function showReviewAnswers() {
    if (state.surveyHistory.length === 0) {
        alert('Không có câu trả lời nào để xem lại!');
        return;
    }
    
    const reviewHTML = state.surveyHistory.map((item, index) => {
        const node = getNode(item.questionId);
        const nodeIndex = node ? state.nodes.indexOf(node) + 1 : index + 1;
        const isInfoNode = node ? node.isInfoNode : false;
        
        return `
            <div class="bg-white border-2 border-gray-200 rounded-lg p-5 transition-all hover:border-teal-600 hover:shadow-md">
                <div class="flex items-center gap-2.5 mb-4 pb-2.5 border-b border-gray-200">
                    <span class="inline-flex items-center justify-center w-8 h-8 bg-teal-800 text-white rounded-full font-bold text-sm flex-shrink-0">${index + 1}</span>
                    <span class="text-xs text-gray-500 font-semibold uppercase">${isInfoNode ? 'Thông báo' : 'Câu hỏi'} #${nodeIndex}</span>
                </div>
                <div class="text-base font-semibold text-teal-900 mb-3 leading-relaxed whitespace-pre-wrap">${formatTextWithLineBreaks(item.question || 'Chưa có nội dung')}</div>
                <div class="text-sm text-teal-800 leading-relaxed p-3 bg-gray-50 rounded-md border-l-4 border-teal-700">
                    <strong class="text-teal-700 mr-2">${isInfoNode ? 'Nội dung:' : 'Đã chọn:'}</strong> 
                    <span>${item.answer}</span>
                </div>
            </div>
        `;
    }).join('');
    
    const surveyBody = document.getElementById('surveyBody');
    if (!surveyBody) {
        console.error('surveyBody element not found!');
        return;
    }
    surveyBody.innerHTML = `
        <div class="p-5">
            <div class="text-center mb-8 pb-5 border-b-2 border-gray-200">
                <h3 class="text-2xl text-teal-900 mb-2.5">📋 Xem lại câu trả lời</h3>
                <p class="text-sm text-gray-500 m-0">Tổng cộng: ${state.surveyHistory.length} ${state.surveyHistory.length === 1 ? 'câu trả lời' : 'câu trả lời'}</p>
            </div>
            <div class="flex flex-col gap-5 max-h-[calc(90vh-250px)] overflow-y-auto p-2.5">
                ${reviewHTML}
            </div>
            <div class="text-center mt-8">
                <button class="bg-teal-800 hover:bg-teal-900 text-white px-8 py-3 rounded-md text-base cursor-pointer transition-colors" onclick="window.showSurveyEndHandler()">Quay lại</button>
            </div>
        </div>
    `;
}

// Close survey
export function closeSurvey() {
    hideModal(dom.surveyModal);
    resetSurveyState();
}

