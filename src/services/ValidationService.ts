// Validation engine for RMG templates
// This class handles comprehensive validation with C# RMG compatibility

import { RMGTemplate } from '../models/rmg';
import { GameDataService } from './GameDataService';

export class ValidationService {
    private rules: ValidationRule[] = [];
    private cache: Map<string, ValidationResult> = new Map();
    private contentDatabase: ContentDatabaseProvider;
    private gameDataService: GameDataService;

    constructor(gameDataService?: GameDataService, contentDatabase?: ContentDatabaseProvider) {
        this.gameDataService = gameDataService || new GameDataService();
        this.contentDatabase = contentDatabase || new ContentDatabaseProvider(this.gameDataService);
        this.initializeValidationRules();
    }

    private initializeValidationRules(): void {
        // Initialize validation rules for different validation stages
        // Structural, Referential, Logical, C# Compatibility
        this.rules = [
            {
                name: 'structural',
                validate: (template) => this.validateStructure(template)
            },
            {
                name: 'referential',
                validate: (template) => this.validateReferences(template)
            },
            {
                name: 'logical',
                validate: (template) => this.validateLogic(template)
            },
            {
                name: 'csharp_compatibility',
                validate: (template) => this.validateRMGCompatibility(template)
            }
        ];
    }

    public async validateTemplate(template: RMGTemplate): Promise<ValidationResult> {
        // Ensure game data is loaded before validation
        if (!this.gameDataService.getGameData()) {
            try {
                await this.gameDataService.loadGameData();
            } catch (error) {
                console.warn('Failed to load game data for validation:', error);
            }
        }

        // Check cache first
        const cacheKey = this.getCacheKey(template);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        // Run validation pipeline
        const errors: ValidationError[] = [];

        // Run all validation rules
        for (const rule of this.rules) {
            try {
                const ruleErrors = rule.validate(template);
                errors.push(...ruleErrors);
            } catch (error) {
                errors.push({
                    field: 'validation.process',
                    message: `Validation rule '${rule.name}' failed: ${error}`,
                    severity: 'error'
                });
            }
        }

        const result: ValidationResult = {
            isValid: errors.filter(e => e.severity === 'error').length === 0,
            errors,
            warningsCount: errors.filter(e => e.severity === 'warning').length,
            errorsCount: errors.filter(e => e.severity === 'error').length
        };

        // Cache result for performance
        this.cache.set(cacheKey, result);
        return result;
    }

    private validateStructure(template: RMGTemplate): ValidationError[] {
        const errors: ValidationError[] = [];

        // Essential map properties
        if (!template.name || !template.name.trim()) {
            errors.push({
                field: 'name',
                message: 'Map name cannot be empty',
                severity: 'error',
                suggestion: 'Provide a descriptive map name'
            });
        }

        // Map dimensions validation
        if (template.sizeX < 32 || template.sizeX > 512) {
            const severity = template.sizeX < 36 ? 'error' : 'warning';
            errors.push({
                field: 'sizeX',
                message: `Map width (${template.sizeX}) outside recommended range (32-512)`,
                severity,
                suggestion: 'Use map sizes between 36x36 and 512x512 for optimal performance'
            });
        }

        if (template.sizeZ < 32 || template.sizeZ > 512) {
            const severity = template.sizeZ < 36 ? 'error' : 'warning';
            errors.push({
                field: 'sizeZ',
                message: `Map height (${template.sizeZ}) outside recommended range (32-512)`,
                severity,
                suggestion: 'Use map sizes between 36x36 and 512x512 for optimal performance'
            });
        }

        // Must have at least one variant
        if (!template.variants || template.variants.length === 0) {
            errors.push({
                field: 'variants',
                message: 'Map must have at least one variant',
                severity: 'error',
                suggestion: 'Add at least one variant with zones and connections'
            });
            return errors;
        }

        // Validate each variant
        template.variants.forEach((variant, i) => {
            errors.push(...this.validateVariantStructure(variant, `variants[${i}]`));
        });

        return errors;
    }

