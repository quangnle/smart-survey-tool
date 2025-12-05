import { state, getNode, getNodeIndex, setSelectedNodeId, updateNode } from '../state/store.js';
import { dom } from '../config/dom-elements.js';
import { getQuestionPreview } from '../models/node.js';
import { renderAnswer } from './answer-list.js';
import { updateQuestionsList } from './sidebar.js';
import { toggleMultipleChoice, addRule, deleteRule, addAnswerToRule, removeAnswerFromRule, updateRuleLink, moveRuleUp, moveRuleDown } from '../services/rule-service.js';
import { openRuleLinkModal } from '../services/link-service.js';
import { getOtherAnswer, toggleOtherAnswer, updateOtherAnswer } from '../services/answer-service.js';
import { openLinkModal } from '../services/link-service.js';

// Render question editor
export function renderQuestionEditor(nodeId, preserveScroll = false) {
    const node = getNode(nodeId);
    if (!node) return;
    
    // Save scroll position if preserveScroll is true
    let scrollTop = 0;
    if (preserveScroll && dom.questionEditor) {
        // Find the scrollable container (the div with overflow-y-auto class)
        const scrollContainer = dom.questionEditor.querySelector('.overflow-y-auto');
        if (scrollContainer) {
            scrollTop = scrollContainer.scrollTop;
        } else {
            // Fallback: use questionEditor's scroll position if it's scrollable
            scrollTop = dom.questionEditor.scrollTop || 0;
        }
    }
    
    setSelectedNodeId(nodeId);
    const nodeIndex = getNodeIndex(nodeId);
    
    const nextQuestionPreview = node.nextQuestion 
        ? getQuestionPreview(node.nextQuestion)
        : '';
    
    dom.questionEditor.innerHTML = `
        <div class="bg-teal-700 text-white px-5 py-4 flex justify-between items-center border-b-2 border-teal-800 shadow-md">
            <div class="text-lg font-bold flex-1">${node.isInfoNode ? 'Notification' : 'Question'} #${nodeIndex + 1}</div>
        </div>
        <div class="flex-1 p-8 overflow-y-auto">
            <div class="mb-5 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <label class="flex items-center gap-2.5 cursor-pointer text-sm text-yellow-900 font-medium mb-3">
                    <input type="checkbox" class="w-[18px] h-[18px] cursor-pointer accent-yellow-500" ${node.isInfoNode ? 'checked' : ''} onchange="window.toggleNodeTypeHandler('${node.id}', this.checked)">
                    <span>This is a notification node (displays content only, no answers)</span>
                </label>
                ${node.isInfoNode ? `
                <div class="mt-3 pt-3 border-t border-yellow-300">
                    <label class="text-xs text-yellow-900 font-semibold mb-2 block">Notification Type:</label>
                    <div class="flex flex-wrap gap-2">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="infoType-${node.id}" value="normal" ${(node.infoType || 'warning') === 'normal' ? 'checked' : ''} onchange="window.updateInfoTypeHandler('${node.id}', 'normal')" class="w-4 h-4 cursor-pointer">
                            <span class="text-xs px-3 py-1.5 rounded bg-white border-2 border-gray-300 text-gray-700">Normal</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="infoType-${node.id}" value="success" ${(node.infoType || 'warning') === 'success' ? 'checked' : ''} onchange="window.updateInfoTypeHandler('${node.id}', 'success')" class="w-4 h-4 cursor-pointer">
                            <span class="text-xs px-3 py-1.5 rounded bg-teal-50 border-2 border-teal-400 text-teal-900">Success</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="infoType-${node.id}" value="warning" ${(node.infoType || 'warning') === 'warning' ? 'checked' : ''} onchange="window.updateInfoTypeHandler('${node.id}', 'warning')" class="w-4 h-4 cursor-pointer">
                            <span class="text-xs px-3 py-1.5 rounded bg-yellow-50 border-2 border-yellow-400 text-yellow-900">Warning</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="infoType-${node.id}" value="danger" ${(node.infoType || 'warning') === 'danger' ? 'checked' : ''} onchange="window.updateInfoTypeHandler('${node.id}', 'danger')" class="w-4 h-4 cursor-pointer">
                            <span class="text-xs px-3 py-1.5 rounded bg-red-50 border-2 border-red-400 text-red-900">Danger</span>
                        </label>
                    </div>
                </div>
                ` : ''}
            </div>
            ${!node.isInfoNode ? `
            <div class="mb-5 p-4 bg-blue-50 border-2 border-blue-400 rounded-lg">
                <label class="flex items-center gap-2.5 cursor-pointer text-sm text-blue-900 font-medium">
                    <input type="checkbox" class="w-[18px] h-[18px] cursor-pointer accent-blue-500" ${node.isMultipleChoice ? 'checked' : ''} onchange="window.toggleMultipleChoiceHandler('${node.id}', this.checked)">
                    <span>Allow multiple answer selection (Multiple Choice)</span>
                </label>
            </div>
            ` : ''}
            <div class="mb-8">
                <label class="text-sm font-semibold text-teal-900 mb-2.5 block">${node.isInfoNode ? 'Notification Content:' : 'Question Content:'}</label>
                <textarea class="w-full min-h-[120px] p-4 border-2 border-gray-300 rounded-lg text-[15px] font-sans resize-y transition-colors focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200 leading-relaxed" placeholder="${node.isInfoNode ? 'Enter notification content...' : 'Enter question content...'}" oninput="window.updateQuestionHandler('${node.id}', this.value)">${node.question}</textarea>
            </div>
            <div class="mt-8 p-5 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div class="flex justify-between items-center mb-2.5">
                    <label class="text-sm font-semibold text-teal-900">Default Next Question:</label>
                    <div class="flex items-center gap-2.5">
                        <button class="bg-gray-500 hover:bg-gray-600 ${node.nextQuestion ? 'bg-teal-700 hover:bg-teal-800' : ''} text-white px-4 py-2 rounded-md text-xs transition-colors flex items-center gap-1.5" 
                                onclick="window.openNextQuestionModalHandler('${node.id}')" 
                                title="Link to next question">
                            ${node.nextQuestion ? '🔗 Linked' : '🔗 Link Question'}
                        </button>
                        ${node.nextQuestion ? `
                            <span class="text-xs text-teal-700 italic max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">→ ${nextQuestionPreview}</span>
                            <button class="bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full cursor-pointer text-sm flex items-center justify-center transition-colors flex-shrink-0" onclick="window.unlinkNextQuestionHandler('${node.id}')" title="Unlink">×</button>
                        ` : ''}
                    </div>
                </div>
                <p class="text-xs text-gray-500 m-0 italic">
                    ${node.isInfoNode ? 'After displaying the notification, the survey will automatically proceed to this question' : 'If the selected answer does not link to any next question, the survey will proceed to this question'}
                </p>
            </div>
            ${!node.isInfoNode ? `
            <div class="mt-8">
                <div class="text-sm text-teal-900 mb-4 font-semibold">Answers:</div>
                <div class="answers-list" id="answers-${node.id}"></div>
                <button class="bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-md text-sm w-full mt-2.5 transition-colors font-medium" onclick="window.addAnswerHandler('${node.id}')">
                    <span>+</span> Add Answer
                </button>
            </div>
            ${!node.isInfoNode ? `
            <div class="mt-6 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                <label class="flex items-center gap-2.5 cursor-pointer text-sm text-orange-900 font-medium mb-3">
                    <input type="checkbox" class="w-[18px] h-[18px] cursor-pointer accent-orange-500" ${getOtherAnswer(node.id) ? 'checked' : ''} onchange="window.toggleOtherAnswerHandler('${node.id}', this.checked)">
                    <span>Allow "Other" answer</span>
                </label>
                ${(() => {
                    const otherAnswer = getOtherAnswer(node.id);
                    if (!otherAnswer) return '';
                    const otherIndex = node.answers.findIndex(a => a.isOther);
                    const linkedToText = otherAnswer.linkedTo ? getQuestionPreview(otherAnswer.linkedTo) : '';
                    const otherText = otherAnswer.text || 'Other';
                    const otherPlaceholder = otherAnswer.placeholder || 'other opinion';
                    const otherMaxLength = otherAnswer.maxLength || 80;
                    return `
                    <div class="mt-3 pt-3 border-t border-orange-300">
                        <div class="grid grid-cols-3 gap-3 mb-3">
                            <div>
                                <label class="text-xs text-orange-900 font-semibold mb-1.5 block">Display Label:</label>
                                <input type="text" 
                                       class="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-500" 
                                       value="${otherText.replace(/"/g, '&quot;')}"
                                       placeholder="Other"
                                       onchange="window.updateOtherAnswerHandler('${node.id}', {text: this.value})">
                            </div>
                            <div>
                                <label class="text-xs text-orange-900 font-semibold mb-1.5 block">Placeholder:</label>
                                <input type="text" 
                                       class="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-500" 
                                       value="${otherPlaceholder.replace(/"/g, '&quot;')}"
                                       placeholder="other opinion"
                                       onchange="window.updateOtherAnswerHandler('${node.id}', {placeholder: this.value})">
                            </div>
                            <div>
                                <label class="text-xs text-orange-900 font-semibold mb-1.5 block">Max Length:</label>
                                <input type="number" 
                                       class="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:border-orange-500" 
                                       value="${otherMaxLength}"
                                       min="1"
                                       max="500"
                                       onchange="window.updateOtherAnswerHandler('${node.id}', {maxLength: parseInt(this.value) || 80})">
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="bg-teal-700 hover:bg-teal-800 ${otherAnswer.linkedTo ? 'bg-teal-600' : ''} text-white px-4 py-2 rounded-md text-xs transition-colors flex items-center gap-1" 
                                    onclick="window.openLinkModalHandler('${node.id}', ${otherIndex})" 
                                    title="Link to question">
                                ${otherAnswer.linkedTo ? '🔗 Linked' : '🔗 Link Question'}
                            </button>
                            ${otherAnswer.linkedTo ? `
                            <span class="text-xs text-teal-700 italic">→ ${linkedToText.replace(/"/g, '&quot;')}</span>
                            <button class="bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full cursor-pointer text-xs flex items-center justify-center transition-colors" 
                                    onclick="window.unlinkAnswerHandler('${node.id}', ${otherIndex})" 
                                    title="Remove link">×</button>
                            ` : ''}
                        </div>
                    </div>
                    `;
                })()}
            </div>
            ` : ''}
            ${node.isMultipleChoice ? `
            <div class="mt-8 p-5 bg-purple-50 rounded-lg border-2 border-purple-200">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <div class="text-sm font-semibold text-purple-900 mb-1">Link Rules:</div>
                        <p class="text-xs text-purple-700 italic m-0">Rules are checked in order from top to bottom. The first matching rule will be used.</p>
                    </div>
                    <button class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-xs transition-colors font-medium" onclick="window.addRuleHandler('${node.id}')">
                        + Add Rule
                    </button>
                </div>
                <div class="rules-list" id="rules-${node.id}">
                    ${renderRulesList(node)}
                </div>
            </div>
            ` : ''}
            ` : ''}
        </div>
    `;
    
    // Render existing answers (excluding "Other" answer which is rendered separately)
    node.answers.forEach((answer, index) => {
        if (!answer.isOther) {
            renderAnswer(node.id, index);
        }
    });
    
    dom.questionEditor.classList.remove('hidden');
    dom.questionEditor.classList.add('flex');
    dom.emptyState.classList.add('hidden');
    
    // Restore scroll position if preserveScroll is true
    if (preserveScroll && scrollTop > 0) {
        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
            const scrollContainer = dom.questionEditor.querySelector('.overflow-y-auto');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollTop;
            } else {
                // Fallback: use questionEditor's scroll position
                dom.questionEditor.scrollTop = scrollTop;
            }
        });
    }
    
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
            titleElement.textContent = `${node.isInfoNode ? 'Notification' : 'Question'} #${nodeIndex + 1}`;
        }
    }
}

