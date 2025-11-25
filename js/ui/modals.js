import { dom } from '../config/dom-elements.js';

// Modal management utilities
export function showModal(modalElement) {
    modalElement.classList.remove('hidden');
    modalElement.classList.add('flex');
}

export function hideModal(modalElement) {
    modalElement.classList.add('hidden');
    modalElement.classList.remove('flex');
}

// Initialize modal click-outside handlers
export function initModalHandlers() {
    // Link modal
    dom.linkModal.addEventListener('click', (e) => {
        if (e.target === dom.linkModal) {
            hideModal(dom.linkModal);
        }
    });
    
    // Survey modal
    dom.surveyModal.addEventListener('click', (e) => {
        if (e.target === dom.surveyModal) {
            hideModal(dom.surveyModal);
        }
    });
    
    // Chart modal
    dom.chartModal.addEventListener('click', (e) => {
        if (e.target === dom.chartModal) {
            hideModal(dom.chartModal);
        }
    });
}

