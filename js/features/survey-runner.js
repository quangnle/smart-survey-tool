import { state, getNode, resetSurveyState, addToSurveyHistory, getSurveyTitle, getSurveyDescription, truncateHistoryFromIndex, setPathModified, canGoBack, pushToNavigationStack, popFromNavigationStack, peekNavigationStack, getHistoryEntryByNodeId, truncateNavigationStackFromIndex } from '../state/store.js';
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

// Helper function to get info node styling based on type
function getInfoNodeStyles(infoType) {
    const type = infoType || 'warning';
    const styles = {
        normal: {
            bg: 'bg-white',
            border: 'border-gray-300',
            text: 'text-gray-900',
            borderColor: 'border-gray-300'
        },
        success: {
            bg: 'bg-teal-50',
            border: 'border-teal-400',
            text: 'text-teal-900',
            borderColor: 'border-teal-400'
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-400',
            text: 'text-yellow-900',
            borderColor: 'border-yellow-400'
        },
        danger: {
            bg: 'bg-red-50',
            border: 'border-red-400',
            text: 'text-red-900',
            borderColor: 'border-red-400'
        }
    };
    return styles[type] || styles.warning;
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
    
    // 2. Check if user selected only 1 option and that option has a link
    if (selectedAnswerIndices.length === 1) {
        const selectedAnswerIndex = selectedAnswerIndices[0];
        const selectedAnswer = node.answers[selectedAnswerIndex];
        
        if (selectedAnswer && selectedAnswer.linkedTo) {
            return selectedAnswer.linkedTo;
        }
    }
    
    // 3. No rule match and no single answer link → use nextQuestion default
    if (node.nextQuestion) {
        return node.nextQuestion;
    }
    
    // 4. No match and no nextQuestion → end survey
    return 'end';
}

