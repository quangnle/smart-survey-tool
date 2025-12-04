import { updateSurveyTitle, updateSurveyDescription, getSurveyTitle, getSurveyDescription } from '../state/store.js';
import { dom } from '../config/dom-elements.js';

// Update survey title
export function handleSurveyTitleChange(event) {
    const title = event.target.value || '';
    updateSurveyTitle(title);
    updateSurveyInfoDisplay();
}

// Update survey description
export function handleSurveyDescriptionChange(event) {
    const description = event.target.value || '';
    updateSurveyDescription(description);
}

// Update the collapsed title display
export function updateSurveyInfoDisplay() {
    const titleDisplay = document.getElementById('surveyInfoTitleDisplay');
    if (titleDisplay) {
        const title = getSurveyTitle();
        titleDisplay.textContent = title.trim() || 'Chưa có tiêu đề';
    }
}

// Toggle survey info section
export function toggleSurveyInfo() {
    const form = document.getElementById('surveyInfoForm');
    const icon = document.getElementById('surveyInfoToggleIcon');
    
    if (form && icon) {
        const isExpanded = !form.classList.contains('hidden');
        
        if (isExpanded) {
            // Collapse
            form.classList.add('hidden');
            icon.textContent = '▶';
        } else {
            // Expand
            form.classList.remove('hidden');
            icon.textContent = '▼';
        }
    }
}

// Initialize survey metadata inputs
export function initSurveyMetadata() {
    if (dom.surveyTitleInput) {
        dom.surveyTitleInput.value = getSurveyTitle();
        dom.surveyTitleInput.addEventListener('input', handleSurveyTitleChange);
    }
    
    if (dom.surveyDescriptionInput) {
        dom.surveyDescriptionInput.value = getSurveyDescription();
        dom.surveyDescriptionInput.addEventListener('input', handleSurveyDescriptionChange);
    }
    
    // Initialize toggle button and header
    const toggleBtn = document.getElementById('surveyInfoToggleBtn');
    const header = document.getElementById('surveyInfoHeader');
    
    if (header) {
        header.addEventListener('click', (e) => {
            // Toggle when clicking anywhere on header
            toggleSurveyInfo();
        });
    }
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            // Prevent event bubbling to header
            e.stopPropagation();
            toggleSurveyInfo();
        });
    }
    
    // Initialize display
    updateSurveyInfoDisplay();
}

// Load survey metadata to inputs
export function loadSurveyMetadata(title, description) {
    if (dom.surveyTitleInput) {
        dom.surveyTitleInput.value = title || '';
    }
    
    if (dom.surveyDescriptionInput) {
        dom.surveyDescriptionInput.value = description || '';
    }
    
    // Update display
    updateSurveyInfoDisplay();
}

