// Navigation sidebar component
// This class manages the main navigation tabs and panels

import { StateManager } from '../../store/StateManager';
import { EventBus } from '../../store/EventBus';

export class Sidebar {
    private container: HTMLElement;
    private activeTab: string = 'general';
    private stateManager: StateManager;
    private eventBus: EventBus;
    private unsubscribeState!: () => void;

    constructor(container: HTMLElement, stateManager: StateManager, eventBus: EventBus) {
        this.container = container;
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.initializeSidebar();
        this.setupEventHandlers();
        this.setupStateSubscription();
        this.loadTabContent(this.activeTab);
    }

    private initializeSidebar(): void {
        this.container.innerHTML = `
            <div class="sidebar-tabs">
                <button class="tab-button active" data-tab="general">General</button>
                <button class="tab-button" data-tab="zones">Zones</button>
                <button class="tab-button" data-tab="connections">Connections</button>
                <button class="tab-button" data-tab="content">Content</button>
                <button class="tab-button" data-tab="validation">Validation</button>
            </div>
            <div class="sidebar-content">
                <!-- Tab content will be dynamically loaded -->
            </div>
        `;
    }

    private setupEventHandlers(): void {
        const tabs = this.container.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const tabName = target.dataset.tab!;
                this.switchTab(tabName);
            });
        });
    }

    private setupStateSubscription(): void {
        // Subscribe to state changes to update content when template changes
        this.unsubscribeState = this.stateManager.subscribe({
            onStateChange: (oldState: any, newState: any) => {
                if (oldState.currentTemplate !== newState.currentTemplate) {
                    this.loadTabContent(this.activeTab);
                }
            }
        });
    }

    private switchTab(tabName: string): void {
        this.activeTab = tabName;

        // Update tab button states
        const tabs = this.container.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });

        // Emit tab change event
        this.eventBus.emit('sidebar:tab-changed', { tab: tabName });

        // Load tab content
        this.loadTabContent(tabName);
    }

    private loadTabContent(tabName: string): void {
        const contentArea = this.container.querySelector('.sidebar-content') as HTMLElement;
        const template = this.stateManager.getCurrentTemplate();

        switch (tabName) {
            case 'general':
                contentArea.innerHTML = this.renderGeneralTab(template);
                break;
            case 'zones':
                contentArea.innerHTML = this.renderZonesTab(template);
                break;
            case 'connections':
                contentArea.innerHTML = this.renderConnectionsTab(template);
                break;
            case 'content':
                contentArea.innerHTML = this.renderContentTab(template);
                break;
            case 'validation':
                contentArea.innerHTML = this.renderValidationTab();
                break;
            default:
                contentArea.innerHTML = `<div class="tab-content">Unknown tab: ${tabName}</div>`;
        }

        // Setup event handlers for the new content
        this.setupTabEventHandlers(tabName);
    }

    private renderGeneralTab(template: any): string {
        if (!template) {
            return '<div class="tab-content"><p>No template loaded</p></div>';
        }

        return `
            <div class="tab-content">
                <h3>General Settings</h3>
                <div class="form-group">
                    <label for="map-name">Map Name:</label>
                    <input type="text" id="map-name" value="${template.name || ''}" />
                </div>
                <div class="form-group">
                    <label for="map-width">Width:</label>
                    <input type="number" id="map-width" value="${template.sizeX || 36}" min="32" max="512" />
                </div>
                <div class="form-group">
                    <label for="map-height">Height:</label>
                    <input type="number" id="map-height" value="${template.sizeZ || 36}" min="32" max="512" />
                </div>
                <div class="form-group">
                    <label for="variant-count">Variants:</label>
                    <span>${template.variants?.length || 0}</span>
                </div>
            </div>
        `;
    }

    private renderZonesTab(template: any): string {
        if (!template?.variants?.length) {
            return '<div class="tab-content"><p>No variants available</p></div>';
        }

        const zones = template.variants[0].zones || [];
        const zoneList = zones.map((zone: any, index: number) => `
            <div class="zone-item" data-zone-index="${index}">
                <span class="zone-name">${zone.name || `Zone ${index + 1}`}</span>
                <span class="zone-size">Size: ${zone.size || 1}</span>
            </div>
        `).join('');

        return `
            <div class="tab-content">
                <h3>Zones</h3>
                <div class="zones-list">
                    ${zoneList || '<p>No zones defined</p>'}
                </div>
                <button class="add-zone-btn">Add Zone</button>
            </div>
        `;
    }

    private renderConnectionsTab(template: any): string {
        if (!template?.variants?.length) {
            return '<div class="tab-content"><p>No variants available</p></div>';
        }

        const connections = template.variants[0].connections || [];
        const connectionList = connections.map((conn: any, index: number) => `
            <div class="connection-item" data-connection-index="${index}">
                <span class="connection-name">${conn.name || `Connection ${index + 1}`}</span>
                <span class="connection-route">${conn.from || '?'} → ${conn.to || '?'}</span>
            </div>
        `).join('');

        return `
            <div class="tab-content">
                <h3>Connections</h3>
                <div class="connections-list">
                    ${connectionList || '<p>No connections defined</p>'}
                </div>
                <button class="add-connection-btn">Add Connection</button>
            </div>
        `;
    }

    private renderContentTab(template: any): string {
        const contentPools = template?.contentPools?.length || 0;
        const contentLists = template?.contentLists?.length || 0;
        const mandatoryContent = template?.mandatoryContent?.length || 0;

        return `
            <div class="tab-content">
                <h3>Content Configuration</h3>
                <div class="content-summary">
                    <div class="summary-item">
                        <span class="label">Content Pools:</span>
                        <span class="value">${contentPools}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Content Lists:</span>
                        <span class="value">${contentLists}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Mandatory Content:</span>
                        <span class="value">${mandatoryContent}</span>
                    </div>
                </div>
                <button class="manage-content-btn">Manage Content</button>
            </div>
        `;
    }

    private renderValidationTab(): string {
        return `
            <div class="tab-content">
                <h3>Validation</h3>
                <p>Validation results are shown in the Validation Panel.</p>
                <button class="run-validation-btn">Run Validation</button>
            </div>
        `;
    }

    private setupTabEventHandlers(tabName: string): void {
        switch (tabName) {
            case 'general':
                this.setupGeneralTabHandlers();
                break;
            case 'zones':
                this.setupZonesTabHandlers();
                break;
            case 'connections':
                this.setupConnectionsTabHandlers();
                break;
            case 'content':
                this.setupContentTabHandlers();
                break;
            case 'validation':
                this.setupValidationTabHandlers();
                break;
        }
    }

    private setupGeneralTabHandlers(): void {
        const nameInput = this.container.querySelector('#map-name') as HTMLInputElement;
        const widthInput = this.container.querySelector('#map-width') as HTMLInputElement;
        const heightInput = this.container.querySelector('#map-height') as HTMLInputElement;

        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                const template = this.stateManager.getCurrentTemplate();
                if (template) {
                    template.name = (e.target as HTMLInputElement).value;
                    this.stateManager.markDirty();
                    this.eventBus.emit('template:updated', { field: 'name' });
                }
            });
        }

        if (widthInput) {
            widthInput.addEventListener('input', (e) => {
                const template = this.stateManager.getCurrentTemplate();
                if (template) {
                    template.sizeX = parseInt((e.target as HTMLInputElement).value);
                    this.stateManager.markDirty();
                    this.eventBus.emit('template:updated', { field: 'sizeX' });
                }
            });
        }

        if (heightInput) {
            heightInput.addEventListener('input', (e) => {
                const template = this.stateManager.getCurrentTemplate();
                if (template) {
                    template.sizeZ = parseInt((e.target as HTMLInputElement).value);
                    this.stateManager.markDirty();
                    this.eventBus.emit('template:updated', { field: 'sizeZ' });
                }
            });
        }
    }

    private setupZonesTabHandlers(): void {
        const zoneItems = this.container.querySelectorAll('.zone-item');
        zoneItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt((e.currentTarget as HTMLElement).dataset.zoneIndex!);
                this.eventBus.emit('zone:selected', { zoneIndex: index });
            });
        });

        const addZoneBtn = this.container.querySelector('.add-zone-btn') as HTMLButtonElement;
        if (addZoneBtn) {
            addZoneBtn.addEventListener('click', () => {
                this.eventBus.emit('zone:add');
            });
        }
    }

    private setupConnectionsTabHandlers(): void {
        const connectionItems = this.container.querySelectorAll('.connection-item');
        connectionItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt((e.currentTarget as HTMLElement).dataset.connectionIndex!);
                this.eventBus.emit('connection:selected', { connectionIndex: index });
            });
        });

        const addConnectionBtn = this.container.querySelector('.add-connection-btn') as HTMLButtonElement;
        if (addConnectionBtn) {
            addConnectionBtn.addEventListener('click', () => {
                this.eventBus.emit('connection:add');
            });
        }
    }

    private setupContentTabHandlers(): void {
        const manageContentBtn = this.container.querySelector('.manage-content-btn') as HTMLButtonElement;
        if (manageContentBtn) {
            manageContentBtn.addEventListener('click', () => {
                this.eventBus.emit('content:manage');
            });
        }
    }

    private setupValidationTabHandlers(): void {
        const runValidationBtn = this.container.querySelector('.run-validation-btn') as HTMLButtonElement;
        if (runValidationBtn) {
            runValidationBtn.addEventListener('click', () => {
                this.eventBus.emit('validation:run');
            });
        }
    }

    public getActiveTab(): string {
        return this.activeTab;
    }

    public destroy(): void {
        if (this.unsubscribeState) {
            this.unsubscribeState();
        }
    }
}