    private validateVariantStructure(variant: any, pathPrefix: string): ValidationError[] {
        const errors: ValidationError[] = [];

        // Must have zones for meaningful gameplay
        if (!variant.zones || variant.zones.length === 0) {
            errors.push({
                field: `${pathPrefix}.zones`,
                message: 'Variant must have at least one zone',
                severity: 'error',
                suggestion: 'Add zones to define map regions'
            });
            return errors;
        }

        // Validate zones
        const zoneNames = new Set<string>();
        variant.zones.forEach((zone: any, i: number) => {
            const zonePath = `${pathPrefix}.zones[${i}]`;

            // Check for duplicate zone names
            if (zone.name && zoneNames.has(zone.name)) {
                errors.push({
                    field: zonePath,
                    message: `Duplicate zone name: '${zone.name}'`,
                    severity: 'error',
                    suggestion: 'Zone names must be unique within a variant'
                });
            }
            if (zone.name) zoneNames.add(zone.name);

            errors.push(...this.validateZoneStructure(zone, zonePath));
        });

        // Validate connections
        if (variant.connections) {
            errors.push(...this.validateConnectionsStructure(variant.connections, variant.zones, pathPrefix));
        }

        return errors;
    }

    private validateZoneStructure(zone: any, pathPrefix: string): ValidationError[] {
        const errors: ValidationError[] = [];

        // Zone name validation
        if (!zone.name || !zone.name.trim()) {
            errors.push({
                field: `${pathPrefix}.name`,
                message: 'Zone name cannot be empty',
                severity: 'error'
            });
        }

        // Size validation (must be positive)
        if (zone.size <= 0) {
            errors.push({
                field: `${pathPrefix}.size`,
                message: `Zone size must be positive (got ${zone.size})`,
                severity: 'error',
                suggestion: 'Set zone size to a positive value (typically 0.5-3.0)'
            });
        }

        // Content value validation
        const contentValues = [
            { field: 'guardedContentValue', value: zone.guardedContentValue },
            { field: 'unguardedContentValue', value: zone.unguardedContentValue },
            { field: 'resourcesValue', value: zone.resourcesValue },
            { field: 'guardedContentValuePerArea', value: zone.guardedContentValuePerArea },
            { field: 'unguardedContentValuePerArea', value: zone.unguardedContentValuePerArea },
            { field: 'resourcesValuePerArea', value: zone.resourcesValuePerArea }
        ];

        contentValues.forEach(({ field, value }) => {
            if (value < 0) {
                errors.push({
                    field: `${pathPrefix}.${field}`,
                    message: `${field} cannot be negative (got ${value})`,
                    severity: 'error'
                });
            }
        });

        // Guard system validation
        if (zone.guardMultiplier <= 0) {
            errors.push({
                field: `${pathPrefix}.guardMultiplier`,
                message: `Guard multiplier must be positive (got ${zone.guardMultiplier})`,
                severity: 'error'
            });
        }

        if (zone.guardRandomization < 0 || zone.guardRandomization > 1) {
            errors.push({
                field: `${pathPrefix}.guardRandomization`,
                message: `Guard randomization must be between 0.0 and 1.0 (got ${zone.guardRandomization})`,
                severity: 'error'
            });
        }

        // Crossroads position validation
        if (zone.crossroadsPosition < -1) {
            errors.push({
                field: `${pathPrefix}.crossroadsPosition`,
                message: `Crossroads position must be -1 (auto) or non-negative index (got ${zone.crossroadsPosition})`,
                severity: 'error'
            });
        }

        return errors;
    }

    private validateConnectionsStructure(connections: any[], zones: any[], pathPrefix: string): ValidationError[] {
        const errors: ValidationError[] = [];
        const zoneNames = new Set(zones.map(z => z.name).filter(n => n));
        const connectionNames = new Set<string>();

        connections.forEach((connection, i) => {
            const connPath = `${pathPrefix}.connections[${i}]`;

            // Check duplicate names
            if (connection.name && connectionNames.has(connection.name)) {
                errors.push({
                    field: connPath,
                    message: `Duplicate connection name: '${connection.name}'`,
                    severity: 'error'
                });
            }
            if (connection.name) connectionNames.add(connection.name);

            // Validate zone references
            if (!zoneNames.has(connection.from)) {
                errors.push({
                    field: `${connPath}.from`,
                    message: `Connection references unknown 'from' zone: '${connection.from}'`,
                    severity: 'error',
                    suggestion: `Use one of: ${Array.from(zoneNames).join(', ')}`
                });
            }

            if (!zoneNames.has(connection.to)) {
                errors.push({
                    field: `${connPath}.to`,
                    message: `Connection references unknown 'to' zone: '${connection.to}'`,
                    severity: 'error',
                    suggestion: `Use one of: ${Array.from(zoneNames).join(', ')}`
                });
            }

            // Validate guard zone reference
            if (connection.guardZone && !zoneNames.has(connection.guardZone)) {
                errors.push({
                    field: `${connPath}.guardZone`,
                    message: `Connection references unknown guard zone: '${connection.guardZone}'`,
                    severity: 'error'
                });
            }

            // Self-connections warning
            if (connection.from === connection.to) {
                errors.push({
                    field: connPath,
                    message: 'Connection connects zone to itself',
                    severity: 'warning',
                    suggestion: 'Self-connections are unusual and may cause layout issues'
                });
            }

            // Guard values validation
            if (connection.guardValue < 0) {
                errors.push({
                    field: `${connPath}.guardValue`,
                    message: 'Negative guard value',
                    severity: 'warning'
                });
            }
        });

        return errors;
    }

