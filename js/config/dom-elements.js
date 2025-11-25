// DOM element references
export const dom = {
    // Main containers
    contentPanel: document.getElementById('contentPanel'),
    questionEditor: document.getElementById('questionEditor'),
    emptyState: document.getElementById('emptyState'),
    questionsList: document.getElementById('questionsList'),
    
    // Toolbar buttons
    addQuestionBtn: document.getElementById('addQuestionBtn'),
    playBtn: document.getElementById('playBtn'),
    saveBtn: document.getElementById('saveBtn'),
    loadBtn: document.getElementById('loadBtn'),
    loadFileInput: document.getElementById('loadFileInput'),
    chartBtn: document.getElementById('chartBtn'),
    
    // Modals
    chartModal: document.getElementById('chartModal'),
    closeChartBtn: document.getElementById('closeChartBtn'),
    linkModal: document.getElementById('linkModal'),
    surveyModal: document.getElementById('surveyModal'),
    closeModal: document.querySelector('.close-modal'),
    closeSurveyBtn: document.getElementById('closeSurveyBtn'),
    
    // Modal content
    questionList: document.getElementById('questionList'),
    surveyBody: document.getElementById('surveyBody'),
    chartBody: document.getElementById('chartBody'),
    chartSvg: document.getElementById('chartSvg')
};

// Initialize DOM elements (call after DOM is ready)
export function initDOMElements() {
    // Verify all critical elements exist
    const criticalElements = [
        'contentPanel', 'questionEditor', 'emptyState', 
        'questionsList', 'addQuestionBtn', 'playBtn'
    ];
    
    const missing = criticalElements.filter(key => !dom[key]);
    if (missing.length > 0) {
        console.warn('Missing DOM elements:', missing);
    }
}

