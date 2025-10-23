// Game data integration service
// This class handles loading and managing Heroes OE game data

export class GameDataService {
    private gameData: GameData | null = null;
    private contentDatabase: ContentDatabase | null = null;
    private biomes: Biome[] = [];
    private factions: Faction[] = [];
    private contentMap: Map<string, Content> = new Map();

    constructor() {
        // Initialize game data service
    }

    public async loadGameData(): Promise<void> {
        try {
            console.log('Loading game data...');

            // For now, initialize with empty data to avoid blocking the app
            // TODO: Load actual game data when available
            this.gameData = {
                biomes: [],
                factions: [],
                objects: [],
                metaObjects: [],
                waterTypes: []
            };

            this.contentDatabase = {
                metaObjectsBySid: {},
                contentPools: {},
                biomes: [],
                factions: []
            };

            // Build content map for quick lookups
            this.buildContentMap();

            // Extract biomes and factions
            this.extractBiomesAndFactions();

            console.log('Game data loaded successfully (placeholder data)');
        } catch (error) {
            console.error('Failed to load game data:', error);
            throw new Error(`Game data loading failed: ${error}`);
        }
    }

    private buildContentMap(): void {
        if (!this.contentDatabase) return;

        this.contentMap.clear();

        // Add meta objects
        Object.values(this.contentDatabase.metaObjectsBySid).forEach(metaObj => {
            const content: Content = {
                id: metaObj.sid,
                name: metaObj.name || metaObj.sid,
                type: metaObj.type,
                sid: metaObj.sid,
                isBuilding: metaObj.isBuilding,
                value: metaObj.value || 0,
                guardValue: metaObj.guardValue || 0,
                biomeWeights: metaObj.biomeWeights || {}
            };
            this.contentMap.set(metaObj.sid, content);
        });

        // Add regular objects from content pools
        if (this.contentDatabase.contentPools) {
            Object.values(this.contentDatabase.contentPools).forEach(pool => {
                pool.groups?.forEach(group => {
                    group.content?.forEach(contentItem => {
                        const content: Content = {
                            id: contentItem.sid,
                            name: contentItem.sid, // TODO: Get proper name from config
                            type: this.isBuilding(contentItem.sid) ? 'building' : 'pickup',
                            sid: contentItem.sid,
                            weight: contentItem.weight || 1,
                            biomeWeights: {} // TODO: Extract from weights table
                        };
                        this.contentMap.set(contentItem.sid, content);
                    });
                });
            });
        }
    }

    private extractBiomesAndFactions(): void {
        if (!this.gameData) return;

        // Extract biomes
        this.biomes = this.gameData.biomes?.map(biome => ({
            id: biome.id,
            name: biome.name,
            biome: biome.biome,
            waterType: biome.waterType
        })) || [];

        // Extract factions
        this.factions = this.gameData.factions?.map(faction => ({
            id: faction.id,
            name: faction.name,
            biome: faction.biome
        })) || [];
    }

    private isBuilding(sid: string): boolean {
        if (!this.contentDatabase) return false;

        // Check building patterns (similar to C# implementation)
        const buildingPatterns = [
            'tower', 'fort', 'castle', 'dwelling', 'mine', 'portal', 'gate',
            'temple', 'shrine', 'monument', 'library', 'market', 'tavern'
        ];

        const sidLower = sid.toLowerCase();
        return buildingPatterns.some(pattern => sidLower.includes(pattern));
    }

    public getGameData(): GameData | null {
        return this.gameData;
    }

    public getContentDatabase(): ContentDatabase | null {
        return this.contentDatabase;
    }

    public getContentById(contentId: string): Content | null {
        return this.contentMap.get(contentId) || null;
    }

    public searchContent(query: string): Content[] {
        if (!query.trim()) return Array.from(this.contentMap.values());

        const lowerQuery = query.toLowerCase();
        return Array.from(this.contentMap.values()).filter(content =>
            content.id.toLowerCase().includes(lowerQuery) ||
            content.name.toLowerCase().includes(lowerQuery) ||
            content.type.toLowerCase().includes(lowerQuery)
        );
    }

    public getBiomes(): Biome[] {
        return [...this.biomes];
    }

    public getFactions(): Faction[] {
        return [...this.factions];
    }

    public validateContentAvailability(contentIds: string[]): ValidationResult {
        const errors: ValidationError[] = [];

        contentIds.forEach(contentId => {
            if (!this.contentMap.has(contentId)) {
                errors.push({
                    field: 'content',
                    message: `Content '${contentId}' not found in game database`,
                    severity: 'error'
                });
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    public getContentValue(sid: string): number {
        const content = this.getContentById(sid);
        return content?.value || 0;
    }

    public getContentGuardValue(sid: string): number {
        const content = this.getContentById(sid);
        return content?.guardValue || 0;
    }

    public isContentBuilding(sid: string): boolean {
        const content = this.getContentById(sid);
        return content?.isBuilding || false;
    }
}

// Game data interfaces
export interface GameData {
    biomes: GameBiome[];
    factions: GameFaction[];
    objects: GameObject[];
    metaObjects: MetaObject[];
    waterTypes: WaterType[];
}

export interface GameBiome {
    id: string;
    name: string;
    biome: string;
    waterType: string;
}

export interface GameFaction {
    id: string;
    name: string;
    biome: string;
}

export interface GameObject {
    sid: string;
    name: string;
    type: string;
    buildingSizeX?: number;
    buildingSizeZ?: number;
    value?: number;
    guardValue?: number;
}

export interface MetaObject {
    sid: string;
    name: string;
    type: string;
    isBuilding: boolean;
    value?: number;
    guardValue?: number;
    biomeWeights?: { [biome: string]: number };
}

export interface WaterType {
    name: string;
    id: number;
}

// Content database interface
export interface ContentDatabase {
    metaObjectsBySid: { [sid: string]: MetaObjectDesc };
    contentPools?: { [name: string]: ContentPool };
    biomes?: Biome[];
    factions?: Faction[];
}

export interface MetaObjectDesc {
    sid: string;
    name?: string;
    type: string;
    isBuilding: boolean;
    value?: number;
    guardValue?: number;
    biomeWeights?: { [biome: string]: number };
}

export interface ContentPool {
    name: string;
    valueDistribution: ValueDistribution;
    groups: ContentPoolGroup[];
    bans: ContentID[];
}

export interface ContentPoolGroup {
    content: ContentWeight[];
    includeLists: string[];
    weight: number;
}

export interface ContentWeight {
    sid: string;
    weight: number;
}

export interface ContentID {
    sid: string;
    variant: number;
}

export interface ValueDistribution {
    brackets: ValueBracket[];
}

export interface ValueBracket {
    min: number;
    max: number;
    weight: number;
}

// Content interface
export interface Content {
    id: string;
    name: string;
    type: string;
    sid: string;
    isBuilding?: boolean;
    value?: number;
    guardValue?: number;
    weight?: number;
    biomeWeights?: { [biome: string]: number };
}

// Biome interface
export interface Biome {
    id: string;
    name: string;
    biome: string;
    waterType: string;
}

// Faction interface
export interface Faction {
    id: string;
    name: string;
    biome: string;
}

// Validation interfaces
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}