// Export functionality for RMG templates
// This class handles generating game-ready RMG files

import { ValidationService } from './ValidationService.js';
import { GameDataService } from './GameDataService.js';

export class ExportService {
    private validationService: ValidationService;
    private gameDataService: GameDataService;

    constructor(validationService?: ValidationService, gameDataService?: GameDataService) {
        this.gameDataService = gameDataService || new GameDataService();
        this.validationService = validationService || new ValidationService(this.gameDataService);
    }

    public async exportTemplate(template: any, filename: string): Promise<void> {
        // Ensure game data is loaded before export
        if (!this.gameDataService.getGameData()) {
            try {
                await this.gameDataService.loadGameData();
            } catch (error) {
                console.warn('Failed to load game data for export:', error);
            }
        }

        // Convert template to RMG JSON format
        const rmgJson = this.convertToRMGFormat(template);

        // Validate the export format
        await this.validateExport(rmgJson);

        // Generate downloadable file
        this.downloadFile(rmgJson, filename);
    }

    private convertToRMGFormat(template: any): any {
        // Convert internal template format to C# RMG compatible JSON
        const rmgJson: any = {
            name: template.name,
            gameMode: template.gameMode,
            description: template.description || "",
            displayWinCondition: template.displayWinCondition || "",
            sizeX: template.sizeX,
            sizeZ: template.sizeZ,
            gameRules: this.convertGameRules(template.gameRules),
            variants: template.variants?.map((variant: any) => this.convertVariant(variant)) || [],
            zoneLayouts: template.zoneLayouts?.map((layout: any) => this.convertZoneLayout(layout)) || [],
            mandatoryContent: template.mandatoryContent?.map((content: any) => this.convertMandatoryContent(content)) || [],
            contentCountLimits: template.contentCountLimits?.map((limit: any) => this.convertContentCountLimits(limit)) || [],
            contentPools: template.contentPools?.map((pool: any) => this.convertContentPool(pool)) || [],
            contentLists: template.contentLists?.map((list: any) => this.convertContentList(list)) || []
        };

        return rmgJson;
    }

    private convertGameRules(gameRules: any): any {
        return {
            heroCountMin: gameRules.heroCountMin || 3,
            heroCountMax: gameRules.heroCountMax || 6,
            heroCountIncrement: gameRules.heroCountIncrement || 1,
            heroHireBan: gameRules.heroHireBan || false,
            encounterHoles: gameRules.encounterHoles || false,
            winConditions: gameRules.winConditions || {
                classic: true,
                desertion: true,
                heroLighting: true,
                lostStartCity: false,
                lostStartCityDay: 3,
                lostStartHero: false
            }
        };
    }

    private convertVariant(variant: any): any {
        return {
            orientation: this.convertOrientation(variant.orientation || {}),
            border: this.convertBorder(variant.border || {}),
            zones: variant.zones.map((zone: any) => this.convertZone(zone)),
            connections: variant.connections.map((connection: any) => this.convertConnection(connection))
        };
    }

    private convertOrientation(orientation: any): any {
        return {
            mode: orientation.mode || "MinimalBoundingSquare"
        };
    }

    private convertBorder(border: any): any {
        return {
            cornerRadius: border.cornerRadius || 0.8,
            obstaclesWidth: border.obstaclesWidth || 3,
            obstaclesNoise: border.obstaclesNoise || [{ amp: 0.5, freq: 6 }],
            waterWidth: border.waterWidth || 3,
            waterNoise: border.waterNoise || [{ amp: 1, freq: 12 }],
            waterType: border.waterType || "water grass"
        };
    }

    private convertZone(zone: any): any {
        const convertedZone: any = {
            name: zone.name,
            size: zone.size,
            layout: zone.layout,
            guardCutoffValue: zone.guardCutoffValue,
            guardRandomization: zone.guardRandomization,
            guardMultiplier: zone.guardMultiplier,
            guardWeeklyIncrement: zone.guardWeeklyIncrement,
            guardReactionDistribution: zone.guardReactionDistribution,
            guardedContentPool: zone.guardedContentPool,
            unguardedContentPool: zone.unguardedContentPool,
            resourcesContentPool: zone.resourcesContentPool,
            mandatoryContent: zone.mandatoryContent,
            contentCountLimits: zone.contentCountLimits,
            guardedContentValue: zone.guardedContentValue,
            guardedContentValuePerArea: zone.guardedContentValuePerArea,
            unguardedContentValue: zone.unguardedContentValue,
            unguardedContentValuePerArea: zone.unguardedContentValuePerArea,
            resourcesValue: zone.resourcesValue,
            resourcesValuePerArea: zone.resourcesValuePerArea,
            mainObjects: zone.mainObjects.map((obj: any) => this.convertMainObject(obj)),
            zoneBiome: this.convertBiomeRule(zone.zoneBiome),
            contentBiome: this.convertBiomeRule(zone.contentBiome),
            metaObjectsBiome: this.convertBiomeRule(zone.metaObjectsBiome),
            crossroadsPosition: zone.crossroadsPosition,
            roads: zone.roads.map((road: any) => this.convertRoad(road))
        };

        return convertedZone;
    }

