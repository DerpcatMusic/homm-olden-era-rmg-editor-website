// TypeScript interfaces and type definitions
// This file contains type definitions for the RMG editor

export interface Point {
    x: number;
    y: number;
}

export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

export interface EditorState {
    // TODO: Define editor state interface
}

export interface GameData {
    // TODO: Define game data interface
}

// Enums and types from C# MapGenerator
export enum ConnectionType {
    Default,
    Direct,
    GladiatorArena,
    Portal,
    Proximity
}

export enum MainObjectType {
    City,
    Spawn,
    AbandonedOutpost,
    GladiatorArena
}

export enum MainObjectPlacement {
    Uniform,
    Center,
    Connection,
    NearZone
}

export enum RoadType {
    Dirt,
    Stone
}

export enum RoadTargetType {
    Crossroads,
    MainObject,
    Connection,
    MandatoryContent
}

export enum PlacementRuleType {
    Random,
    Sid,
    MainObject,
    Crossroads,
    Connection,
    Road,
    MandatoryContent
}

export enum GatePlacement {
    Random,
    Center,
    NearZone
}

export enum InteractionLayout {
    CornerRight,
    CornerLeft,
    Bottom,
    All
}

export enum BiomeRuleType {
    FromList,
    MatchZone,
    MatchMainObject
}

export enum FactionRuleType {
    FromList,
    Match
}

export enum ESquadReactionType {
    Common,
    // Add other reaction types as needed
}

export enum ESpawn {
    Player1,
    Player2,
    Player3,
    Player4,
    Player5,
    Player6,
    Player7,
    Player8
}

// Classes and interfaces
export class Orientation {
    // TODO: Implement orientation properties
}

export class Border {
    // TODO: Implement border properties
}

export class RiverSettings {
    // TODO: Implement river settings
}

export class GameRules {
    heroHireBan: boolean = false;
    // TODO: Add other game rules
}

export class BanInfo {
    bannedMagics: string[] = [];
    bannedItems: string[] = [];
    bannedSkills: string[] = [];
    bannedHeroes: string[] = [];
    bannedUnits: string[] = [];
}

export class ValueOverrides {
    constructor(overrides: ContentValueOverride[]) {
        // TODO: Implement value overrides
    }
}

export class ZoneLayoutConfig {
    name: string = "";
    obstaclesFill: number = 0.4;
    obstaclesFillVoid: number = 0.5;
    lakesFill: number = 0;
    minLakeArea: number = 20;
    elevationClusterScale: number = 0.15;
    elevationModes: ZoneElevationMode[] = [new ZoneElevationMode()];
    roadClusterArea: number = 70;
    guardedEncounterResourceFractions: ResourceFractionDistribution = new ResourceFractionDistribution();
    ambientPickupDistribution: AmbientPickupDistribution = new AmbientPickupDistribution();
}

export class ZoneElevationMode {
    weight: number = 1;
    minElevatedFraction: number = 0;
    maxElevatedFraction: number = 1;
}

export class ResourceFractionDistribution {
    countBounds: number[] = [];
    fractions: number[] = [0.5];
}

export class AmbientPickupDistribution {
    repulsion: number = 1;
    noise: number = 0.2;
    roadAttraction: number = 0.5;
    obstacleAttraction: number = 0;
    groupSizeWeights: number[] = [4, 1, 1];
}

export class EncounterHolesSettings {
    affectedEncounters: number = 0.5;
    twoHoleEncounters: number = 0.25;
}

export class BiomeRule {
    type: BiomeRuleType = BiomeRuleType.MatchZone;
    args?: string[];
}

export class FactionRule {
    type: FactionRuleType = FactionRuleType.FromList;
    args?: string[];
}

export class RoadTargetConfig {
    type: RoadTargetType = RoadTargetType.Crossroads;
    args?: string[];
}

export class RoadConfig {
    type: RoadType = RoadType.Stone;
    from: RoadTargetConfig = new RoadTargetConfig();
    to: RoadTargetConfig = new RoadTargetConfig();
}

export class ContentID {
    sid?: string;
    variant: number = -1;
}

export class ContentWeight {
    sid?: string;
    variant: number = -1;
    biome?: string;
    weight: number = 1;
}

export class ContentValueOverride {
    sid?: string;
    variant: number = -1;
    goodsValue: number = 0;
    guardValue: number = 0;
    aiValue: number = 0;
}

export class ContentPoolConfig {
    name: string = "";
    valueDistribution: ValueDistributionConfig = new ValueDistributionConfig();
    groups: ContentPoolConfig.Group[] = [];
    bans: ContentID[] = [];
}

export namespace ContentPoolConfig {
    export class Group {
        weight: number = 1;
        includeLists: string[] = [];
        content: ContentWeight[] = [];
    }
}

export class ValueDistributionConfig {
    priceBounds: number[] = [];
    weights: number[] = [1];
}

export class ContentList {
    name: string = "";
    content: ContentWeight[] = [];
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

export class MandatoryContentPreset {
    name: string = "";
    content: MandatoryContent[] = [];
}

export class ContentCountLimit {
    content: ContentID[] = [];
    sid?: string;
    variant: number = -1;
    biome?: string;
    maxCount: number = 1;
}

export class ContentCountLimitPreset {
    name: string = "";
    limits: ContentCountLimit[] = [];
}

export class ContentTask {
    mandatory?: MapObjectDesc[][];
    guarded?: ContentTask.SlottedContent[];
    unguarded?: ContentTask.SlottedContent[];
    resources?: MapObjectDesc[][];
    limits?: Limits[];
}

export namespace ContentTask {
    export class SlottedContent {
        // TODO: Implement slotted content
    }
}

export class Limits {
    // TODO: Implement limits
}

export class MapObjectDesc {
    sid?: string;
    variant: number = 0;
    mapConfig?: any; // TODO: Define proper type
    metaObjectDesc?: any; // TODO: Define proper type
    logicConfig?: any; // TODO: Define proper type
    value: number = 0;
    guardValue: number = 0;

