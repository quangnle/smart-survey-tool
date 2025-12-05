import { state } from '../state/store.js';
import { loadSurveyData } from './file-service-loader.js';

// Export survey to JSON file
export function exportSurvey() {
    if (state.nodes.length === 0) {
        alert('No survey data to save!');
        return;
    }
    
    // Prepare survey data
    const surveyData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        title: state.surveyTitle || '',
        description: state.surveyDescription || '',
        linkLabelPositions: state.linkLabelPositions || {}, // Save chart label positions
        questions: state.nodes.map((node, index) => ({
            id: node.id,
            order: index + 1,
            question: node.question,
            isInfoNode: node.isInfoNode || false,
            infoType: node.infoType || 'warning',
            isMultipleChoice: node.isMultipleChoice || false,
            nextQuestion: node.nextQuestion || null,
            nextQuestionText: node.nextQuestion ? state.nodes.find(n => n.id === node.nextQuestion)?.question || null : null,
            rules: node.rules || [],
            position: node.position || null, // Save chart position
            answers: node.answers.map((answer, answerIndex) => ({
                id: `answer-${node.id}-${answerIndex}`,
                text: answer.text,
                linkedTo: answer.linkedTo || null,
                linkedToQuestion: answer.linkedTo ? state.nodes.find(n => n.id === answer.linkedTo)?.question || null : null,
                isOther: answer.isOther || false,
                placeholder: answer.placeholder || null,
                maxLength: answer.maxLength || null
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
    alert('Survey saved successfully!');
}

// Handle file load
export function handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        alert('Please select a JSON file!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            loadSurveyData(jsonData);
        } catch (error) {
            alert('Error reading JSON file: ' + error.message);
            console.error('Parse error:', error);
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file!');
    };
    
    reader.readAsText(file);
    
    // Reset input để có thể chọn lại cùng file
    event.target.value = '';
}