    private convertMainObject(obj: any): any {
        return {
            type: obj.type,
            guardChance: obj.guardChance,
            guardValue: obj.guardValue,
            guardWeeklyIncrement: obj.guardWeeklyIncrement,
            buildingsConstructionSid: obj.buildingsConstructionSid,
            placement: obj.placement,
            placementArgs: obj.placementArgs,
            faction: this.convertFactionRule(obj.faction),
            spawn: obj.spawn
        };
    }

    private convertBiomeRule(rule: any): any {
        return {
            type: rule.type,
            args: rule.args
        };
    }

    private convertFactionRule(rule: any): any {
        if (!rule) return { type: "FromList", args: [] };
        return {
            type: rule.type || "FromList",
            args: rule.args || []
        };
    }

    private convertRoad(road: any): any {
        return {
            type: road.type || "Stone",
            from: this.convertRoadTarget(road.from),
            to: this.convertRoadTarget(road.to)
        };
    }

    private convertRoadTarget(target: any): any {
        return {
            type: target.type,
            args: target.args
        };
    }

    private convertConnection(connection: any): any {
        return {
            name: connection.name,
            from: connection.from,
            to: connection.to,
            connectionType: connection.connectionType,
            road: connection.road,
            guardEscape: connection.guardEscape,
            guardValue: connection.guardValue,
            guardWeeklyIncrement: connection.guardWeeklyIncrement
        };
    }

    private convertZoneLayout(layout: any): any {
        return {
            name: layout.name,
            obstaclesFill: layout.obstaclesFill,
            obstaclesFillVoid: layout.obstaclesFillVoid,
            lakesFill: layout.lakesFill,
            minLakeArea: layout.minLakeArea,
            elevationClusterScale: layout.elevationClusterScale,
            elevationModes: layout.elevationModes,
            roadClusterArea: layout.roadClusterArea,
            guardedEncounterResourceFractions: layout.guardedEncounterResourceFractions,
            ambientPickupDistribution: layout.ambientPickupDistribution
        };
    }

    private convertMandatoryContent(content: any): any {
        return {
            name: content.name,
            content: content.content.map((item: any) => this.convertMandatoryContentItem(item))
        };
    }

    private convertMandatoryContentItem(item: any): any {
        return {
            sid: item.sid,
            isGuarded: item.isGuarded,
            isMine: item.isMine,
            soloEncounter: item.soloEncounter,
            rules: item.rules,
            designatedEncounter: item.designatedEncounter
        };
    }

    private convertContentCountLimits(limit: any): any {
        return {
            name: limit.name,
            limits: limit.limits.map((l: any) => ({
                sid: l.sid,
                variant: l.variant,
                maxCount: l.maxCount
            }))
        };
    }

    private convertContentPool(pool: any): any {
        return {
            name: pool.name,
            valueDistribution: pool.valueDistribution,
            groups: pool.groups,
            bans: pool.bans
        };
    }

    private convertContentList(list: any): any {
        return {
            name: list.name,
            content: list.content
        };
    }

    private async validateExport(rmgJson: any): Promise<void> {
        // Validate that the exported JSON is compatible with C# RMG
        // Use ValidationService to validate the structure
        const validationResult = await this.validationService.validateTemplate(rmgJson as any);

        if (!validationResult.isValid) {
            const errorMessages = validationResult.errors
                .filter(error => error.severity === 'error')
                .map(error => `${error.field}: ${error.message}`)
                .join('\n');

            throw new Error(`Export validation failed:\n${errorMessages}`);
        }

        // Log warnings if any
        const warnings = validationResult.errors.filter(error => error.severity === 'warning');
        if (warnings.length > 0) {
            console.warn('Export validation warnings:', warnings);
        }
    }

    private downloadFile(data: any, filename: string): void {
        // TODO: Create and trigger download of JSON file
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename.endsWith('.rmg.json') ? filename : `${filename}.rmg.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    public async exportBatch(templates: RMGTemplate[], baseFilename: string): Promise<void> {
        // TODO: Export multiple templates as a batch
        for (let i = 0; i < templates.length; i++) {
            const filename = `${baseFilename}_${i + 1}`;
            await this.exportTemplate(templates[i], filename);
        }
    }
}

// TODO: Import RMGTemplate from models
interface RMGTemplate {
    // TODO: Define RMGTemplate interface
}