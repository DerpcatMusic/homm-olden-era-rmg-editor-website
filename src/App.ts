// Main application class for the RMG Editor
// This class coordinates all services, manages UI components, and handles application lifecycle

import { EventBus } from './store/EventBus';
import { StateManager } from './store/StateManager';
import { HistoryManager } from './store/HistoryManager';
import { FileService } from './services/FileService';
import { ExportService } from './services/ExportService';
import { GameDataService } from './services/GameDataService';
import { ValidationService } from './services/ValidationService';
import { CanvasEditor } from './components/core/CanvasEditor';
import { ZoneManager } from './components/core/ZoneManager';
import { ConnectionEditor } from './components/core/ConnectionEditor';
import { ZoneEditor } from './components/core/ZoneEditor';
import { Sidebar } from './components/ui/Sidebar';
import { PropertyPanel } from './components/ui/PropertyPanel';
import { ValidationPanel } from './components/ui/ValidationPanel';
import { RMGTemplate } from './models/rmg';
import { Orientation, Border, RiverSettings } from './models/types';
import { ErrorBoundary, PerformanceMonitor, MemoryMonitor, debounce } from './utils/validation';

export class App {
    // Core services
    private eventBus: EventBus;
    private stateManager: StateManager;
    private historyManager: HistoryManager;

    // Business services
    private fileService: FileService;
    private exportService: ExportService;
    private gameDataService: GameDataService;
    private validationService: ValidationService;

    // UI components
    private canvasEditor: CanvasEditor | null = null;
    private zoneManager: ZoneManager;
    private connectionEditor: ConnectionEditor;
    private zoneEditor: ZoneEditor;
    private sidebar: Sidebar | null = null;
    private propertyPanel: PropertyPanel | null = null;
    private validationPanel: ValidationPanel | null = null;

    // Application state
    private isInitialized: boolean = false;
    private isRunning: boolean = false;

    constructor() {
        // Initialize core services
        this.eventBus = new EventBus();
        this.stateManager = new StateManager({
            currentTemplate: undefined,
            hasUnsavedChanges: false
        });
        this.historyManager = new HistoryManager();

        // Initialize business services
        this.fileService = new FileService();
        this.exportService = new ExportService();
        this.gameDataService = new GameDataService();
        this.validationService = new ValidationService();

        // Initialize UI components
        this.zoneManager = new ZoneManager();
        this.connectionEditor = new ConnectionEditor(this.eventBus, this.stateManager);
        this.zoneEditor = new ZoneEditor(this.eventBus, this.stateManager);

        // Setup error boundary and performance monitoring
        this.setupErrorBoundary();
        this.setupPerformanceMonitoring();

        // Setup event handlers
        this.setupEventHandlers();
    }

    /**
     * Initialize the application and all its services
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing RMG Editor application...');


            // Initialize game data service first (required for other services)
            console.log('Loading game data...');
            await this.gameDataService.loadGameData();
            console.log('Game data loaded successfully');

            // Initialize canvas editor if we have a canvas element
            console.log('Initializing canvas editor...');
            const canvas = document.getElementById('rmg-canvas') as HTMLCanvasElement;
            if (canvas) {
                this.canvasEditor = new CanvasEditor(canvas, this.eventBus, this.stateManager);
                console.log('Canvas editor initialized');
            } else {
                console.warn('Canvas element not found');
            }

            // Initialize UI panels
            console.log('Initializing UI panels...');
            const sidebarElement = document.getElementById('rmg-sidebar');
            if (sidebarElement) {
                console.log('Creating sidebar...');
                this.sidebar = new Sidebar(sidebarElement, this.stateManager, this.eventBus);
                console.log('Sidebar created');
            } else {
                console.warn('Sidebar element not found');
            }

            const propertyPanelElement = document.getElementById('rmg-property-panel');
            if (propertyPanelElement) {
                console.log('Creating property panel...');
                this.propertyPanel = new PropertyPanel(propertyPanelElement, this.stateManager, this.eventBus);
                console.log('Property panel created');
            } else {
                console.warn('Property panel element not found');
            }

            const validationPanelElement = document.getElementById('rmg-validation-panel');
            if (validationPanelElement) {
                console.log('Creating validation panel...');
                this.validationPanel = new ValidationPanel(validationPanelElement, this.stateManager, this.eventBus, this.validationService);
                console.log('Validation panel created');
            } else {
                console.warn('Validation panel element not found');
            }

            // Setup state change observers
            this.setupStateObservers();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Setup error handling
            this.setupGlobalErrorHandling();

            this.isInitialized = true;
            console.log('RMG Editor application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showErrorScreen(error);
            throw error;
        }
    }

    /**
     * Start the application and begin the main event loop
     */
    public async start(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('Application must be initialized before starting');
        }