    private validateReferences(template: RMGTemplate): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!template.variants || template.variants.length === 0) return errors;

        // Build reference maps
        const mandatoryContentNames = new Set(template.mandatoryContent?.map(p => p.name) || []);
        const contentPoolNames = new Set(template.contentPools?.map(p => p.name) || []);
        const contentListNames = new Set(template.contentLists?.map(l => l.name) || []);
        const contentLimitNames = new Set(template.contentCountLimits?.map(l => l.name) || []);
        const zoneLayoutNames = new Set(template.zoneLayouts?.map(l => l.name) || []);

        template.variants.forEach((variant, i) => {
            const variantPath = `variants[${i}]`;
            const zoneNames = new Set(variant.zones?.map(z => z.name).filter(n => n) || []);

            // Validate zone references
            variant.zones?.forEach((zone, zIdx) => {
                const zonePath = `${variantPath}.zones[${zIdx}]`;

                // Validate mandatory content preset references
                zone.mandatoryContent?.forEach(presetName => {
                    if (!mandatoryContentNames.has(presetName)) {
                        errors.push({
                            field: `${zonePath}.mandatoryContent`,
                            message: `Zone '${zone.name}' references non-existent mandatory content preset: '${presetName}'`,
                            severity: 'error',
                            suggestion: `Available presets: ${Array.from(mandatoryContentNames).join(', ')}`
                        });
                    }
                });

                // Validate content pool references
                const poolFields = [
                    { field: 'guardedContentPool', pools: zone.guardedContentPool },
                    { field: 'unguardedContentPool', pools: zone.unguardedContentPool },
                    { field: 'resourcesContentPool', pools: zone.resourcesContentPool }
                ];

                poolFields.forEach(({ field, pools }) => {
                    pools?.forEach(poolName => {
                        if (!contentPoolNames.has(poolName)) {
                            errors.push({
                                field: `${zonePath}.${field}`,
                                message: `Zone '${zone.name}' references non-existent content pool: '${poolName}'`,
                                severity: 'error'
                            });
                        }
                    });
                });

                // Validate content count limit references
                zone.contentCountLimits?.forEach(limitName => {
                    if (!contentLimitNames.has(limitName)) {
                        errors.push({
                            field: `${zonePath}.contentCountLimits`,
                            message: `Zone '${zone.name}' references non-existent content count limit: '${limitName}'`,
                            severity: 'error'
                        });
                    }
                });

                // Validate zone layout reference
                if (zone.layout && typeof zone.layout === 'string' && !zoneLayoutNames.has(zone.layout)) {
                    errors.push({
                        field: `${zonePath}.layout`,
                        message: `Zone '${zone.name}' references non-existent zone layout: '${zone.layout}'`,
                        severity: 'error',
                        suggestion: `Available layouts: ${Array.from(zoneLayoutNames).join(', ')}`
                    });
                }
            });
        });

        return errors;
    }

    private validateLogic(template: RMGTemplate): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!template.variants) return errors;

        template.variants.forEach((variant, i) => {
            const variantPath = `variants[${i}]`;

            // Check biome rule cycles
            errors.push(...this.checkBiomeRuleCycles(variant.zones || [], variantPath));

            // Validate road target references
            variant.zones?.forEach((zone, zIdx) => {
                const zonePath = `${variantPath}.zones[${zIdx}]`;
                zone.roads?.forEach((road, rIdx) => {
                    errors.push(...this.validateRoadTargetReferences(road, zone, variant, `${zonePath}.roads[${rIdx}]`));
                });
            });
        });

        return errors;
    }

    private checkBiomeRuleCycles(zones: any[], pathPrefix: string): ValidationError[] {
        const errors: ValidationError[] = [];
        const zoneNameToIndex = new Map<string, number>();

        zones.forEach((zone, i) => {
            if (zone.name) zoneNameToIndex.set(zone.name, i);
        });

        zones.forEach((zone, i) => {
            const biomeRuleAttrs = ['zoneBiome', 'contentBiome', 'metaObjectsBiome'] as const;

            biomeRuleAttrs.forEach(attr => {
                const path: string[] = [zone.name || `zone_${i}`];
                const visited = new Set<number>();
                const biomeRule = (zone as any)[attr];

                if (this.hasBiomeCycle(biomeRule, zones, zoneNameToIndex, visited, path)) {
                    const cyclePath = path.join(' -> ');
                    errors.push({
                        field: `${pathPrefix}.zones[${i}].${attr}`,
                        message: `Circular dependency in biome rules: ${cyclePath}`,
                        severity: 'error',
                        suggestion: 'Break the circular reference (e.g., have one zone use \'FromList\')'
                    });
                }
            });
        });

        return errors;
    }

    private hasBiomeCycle(rule: any, zones: any[], zoneMap: Map<string, number>, visited: Set<number>, path: string[]): boolean {
        if (!rule || rule.type !== 'MatchZone' || !rule.args || rule.args.length === 0) {
            return false;
        }

        const targetZoneName = rule.args[0];
        if (!zoneMap.has(targetZoneName)) {
            return false; // Reference error, handled elsewhere
        }

        const targetIndex = zoneMap.get(targetZoneName)!;
        path.push(targetZoneName);

        if (visited.has(targetIndex)) {
            return true; // Cycle detected
        }

        visited.add(targetIndex);

        const targetZone = zones[targetIndex];
        const biomeRuleAttrs = ['zoneBiome', 'contentBiome', 'metaObjectsBiome'] as const;

        for (const attr of biomeRuleAttrs) {
            const nextRule = (targetZone as any)[attr];
            if (this.hasBiomeCycle(nextRule, zones, zoneMap, visited, path)) {
                return true;
            }
        }

        path.pop();
        visited.delete(targetIndex);
        return false;
    }

    private validateRoadTargetReferences(road: any, zone: any, variant: any, pathPrefix: string): ValidationError[] {
        const errors: ValidationError[] = [];
        const connectionNames = new Set(variant.connections?.map((c: any) => c.name).filter((n: any) => n) || []);

        // Validate 'from' target
        if (road.from?.type === 'Connection' && road.from.args && road.from.args[0] && !connectionNames.has(road.from.args[0])) {
            errors.push({
                field: `${pathPrefix}.from.args[0]`,
                message: `Road references unknown connection: '${road.from.args[0]}'`,
                severity: 'error'
            });
        }

        // Validate 'to' target
        if (road.to?.type === 'Connection' && road.to.args && road.to.args[0] && !connectionNames.has(road.to.args[0])) {
            errors.push({
                field: `${pathPrefix}.to.args[0]`,
                message: `Road references unknown connection: '${road.to.args[0]}'`,
                severity: 'error'
            });
        }

        return errors;
    }

    private validateRMGCompatibility(template: RMGTemplate): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!template.variants) return errors;

        // Validate mandatory content compatibility
        template.variants.forEach((variant, vIdx) => {
            variant.zones?.forEach((zone, zIdx) => {
                const zonePath = `variants[${vIdx}].zones[${zIdx}]`;
                zone.mandatoryContent?.forEach((presetName: any) => {
                    const preset = template.mandatoryContent?.find(p => p.name === presetName);
                    if (preset) {
                        errors.push(...this.validatePresetCompatibility(preset, zone, `${zonePath}.mandatoryContent[${presetName}]`));
                    }
                });
            });
        });

        // Validate building/pickup categorization
        errors.push(...this.validateBuildingPickupCategorization(template));

        // Validate encounter slot requirements
        errors.push(...this.validateEncounterSlotRequirements(template));

        return errors;
    }

    private validatePresetCompatibility(preset: any, zone: any, pathPrefix: string): ValidationError[] {
        const errors: ValidationError[] = [];

        let buildingCount = 0;
        let pickupCount = 0;
        let soloCount = 0;
        let hoboPickupCount = 0;

        preset.content?.forEach((item: any) => {
            if (!item.sid) return;

            const isBuilding = this.contentDatabase.isMapObjectBuildingBySid(item.sid);
            const designated = item.designatedEncounter !== false; // Default true
            const solo = item.soloEncounter || false;

            if (isBuilding) {
                buildingCount++;
            } else {
                pickupCount++;
            }

            if (solo) {
                soloCount++;
            } else if (!designated && !isBuilding && !item.rules) {
                hoboPickupCount++;
            }
        });

        const zoneSizeFactor = Math.max(1.0, zone.size);

        // Solo encounters need dedicated encounter slots
        const maxSoloForZone = Math.max(1, Math.floor(zoneSizeFactor * 2));
        if (soloCount > maxSoloForZone) {
            errors.push({
                field: pathPrefix,
                message: `Zone '${zone.name}' may not have enough encounter capacity for ${soloCount} solo encounters`,
                severity: 'warning',
                suggestion: `Consider reducing solo encounters or increasing zone size (current: ${zone.size})`
            });
        }

        // Buildings need building slots in encounters
        const maxBuildingsForZone = Math.max(2, Math.floor(zoneSizeFactor * 5));
        if (buildingCount > maxBuildingsForZone) {
            errors.push({
                field: pathPrefix,
                message: `Zone '${zone.name}' may not have enough building slots for ${buildingCount} buildings`,
                severity: 'warning',
                suggestion: `Consider reducing buildings or increasing zone size (current: ${zone.size})`
            });
        }

        // Hobo pickups need ambient pickup slots
        const maxHoboForZone = Math.max(3, Math.floor(zoneSizeFactor * 3));
        if (hoboPickupCount > maxHoboForZone) {
            errors.push({
                field: pathPrefix,
                message: `Zone '${zone.name}' may not have enough ambient slots for ${hoboPickupCount} hobo pickups`,
                severity: 'warning',
                suggestion: 'Consider enabling designated encounters for some items'
            });
        }

        return errors;
    }

    private validateBuildingPickupCategorization(template: RMGTemplate): ValidationError[] {
        const errors: ValidationError[] = [];

        template.variants?.forEach((variant, vIdx) => {
            variant.zones?.forEach((zone, zIdx) => {
                const zonePath = `variants[${vIdx}].zones[${zIdx}]`;

                zone.mandatoryContent?.forEach((presetName: any) => {
                    const preset = template.mandatoryContent?.find(p => p.name === presetName);
                    preset?.content?.forEach((item: any, mcIdx: number) => {
                        if (!item.sid) return;

                        const itemPath = `${zonePath}.mandatoryContent[${presetName}][${mcIdx}]`;

                        // Verify SID exists
                        if (!this.contentDatabase.validateSidExists(item.sid)) {
                            errors.push({
                                field: `${itemPath}.sid`,
                                message: `Unknown SID '${item.sid}' not found in content database`,
                                severity: 'error',
                                suggestion: 'Use a valid SID from the content database'
                            });
                        }
                    });
                });
            });
        });

        return errors;
    }

    private validateEncounterSlotRequirements(template: RMGTemplate): ValidationError[] {
        const errors: ValidationError[] = [];

        template.variants?.forEach((variant, vIdx) => {
            variant.zones?.forEach((zone, zIdx) => {
                const zonePath = `variants[${vIdx}].zones[${zIdx}]`;

                const totalRequirements = this.calculateSlotRequirements(zone, template.mandatoryContent || []);

                // Basic heuristic for slot availability based on zone size
                const estimatedEncounterSlots = Math.max(1, Math.floor(zone.size * 8));
                const estimatedAmbientSlots = Math.max(1, Math.floor(zone.size * 12));

                if (totalRequirements.solo > estimatedEncounterSlots / 2) {
                    errors.push({
                        field: zonePath,
                        message: `Zone '${zone.name}' may not have enough slots for ${totalRequirements.solo} solo encounters`,
                        severity: 'warning'
                    });
                }

                if (totalRequirements.hoboPickups > estimatedAmbientSlots / 3) {
                    errors.push({
                        field: zonePath,
                        message: `Zone '${zone.name}' may not have enough ambient slots for ${totalRequirements.hoboPickups} hobo pickups`,
                        severity: 'warning'
                    });
                }
            });
        });

        return errors;
    }

    private calculateSlotRequirements(zone: any, mandatoryPresets: any[]): any {
        const requirements = {
            buildings: 0,
            pickups: 0,
            solo: 0,
            hoboPickups: 0,
            designated: 0
        };

        zone.mandatoryContent?.forEach((presetName: string) => {
            const preset = mandatoryPresets.find(p => p.name === presetName);
            if (!preset) return;

            preset.content?.forEach((item: any) => {
                if (!item.sid) return;

                const isBuilding = this.contentDatabase.isMapObjectBuildingBySid(item.sid);
                const designated = item.designatedEncounter !== false;
                const solo = item.soloEncounter || false;

                if (isBuilding) {
                    requirements.buildings++;
                } else {
                    requirements.pickups++;
                }

                if (solo) {
                    requirements.solo++;
                } else if (designated) {
                    requirements.designated++;
                } else if (!isBuilding && !item.rules) {
                    requirements.hoboPickups++;
                }
            });
        });

        return requirements;
    }

    private getCacheKey(template: RMGTemplate): string {
        // Generate cache key based on template content hash
        // For simplicity, use a combination of key properties
        const keyParts = [
            template.name || '',
            template.sizeX?.toString() || '',
            template.sizeZ?.toString() || '',
            template.variants?.length?.toString() || '',
            // Add more properties as needed for cache invalidation
        ];
        return keyParts.join('|');
    }

    public clearCache(): void {
        this.cache.clear();
    }

    public addValidationRule(rule: ValidationRule): void {
        this.rules.push(rule);
    }

    public getCacheStats(): { size: number; hitRate?: number } {
        return {
            size: this.cache.size
        };
    }
}

