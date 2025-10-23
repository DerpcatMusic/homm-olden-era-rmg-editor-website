// Property panel for selected object properties
// This class displays and edits properties of selected zones, connections, etc.

import { StateManager } from '../../store/StateManager';
import { EventBus } from '../../store/EventBus';

export class PropertyPanel {
    private container: HTMLElement;
    private selectedObject: any = null;
    private stateManager: StateManager;
    private eventBus: EventBus;
    private unsubscribeState!: () => void;
    private unsubscribeEvents!: () => void;

    constructor(container: HTMLElement, stateManager: StateManager, eventBus: EventBus) {
        this.container = container;
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.initializePanel();
        this.setupEventSubscriptions();
    }

    private initializePanel(): void {
        this.container.innerHTML = `
            <div class="property-panel">
                <h3>Properties</h3>
                <div class="properties-content">
                    <p class="no-selection">No object selected</p>
                </div>
            </div>
        `;
    }

    private setupEventSubscriptions(): void {
        // Subscribe to state changes
        this.unsubscribeState = this.stateManager.subscribe({
            onStateChange: (oldState: any, newState: any) => {
                // Update properties if template changed
                if (oldState.currentTemplate !== newState.currentTemplate) {
                    this.updatePropertiesDisplay();
                }
            }
        });

        // Subscribe to selection events
        const unsubscribeZone = this.eventBus.on('zone:selected', (data: any) => {
            this.setSelectedObject({ type: 'zone', ...data });
        });

        const unsubscribeConnection = this.eventBus.on('connection:selected', (data: any) => {
            this.setSelectedObject({ type: 'connection', ...data });
        });

        const unsubscribeDeselect = this.eventBus.on('object:deselected', () => {
            this.clearSelection();
        });

        this.unsubscribeEvents = () => {
            unsubscribeZone();
            unsubscribeConnection();
            unsubscribeDeselect();
        };
    }

    public setSelectedObject(object: any): void {
        this.selectedObject = object;
        this.updatePropertiesDisplay();
    }

    private updatePropertiesDisplay(): void {
        const contentArea = this.container.querySelector('.properties-content') as HTMLElement;

        if (!this.selectedObject) {
            contentArea.innerHTML = '<p class="no-selection">No object selected</p>';
            return;
        }

        const template = this.stateManager.getCurrentTemplate();
        if (!template) {
            contentArea.innerHTML = '<p class="no-selection">No template loaded</p>';
            return;
        }

        let propertiesHtml = '';

        switch (this.selectedObject.type) {
            case 'zone':
                propertiesHtml = this.renderZoneProperties(template, this.selectedObject.zoneIndex);
                break;
            case 'connection':
                propertiesHtml = this.renderConnectionProperties(template, this.selectedObject.connectionIndex);
                break;
            default:
                propertiesHtml = `<div class="object-properties">
                    <div class="property-group">
                        <label>Type:</label>
                        <span>${this.selectedObject.type || 'Unknown'}</span>
                    </div>
                </div>`;
        }

        contentArea.innerHTML = propertiesHtml;
        this.setupPropertyEventHandlers();
    }

    private renderZoneProperties(template: any, zoneIndex: number): string {
        const variant = template.variants?.[0];
        if (!variant?.zones?.[zoneIndex]) {
            return '<p class="error">Zone not found</p>';
        }

        const zone = variant.zones[zoneIndex];

        return `
            <div class="object-properties">
                <div class="property-group">
                    <label for="zone-name">Name:</label>
                    <input type="text" id="zone-name" value="${zone.name || ''}" />
                </div>
                <div class="property-group">
                    <label for="zone-size">Size:</label>
                    <input type="number" id="zone-size" value="${zone.size || 1}" min="0.1" step="0.1" />
                </div>
                <div class="property-group">
                    <label for="zone-guarded-value">Guarded Content Value:</label>
                    <input type="number" id="zone-guarded-value" value="${zone.guardedContentValue || 0}" min="0" />
                </div>
                <div class="property-group">
                    <label for="zone-unguarded-value">Unguarded Content Value:</label>
                    <input type="number" id="zone-unguarded-value" value="${zone.unguardedContentValue || 0}" min="0" />
                </div>
                <div class="property-group">
                    <label for="zone-guard-multiplier">Guard Multiplier:</label>
                    <input type="number" id="zone-guard-multiplier" value="${zone.guardMultiplier || 1}" min="0" step="0.1" />
                </div>
                <div class="property-group">
                    <label for="zone-crossroads-pos">Crossroads Position:</label>
                    <input type="number" id="zone-crossroads-pos" value="${zone.crossroadsPosition ?? -1}" min="-1" />
                </div>
            </div>
        `;
    }

    private renderConnectionProperties(template: any, connectionIndex: number): string {
        const variant = template.variants?.[0];
        if (!variant?.connections?.[connectionIndex]) {
            return '<p class="error">Connection not found</p>';
        }

        const connection = variant.connections[connectionIndex];

        return `
            <div class="object-properties">
                <div class="property-group">
                    <label for="connection-name">Name:</label>
                    <input type="text" id="connection-name" value="${connection.name || ''}" />
                </div>
                <div class="property-group">
                    <label for="connection-from">From Zone:</label>
                    <input type="text" id="connection-from" value="${connection.from || ''}" />
                </div>
                <div class="property-group">
                    <label for="connection-to">To Zone:</label>
                    <input type="text" id="connection-to" value="${connection.to || ''}" />
                </div>
                <div class="property-group">
                    <label for="connection-guard-zone">Guard Zone:</label>
                    <input type="text" id="connection-guard-zone" value="${connection.guardZone || ''}" />
                </div>
                <div class="property-group">
                    <label for="connection-guard-value">Guard Value:</label>
                    <input type="number" id="connection-guard-value" value="${connection.guardValue || 0}" min="0" />
                </div>
            </div>
        `;
    }