// Render rules list HTML
function renderRulesList(node) {
    if (!node.rules || node.rules.length === 0) {
        return '<p class="text-xs text-gray-500 italic text-center py-4">No rules yet. Click "Add Rule" to create a new rule.</p>';
    }
    
    // Sort rules by order
    const sortedRules = [...node.rules].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return sortedRules.map((rule, ruleIndex) => {
        const actualIndex = node.rules.indexOf(rule);
        const ruleNumber = ruleIndex + 1;
        
        // Get answer options for dropdown (include "Other" answer)
        const answerOptions = node.answers.map((answer, idx) => {
            const isSelected = rule.answerIndices.includes(idx);
            let answerText = answer.text.trim() || `Answer ${idx + 1}`;
            if (answer.isOther) {
                answerText = `${answerText} (Other)`;
            }
            return `<option value="${idx}" ${isSelected ? 'selected' : ''}>${answerText}</option>`;
        }).join('');
        
        const linkedToPreview = rule.linkedTo ? getQuestionPreview(rule.linkedTo) : '';
        
        return `
            <div class="mb-4 p-4 bg-white rounded-lg border-2 border-purple-300" data-rule-index="${actualIndex}">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xs font-semibold text-purple-900">Rule ${ruleNumber}:</span>
                    <div class="flex gap-1 ml-auto">
                        <button class="bg-gray-400 hover:bg-gray-500 text-white w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${ruleIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
                                onclick="window.moveRuleUpHandler('${node.id}', ${actualIndex})" 
                                title="Move up"
                                ${ruleIndex === 0 ? 'disabled' : ''}>↑</button>
                        <button class="bg-gray-400 hover:bg-gray-500 text-white w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${ruleIndex >= sortedRules.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                                onclick="window.moveRuleDownHandler('${node.id}', ${actualIndex})" 
                                title="Move down"
                                ${ruleIndex >= sortedRules.length - 1 ? 'disabled' : ''}>↓</button>
                        <button class="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded text-xs flex items-center justify-center transition-colors" 
                                onclick="window.deleteRuleHandler('${node.id}', ${actualIndex})" 
                                title="Delete rule">×</button>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex items-center gap-2 flex-wrap" id="rule-${node.id}-${actualIndex}-answers">
                        ${rule.answerIndices.length === 0 ? `
                        <select class="px-3 py-2 border-2 border-gray-300 rounded-md text-xs focus:outline-none focus:border-purple-600" 
                                onchange="if(this.value) window.addAnswerToRuleHandler('${node.id}', ${actualIndex}, parseInt(this.value)); this.value='';">
                            <option value="">-- Chọn câu trả lời --</option>
                            ${node.answers.map((answer, idx) => {
                                let answerText = answer.text.trim() || `Answer ${idx + 1}`;
                                if (answer.isOther) {
                                    answerText = `${answerText} (Other)`;
                                }
                                return `<option value="${idx}">${answerText}</option>`;
                            }).join('')}
                        </select>
                        ` : rule.answerIndices.map((answerIdx, arrIdx) => {
                            // Skip placeholder indices (-1)
                            if (answerIdx === -1) {
                                const availableAnswers = node.answers.map((answer, idx) => {
                                    const isSelected = rule.answerIndices.includes(idx) && idx !== -1;
                                    const text = answer.text.trim() || `Câu trả lời ${idx + 1}`;
                                    return `<option value="${idx}" ${isSelected ? 'disabled' : ''}>${text}</option>`;
                                }).join('');
                                return `
                                <div class="flex items-center gap-1">
                                    <select class="px-3 py-2 border-2 border-gray-300 rounded-md text-xs focus:outline-none focus:border-purple-600" 
                                            onchange="if(this.value) window.updateRuleAnswerByIndexHandler('${node.id}', ${actualIndex}, ${arrIdx}, parseInt(this.value))">
                                        <option value="">-- Select answer --</option>
                                        ${availableAnswers}
                                    </select>
                                    <button class="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded text-xs flex items-center justify-center transition-colors" 
                                            onclick="window.removeAnswerFromRuleByIndexHandler('${node.id}', ${actualIndex}, ${arrIdx})" 
                                            title="Delete">×</button>
                                </div>
                                `;
                            }
                            
                            const answer = node.answers[answerIdx];
                            let answerText = answer?.text.trim() || `Answer ${answerIdx + 1}`;
                            if (answer?.isOther) {
                                answerText = `${answerText} (Other)`;
                            }
                            const availableAnswers = node.answers.map((answer, idx) => {
                                const isSelected = rule.answerIndices.includes(idx) && idx !== answerIdx && idx !== -1;
                                let text = answer.text.trim() || `Answer ${idx + 1}`;
                                if (answer.isOther) {
                                    text = `${text} (Other)`;
                                }
                                return `<option value="${idx}" ${isSelected ? 'disabled' : ''} ${idx === answerIdx ? 'selected' : ''}>${text}</option>`;
                            }).join('');
                            return `
                            <div class="flex items-center gap-1">
                                <select class="px-3 py-2 border-2 border-gray-300 rounded-md text-xs focus:outline-none focus:border-purple-600" 
                                        onchange="window.updateRuleAnswerByIndexHandler('${node.id}', ${actualIndex}, ${arrIdx}, parseInt(this.value))">
                                    <option value="">-- Select --</option>
                                    ${availableAnswers}
                                </select>
                                <button class="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded text-xs flex items-center justify-center transition-colors" 
                                        onclick="window.removeAnswerFromRuleByIndexHandler('${node.id}', ${actualIndex}, ${arrIdx})" 
                                        title="Delete">×</button>
                            </div>
                            `;
                        }).join('')}
                        ${rule.answerIndices.length > 0 ? `
                        <button class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-md text-xs transition-colors flex items-center gap-1" 
                                onclick="window.addAnswerToRuleDropdownHandler('${node.id}', ${actualIndex})">
                            <span>+</span> Add
                        </button>
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-2 mt-3">
                        <button class="bg-teal-600 hover:bg-teal-700 ${rule.linkedTo ? 'bg-teal-700' : ''} text-white px-4 py-2 rounded-md text-xs transition-colors flex items-center gap-1" 
                                onclick="window.openRuleLinkModalHandler('${node.id}', ${actualIndex})" 
                                title="Link to question">
                            ${rule.linkedTo ? '🔗 Linked' : '🔗 Link Question'}
                        </button>
                        ${rule.linkedTo ? `
                            <span class="text-xs text-teal-700 italic">→ ${linkedToPreview}</span>
                            <button class="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center transition-colors" 
                                    onclick="window.updateRuleLinkHandler('${node.id}', ${actualIndex}, null)" 
                                    title="Unlink">×</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
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