// Helper function to render survey header (title and description)
function renderSurveyHeader() {
    const title = getSurveyTitle();
    const description = getSurveyDescription();
    
    if (!title && !description) {
        return '';
    }
    
    return `
        <div class="mb-8 pb-6 border-b-2 border-teal-200">
            ${title ? `<h1 class="text-3xl font-bold text-teal-900 mb-3">${formatTextWithLineBreaks(title)}</h1>` : ''}
            ${description ? `<p class="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">${formatTextWithLineBreaks(description)}</p>` : ''}
        </div>
    `;
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
    
    // Check if this is the first question (to show header)
    const isFirstQuestion = state.nodes.length > 0 && state.nodes[0].id === nodeId;
    const headerHTML = isFirstQuestion ? renderSurveyHeader() : '';
    
    // Handle info node (content only, no answers)
    if (node.isInfoNode) {
        const infoStyles = getInfoNodeStyles(node.infoType);
        const showBackButton = canGoBack();
        
        // Back button HTML
        const backButtonHTML = showBackButton ? `
            <div class="mb-4">
                <button class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors flex items-center gap-2" onclick="window.goBackToPreviousQuestionHandler()">
                    <span>←</span> Quay lại câu trước
                </button>
            </div>
        ` : '';
        
        if (isEndNode) {
            // End node - show end button
            const surveyBody = document.getElementById('surveyBody');
            if (!surveyBody) {
                console.error('surveyBody element not found!');
                return;
            }
            surveyBody.innerHTML = `
                ${headerHTML}
                ${backButtonHTML}
                <div class="mb-8 text-center p-10">
                    <div class="text-xl ${infoStyles.text} ${infoStyles.bg} p-5 rounded-lg border-2 ${infoStyles.border} mb-8 whitespace-pre-wrap">${formatTextWithLineBreaks(node.question || 'Thông báo chưa có nội dung')}</div>
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
                ${headerHTML}
                ${backButtonHTML}
                <div class="mb-8 text-center p-10">
                    <div class="text-xl ${infoStyles.text} ${infoStyles.bg} p-5 rounded-lg border-2 ${infoStyles.border} mb-8 whitespace-pre-wrap">${formatTextWithLineBreaks(node.question || 'Thông báo chưa có nội dung')}</div>
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
    
    // Filter out empty answers (include "Other" answer in validAnswers)
    const validAnswers = node.answers.filter(a => a.text.trim() !== '');
    const otherAnswer = node.answers.find(a => a.isOther === true);
    
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
                ${headerHTML}
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
    
    // Restore answer from history if exists
    const historyEntry = restoreAnswerFromHistory(nodeId);
    const showBackButton = canGoBack();
    const pathModifiedWarning = state.isPathModified ? `
        <div class="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded text-sm text-yellow-800">
            <strong>⚠️ Lưu ý:</strong> Bạn đã thay đổi lựa chọn. Path mới sẽ được tạo từ đây.
        </div>
    ` : '';
    
    const surveyBody = document.getElementById('surveyBody');
    if (!surveyBody) {
        console.error('surveyBody element not found!');
        return;
    }
    
    // Back button HTML
    const backButtonHTML = showBackButton ? `
        <div class="mb-4">
            <button class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors flex items-center gap-2" onclick="window.goBackToPreviousQuestionHandler()">
                <span>←</span> Quay lại câu trước
            </button>
        </div>
    ` : '';
    
    // Render based on multiple choice or single choice
    if (isMultipleChoice) {
        // Multiple choice: use checkboxes
        const otherAnswerIndex = otherAnswer ? node.answers.indexOf(otherAnswer) : -1;
        const regularAnswers = validAnswers.filter(a => !a.isOther);
        // Restore multiple choice selections
        const restoredIndices = historyEntry && Array.isArray(historyEntry.answerIndex) 
            ? historyEntry.answerIndex 
            : (historyEntry && !Array.isArray(historyEntry.answerIndex) ? [historyEntry.answerIndex] : []);
        const restoredOtherText = historyEntry && historyEntry.answer && historyEntry.answer.includes(': ') 
            ? historyEntry.answer.split(': ').slice(1).join(': ') 
            : '';
        
        surveyBody.innerHTML = `
            ${headerHTML}
            ${backButtonHTML}
            ${pathModifiedWarning}
            <div class="mb-8">
                <div class="text-2xl font-semibold text-teal-900 mb-6 leading-snug whitespace-pre-wrap">${formatTextWithLineBreaks(node.question || 'Câu hỏi chưa có nội dung')}</div>
                <p class="text-sm text-gray-600 mb-4 italic">Bạn có thể chọn nhiều câu trả lời:</p>
                <div class="flex flex-col gap-3 mb-6">
                    ${regularAnswers.map((answer, index) => {
                        const answerIndex = node.answers.indexOf(answer);
                        const isChecked = restoredIndices.includes(answerIndex);
                        return `
                        <label class="flex items-center gap-3 p-4 bg-gray-50 border-2 ${isChecked ? 'border-teal-500 bg-teal-50' : 'border-gray-300'} rounded-lg cursor-pointer hover:bg-gray-100 transition-all">
                            <input type="checkbox" 
                                   class="w-5 h-5 cursor-pointer accent-teal-600" 
                                   value="${answerIndex}"
                                   data-answer-index="${answerIndex}"
                                   ${isChecked ? 'checked' : ''}>
                            <span class="flex-1 text-base text-teal-900">${answer.text}</span>
                            ${isChecked ? '<span class="text-xs text-teal-600 font-semibold">(Đã chọn trước đó)</span>' : ''}
                        </label>
                    `;
                    }).join('')}
                    ${otherAnswer ? `
                    <div class="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                        <label class="text-base text-teal-900 mb-2 block">${otherAnswer.text || 'Khác'}:</label>
                        <input type="text" 
                               id="other-input-${nodeId}"
                               class="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:border-teal-600"
                               placeholder="${otherAnswer.placeholder || 'ý kiến khác'}"
                               maxlength="${otherAnswer.maxLength || 80}"
                               value="${restoredOtherText}"
                               oninput="window.handleOtherInputHandler('${nodeId}')">
                    </div>
                    ` : ''}
                </div>
                <button class="bg-teal-700 hover:bg-teal-800 text-white w-full rounded-lg px-5 py-4 text-base cursor-pointer transition-all font-semibold ${state.isPathModified ? 'opacity-75' : ''}" 
                        onclick="window.submitMultipleChoiceHandler('${nodeId}')"
                        ${state.isPathModified ? 'title="Bạn đã thay đổi lựa chọn. Vui lòng xác nhận để tiếp tục."' : ''}>
                    Tiếp tục →
                </button>
            </div>
        `;
    } else {
        // Single choice: use radio buttons (original behavior)
        const otherAnswerIndex = otherAnswer ? node.answers.indexOf(otherAnswer) : -1;
        const regularAnswers = validAnswers.filter(a => !a.isOther);
        
        // Restore single choice selection
        const restoredIndex = historyEntry ? historyEntry.answerIndex : -1;
        const restoredOtherText = historyEntry && historyEntry.answer && historyEntry.answer.includes(': ') 
            ? historyEntry.answer.split(': ').slice(1).join(': ') 
            : '';
        
        surveyBody.innerHTML = `
            ${headerHTML}
            ${backButtonHTML}
            ${pathModifiedWarning}
            <div class="mb-8">
                <div class="text-2xl font-semibold text-teal-900 mb-6 leading-snug whitespace-pre-wrap">${formatTextWithLineBreaks(node.question || 'Câu hỏi chưa có nội dung')}</div>
                <div class="flex flex-col gap-3">
                    ${regularAnswers.map((answer, index) => {
                        const hasLink = answer.linkedTo;
                        const answerIndex = node.answers.indexOf(answer);
                        const isSelected = restoredIndex === answerIndex;
                        return `
                        <button class="bg-gray-50 hover:bg-teal-800 hover:border-teal-800 hover:text-white border-2 ${isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-300'} hover:border-teal-800 rounded-lg px-5 py-4 text-base text-teal-900 hover:text-white cursor-pointer transition-all hover:translate-x-1 text-left font-sans ${!hasLink ? 'opacity-90' : ''}" onclick="window.selectSurveyAnswerHandler('${nodeId}', ${answerIndex})">
                            ${answer.text}
                            ${hasLink ? '<span class="text-xs opacity-70 ml-2">→</span>' : ''}
                            ${isSelected ? '<span class="text-xs text-teal-600 font-semibold ml-2">(Đã chọn trước đó)</span>' : ''}
                        </button>
                    `;
                    }).join('')}
                    ${otherAnswer ? `
                    <div class="bg-gray-50 border-2 ${restoredIndex === otherAnswerIndex ? 'border-teal-500 bg-teal-50' : 'border-gray-300'} rounded-lg p-4 mb-3">
                        <label class="text-base text-teal-900 mb-2 block">${otherAnswer.text || 'Khác'}:</label>
                        <input type="text" 
                               id="other-input-${nodeId}"
                               class="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:border-teal-600"
                               placeholder="${otherAnswer.placeholder || 'ý kiến khác'}"
                               maxlength="${otherAnswer.maxLength || 80}"
                               value="${restoredOtherText}"
                               onkeypress="if(event.key === 'Enter') window.selectSurveyAnswerHandler('${nodeId}', ${otherAnswerIndex})">
                        ${restoredIndex === otherAnswerIndex ? '<span class="text-xs text-teal-600 font-semibold mt-1 block">(Đã chọn trước đó)</span>' : ''}
                    </div>
                    <button class="bg-teal-700 hover:bg-teal-800 text-white w-full px-5 py-4 text-base cursor-pointer transition-all font-semibold rounded-lg"
                            onclick="window.selectSurveyAnswerHandler('${nodeId}', ${otherAnswerIndex})">
                        Tiếp tục →
                    </button>
                    ` : ''}
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
    
    // Check if user previously answered this question (not skipped)
    const historyEntry = restoreAnswerFromHistory(nodeId);
    const hasChanged = historyEntry && historyEntry.answerIndex !== -1;
    
    if (hasChanged) {
        // User previously answered, now skipping - this is a change
        // Find the history index for this nodeId to truncate from
        const historyIndex = state.surveyHistory.findIndex(entry => entry.questionId === nodeId);
        if (historyIndex >= 0) {
            truncateHistoryFromIndex(historyIndex);
        }
        // Add skip to history
        addToSurveyHistory({
            questionId: nodeId,
            question: node.question,
            answer: '(Bỏ qua)',
            answerIndex: -1
        });
    } else {
        // No change (either no history or was also skipped before)
        addToSurveyHistory({
            questionId: nodeId,
            question: node.question,
            answer: '(Bỏ qua)',
            answerIndex: -1
        });
    }
    
    // Push current node to navigation stack before moving forward
    pushToNavigationStack(nodeId);
    
    state.currentSurveyNodeId = node.nextQuestion;
    showSurveyQuestion(node.nextQuestion);
}

// Select survey answer (single choice)
export function selectSurveyAnswer(nodeId, answerIndex) {
    const node = getNode(nodeId);
    if (!node || !node.answers[answerIndex]) return;
    
    const answer = node.answers[answerIndex];
    
    // Handle "Other" answer - check if has text input
    let answerText = answer.text;
    let otherText = '';
    if (answer.isOther) {
        const otherInput = document.getElementById(`other-input-${nodeId}`);
        otherText = otherInput ? otherInput.value.trim() : '';
        // If "Other" is selected but no text entered, don't proceed
        if (!otherText) {
            // Focus on the input to prompt user
            if (otherInput) {
                otherInput.focus();
            }
            return;
        }
        answerText = `${answer.text}: ${otherText}`;
    }
    
    // Check if answer has changed
    const hasChanged = detectSingleChoiceChange(nodeId, answerIndex, otherText);
    
    if (hasChanged) {
        // Find the history index for this nodeId to truncate from
        const historyIndex = state.surveyHistory.findIndex(entry => entry.questionId === nodeId);
        if (historyIndex >= 0) {
            truncateHistoryFromIndex(historyIndex);
        }
        // Proceed with new answer
        proceedWithAnswer(nodeId, answerIndex, answerText, answer, node);
    } else {
        // No change, proceed normally
        proceedWithAnswer(nodeId, answerIndex, answerText, answer, node);
    }
}

// Helper function to proceed with answer (single choice)
function proceedWithAnswer(nodeId, answerIndex, answerText, answer, node) {
    // Add to history
    addToSurveyHistory({
        questionId: nodeId,
        question: node.question,
        answer: answerText,
        answerIndex: answerIndex
    });
    
    // Push current node to navigation stack before moving forward
    pushToNavigationStack(nodeId);
    
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
    // 3. No link at all - end survey immediately
    else {
        state.currentSurveyNodeId = null;
        showSurveyEnd();
    }
}

// Handle "Other" input text change (no longer needed for auto-check, but kept for compatibility)
export function handleOtherInput(nodeId) {
    // Input is always visible now, no need to toggle
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
            const answer = node.answers[answerIndex];
            if (answer) {
                selectedAnswers.push(answer.text);
            }
        }
    });
    
    // Check "Other" input - if has text, consider it selected
    const otherAnswer = node.answers.find(a => a.isOther);
    let otherText = '';
    if (otherAnswer) {
        const otherInput = document.getElementById(`other-input-${nodeId}`);
        otherText = otherInput ? otherInput.value.trim() : '';
        if (otherText) {
            const otherIndex = node.answers.indexOf(otherAnswer);
            if (!selectedIndices.includes(otherIndex)) {
                selectedIndices.push(otherIndex);
            }
            // Add to selectedAnswers with the text input
            const otherAnswerText = `${otherAnswer.text}: ${otherText}`;
            // Remove old "Khác" if exists (without text) and add new one (with text)
            const existingOtherIndex = selectedAnswers.findIndex(a => a === otherAnswer.text);
            if (existingOtherIndex >= 0) {
                selectedAnswers[existingOtherIndex] = otherAnswerText;
            } else {
                selectedAnswers.push(otherAnswerText);
            }
        }
    }
    
    // Check if answer has changed
    const hasChanged = detectMultipleChoiceChange(nodeId, selectedIndices, otherText);
    
    if (hasChanged) {
        // Find the history index for this nodeId to truncate from
        const historyIndex = state.surveyHistory.findIndex(entry => entry.questionId === nodeId);
        if (historyIndex >= 0) {
            truncateHistoryFromIndex(historyIndex);
        }
        // Proceed with new answer
        proceedWithMultipleChoice(nodeId, selectedIndices, selectedAnswers);
    } else {
        // No change, proceed normally
        proceedWithMultipleChoice(nodeId, selectedIndices, selectedAnswers);
    }
}