    private setupPropertyEventHandlers(): void {
        if (!this.selectedObject) return;

        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        switch (this.selectedObject.type) {
            case 'zone':
                this.setupZonePropertyHandlers(template, this.selectedObject.zoneIndex);
                break;
            case 'connection':
                this.setupConnectionPropertyHandlers(template, this.selectedObject.connectionIndex);
                break;
        }
    }

    private setupZonePropertyHandlers(template: any, zoneIndex: number): void {
        const variant = template.variants?.[0];
        const zone = variant?.zones?.[zoneIndex];
        if (!zone) return;

        // Name
        const nameInput = this.container.querySelector('#zone-name') as HTMLInputElement;
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                zone.name = (e.target as HTMLInputElement).value;
                this.stateManager.markDirty();
                this.eventBus.emit('zone:updated', { zoneIndex, field: 'name' });
            });
        }

        // Size
        const sizeInput = this.container.querySelector('#zone-size') as HTMLInputElement;
        if (sizeInput) {
            sizeInput.addEventListener('input', (e) => {
                zone.size = parseFloat((e.target as HTMLInputElement).value);
                this.stateManager.markDirty();
                this.eventBus.emit('zone:updated', { zoneIndex, field: 'size' });
            });
        }

        // Guarded Content Value
        const guardedValueInput = this.container.querySelector('#zone-guarded-value') as HTMLInputElement;
        if (guardedValueInput) {
            guardedValueInput.addEventListener('input', (e) => {
                zone.guardedContentValue = parseInt((e.target as HTMLInputElement).value);
                this.stateManager.markDirty();
                this.eventBus.emit('zone:updated', { zoneIndex, field: 'guardedContentValue' });
            });
        }

        // Unguarded Content Value
        const unguardedValueInput = this.container.querySelector('#zone-unguarded-value') as HTMLInputElement;
        if (unguardedValueInput) {
            unguardedValueInput.addEventListener('input', (e) => {
                zone.unguardedContentValue = parseInt((e.target as HTMLInputElement).value);
                this.stateManager.markDirty();
                this.eventBus.emit('zone:updated', { zoneIndex, field: 'unguardedContentValue' });
            });
        }

        // Guard Multiplier
        const guardMultiplierInput = this.container.querySelector('#zone-guard-multiplier') as HTMLInputElement;
        if (guardMultiplierInput) {
            guardMultiplierInput.addEventListener('input', (e) => {
                zone.guardMultiplier = parseFloat((e.target as HTMLInputElement).value);
                this.stateManager.markDirty();
                this.eventBus.emit('zone:updated', { zoneIndex, field: 'guardMultiplier' });
            });
        }

        // Crossroads Position
        const crossroadsPosInput = this.container.querySelector('#zone-crossroads-pos') as HTMLInputElement;
        if (crossroadsPosInput) {
            crossroadsPosInput.addEventListener('input', (e) => {
                zone.crossroadsPosition = parseInt((e.target as HTMLInputElement).value);
                this.stateManager.markDirty();
                this.eventBus.emit('zone:updated', { zoneIndex, field: 'crossroadsPosition' });
            });
        }
    }

    private setupConnectionPropertyHandlers(template: any, connectionIndex: number): void {
        const variant = template.variants?.[0];
        const connection = variant?.connections?.[connectionIndex];
        if (!connection) return;

        // Name
        const nameInput = this.container.querySelector('#connection-name') as HTMLInputElement;
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                connection.name = (e.target as HTMLInputElement).value;
                this.stateManager.markDirty();
                this.eventBus.emit('connection:updated', { connectionIndex, field: 'name' });
            });
        }

        // From Zone
        const fromInput = this.container.querySelector('#connection-from') as HTMLInputElement;
        if (fromInput) {
            fromInput.addEventListener('input', (e) => {
                connection.from = (e.target as HTMLInputElement).value;
                this.stateManager.markDirty();
                this.eventBus.emit('connection:updated', { connectionIndex, field: 'from' });
            });
        }

        // To Zone
        const toInput = this.container.querySelector('#connection-to') as HTMLInputElement;
        if (toInput) {
            toInput.addEventListener('input', (e) => {
                connection.to = (e.target as HTMLInputElement).value;
                this.stateManager.markDirty();
                this.eventBus.emit('connection:updated', { connectionIndex, field: 'to' });
            });
        }

        // Guard Zone
        const guardZoneInput = this.container.querySelector('#connection-guard-zone') as HTMLInputElement;
        if (guardZoneInput) {
            guardZoneInput.addEventListener('input', (e) => {
                connection.guardZone = (e.target as HTMLInputElement).value;
                this.stateManager.markDirty();
                this.eventBus.emit('connection:updated', { connectionIndex, field: 'guardZone' });
            });
        }

        // Guard Value
        const guardValueInput = this.container.querySelector('#connection-guard-value') as HTMLInputElement;
        if (guardValueInput) {
            guardValueInput.addEventListener('input', (e) => {
                connection.guardValue = parseInt((e.target as HTMLInputElement).value);
                this.stateManager.markDirty();
                this.eventBus.emit('connection:updated', { connectionIndex, field: 'guardValue' });
            });
        }
    }

    public clearSelection(): void {
        this.selectedObject = null;
        this.updatePropertiesDisplay();
    }

    public destroy(): void {
        if (this.unsubscribeState) {
            this.unsubscribeState();
        }
        if (this.unsubscribeEvents) {
            this.unsubscribeEvents();
        }
    }
}