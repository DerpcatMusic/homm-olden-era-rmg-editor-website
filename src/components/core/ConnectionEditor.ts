// Connection editing functionality for the canvas editor
// This class handles connection-specific operations and UI

import { EventBus } from '../../store/EventBus';
import { StateManager } from '../../store/StateManager';
import { Connection } from '../../models/rmg';

export class ConnectionEditor {
    private eventBus: EventBus;
    private stateManager: StateManager;

    constructor(eventBus: EventBus, stateManager: StateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.eventBus.on('canvas:connection-selected', (data) => {
            this.onConnectionSelected(data.connectionIndex);
        });

        this.eventBus.on('connection:create', (data) => {
            this.createConnection(data.fromZone, data.toZone);
        });

        this.eventBus.on('connection:delete', (data) => {
            this.deleteConnection(data.connectionIndex);
        });

        this.eventBus.on('connection:update', (data) => {
            this.updateConnection(data.connectionIndex, data.updates);
        });
    }

    private onConnectionSelected(connectionIndex: number): void {
        console.log('Connection selected:', connectionIndex);
        // TODO: Update UI to show connection properties
    }

    public createConnection(fromZone: number, toZone: number): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        // Check if connection already exists
        const existingConnection = (template as any).variants[0].connections.find(
            (conn: any) => conn.from === fromZone && conn.to === toZone
        );

        if (existingConnection) {
            console.warn('Connection already exists between these zones');
            return;
        }

        const newConnection: any = {
            name: `Connection ${fromZone}-${toZone}`,
            from: fromZone,
            to: toZone,
            connectionType: 0, // Default
            length: 1,
            portalFromEnabled: true,
            portalToEnabled: true,
            guardZone: 0,
            guardValue: 0,
            guardWeeklyIncrement: 0,
            guardReaction: 0, // Common
            guardEscape: true,
            gatePlacement: 0, // Random
            portalPlacementRulesFrom: [],
            portalPlacementRulesTo: []
        };

        (template as any).variants[0].connections.push(newConnection);
        this.stateManager.markDirty();
        this.eventBus.emit('connection:created', {
            connectionIndex: (template as any).variants[0].connections.length - 1
        });
    }

    public deleteConnection(connectionIndex: number): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        const connections = (template as any).variants[0].connections;
        if (connectionIndex >= 0 && connectionIndex < connections.length) {
            connections.splice(connectionIndex, 1);
            this.stateManager.markDirty();
            this.eventBus.emit('connection:deleted', { connectionIndex });
        }
    }

    public updateConnection(connectionIndex: number, updates: Partial<Connection>): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        const connections = (template as any).variants[0].connections;
        if (connectionIndex >= 0 && connectionIndex < connections.length) {
            Object.assign(connections[connectionIndex], updates);
            this.stateManager.markDirty();
            this.eventBus.emit('connection:updated', { connectionIndex, updates });
        }
    }

    public getConnection(connectionIndex: number): Connection | null {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return null;

        const connections = (template as any).variants[0].connections;
        return connections[connectionIndex] || null;
    }

    public getAllConnections(): Connection[] {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return [];

        return (template as any).variants[0].connections;
    }

    public getConnectionsForZone(zoneIndex: number): Connection[] {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return [];

        return (template as any).variants[0].connections.filter(
            (conn: any) => conn.from === zoneIndex || conn.to === zoneIndex
        );
    }

    public canCreateConnection(fromZone: number, toZone: number): boolean {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return false;

        // Check if zones exist
        const zones = (template as any).variants[0].zones;
        if (fromZone < 0 || fromZone >= zones.length || toZone < 0 || toZone >= zones.length) {
            return false;
        }

        // Check if connection already exists
        const existingConnection = (template as any).variants[0].connections.find(
            (conn: any) => conn.from === fromZone && conn.to === toZone
        );

        return !existingConnection;
    }
}