// Content database provider interface
export class ContentDatabaseProvider {
    private gameDataService: GameDataService | null = null;

    constructor(gameDataService?: GameDataService) {
        this.gameDataService = gameDataService || null;
    }

    public isMapObjectBuildingBySid(sid: string): boolean {
        if (this.gameDataService) {
            return this.gameDataService.isContentBuilding(sid);
        }

        // Fallback to pattern matching if no game data service
        if (!sid) return false;

        const buildingPatterns: string[] = [
            'tower', 'fort', 'castle', 'dwelling', 'mine', 'portal', 'gate',
            'temple', 'shrine', 'monument', 'library', 'market', 'tavern'
        ];

        const sidLower = sid.toLowerCase();

        // Check building patterns first (more specific)
        for (const pattern of buildingPatterns) {
            if (sidLower.includes(pattern)) {
                return true;
            }
        }

        // Default assumption for unknown SIDs
        return false;
    }

    public getMapObjectDesc(sid: string): any {
        if (!sid || !sid.trim()) return null;

        if (this.gameDataService) {
            const content = this.gameDataService.getContentById(sid);
            if (content) {
                return {
                    sid: content.sid,
                    exists: true,
                    isBuilding: content.isBuilding || false,
                    value: content.value || 0,
                    guardValue: content.guardValue || 0
                };
            }
        }

        return {
            sid: sid,
            exists: true,
            isBuilding: this.isMapObjectBuildingBySid(sid)
        };
    }

