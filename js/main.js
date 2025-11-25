// Main entry point - Initialize application
import { initDOMElements, dom } from './config/dom-elements.js';
import { initModalHandlers } from './ui/modals.js';
import { createNewNode } from './services/node-service.js';
import { startSurvey, showSurveyEnd, showReviewAnswers, closeSurvey, goToNextQuestion, selectSurveyAnswer } from './features/survey-runner.js';
import { exportSurvey, handleFileLoad } from './services/file-service.js';
import { openChartModal, closeChartModal } from './features/chart-visualizer.js';
import { closeLinkModal, openNextQuestionModal, unlinkNextQuestion, openLinkModal } from './services/link-service.js';
import { deleteNode, toggleNodeType } from './services/node-service.js';
import { addAnswer, updateAnswer, deleteAnswer } from './services/answer-service.js';
import { updateQuestionContent } from './ui/question-editor.js';
import { showEmptyState } from './ui/question-editor.js';
import { updateQuestionsList } from './ui/sidebar.js';

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
    
    // Expose handlers to window for inline event handlers
    window.deleteNodeHandler = deleteNode;
    window.toggleNodeTypeHandler = toggleNodeType;
    window.updateQuestionHandler = updateQuestionContent;
    window.addAnswerHandler = addAnswer;
    window.updateAnswerHandler = updateAnswer;
    window.deleteAnswerHandler = deleteAnswer;
    window.openLinkModalHandler = openLinkModal;
    window.openNextQuestionModalHandler = openNextQuestionModal;
    window.unlinkNextQuestionHandler = unlinkNextQuestion;
    window.startSurveyHandler = startSurvey;
    window.showSurveyEndHandler = showSurveyEnd;
    window.showReviewAnswersHandler = showReviewAnswers;
    window.goToNextQuestionHandler = goToNextQuestion;
    window.selectSurveyAnswerHandler = selectSurveyAnswer;
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

