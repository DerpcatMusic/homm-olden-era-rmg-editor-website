// JSON schema definitions for RMG templates
// This file contains validation schemas for RMG data structures

export const RMGTemplateSchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        description: { type: "string" },
        gameMode: { type: "string" },
        displayWinCondition: { type: "string" },
        sizeX: { type: "number", minimum: 1 },
        sizeZ: { type: "number", minimum: 1 },
        gameRules: { $ref: "#/definitions/GameRules" },
        globalBans: { $ref: "#/definitions/GlobalBans" },
        valueOverrides: {
            type: "array",
            items: { $ref: "#/definitions/ContentValueOverride" }
        },
        variants: {
            type: "array",
            items: { $ref: "#/definitions/Variant" }
        },
        zoneLayouts: {
            type: "array",
            items: { $ref: "#/definitions/ZoneLayoutConfig" }
        },
        mandatoryContent: {
            type: "array",
            items: { $ref: "#/definitions/MandatoryContentPreset" }
        },
        contentCountLimits: {
            type: "array",
            items: { $ref: "#/definitions/ContentCountLimitPreset" }
        },
        contentPools: {
            type: "array",
            items: { $ref: "#/definitions/ContentPoolConfig" }
        },
        contentLists: {
            type: "array",
            items: { $ref: "#/definitions/ContentList" }
        }
    },
    required: ["name", "sizeX", "sizeZ", "variants"],
    definitions: {
        GameRules: {
            type: "object",
            properties: {
                heroHireBan: { type: "boolean" }
            }
        },
        GlobalBans: {
            type: "object",
            properties: {
                magics: { type: "array", items: { type: "string" } },
                items: { type: "array", items: { type: "string" } },
                skills: { type: "array", items: { type: "string" } },
                heroes: { type: "array", items: { type: "string" } },
                units: { type: "array", items: { type: "string" } }
            }
        },
        ContentValueOverride: {
            type: "object",
            properties: {
                sid: { type: "string" },
                variant: { type: "number", default: -1 },
                goodsValue: { type: "number", default: 0 },
                guardValue: { type: "number", default: 0 },
                aiValue: { type: "number", default: 0 }
            }
        },
        Variant: {
            type: "object",
            properties: {
                orientation: { $ref: "#/definitions/Orientation" },
                border: { $ref: "#/definitions/Border" },
                river: { $ref: "#/definitions/RiverSettings" },
                zones: {
                    type: "array",
                    items: { $ref: "#/definitions/Zone" }
                },
                connections: {
                    type: "array",
                    items: { $ref: "#/definitions/Connection" }
                }
            }
        },
        Orientation: {
            type: "object",
            properties: {
                // TODO: Add orientation properties
            }
        },
        Border: {
            type: "object",
            properties: {
                // TODO: Add border properties
            }
        },
        RiverSettings: {
            type: "object",
            properties: {
                // TODO: Add river settings properties
            }
        },
        Zone: {
            type: "object",
            properties: {
                name: { type: "string" },
                size: { type: "number", minimum: 0, default: 1 },
                layout: { type: "string" },
                mainObjects: {
                    type: "array",
                    items: { $ref: "#/definitions/MainObject" }
                },
                zoneBiome: { $ref: "#/definitions/BiomeRule" },
                contentBiome: { $ref: "#/definitions/BiomeRule" },
                metaObjectsBiome: { $ref: "#/definitions/BiomeRule" },
                crossroadsPosition: { type: "number", default: -1 },
                guardedContentPool: {
                    type: "array",
                    items: { type: "string" },
                    default: ["content_pool_default_guarded"]
                },
                unguardedContentPool: {
                    type: "array",
                    items: { type: "string" },
                    default: ["content_pool_default_unguarded"]
                },
                resourcesContentPool: {
                    type: "array",
                    items: { type: "string" },
                    default: ["content_pool_default_resources"]
                },
                guardedContentValue: { type: "number", default: 0 },
                guardedContentValuePerArea: { type: "number", default: 0 },
                unguardedContentValue: { type: "number", default: 0 },
                unguardedContentValuePerArea: { type: "number", default: 0 },
                resourcesValue: { type: "number", default: 0 },
                resourcesValuePerArea: { type: "number", default: 0 },
                randomHireEnableWeeklyUnitIncrement: { type: "boolean", default: true },
                randomHireInitialUnitIncrement: { type: "number", default: 1 },
                diplomacyModifier: { type: "number", default: 0 },
                guardCutoffValue: { type: "number", default: 0 },
                guardMultiplier: { type: "number", default: 1 },
                guardRandomization: { type: "number", default: 0.1 },
                guardWeeklyIncrement: { type: "number", default: 0 },
                guardReactionDistribution: {
                    type: "array",
                    items: { type: "number" },
                    default: [1, 1, 1, 1, 1, 0]
                },
                encounterHolesSettings: { $ref: "#/definitions/EncounterHolesSettings" },
                roads: {
                    type: "array",
                    items: { $ref: "#/definitions/Road" }
                },
                mandatoryContent: {
                    type: "array",
                    items: { type: "string" }
                },
                contentCountLimits: {
                    type: "array",
                    items: { type: "string" }
                }
            }
        },
        MainObject: {
            type: "object",
            properties: {
                type: { type: "string", enum: ["City", "Spawn", "AbandonedOutpost", "GladiatorArena"] },
                spawn: { type: "string" },
                owner: { type: "string" },
                isKeyObject: { type: "boolean", default: false },
                placement: { type: "string", enum: ["Uniform", "Center", "Connection", "NearZone"] },
                placementArgs: {
                    type: "array",
                    items: { type: "string" }
                },
                faction: { $ref: "#/definitions/FactionRule" },
                enableWeeklyUnitIncrement: { type: "boolean", default: true },
                initialUnitIncrement: { type: "number", default: 1 },
                guardChance: { type: "number", default: 1 },
                guardValue: { type: "number", default: 0 },
                guardWeeklyIncrement: { type: "number", default: 0 },
                guardRandomization: { type: "number", default: 0.1 },
                removeGuardIfHasOwner: { type: "boolean", default: false },
                buildingsConstructionSid: { type: "string" },
                buildingsBanSid: { type: "string" },
                holdCityWinCon: { type: "boolean", default: false }
            }
        },
        BiomeRule: {
            type: "object",
            properties: {
                type: { type: "string", enum: ["FromList", "MatchZone", "MatchMainObject"] },
                args: {
                    type: "array",
                    items: { type: "string" }
                }
            }
        },
        FactionRule: {
            type: "object",
            properties: {
                type: { type: "string", enum: ["FromList", "Match"] },
                args: {
                    type: "array",
                    items: { type: "string" }
                }
            }
        },
        EncounterHolesSettings: {
            type: "object",
            properties: {
                affectedEncounters: { type: "number", default: 0.5 },
                twoHoleEncounters: { type: "number", default: 0.25 }
            }
        },
        Road: {
            type: "object",
            properties: {
                roadType: { type: "string", enum: ["Dirt", "Stone"] },
                typeFrom: { type: "string", enum: ["Crossroads", "MainObject", "Connection", "MandatoryContent"] },
                indexFrom: { type: "number", default: 0 },
                typeTo: { type: "string", enum: ["Crossroads", "MainObject", "Connection", "MandatoryContent"] },
                indexTo: { type: "number", default: 0 }
            }
        },
        Connection: {
            type: "object",
            properties: {
                name: { type: "string" },
                from: { type: "number", default: 0 },
                to: { type: "number", default: 0 },
                connectionType: { type: "string", enum: ["Default", "Direct", "GladiatorArena", "Portal", "Proximity"] },
                length: { type: "number", default: 0 },
                portalFromEnabled: { type: "boolean", default: true },
                portalToEnabled: { type: "boolean", default: true },
                guardZone: { type: "number", default: 0 },
                guardValue: { type: "number", default: 0 },
                guardWeeklyIncrement: { type: "number", default: 0 },
                guardReaction: { type: "string" },
                guardEscape: { type: "boolean", default: true },
                guardMatchGroup: { type: "string" },
                gatePlacement: { type: "string", enum: ["Random", "Center", "NearZone"] },
                gatePlacementArgs: {
                    type: "array",
                    items: { type: "string" }
                },
                portalPlacementRulesFrom: {
                    type: "array",
                    items: { $ref: "#/definitions/PlacementRule" }
                },
                portalPlacementRulesTo: {
                    type: "array",
                    items: { $ref: "#/definitions/PlacementRule" }
                }
            }
        },
        PlacementRule: {
            type: "object",
            properties: {
                type: { type: "string", enum: ["Random", "Sid", "MainObject", "Crossroads", "Connection", "Road", "MandatoryContent"] },
                target: { type: "number", default: 0 },
                targetMin: { type: "number", default: 0 },
                targetMax: { type: "number", default: 0 },
                weight: { type: "number", default: 1 },
                sid: { type: "string" },
                mainObjectIndex: { type: "number", default: 0 },
                connectionIndex: { type: "number", default: 0 },
                mandatoryContentIndex: { type: "number", default: 0 }
            }
        },
        ZoneLayoutConfig: {
            type: "object",
            properties: {
                name: { type: "string" },
                obstaclesFill: { type: "number", default: 0.4 },
                obstaclesFillVoid: { type: "number", default: 0.5 },
                lakesFill: { type: "number", default: 0 },
                minLakeArea: { type: "number", default: 20 },
                elevationClusterScale: { type: "number", default: 0.15 },
                elevationModes: {
                    type: "array",
                    items: { $ref: "#/definitions/ZoneElevationMode" }
                },
                roadClusterArea: { type: "number", default: 70 },
                guardedEncounterResourceFractions: { $ref: "#/definitions/ResourceFractionDistribution" },
                ambientPickupDistribution: { $ref: "#/definitions/AmbientPickupDistribution" }
            }
        },
        ZoneElevationMode: {
            type: "object",
            properties: {
                weight: { type: "number", default: 1 },
                minElevatedFraction: { type: "number", default: 0 },
                maxElevatedFraction: { type: "number", default: 1 }
            }
        },
        ResourceFractionDistribution: {
            type: "object",
            properties: {
                countBounds: {
                    type: "array",
                    items: { type: "number" }
                },
                fractions: {
                    type: "array",
                    items: { type: "number" },
                    default: [0.5]
                }
            }
        },
        AmbientPickupDistribution: {
            type: "object",
            properties: {
                repulsion: { type: "number", default: 1 },
                noise: { type: "number", default: 0.2 },
                roadAttraction: { type: "number", default: 0.5 },
                obstacleAttraction: { type: "number", default: 0 },
                groupSizeWeights: {
                    type: "array",
                    items: { type: "number" },
                    default: [4, 1, 1]
                }
            }
        },
        MandatoryContentPreset: {
            type: "object",
            properties: {
                name: { type: "string" },
                content: {
                    type: "array",
                    items: { $ref: "#/definitions/MandatoryContent" }
                }
            }
        },
        MandatoryContent: {
            type: "object",
            properties: {
                name: { type: "string" },
                includeLists: {
                    type: "array",
                    items: { type: "string" }
                },
                content: {
                    type: "array",
                    items: { $ref: "#/definitions/ContentWeight" }
                },
                sid: { type: "string" },
                variant: { type: "number", default: -1 },
                rules: {
                    type: "array",
                    items: { $ref: "#/definitions/PlacementRule" }
                },
                designatedEncounter: { type: "boolean", default: true },
                soloEncounter: { type: "boolean", default: false },
                isGuarded: { type: "boolean", default: true },
                isMine: { type: "boolean", default: false },
                owner: { type: "string" }
            }
        },
        ContentWeight: {
            type: "object",
            properties: {
                sid: { type: "string" },
                variant: { type: "number", default: -1 },
                biome: { type: "string" },
                weight: { type: "number", default: 1 }
            }
        },
        ContentCountLimitPreset: {
            type: "object",
            properties: {
                name: { type: "string" },
                limits: {
                    type: "array",
                    items: { $ref: "#/definitions/ContentCountLimit" }
                }
            }
        },
        ContentCountLimit: {
            type: "object",
            properties: {
                content: {
                    type: "array",
                    items: { $ref: "#/definitions/ContentID" }
                },
                sid: { type: "string" },
                variant: { type: "number", default: -1 },
                biome: { type: "string" },
                maxCount: { type: "number", default: 1 }
            }
        },
        ContentID: {
            type: "object",
            properties: {
                sid: { type: "string" },
                variant: { type: "number", default: -1 }
            }
        },
        ContentPoolConfig: {
            type: "object",
            properties: {
                name: { type: "string" },
                valueDistribution: { $ref: "#/definitions/ValueDistributionConfig" },
                groups: {
                    type: "array",
                    items: { $ref: "#/definitions/ContentPoolConfigGroup" }
                },
                bans: {
                    type: "array",
                    items: { $ref: "#/definitions/ContentID" }
                }
            }
        },
        ContentPoolConfigGroup: {
            type: "object",
            properties: {
                weight: { type: "number", default: 1 },
                includeLists: {
                    type: "array",
                    items: { type: "string" }
                },
                content: {
                    type: "array",
                    items: { $ref: "#/definitions/ContentWeight" }
                }
            }
        },
        ValueDistributionConfig: {
            type: "object",
            properties: {
                priceBounds: {
                    type: "array",
                    items: { type: "number" }
                },
                weights: {
                    type: "array",
                    items: { type: "number" },
                    default: [1]
                }
            }
        },
        ContentList: {
            type: "object",
            properties: {
                name: { type: "string" },
                content: {
                    type: "array",
                    items: { $ref: "#/definitions/ContentWeight" }
                }
            }
        }
    }
};

export const ZoneSchema = RMGTemplateSchema.definitions.Zone;
export const ConnectionSchema = RMGTemplateSchema.definitions.Connection;
export const MainObjectSchema = RMGTemplateSchema.definitions.MainObject;