    public validateSidExists(sid: string): boolean {
        if (this.gameDataService) {
            return this.gameDataService.getContentById(sid) !== null;
        }
        return !!this.getMapObjectDesc(sid);
    }

    public getContentValue(sid: string): number {
        if (this.gameDataService) {
            return this.gameDataService.getContentValue(sid);
        }
        return 0;
    }

    public getContentGuardValue(sid: string): number {
        if (this.gameDataService) {
            return this.gameDataService.getContentGuardValue(sid);
        }
        return 0;
    }
}

// TypeScript interfaces for RMG data structures (validation-specific)


export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warningsCount?: number;
    errorsCount?: number;
}

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
    context?: any;
}

export interface ValidationRule {
    name: string;
    validate: (template: RMGTemplate) => ValidationError[];
}

// Additional interfaces for completeness
export interface GameRules {
    heroCountMin: number;
    heroCountMax: number;
    heroCountIncrement: number;
    heroHireBan: boolean;
    encounterHoles: boolean;
    tournamentRules: boolean;
    customAI?: string;
    uniqueMagicCostModifiers: number[];
    bonuses: MapBonus[];
    winConditions: WinConditions;
}

export interface WinConditions {
    classic: boolean;
    desertion: boolean;
    heroLighting: boolean;
    lostStartCity: boolean;
    lostStartHero: boolean;
    gladiatorArena: boolean;
    desertionDay: number;
    desertionValue: number;
    heroLightingDay: number;
    lostStartCityDay: number;
    gladiatorArenaRegistrationStartWork: boolean;
    gladiatorArenaRegistrationStartFight: boolean;
    gladiatorArenaDaysDelayStart: number;
    gladiatorArenaCountDay: number;
}