// Helper function to proceed with multiple choice answer
function proceedWithMultipleChoice(nodeId, selectedIndices, selectedAnswers) {
    const node = getNode(nodeId);
    if (!node) return;
    
    // Add to history
    addToSurveyHistory({
        questionId: nodeId,
        question: node.question,
        answer: selectedAnswers.join(', '),
        answerIndex: selectedIndices
    });
    
    // Push current node to navigation stack before moving forward
    pushToNavigationStack(nodeId);
    
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
    
    // Build a map of the last entry for each questionId to avoid duplicates
    const lastEntryMap = new Map();
    state.surveyHistory.forEach((item, index) => {
        // Keep only the last entry for each questionId
        lastEntryMap.set(item.questionId, { item, originalIndex: index });
    });
    
    // Use navigationStack to maintain correct order and get unique entries
    const uniqueEntries = [];
    const seenNodeIds = new Set();
    
    // First, add entries from navigationStack in order (these are the actual path taken)
    state.navigationStack.forEach(stackItem => {
        if (!seenNodeIds.has(stackItem.nodeId)) {
            const historyEntry = state.surveyHistory[stackItem.historyIndex];
            if (historyEntry) {
                // Check if this is an info node - skip it
                const node = getNode(historyEntry.questionId);
                if (node && !node.isInfoNode) {
                    uniqueEntries.push(historyEntry);
                    seenNodeIds.add(stackItem.nodeId);
                }
            }
        }
    });
    
    // If navigationStack is empty or incomplete, fall back to lastEntryMap
    if (uniqueEntries.length === 0) {
        lastEntryMap.forEach(({ item }) => {
            // Check if this is an info node - skip it
            const node = getNode(item.questionId);
            if (node && !node.isInfoNode) {
                uniqueEntries.push(item);
            }
        });
    }
    
    // Filter out any remaining info nodes just to be safe
    const filteredEntries = uniqueEntries.filter(item => {
        const node = getNode(item.questionId);
        return node && !node.isInfoNode;
    });
    
    const reviewHTML = filteredEntries.map((item, index) => {
        const node = getNode(item.questionId);
        const nodeIndex = node ? state.nodes.indexOf(node) + 1 : index + 1;
        
        return `
            <div class="bg-white border-2 border-gray-200 rounded-lg p-5 transition-all hover:border-teal-600 hover:shadow-md">
                <div class="flex items-center gap-2.5 mb-4 pb-2.5 border-b border-gray-200">
                    <span class="inline-flex items-center justify-center w-8 h-8 bg-teal-800 text-white rounded-full font-bold text-sm flex-shrink-0">${index + 1}</span>
                    <span class="text-xs text-gray-500 font-semibold uppercase">Câu hỏi #${nodeIndex}</span>
                </div>
                <div class="text-base font-semibold text-teal-900 mb-3 leading-relaxed whitespace-pre-wrap">${formatTextWithLineBreaks(item.question || 'Chưa có nội dung')}</div>
                <div class="text-sm text-teal-800 leading-relaxed p-3 bg-gray-50 rounded-md border-l-4 border-teal-700">
                    <strong class="text-teal-700 mr-2">Đã chọn:</strong> 
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
                <p class="text-sm text-gray-500 m-0">Tổng cộng: ${filteredEntries.length} ${filteredEntries.length === 1 ? 'câu trả lời' : 'câu trả lời'}</p>
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

// Go back to previous question
export function goBackToPreviousQuestion() {
    if (!canGoBack()) return;
    
    // Pop from navigation stack to get previous question
    const previousStackItem = popFromNavigationStack();
    if (!previousStackItem) {
        // If no stack item, go to first question
        if (state.nodes.length > 0) {
            state.currentSurveyNodeId = state.nodes[0].id;
            setPathModified(false);
            showSurveyQuestion(state.nodes[0].id);
        }
        return;
    }
    
    // Go to previous question
    state.currentSurveyNodeId = previousStackItem.nodeId;
    setPathModified(false);
    
    // Show question - restoreAnswerFromHistory will find the entry by nodeId
    showSurveyQuestion(previousStackItem.nodeId);
}

// Restore answer from history
function restoreAnswerFromHistory(nodeId) {
    // Find history entry by nodeId
    return getHistoryEntryByNodeId(nodeId);
}

// Detect if answer has changed (single choice)
function detectSingleChoiceChange(nodeId, answerIndex, otherText = '') {
    const historyEntry = restoreAnswerFromHistory(nodeId);
    if (!historyEntry) return false; // No history, not a change
    
    const node = getNode(nodeId);
    if (!node) return false;
    
    // Compare answer index
    if (historyEntry.answerIndex !== answerIndex) {
        return true;
    }
    
    // If "Other" answer, compare text
    if (answerIndex >= 0 && node.answers[answerIndex] && node.answers[answerIndex].isOther) {
        const historyText = historyEntry.answer || '';
        const currentText = otherText || '';
        // Extract text after ": " from history (format: "Khác: text")
        const historyOtherText = historyText.includes(': ') ? historyText.split(': ').slice(1).join(': ') : '';
        if (historyOtherText !== currentText) {
            return true;
        }
    }
    
    return false;
}

// Detect if answer has changed (multiple choice)
function detectMultipleChoiceChange(nodeId, selectedIndices, otherText = '') {
    const historyEntry = restoreAnswerFromHistory(nodeId);
    if (!historyEntry) return false; // No history, not a change
    
    // Compare answer indices
    const historyIndices = Array.isArray(historyEntry.answerIndex) 
        ? [...historyEntry.answerIndex].sort((a, b) => a - b)
        : [historyEntry.answerIndex];
    const currentIndices = [...selectedIndices].sort((a, b) => a - b);
    
    if (!arraysMatchExactly(historyIndices, currentIndices)) {
        return true;
    }
    
    // Check "Other" text if present
    const node = getNode(nodeId);
    if (node && otherText) {
        const otherAnswer = node.answers.find(a => a.isOther);
        if (otherAnswer && currentIndices.includes(node.answers.indexOf(otherAnswer))) {
            const historyText = historyEntry.answer || '';
            // Extract text after ": " from history
            const historyOtherText = historyText.includes(': ') 
                ? historyText.split(': ').slice(1).join(': ') 
                : '';
            if (historyOtherText !== otherText) {
                return true;
            }
        }
    }
    
    return false;
}


