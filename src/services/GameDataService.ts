// Game data integration service
// This class handles loading and managing Heroes OE game data

export class GameDataService {
    private gameData: GameData | null = null;
    private contentDatabase: ContentDatabase | null = null;
    private biomes: Biome[] = [];
    private factions: Faction[] = [];
    private contentMap: Map<string, Content> = new Map();
    // Local upload support
    private localFiles: Map<string, File> = new Map();
    private useLocalData: boolean = false;

    constructor() {
        // Initialize game data service
    }

    public async loadGameData(): Promise<void> {
        try {
            if (this.useLocalData && this.localFiles.size > 0) {
                console.log('Loading game data from uploaded folders...');
                await this.loadFromLocalFiles();
            } else {
                console.log('Loading game data from source directory...');
                await this.loadFromSourceDirectory();
            }

            // Build content map for quick lookups
            this.buildContentMap();

            // Extract biomes and factions
            this.extractBiomesAndFactions();

            console.log('Game data loaded successfully');
        } catch (error) {
            console.error('Failed to load game data:', error);
            throw new Error(`Game data loading failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async loadGameDataFromFiles(files: File[] | FileList): Promise<void> {
        // Index uploaded files by their webkitRelativePath (or name)
        this.localFiles.clear();
        const list = Array.from(files);
        for (const f of list) {
            const key = ('webkitRelativePath' in f && f.webkitRelativePath)
                ? f.webkitRelativePath.replace(/^[\\/]+/, '')
                : f.name;
            this.localFiles.set(key.replace(/\\/g, '/'), f);
        }
        this.useLocalData = true;
        await this.loadGameData();
    }

    private async loadFromSourceDirectory(): Promise<void> {
        const dataJson = await this.readJson('/source/DB/data.json');
        const statsJson = await this.readJson('/source/DB/stats/stats_info.json');
        const generatorConfigJson = await this.readJson('/source/generator/generator_config.json');

        // Initialize game data structure
        this.gameData = {
            biomes: [],
            factions: (dataJson?.fractions) || [],
            objects: [],
            metaObjects: [],
            waterTypes: [],
            stats: (statsJson?.array) || [],
            generatorConfig: generatorConfigJson
        };

        // Load factions data
        await this.loadFactionsData();

        // Load units data
        await this.loadUnitsData();

        // Load heroes data
        await this.loadHeroesData();

        // Load artifacts data
        await this.loadArtifactsData();

        // Load meta objects from generator config
        this.loadMetaObjects(generatorConfigJson);
    }

    private async loadFactionsData(): Promise<void> {
        // Load fractions configuration
        try {
            const fractionsJson = await this.readJson('/source/DB/fractions.json');
            this.gameData!.factions = (fractionsJson?.fractions) || this.gameData!.factions || [];
        } catch (error) {
            console.warn('Could not load fractions.json, using basic faction data');
        }
    }

    private async loadUnitsData(): Promise<void> {
        const unitPromises = [
            this.loadUnitFile('/source/DB/units/units_logics/dungeon/assassin_l.json'),
            this.loadUnitFile('/source/DB/units/units_logics/dungeon/medusa_upg_l.json'),
            this.loadUnitFile('/source/DB/units/units_logics/dungeon/trogl_l.json'),
            this.loadUnitFile('/source/DB/units/units_logics/undead/avatar_of_war_upg_alt_l.json'),
            this.loadUnitFile('/source/DB/units/units_logics/undead/flicker_l.json'),
            this.loadUnitFile('/source/DB/units/units_logics/undead/graverobber_l.json'),
            this.loadUnitFile('/source/DB/units/units_logics/unfrozen/eldritch_flyer_l.json'),
            this.loadUnitFile('/source/DB/units/units_logics/unfrozen/frostworm_rider_l.json'),
            this.loadUnitFile('/source/DB/units/units_logics/unfrozen/lesser_eldritch_l.json')
        ];

        const unitArrays = await Promise.all(unitPromises);
        this.gameData!.objects = unitArrays.flat();
    }

    private async loadUnitFile(path: string): Promise<GameObject[]> {
        try {
            const unitJson = await this.readJson(path);
            return unitJson?.array || [];
        } catch (error) {
            console.warn(`Could not load unit file ${path}:`, error);
            return [];
        }
    }

    private async loadHeroesData(): Promise<void> {
        const heroPromises = [
            this.loadHeroFile('/source/DB/heroes/humans/human_hero_1.json'),
            this.loadHeroFile('/source/DB/heroes/dungeon/dungeon_hero_1.json'),
            this.loadHeroFile('/source/DB/heroes/necros/necros_hero_1.json'),
            this.loadHeroFile('/source/DB/heroes/unfrozen/unfrozen_hero_1.json')
        ];

        const heroArrays = await Promise.all(heroPromises);
        const heroes = heroArrays.flat();

        // Add heroes to objects array
        this.gameData!.objects.push(...heroes);
    }

    private async loadHeroFile(path: string): Promise<GameObject[]> {
        try {
            const heroJson = await this.readJson(path);
            return heroJson?.array || [];
        } catch (error) {
            console.warn(`Could not load hero file ${path}:`, error);
            return [];
        }
    }

    private async loadArtifactsData(): Promise<void> {
        try {
            const artifactsJson = await this.readJson('/source/DB/items/items/right_hand.json');
            const artifacts = artifactsJson?.array || [];

            // Add artifacts to objects array
            this.gameData!.objects.push(...artifacts);
        } catch (error) {
            console.warn('Could not load artifacts data:', error);
        }
    }

    private loadMetaObjects(generatorConfig: any): void {
        const metaObjects: MetaObject[] = [];

        // Load meta objects from generator config
        if (generatorConfig.metaObjects) {
            generatorConfig.metaObjects.forEach((metaObj: any) => {
                metaObjects.push({
                    sid: metaObj.sid,
                    name: metaObj.sid,
                    type: metaObj.type,
                    isBuilding: false,
                    value: metaObj.value || 0,
                    guardValue: metaObj.guardValue || 0
                });
            });
        }

        this.gameData!.metaObjects = metaObjects;
    }

    private buildContentMap(): void {
        if (!this.gameData) return;

        this.contentMap.clear();

        // Add meta objects from generator config
        this.gameData.metaObjects.forEach(metaObj => {
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

        // Add game objects (units, heroes, artifacts)
        this.gameData.objects.forEach(obj => {
            const objId = obj.sid || obj.id || 'unknown';
            const objName = obj.name || obj.sid || obj.id || 'Unknown Object';
            const content: Content = {
                id: objId,
                name: objName,
                type: this.getObjectType(obj),
                sid: objId,
                isBuilding: this.isBuildingObject(obj),
                value: obj.value || 0,
                guardValue: obj.guardValue || 0,
                weight: 1
            };
            this.contentMap.set(objId, content);
        });
    }

    private getObjectType(obj: any): string {
        if (obj.classType) return 'hero';
        if (obj.slot_) return 'artifact';
        if (obj.fraction) return 'unit';
        return 'object';
    }

    private isBuildingObject(obj: any): boolean {
        // Check if object is a building based on its properties
        return obj.buildingSizeX !== undefined || obj.buildingSizeZ !== undefined;
    }

    private extractBiomesAndFactions(): void {
        if (!this.gameData) return;

        // Extract biomes from generator config water mappings
        if (this.gameData.generatorConfig?.waterForBiome) {
            this.biomes = Object.keys(this.gameData.generatorConfig.waterForBiome).map(biomeKey => ({
                id: biomeKey,
                name: biomeKey,
                biome: biomeKey,
                waterType: this.gameData!.generatorConfig!.waterForBiome[biomeKey]
            }));
        } else {
            this.biomes = [];
        }

        // Extract factions from data.json (factions is an array of strings)
        this.factions = (this.gameData.factions as unknown as string[])?.map(factionId => ({
            id: factionId,
            name: factionId,
            biome: this.getFactionBiome(factionId)
        })) || [];
    }

    private getFactionBiome(factionId: string): string {
        // Map factions to their native biomes based on typical Heroes game logic
        const factionBiomeMap: { [key: string]: string } = {
            'human': 'Grass',
            'undead': 'Deathland',
            'unfrozen': 'Snow',
            'dungeon': 'Dirt',
            'neutral': 'Grass',
            'mix': 'Grass'
        };
        return factionBiomeMap[factionId] || 'Grass';
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

    public getUnits(): Content[] {
        return Array.from(this.contentMap.values()).filter(content => content.type === 'unit');
    }

    // Local vs remote JSON reader
    private async readJson(path: string): Promise<any> {
        if (this.useLocalData && this.localFiles.size > 0) {
            // Normalize: remove leading "/source/" if present
            let candidate = path.replace(/^\/?source\//, '').replace(/^\/+/, '');
            candidate = candidate.replace(/\\/g, '/');

            // Try exact match
            let file = this.findLocalFile(candidate);
            if (!file) {
                // Also try without leading DB/ or generator/ if nested differently
                file = this.findLocalFile(candidate.split('/').slice(-2).join('/')) || this.findLocalFile(candidate.split('/').pop() || '');
            }
            if (!file) {
                throw new Error(`Local file not found: ${candidate}`);
            }
            const text = await file.text();
            return JSON.parse(text);
        } else {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} for ${path}`);
            }
            return response.json();
        }
    }

    private findLocalFile(relativePath: string): File | null {
        const norm = relativePath.replace(/\\/g, '/');
        if (this.localFiles.has(norm)) return this.localFiles.get(norm)!;
        // Fallback: search by suffix match
        for (const [key, value] of this.localFiles.entries()) {
            if (key.endsWith(norm)) return value;
        }
        // Fallback: search by filename only (last segment)
        const base = norm.split('/').pop();
        if (base) {
            for (const [key, value] of this.localFiles.entries()) {
                if (key.endsWith('/' + base) || key === base) return value;
            }
        }
        return null;
    }

    private async loadFromLocalFiles(): Promise<void> {
        // Mirror loadFromSourceDirectory but using local files map
        const dataJson = await this.readJson('DB/data.json');
        const statsJson = await this.readJson('DB/stats/stats_info.json');
        const generatorConfigJson = await this.readJson('generator/generator_config.json');

        this.gameData = {
            biomes: [],
            factions: (dataJson?.fractions) || [],
            objects: [],
            metaObjects: [],
            waterTypes: [],
            stats: (statsJson?.array) || [],
            generatorConfig: generatorConfigJson
        };

        await this.loadFactionsData();
        await this.loadUnitsData();
        await this.loadHeroesData();
        await this.loadArtifactsData();

        this.loadMetaObjects(generatorConfigJson);
    }

    public getHeroes(): Content[] {
        return Array.from(this.contentMap.values()).filter(content => content.type === 'hero');
    }

    public getArtifacts(): Content[] {
        return Array.from(this.contentMap.values()).filter(content => content.type === 'artifact');
    }

    public getObjectsByFaction(factionId: string): Content[] {
        return Array.from(this.contentMap.values()).filter(content => {
            const obj = this.gameData?.objects.find(o => (o.sid || o.id) === content.id);
            return obj?.fraction === factionId;
        });
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
    stats?: any[];
    generatorConfig?: any;
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
    sid?: string;
    id?: string;
    name?: string;
    type?: string;
    buildingSizeX?: number;
    buildingSizeZ?: number;
    value?: number;
    guardValue?: number;
    fraction?: string;
    classType?: string;
    slot_?: string;
    [key: string]: any; // Allow additional properties
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