export interface MapBonus {
    sid: string;
    receiverSide: number;
    receiverFilter: string;
    parameters: string[];
}

export interface Orientation {
    mode: string;
    zeroAngleZone?: string;
    baseAngleMin: number;
    baseAngleMax: number;
    randomAngleAmplitude: number;
    randomAngleStep: number;
}

export interface Border {
    cornerRadius: number;
    obstaclesWidth: number;
    obstaclesNoise: NoiseMode[];
    waterWidth: number;
    waterNoise: NoiseMode[];
    waterType: string;
}

export interface RiverSettings {
    createRiverSystem: boolean;
    tributarySpacing: number;
}

export interface NoiseMode {
    amp: number;
    freq: number;
}

export interface EncounterHolesSettings {
    affectedEncounters: number;
    twoHoleEncounters: number;
}

export interface BiomeRule {
    type: string;
    args?: string[];
}

export interface MainObject {
    type: string;
    placement: string;
    placementArgs: string[];
    faction?: any;
    spawn?: string;
    owner?: string;
    guardChance: number;
    guardValue: number;
    guardWeeklyIncrement: number;
    guardRandomization: number;
    removeGuardIfHasOwner: boolean;
    isKeyObject: boolean;
    enableWeeklyUnitIncrement: boolean;
    initialUnitIncrement: number;
    buildingsConstructionSid?: string;
    buildingsBanSid?: string;
}

