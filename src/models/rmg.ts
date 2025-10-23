// Core RMG data structures and models
// This file contains the main data models for RMG templates

import {
    GameRules,
    Orientation,
    Border,
    RiverSettings,
    ValueOverrides,
    BanInfo,
    ContentTask,
    ZoneLayoutConfig,
    BiomeRule,
    EncounterHolesSettings,
    ConnectionType,
    ESquadReactionType,
    GatePlacement,
    MainObjectType,
    ESpawn,
    MainObjectPlacement,
    FactionRule,
    ContentWeight,
    RoadType,
    RoadTargetType,
    PlacementRuleType,
    ContentID,
    ContentValueOverride,
    MandatoryContentPreset,
    ContentCountLimitPreset,
    ContentPoolConfig,
    ContentList
} from './types';

export interface RMGTemplate {
    name: string;
    description: string;
    gameMode: string;
    displayWinCondition?: string;
    sizeX: number;
    sizeZ: number;
    gameRules: GameRules;
    globalBans: GlobalBans;
    valueOverrides: ContentValueOverride[];
    variants: Variant[];
    zoneLayouts: ZoneLayoutConfig[];
    mandatoryContent: MandatoryContentPreset[];
    contentCountLimits: ContentCountLimitPreset[];
    contentPools: ContentPoolConfig[];
    contentLists: ContentList[];
}

export interface Variant {
    orientation: Orientation;
    border: Border;
    river: RiverSettings;
    zones: Zone[];
    connections: Connection[];
}

export interface GlobalBans {
    magics: string[];
    items: string[];
    skills: string[];
    heroes: string[];
    units: string[];
}

export class MapDescription {
    template?: RMGTemplate;
    templateVariant: number = 0;
    name: string = "";
    sizeX: number = 128;
    sizeZ: number = 128;
    seed: number = 0;
    orientation: Orientation = new Orientation();
    border: Border = new Border();
    river: RiverSettings = new RiverSettings();
    gameRules: GameRules = new GameRules();
    valueOverrides: ValueOverrides = new ValueOverrides([]);
    banInfo: BanInfo = new BanInfo();
    heroPoolCount: number = 0;
    zones: Zone[] = [];
    connections: Connection[] = [];
    contentTask?: ContentTask;

    static readonly DefaultGuardReactionDistribution: number[] = [1, 1, 1, 1, 1, 0];
}

export class Zone {
    name: string = "";
    size: number = 1;
    layout?: ZoneLayoutConfig;
    mainObjects: MainObject[] = [];
    zoneBiome: BiomeRule = new BiomeRule();
    contentBiome: BiomeRule = new BiomeRule();
    metaObjectsBiome: BiomeRule = new BiomeRule();
    crossroadsPosition: number = -1;
    guardedContentPool: string[] = ["content_pool_default_guarded"];
    unguardedContentPool: string[] = ["content_pool_default_unguarded"];
    resourcesContentPool: string[] = ["content_pool_default_resources"];
    guardedContentValue: number = 0;
    guardedContentValuePerArea: number = 0;
    unguardedContentValue: number = 0;
    unguardedContentValuePerArea: number = 0;
    resourcesValue: number = 0;
    resourcesValuePerArea: number = 0;
    randomHireEnableWeeklyUnitIncrement: boolean = true;
    randomHireInitialUnitIncrement: number = 1;
    diplomacyModifier: number = 0;
    guardCutoffValue: number = 0;
    guardMultiplier: number = 1;
    guardRandomization: number = 0.1;
    guardWeeklyIncrement: number = 0;
    guardReactionDistribution: number[] = MapDescription.DefaultGuardReactionDistribution;
    encounterHolesSettings: EncounterHolesSettings = new EncounterHolesSettings();
    roads: Road[] = [];
    mandatoryContent: string[] = [];
    contentCountLimits: string[] = [];
}

export class Connection {
    name: string = "";
    from: number = 0;
    to: number = 0;
    connectionType: ConnectionType = ConnectionType.Default;
    length: number = 0;
    portalFromEnabled: boolean = true;
    portalToEnabled: boolean = true;
    guardZone: number = 0;
    guardValue: number = 0;
    guardWeeklyIncrement: number = 0;
    guardReaction: ESquadReactionType = ESquadReactionType.Common;
    guardEscape: boolean = true;
    guardMatchGroup?: string;
    gatePlacement: GatePlacement = GatePlacement.Random;
    gatePlacementArgs?: string[];
    portalPlacementRulesFrom: PlacementRule[] = [];
    portalPlacementRulesTo: PlacementRule[] = [];
}

export class MainObject {
    type: MainObjectType = MainObjectType.City;
    spawn?: ESpawn;
    owner?: ESpawn;
    isKeyObject: boolean = false;
    placement: MainObjectPlacement = MainObjectPlacement.Uniform;
    placementArgs?: string[];
    faction: FactionRule = new FactionRule();
    enableWeeklyUnitIncrement: boolean = true;
    initialUnitIncrement: number = 1;
    guardChance: number = 1;
    guardValue: number = 0;
    guardWeeklyIncrement: number = 0;
    guardRandomization: number = 0.1;
    removeGuardIfHasOwner: boolean = false;
    buildingsConstructionSid?: string;
    buildingsBanSid?: string;
    holdCityWinCon: boolean = false;
}

export class MandatoryContent {
    name: string = "";
    content: ContentWeight[] = [];
    sid?: string;
    variant: number = -1;
    rules: PlacementRule[] = [];
    designatedEncounter: boolean = true;
    soloEncounter: boolean = false;
    isGuarded: boolean = true;
    isMine: boolean = false;
    owner?: ESpawn;
}

export class Road {
    roadType: RoadType = RoadType.Stone;
    typeFrom: RoadTargetType = RoadTargetType.Crossroads;
    indexFrom: number = 0;
    typeTo: RoadTargetType = RoadTargetType.Crossroads;
    indexTo: number = 0;
}

export class PlacementRule {
    type: PlacementRuleType = PlacementRuleType.Random;
    target: number = 0;
    targetMin: number = 0;
    targetMax: number = 0;
    weight: number = 1;
    sid?: string;
    mainObjectIndex: number = 0;
    connectionIndex: number = 0;
    mandatoryContentIndex: number = 0;
    config?: any; // TODO: Define proper type
}

export class ContentCountLimit {
    content: ContentID[] = [];
    sid?: string;
    variant: number = -1;
    biome?: string;
    maxCount: number = 1;
}