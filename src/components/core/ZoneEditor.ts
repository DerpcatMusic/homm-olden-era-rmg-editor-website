// Zone editing functionality for the canvas editor
// This class handles zone-specific operations and UI

import { EventBus } from '../../store/EventBus';
import { StateManager } from '../../store/StateManager';
import { Zone } from '../../models/rmg';

export class ZoneEditor {
    private eventBus: EventBus;
    private stateManager: StateManager;

    constructor(eventBus: EventBus, stateManager: StateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.eventBus.on('canvas:zone-selected', (data) => {
            this.onZoneSelected(data.zoneIndex);
        });

        this.eventBus.on('zone:create', () => {
            this.createZone();
        });

        this.eventBus.on('zone:delete', (data) => {
            this.deleteZone(data.zoneIndex);
        });

        this.eventBus.on('zone:update', (data) => {
            this.updateZone(data.zoneIndex, data.updates);
        });
    }

    private onZoneSelected(zoneIndex: number): void {
        console.log('Zone selected:', zoneIndex);
        // TODO: Update UI to show zone properties
    }

    public createZone(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        const newZone: any = {
            name: `Zone ${(template as any).variants[0].zones.length}`,
            size: 1,
            mainObjects: [],
            zoneBiome: {},
            contentBiome: {},
            metaObjectsBiome: {},
            crossroadsPosition: -1,
            guardedContentPool: ["content_pool_default_guarded"],
            unguardedContentPool: ["content_pool_default_unguarded"],
            resourcesContentPool: ["content_pool_default_resources"],
            guardedContentValue: 0,
            guardedContentValuePerArea: 0,
            unguardedContentValue: 0,
            unguardedContentValuePerArea: 0,
            resourcesValue: 0,
            resourcesValuePerArea: 0,
            randomHireEnableWeeklyUnitIncrement: true,
            randomHireInitialUnitIncrement: 1,
            diplomacyModifier: 0,
            guardCutoffValue: 0,
            guardMultiplier: 1,
            guardRandomization: 0.1,
            guardWeeklyIncrement: 0,
            guardReactionDistribution: [1, 1, 1, 1, 1, 0],
            encounterHolesSettings: {},
            roads: [],
            mandatoryContent: [],
            contentCountLimits: []
        };

        (template as any).variants[0].zones.push(newZone);
        this.stateManager.markDirty();
        this.eventBus.emit('zone:created', { zoneIndex: (template as any).variants[0].zones.length - 1 });
    }

    public deleteZone(zoneIndex: number): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        const zones = (template as any).variants[0].zones;
        if (zoneIndex >= 0 && zoneIndex < zones.length) {
            zones.splice(zoneIndex, 1);

            // Update connections that reference deleted zone
            const connections = (template as any).variants[0].connections;
            const updatedConnections = connections.filter((conn: any) =>
                conn.from !== zoneIndex && conn.to !== zoneIndex
            );

            // Update connection indices
            updatedConnections.forEach((conn: any) => {
                if (conn.from > zoneIndex) conn.from--;
                if (conn.to > zoneIndex) conn.to--;
            });

            (template as any).variants[0].connections = updatedConnections;

            this.stateManager.markDirty();
            this.eventBus.emit('zone:deleted', { zoneIndex });
        }
    }

    public updateZone(zoneIndex: number, updates: Partial<Zone>): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        const zones = (template as any).variants[0].zones;
        if (zoneIndex >= 0 && zoneIndex < zones.length) {
            Object.assign(zones[zoneIndex], updates);
            this.stateManager.markDirty();
            this.eventBus.emit('zone:updated', { zoneIndex, updates });
        }
    }

    public getZone(zoneIndex: number): Zone | null {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return null;

        const zones = (template as any).variants[0].zones;
        return zones[zoneIndex] || null;
    }

    public getAllZones(): Zone[] {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return [];

        return (template as any).variants[0].zones;
    }
}