export interface RoadConfig {
    type: string;
    from: RoadTargetConfig;
    to: RoadTargetConfig;
}

export interface RoadTargetConfig {
    type: string;
    args: string[];
}

export interface PlacementRule {
    type: string;
    args?: string[];
    target: number;
    targetMin: number;
    targetMax: number;
    weight: number;
    sid?: string;
    mainObjectIndex: number;
    connectionIndex: number;
    mandatoryContentIndex: number;
}

export interface ZoneLayoutConfig {
    name: string;
    obstaclesFill: number;
    obstaclesFillVoid: number;
    lakesFill: number;
    minLakeArea: number;
    elevationClusterScale: number;
    elevationModes: any[];
    roadClusterArea: number;
    guardedEncounterResourceFractions: any;
    ambientPickupDistribution: any;
}

export interface MandatoryContentPreset {
    name: string;
    content: MandatoryContentItem[];
}

export interface MandatoryContentItem {
    name?: string;
    sid?: string;
    variant?: number;
    isGuarded?: boolean;
    owner?: string;
    isMine?: boolean;
    soloEncounter?: boolean;
    rules: PlacementRule[];
    includeLists: string[];
    weight?: number;
    content: ContentWeight[];
    designatedEncounter?: boolean;
}

export interface ContentCountLimitPreset {
    name: string;
    limits: ContentCountLimit[];
}

export interface ContentCountLimit {
    sid?: string;
    maxCount?: number;
    includeLists: string[];
    biome?: string;
    weight?: number;
}

export interface ContentPoolConfig {
    name: string;
    valueDistribution: any;
    groups: any[];
    bans: ContentID[];
}

export interface ContentList {
    name: string;
    content: ContentWeight[];
}

export interface ContentWeight {
    sid: string;
    weight: number;
}

export interface ContentID {
    sid: string;
    variant: number;
}

export interface GlobalBans {
    magics?: string[];
    items?: string[];
    skills?: string[];
    heroes?: string[];
    units?: string[];
}

export interface ContentValueOverride {
    sid: string;
    variant: number;
    goodsValue: number;
    guardValue: number;
    aiValue: number;
}