        if (this.isRunning) {
            return;
        }

        try {
            console.log('Starting RMG Editor application...');

            // Start any background services or timers
            this.startBackgroundServices();

            // Render initial UI state
            this.render();

            this.isRunning = true;
            console.log('RMG Editor application started successfully');

        } catch (error) {
            console.error('Failed to start application:', error);
            throw error;
        }
    }

    /**
     * Stop the application and cleanup resources
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        try {
            console.log('Stopping RMG Editor application...');

            // Stop background services
            this.stopBackgroundServices();

            // Save any pending changes
            await this.savePendingChanges();

            // Cleanup UI components
            if (this.sidebar) {
                this.sidebar.destroy();
            }
            if (this.propertyPanel) {
                this.propertyPanel.destroy();
            }
            if (this.validationPanel) {
                this.validationPanel.destroy();
            }

            // Clear event listeners
            this.eventBus.clear();

            this.isRunning = false;
            console.log('RMG Editor application stopped successfully');

        } catch (error) {
            console.error('Error stopping application:', error);
            throw error;
        }
    }

    /**
     * Load an RMG template from file
     */
    public async loadTemplate(): Promise<void> {
        try {
            const template = await this.fileService.loadRMGFile();
            if (template) {
                // Validate the template
                const validationResult = await this.validationService.validateTemplate(template);
                if (!validationResult.isValid) {
                    console.warn('Template validation warnings:', validationResult.errors);
                    // Show validation warnings to user
                    this.showValidationWarnings(validationResult.errors);
                }

                // Update state
                this.stateManager.setCurrentTemplate(template);
                this.historyManager.pushState(this.stateManager.getState());

                // Emit event
                this.eventBus.emit('template:loaded', template);

                this.showUserFeedback(`Template "${template.name || 'Unknown'}" loaded successfully`, 'success');
                console.log('Template loaded successfully');
            }
        } catch (error) {
            console.error('Failed to load template:', error);
            this.showUserFeedback(`Failed to load template: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            throw error;
        }
    }

    /**
     * Save the current template to file
     */
    public async saveTemplate(filename?: string): Promise<void> {
        try {
            const template = this.stateManager.getCurrentTemplate();
            if (!template) {
                throw new Error('No template to save');
            }

            const saveFilename = filename || `${template.name || 'untitled'}.rmg.json`;
            await this.fileService.saveRMGFile(template, saveFilename);

            // Mark as clean
            this.stateManager.markClean();

            // Emit event
            this.eventBus.emit('template:saved', { template, filename: saveFilename });

            this.showUserFeedback(`Template saved as "${saveFilename}"`, 'success');
            console.log('Template saved successfully');
        } catch (error) {
            console.error('Failed to save template:', error);
            this.showUserFeedback(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            throw error;
        }
    }

    /**
     * Export the current template
     */
    public async exportTemplate(filename?: string): Promise<void> {
        try {
            const template = this.stateManager.getCurrentTemplate();
            if (!template) {
                throw new Error('No template to export');
            }

            const exportFilename = filename || `${template.name || 'untitled'}`;
            await this.exportService.exportTemplate(template, exportFilename);

            this.showUserFeedback(`Template exported as "${exportFilename}"`, 'success');
            console.log('Template exported successfully');
        } catch (error) {
            console.error('Failed to export template:', error);
            this.showUserFeedback(`Failed to export template: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            throw error;
        }
    }

    /**
     * Create a new empty template
     */
    public createNewTemplate(): void {
        const newTemplate: RMGTemplate = {
            name: 'New Template',
            description: '',
            gameMode: 'Classic',
            sizeX: 128,
            sizeZ: 128,
            gameRules: { heroHireBan: false },
            globalBans: {
                magics: [],
                items: [],
                skills: [],
                heroes: [],
                units: []
            },
            valueOverrides: [],
            variants: [{
                orientation: new Orientation(),
                border: new Border(),
                river: new RiverSettings(),
                zones: [],
                connections: []
            }],
            zoneLayouts: [],
            mandatoryContent: [],
            contentCountLimits: [],
            contentPools: [],
            contentLists: []
        };

        this.stateManager.setCurrentTemplate(newTemplate);
        this.historyManager.pushState(this.stateManager.getState());
        this.stateManager.markDirty();

        this.eventBus.emit('template:created', newTemplate);
    }

    /**
     * Undo the last action
     */
    public undo(): void {
        const previousState = this.historyManager.undo();
        if (previousState) {
            this.stateManager.updateState(previousState);
            this.eventBus.emit('action:undone', previousState);
        }
    }

    /**
     * Redo the last undone action
     */
    public redo(): void {
        const nextState = this.historyManager.redo();
        if (nextState) {
            this.stateManager.updateState(nextState);
            this.eventBus.emit('action:redone', nextState);
        }
    }

    /**
     * Get the current application state
     */
    public getState() {
        return this.stateManager.getState();
    }

    /**
     * Check if there are unsaved changes
     */
    public hasUnsavedChanges(): boolean {
        return this.stateManager.isDirty();
    }

    // UI Feedback and Error Handling Methods


    private showErrorScreen(error: any): void {
        const errorScreen = document.getElementById('error-screen');
        const errorMessage = document.getElementById('error-message');
        const retryButton = document.getElementById('retry-button');

        if (errorScreen && errorMessage) {
            errorScreen.classList.remove('hidden');
            errorMessage.textContent = error instanceof Error ? error.message : 'An unexpected error occurred';

            if (retryButton) {
                retryButton.onclick = () => {
                    errorScreen.classList.add('hidden');
                    this.initialize();
                };
            }
        }
    }

    private setupGlobalErrorHandling(): void {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showErrorScreen(event.reason);
            event.preventDefault();
        });

        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            this.showErrorScreen(event.error);
            event.preventDefault();
        });

        // Handle file service feedback
        window.addEventListener('file-service-feedback', (event: any) => {
            this.showUserFeedback(event.detail.message, event.detail.type);
        });
    }

    private showUserFeedback(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
        // Create or update notification element
        let notification = document.getElementById('app-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'app-notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }

        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification) {
                notification.style.display = 'none';
            }
        }, 5000);
    }

    private showValidationWarnings(errors: any[]): void {
        // Show validation panel with warnings
        const validationPanel = document.getElementById('rmg-validation-panel');
        if (validationPanel) {
            validationPanel.classList.remove('hidden');
            // The validation panel component will handle displaying the errors
            this.eventBus.emit('validation:results-updated', { errors });
        }

        // Also show a notification
        const warningCount = errors.filter(e => e.severity === 'warning').length;
        const errorCount = errors.filter(e => e.severity === 'error').length;

        if (errorCount > 0) {
            this.showUserFeedback(`Template has ${errorCount} error(s) and ${warningCount} warning(s)`, 'warning');
        } else if (warningCount > 0) {
            this.showUserFeedback(`Template has ${warningCount} warning(s)`, 'warning');
        }
    }

    private setupErrorBoundary(): void {
        const errorBoundary = ErrorBoundary.getInstance();
        errorBoundary.addErrorHandler((error, context) => {
            console.error('Application error boundary:', error, context);
            this.showUserFeedback(`Application error: ${error.message}`, 'error');
        });
    }

    private setupPerformanceMonitoring(): void {
        const perfMonitor = PerformanceMonitor.getInstance();
        const memoryMonitor = MemoryMonitor.getInstance();

        // Monitor memory usage periodically
        setInterval(() => {
            memoryMonitor.recordMemoryUsage();
            const memoryUsage = memoryMonitor.getCurrentMemoryUsage();
            const memoryElement = document.getElementById('memory-usage');
            if (memoryElement) {
                memoryElement.textContent = `Memory: ${memoryUsage} MB`;
            }
        }, 5000);

        // Debounce frequent operations
        this.debouncedRender = debounce(this.render.bind(this), 100);
        this.debouncedValidation = debounce(this.validateCurrentTemplate.bind(this), 500);
    }

    private debouncedRender!: () => void;
    private debouncedValidation!: () => void;

    private validateCurrentTemplate(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (template) {
            const perfEnd = PerformanceMonitor.getInstance().startMeasurement('template-validation');
            this.validationService.validateTemplate(template).then(result => {
                perfEnd();
                if (!result.isValid || (result.warningsCount && result.warningsCount > 0)) {
                    this.showValidationWarnings(result.errors);
                }
            }).catch(error => {
                console.error('Validation error:', error);
            });
        }
    }

    // Private methods

    private setupEventHandlers(): void {
        // Template events
        this.eventBus.on('template:loaded', (template) => {
            this.onTemplateLoaded(template);
        });

        this.eventBus.on('template:saved', (data) => {
            this.onTemplateSaved(data);
        });

        // UI events
        this.eventBus.on('ui:render', () => {
            this.debouncedRender();
        });

        // Sidebar events
        this.eventBus.on('zone:add', () => {
            this.handleAddZone();
        });

        this.eventBus.on('connection:add', () => {
            this.handleAddConnection();
        });

        this.eventBus.on('content:manage', () => {
            this.handleManageContent();
        });

        // Property panel events
        this.eventBus.on('zone:updated', (data) => {
            this.handleZoneUpdated(data);
        });

        this.eventBus.on('connection:updated', (data) => {
            this.handleConnectionUpdated(data);
        });

        // Validation events
        this.eventBus.on('validation:item-clicked', (data) => {
            this.handleValidationItemClicked(data);
        });

        // Error events
        this.eventBus.on('error', (error) => {
            this.handleError(error);
        });
    }

    private setupStateObservers(): void {
        this.stateManager.subscribe({
            onStateChange: (oldState, newState) => {
                this.onStateChanged(oldState, newState);
            }
        });
    }

    private setupKeyboardShortcuts(): void {
        if (typeof document === 'undefined') return;

        document.addEventListener('keydown', (event) => {
            // Ctrl+Z - Undo
            if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                this.undo();
            }

            // Ctrl+Y or Ctrl+Shift+Z - Redo
            if (event.ctrlKey && (event.key === 'y' || (event.shiftKey && event.key === 'Z'))) {
                event.preventDefault();
                this.redo();
            }

            // Ctrl+S - Save
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                this.saveTemplate();
            }

            // Ctrl+O - Open
            if (event.ctrlKey && event.key === 'o') {
                event.preventDefault();
                this.loadTemplate();
            }

            // Ctrl+N - New
            if (event.ctrlKey && event.key === 'n') {
                event.preventDefault();
                this.createNewTemplate();
            }
        });
    }

    private startBackgroundServices(): void {
        // TODO: Start any background services like auto-save timers
    }

    private stopBackgroundServices(): void {
        // TODO: Stop background services
    }

    private async savePendingChanges(): Promise<void> {
        if (this.hasUnsavedChanges()) {
            // TODO: Prompt user to save changes
            console.warn('Unsaved changes detected');
        }
    }

    private render(): void {
        // Use debounced render for performance
        if (this.debouncedRender) {
            this.debouncedRender();
        } else {
            this.doRender();
        }
    }

    private doRender(): void {
        const perfEnd = PerformanceMonitor.getInstance().startMeasurement('render');

        try {
            // Render the UI components
            if (this.canvasEditor) {
                this.canvasEditor.render();
            }

            // Update UI state indicators
            this.updateUIState();

            // UI panels are reactive and update automatically via state changes
        } finally {
            perfEnd();
        }
    }

    private updateUIState(): void {
        // Update file name display
        const template = this.stateManager.getCurrentTemplate();
        const fileNameElement = document.getElementById('current-file-name');
        const unsavedIndicator = document.getElementById('unsaved-indicator');

        if (fileNameElement) {
            fileNameElement.textContent = template?.name || 'No file loaded';
        }

        if (unsavedIndicator) {
            if (this.stateManager.isDirty()) {
                unsavedIndicator.classList.remove('hidden');
            } else {
                unsavedIndicator.classList.add('hidden');
            }
        }

        // Update template stats
        const templateStats = document.getElementById('template-stats');
        if (templateStats && template?.variants?.[0]) {
            const variant = template.variants[0];
            const zoneCount = variant.zones?.length || 0;
            const connectionCount = variant.connections?.length || 0;
            templateStats.textContent = `Zones: ${zoneCount} | Connections: ${connectionCount}`;
        }
    }

    private onTemplateLoaded(template: RMGTemplate): void {
        console.log('Template loaded:', template.name);
        this.render();
    }

    private onTemplateSaved(data: { template: RMGTemplate; filename: string }): void {
        console.log('Template saved:', data.filename);
    }

    private onStateChanged(oldState: any, newState: any): void {
        // Handle state changes and update UI accordingly
        this.debouncedRender();

        // Trigger validation when template changes
        if (oldState.currentTemplate !== newState.currentTemplate) {
            this.debouncedValidation();
        }
    }

    private handleError(error: any): void {
        console.error('Application error:', error);
        this.showUserFeedback(`Application error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }

    // Event handler methods for UI interactions

    private handleAddZone(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template?.variants?.[0]) {
            console.warn('No template or variant available to add zone');
            return;
        }

        const variant = template.variants[0];
        if (!variant.zones) {
            variant.zones = [];
        }

        // Create a new zone with default values
        const newZone = {
            name: `Zone ${variant.zones.length + 1}`,
            size: 1.0,
            guardedContentValue: 0,
            unguardedContentValue: 0,
            guardMultiplier: 1.0,
            crossroadsPosition: -1
        };

        variant.zones.push(newZone);
        this.stateManager.markDirty();
        this.eventBus.emit('zone:added', { zoneIndex: variant.zones.length - 1 });
        console.log('Zone added:', newZone.name);
    }

    private handleAddConnection(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template?.variants?.[0]) {
            console.warn('No template or variant available to add connection');
            return;
        }

        const variant = template.variants[0];
        if (!variant.connections) {
            variant.connections = [];
        }

        // Create a new connection with default values
        const newConnection = {
            name: `Connection ${variant.connections.length + 1}`,
            from: '',
            to: '',
            guardValue: 0
        };

        variant.connections.push(newConnection);
        this.stateManager.markDirty();
        this.eventBus.emit('connection:added', { connectionIndex: variant.connections.length - 1 });
        console.log('Connection added:', newConnection.name);
    }

    private handleManageContent(): void {
        // TODO: Open content management dialog
        console.log('Content management requested');
        this.eventBus.emit('content:management-opened');
    }

    private handleZoneUpdated(data: any): void {
        console.log('Zone updated:', data);
        // Additional logic for zone updates can be added here
    }

    private handleConnectionUpdated(data: any): void {
        console.log('Connection updated:', data);
        // Additional logic for connection updates can be added here
    }

    private handleValidationItemClicked(data: any): void {
        const { result } = data;
        console.log('Validation item clicked:', result);

        // Focus on the field that has the validation error
        // TODO: Implement field focusing logic based on result.field
        this.eventBus.emit('validation:focus-field', { field: result.field });
    }
}