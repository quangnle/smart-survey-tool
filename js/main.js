// Main entry point - Initialize application
import { initDOMElements, dom } from './config/dom-elements.js';
import { initModalHandlers } from './ui/modals.js';
import { createNewNode } from './services/node-service.js';
import { startSurvey, showSurveyEnd, showReviewAnswers, closeSurvey, goToNextQuestion, selectSurveyAnswer, submitMultipleChoice, handleOtherInput } from './features/survey-runner.js';
import { exportSurvey, handleFileLoad } from './services/file-service.js';
import { openChartModal, closeChartModal } from './features/chart-visualizer.js';
import { closeLinkModal, openNextQuestionModal, unlinkNextQuestion, openLinkModal, openRuleLinkModal, unlinkAnswer } from './services/link-service.js';
import { deleteNode, toggleNodeType, updateInfoType } from './services/node-service.js';
import { addAnswer, updateAnswer, deleteAnswer, toggleOtherAnswer, updateOtherAnswer } from './services/answer-service.js';
import { toggleMultipleChoice, addRule, deleteRule, addAnswerToRule, removeAnswerFromRule, updateRuleLink, moveRuleUp, moveRuleDown, updateRuleAnswerByIndex, removeAnswerFromRuleByIndex, addAnswerToRuleDropdown } from './services/rule-service.js';
import { updateQuestionContent } from './ui/question-editor.js';
import { showEmptyState } from './ui/question-editor.js';
import { updateQuestionsList } from './ui/sidebar.js';
import { initSurveyMetadata } from './services/survey-service.js';

// Initialize application
function initApp() {
    // Initialize DOM elements
    initDOMElements();
    
    // Initialize modal handlers
    initModalHandlers();
    
    // Set up event listeners
    dom.addQuestionBtn.addEventListener('click', createNewNode);
    dom.playBtn.addEventListener('click', startSurvey);
    dom.saveBtn.addEventListener('click', exportSurvey);
    dom.loadBtn.addEventListener('click', () => dom.loadFileInput.click());
    dom.loadFileInput.addEventListener('change', handleFileLoad);
    dom.chartBtn.addEventListener('click', openChartModal);
    dom.closeChartBtn.addEventListener('click', closeChartModal);
    dom.closeModal.addEventListener('click', closeLinkModal);
    dom.closeSurveyBtn.addEventListener('click', closeSurvey);
    
    // Initialize UI
    showEmptyState();
    updateQuestionsList();
    initSurveyMetadata();
    
    // Expose handlers to window for inline event handlers
    window.deleteNodeHandler = deleteNode;
    window.toggleNodeTypeHandler = toggleNodeType;
    window.updateInfoTypeHandler = updateInfoType;
    window.updateQuestionHandler = updateQuestionContent;
    window.addAnswerHandler = addAnswer;
    window.updateAnswerHandler = updateAnswer;
    window.deleteAnswerHandler = deleteAnswer;
    window.toggleOtherAnswerHandler = toggleOtherAnswer;
    window.updateOtherAnswerHandler = updateOtherAnswer;
    window.openLinkModalHandler = openLinkModal;
    window.unlinkAnswerHandler = unlinkAnswer;
    window.openNextQuestionModalHandler = openNextQuestionModal;
    window.unlinkNextQuestionHandler = unlinkNextQuestion;
    window.startSurveyHandler = startSurvey;
    window.showSurveyEndHandler = showSurveyEnd;
    window.showReviewAnswersHandler = showReviewAnswers;
    window.goToNextQuestionHandler = goToNextQuestion;
    window.selectSurveyAnswerHandler = selectSurveyAnswer;
    
    // Multiple choice and rules handlers
    window.toggleMultipleChoiceHandler = toggleMultipleChoice;
    window.addRuleHandler = addRule;
    window.deleteRuleHandler = deleteRule;
    window.addAnswerToRuleHandler = addAnswerToRule;
    window.removeAnswerFromRuleHandler = removeAnswerFromRule;
    window.updateRuleLinkHandler = updateRuleLink;
    window.moveRuleUpHandler = moveRuleUp;
    window.moveRuleDownHandler = moveRuleDown;
    window.openRuleLinkModalHandler = openRuleLinkModal;
    window.updateRuleAnswerByIndexHandler = updateRuleAnswerByIndex;
    window.removeAnswerFromRuleByIndexHandler = removeAnswerFromRuleByIndex;
    window.addAnswerToRuleDropdownHandler = addAnswerToRuleDropdown;
    window.submitMultipleChoiceHandler = submitMultipleChoice;
    window.handleOtherInputHandler = handleOtherInput;
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

