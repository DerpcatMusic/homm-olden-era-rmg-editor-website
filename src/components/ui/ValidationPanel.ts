// Validation feedback panel
// This class displays real-time validation results and error messages

import { StateManager } from '../../store/StateManager.js';
import { EventBus } from '../../store/EventBus.js';
import { ValidationService } from '../../services/ValidationService.js';

export class ValidationPanel {
    private container: HTMLElement;
    private validationResults: any[] = [];
    private stateManager: StateManager;
    private eventBus: EventBus;
    private validationService: ValidationService;
    private unsubscribeState!: () => void;
    private unsubscribeEvents!: () => void;
    private autoValidateTimer: number | null = null;

    constructor(container: HTMLElement, stateManager: StateManager, eventBus: EventBus, validationService: ValidationService) {
        this.container = container;
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.validationService = validationService;
        this.initializePanel();
        this.setupEventSubscriptions();
        this.runValidation();
    }

    private initializePanel(): void {
        this.container.innerHTML = `
            <div class="validation-panel">
                <h3>Validation</h3>
                <div class="validation-controls">
                    <button class="validate-btn">Validate</button>
                    <button class="clear-btn">Clear</button>
                </div>
                <div class="validation-status">
                    <span class="status-indicator">Ready</span>
                </div>
                <div class="validation-results">
                    <!-- Validation messages will be displayed here -->
                </div>
            </div>
        `;
    }

    private setupEventSubscriptions(): void {
        // Subscribe to state changes for auto-validation
        this.unsubscribeState = this.stateManager.subscribe({
            onStateChange: (oldState: any, newState: any) => {
                // Auto-validate when template changes or becomes dirty
                if (oldState.currentTemplate !== newState.currentTemplate ||
                    (!oldState.hasUnsavedChanges && newState.hasUnsavedChanges)) {
                    this.scheduleAutoValidation();
                }
            }
        });

        // Subscribe to validation events
        const unsubscribeRunValidation = this.eventBus.on('validation:run', () => {
            this.runValidation();
        });

        const unsubscribeClearResults = this.eventBus.on('validation:clear', () => {
            this.clearResults();
        });

        this.unsubscribeEvents = () => {
            unsubscribeRunValidation();
            unsubscribeClearResults();
        };

        // Setup control button handlers
        this.setupControlHandlers();
    }

    private setupControlHandlers(): void {
        const validateBtn = this.container.querySelector('.validate-btn') as HTMLButtonElement;
        const clearBtn = this.container.querySelector('.clear-btn') as HTMLButtonElement;

        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
                this.runValidation();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearResults();
            });
        }
    }

    private scheduleAutoValidation(): void {
        // Debounce auto-validation to avoid excessive calls
        if (this.autoValidateTimer) {
            clearTimeout(this.autoValidateTimer);
        }

        this.autoValidateTimer = window.setTimeout(() => {
            this.runValidation();
        }, 500); // 500ms delay
    }

    private async runValidation(): Promise<void> {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) {
            this.updateValidationResults([]);
            return;
        }

        try {
            const result = await this.validationService.validateTemplate(template);
            const errors = result.errors.map(error => ({
                field: error.field,
                message: error.message,
                severity: error.severity,
                suggestion: error.suggestion
            }));

            this.updateValidationResults(errors);
            this.eventBus.emit('validation:completed', { result });
        } catch (error) {
            console.error('Validation failed:', error);
            this.updateValidationResults([{
                field: 'validation.process',
                message: `Validation process failed: ${error}`,
                severity: 'error'
            }]);
        }
    }

    public updateValidationResults(results: any[]): void {
        this.validationResults = results;
        this.displayValidationResults();
        this.updateStatusIndicator();
    }

    private displayValidationResults(): void {
        const resultsArea = this.container.querySelector('.validation-results') as HTMLElement;
        resultsArea.innerHTML = '';

        if (this.validationResults.length === 0) {
            resultsArea.innerHTML = '<p class="no-issues">No validation issues found.</p>';
            return;
        }

        const resultsList = document.createElement('ul');
        resultsList.className = 'validation-list';

        this.validationResults.forEach((result, index) => {
            const listItem = document.createElement('li');
            listItem.className = `validation-item ${result.severity}`;
            listItem.innerHTML = `
                <span class="severity-icon">${this.getSeverityIcon(result.severity)}</span>
                <div class="validation-content">
                    <span class="message">${result.message}</span>
                    <span class="field">${result.field}</span>
                    ${result.suggestion ? `<span class="suggestion">${result.suggestion}</span>` : ''}
                </div>
            `;

            // Make items clickable to focus on the field
            listItem.addEventListener('click', () => {
                this.eventBus.emit('validation:item-clicked', { result, index });
            });

            resultsList.appendChild(listItem);
        });

        resultsArea.appendChild(resultsList);
    }

    private updateStatusIndicator(): void {
        const indicator = this.container.querySelector('.status-indicator') as HTMLElement;
        const errorCount = this.validationResults.filter(r => r.severity === 'error').length;
        const warningCount = this.validationResults.filter(r => r.severity === 'warning').length;

        if (errorCount > 0) {
            indicator.textContent = `${errorCount} Error${errorCount > 1 ? 's' : ''}`;
            indicator.className = 'status-indicator error';
        } else if (warningCount > 0) {
            indicator.textContent = `${warningCount} Warning${warningCount > 1 ? 's' : ''}`;
            indicator.className = 'status-indicator warning';
        } else if (this.validationResults.length > 0) {
            indicator.textContent = 'Valid';
            indicator.className = 'status-indicator valid';
        } else {
            indicator.textContent = 'Ready';
            indicator.className = 'status-indicator ready';
        }
    }

    private getSeverityIcon(severity: string): string {
        switch (severity) {
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '•';
        }
    }

    public clearResults(): void {
        this.validationResults = [];
        this.displayValidationResults();
        this.updateStatusIndicator();
        this.eventBus.emit('validation:cleared');
    }

    public destroy(): void {
        if (this.unsubscribeState) {
            this.unsubscribeState();
        }
        if (this.unsubscribeEvents) {
            this.unsubscribeEvents();
        }
        if (this.autoValidateTimer) {
            clearTimeout(this.autoValidateTimer);
        }
    }
}