    IsNull(): boolean {
        return !this.sid;
    }
}

export class Content {
    objectDesc: MapObjectDesc = new MapObjectDesc();
    owner?: ESpawn;
    value: number = 0;
    guardValue: number = 0;
    canBeMoved: boolean = false;
    pool?: ContentPool;

    NeedsToPlaceMapObject(): boolean {
        return this.objectDesc.mapConfig != null;
    }

    static ObjectFromPool(objectDesc: MapObjectDesc, value: number, guardValue: number, canBeMoved: boolean, pool?: ContentPool): Content {
        return new Content(objectDesc, undefined, value, guardValue, canBeMoved, pool);
    }

    static Object(objectDesc: MapObjectDesc, owner?: ESpawn, value: number = 0, guardValue: number = 0, canBeMoved: boolean = false): Content {
        return new Content(objectDesc, owner, value, guardValue, canBeMoved, undefined);
    }

    static ValueOnly(value: number, guardValue: number): Content {
        return new Content(new MapObjectDesc(), undefined, value, guardValue, false, undefined);
    }

    constructor(objectDesc: MapObjectDesc, owner: ESpawn | undefined, value: number, guardValue: number, canBeMoved: boolean, pool: ContentPool | undefined) {
        this.objectDesc = objectDesc;
        this.owner = owner;
        this.value = value;
        this.guardValue = guardValue;
        this.canBeMoved = canBeMoved;
        this.pool = pool;
    }
}

export class ContentPool {
    config: ContentPoolConfig = new ContentPoolConfig();
    // TODO: Implement content pool methods
}

export class ContentWeightsTable {
    // TODO: Implement content weights table
}

export class ValueDistribution {
    constructor(config: ValueDistributionConfig, name: string) {
        // TODO: Implement value distribution
    }

    TargetPercentages: number[] = [];
    BracketCount: number = 0;

    Bracket(index: number): { x: number, y: number } {
        // TODO: Implement bracket method
        return { x: 0, y: 0 };
    }

    GetBracketForValue(value: number): number {
        // TODO: Implement get bracket for value
        return 0;
    }
}

export class ContentRegistry {
    // TODO: Implement content registry
}

export class ContentSlotsFiller {
    // TODO: Implement content slots filler
}

export class Encounter {
    // TODO: Implement encounter
}

export class EncounterTemplate {
    // TODO: Implement encounter template
}

export class BuildingSlot {
    position: Point = { x: 0, y: 0 };
    width: number = 1;
    height: number = 1;
    interaction: InteractionLayout = InteractionLayout.All;
}

export class PickupSlot {
    position: Point = { x: 0, y: 0 };
    isOptional: boolean = false;
    canBeHole: boolean = true;
}

export class GuardSlot {
    position: Point = { x: 0, y: 0 };
}

export class BuildingKey {
    constructor(width: number, height: number, interaction: InteractionLayout) {
        this.width = width;
        this.height = height;
        this.interact = interaction;
    }

    width: number;
    height: number;
    interact: InteractionLayout;
}

export class ContentLocality {
    // TODO: Implement content locality
}

export class SlotLocality {
    // TODO: Implement slot locality
}

export class MemoryPool<T> {
    // TODO: Implement memory pool
}

export class PooledArray<T> {
    // TODO: Implement pooled array
}

export class EncounterUtils {
    // TODO: Implement encounter utils
}

export class GridUtils {
    static CoordsToIndex(coords: Point, mapSize: Point): number {
        return coords.x + coords.y * mapSize.x;
    }

    static IndexToCoords(index: number, mapSize: Point): Point {
        return {
            x: index % mapSize.x,
            y: Math.floor(index / mapSize.x)
        };
    }
}

export class Direction {
    static FromIndex(index: number): Point {
        // TODO: Implement direction from index
        return { x: 0, y: 0 };
    }
}

export class Pathfinder<T> {
    // TODO: Implement pathfinder
}

export class EncounterNeighboursGetter {
    // TODO: Implement encounter neighbours getter
}

export class EncounterCostCalculator {
    // TODO: Implement encounter cost calculator
}

export class SquadParams {
    // TODO: Implement squad params
}

export class GeneratorConfig {
    // TODO: Implement generator config
}

export class GeneratorException extends Error {
    // TODO: Implement generator exception
}

export class Layout {
    // TODO: Implement layout
}

export class ZoneMap {
    // TODO: Implement zone map
}

export class ReadOnlyArray<T> {
    // TODO: Implement readonly array
}

export enum ObstacleState {
    Free = 0,
    AlwaysFree = 1,
    AlwaysObstacle = 2,
    Reserved = 3,
    ReservedWalkable = 4,
    ReservedRoadTarget = 5,
    NoEncounters = 6
}

export namespace ObstacleState {
    export function IsFreeForEncounter(state: ObstacleState): boolean {
        return state === ObstacleState.AlwaysFree || state === ObstacleState.ReservedWalkable;
    }
}

export class MapData {
    // TODO: Implement map data
}

export class MetaInfo {
    // TODO: Implement meta info
}

export class MapDataMiscSpawn {
    // TODO: Implement map data misc spawn
}

export enum ESpawnPointType {
    City
}

export enum EMapGameMode {
    Classic
}