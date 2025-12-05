import { state, addNode, setSelectedNodeId, generateNodeId, updateSurveyTitle, updateSurveyDescription } from '../state/store.js';
import { createNode } from '../models/node.js';
import { renderQuestionEditor } from '../ui/question-editor.js';
import { showEmptyState } from '../ui/question-editor.js';
import { updateQuestionsList } from '../ui/sidebar.js';
import { loadSurveyMetadata } from './survey-service.js';

// Load survey data
export function loadSurveyData(surveyData) {
    // Validate data structure
    if (!surveyData.questions || !Array.isArray(surveyData.questions)) {
        alert('JSON file format is incorrect!');
        return;
    }
    
    // Confirm before loading (will overwrite current data)
    if (state.nodes.length > 0) {
        if (!confirm('Loading a new survey will replace the current survey. Are you sure you want to continue?')) {
            return;
        }
    }
    
    try {
        // Clear current nodes
        state.nodes = [];
        state.nodeIdCounter = 0;
        setSelectedNodeId(null);
        
        // Load survey metadata (title and description)
        const title = surveyData.title || '';
        const description = surveyData.description || '';
        updateSurveyTitle(title);
        updateSurveyDescription(description);
        loadSurveyMetadata(title, description);
        
        // Load chart label positions
        if (surveyData.linkLabelPositions) {
            state.linkLabelPositions = surveyData.linkLabelPositions;
        } else {
            state.linkLabelPositions = {};
        }
        
        // Restore nodes from JSON
        surveyData.questions.forEach((qData, index) => {
            // Create new node with original ID or generate new one
            const nodeId = qData.id || generateNodeId();
            const node = createNode(qData.question || '', qData.isInfoNode || false);
            node.id = nodeId;
            node.nextQuestion = qData.nextQuestion || null;
            node.infoType = qData.infoType || 'warning';
            node.isMultipleChoice = qData.isMultipleChoice || false;
            node.rules = qData.rules || [];
            
            // Restore chart position if available
            if (qData.position && qData.position.x && qData.position.y) {
                node.position = {
                    x: qData.position.x,
                    y: qData.position.y
                };
            }
            
            // Restore answers
            if (qData.answers && Array.isArray(qData.answers)) {
                qData.answers.forEach((aData) => {
                    node.answers.push({
                        text: aData.text || '',
                        linkedTo: aData.linkedTo || null,
                        isOther: aData.isOther || false,
                        placeholder: aData.placeholder || null,
                        maxLength: aData.maxLength || null
                    });
                });
            }
            
            addNode(node);
            
            // Update nodeIdCounter to avoid conflicts
            const match = nodeId.match(/node-(\d+)/);
            if (match) {
                const num = parseInt(match[1]);
                if (num >= state.nodeIdCounter) {
                    state.nodeIdCounter = num + 1;
                }
            }
        });
        
        // Restore links between answers and questions
        surveyData.questions.forEach((qData, qIndex) => {
            const node = state.nodes[qIndex];
            if (!node) return;
            
            if (qData.answers && Array.isArray(qData.answers)) {
                qData.answers.forEach((aData, aIndex) => {
                    if (aData.linkedTo && node.answers[aIndex]) {
                        // Find the target node by ID or by order
                        let targetNode = null;
                        if (aData.linkedTo) {
                            // Try to find by ID first
                            targetNode = state.nodes.find(n => n.id === aData.linkedTo);
                            
                            // If not found, try to find by linkedToQuestion text
                            if (!targetNode && aData.linkedToQuestion) {
                                targetNode = state.nodes.find(n => n.question === aData.linkedToQuestion);
                            }
                            
                            // If still not found, try by order (if linkedTo was an index)
                            if (!targetNode && !isNaN(aData.linkedTo)) {
                                const orderIndex = parseInt(aData.linkedTo) - 1;
                                if (orderIndex >= 0 && orderIndex < state.nodes.length) {
                                    targetNode = state.nodes[orderIndex];
                                }
                            }
                        }
                        
                        if (targetNode) {
                            node.answers[aIndex].linkedTo = targetNode.id;
                        }
                    }
                });
            }
            
            // Restore nextQuestion links
            if (qData.nextQuestion) {
                let targetNode = state.nodes.find(n => n.id === qData.nextQuestion);
                if (!targetNode && qData.nextQuestionText) {
                    targetNode = state.nodes.find(n => n.question === qData.nextQuestionText);
                }
                if (targetNode) {
                    node.nextQuestion = targetNode.id;
                }
            }
        });
        
        // Update UI
        showEmptyState();
        updateQuestionsList();
        
        // Select first question if available
        if (state.nodes.length > 0) {
            renderQuestionEditor(state.nodes[0].id);
        }
        
        alert(`Successfully loaded ${state.nodes.length} questions!`);
        
    } catch (error) {
        alert('Error loading survey: ' + error.message);
        console.error('Load error:', error);
    }
}

