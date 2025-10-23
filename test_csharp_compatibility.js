// Test script to verify C# compatibility of exported RMG files
// This script compares the exported JSON structure with C# MapDescription class

const fs = require('fs');
const path = require('path');

function testCSharpCompatibility() {
    console.log('Testing C# MapGenerator compatibility...\n');

    try {
        // Load exported files
        const shamrockPath = path.join(__dirname, 'Shamrock_exported_test.rmg.json');
        const memoryLanePath = path.join(__dirname, 'Memory Lane_exported_test.rmg.json');

        const shamrockData = JSON.parse(fs.readFileSync(shamrockPath, 'utf8'));
        const memoryLaneData = JSON.parse(fs.readFileSync(memoryLanePath, 'utf8'));

        const testFiles = [
            { name: 'Shamrock', data: shamrockData },
            { name: 'Memory Lane', data: memoryLaneData }
        ];

        for (const { name, data } of testFiles) {
            console.log(`\n=== Testing C# compatibility for ${name} ===`);

            // Test top-level properties
            const requiredTopLevelProps = [
                'name', 'gameMode', 'sizeX', 'sizeZ', 'gameRules',
                'variants'
            ];

            console.log('Checking top-level properties...');
            const missingTopLevel = requiredTopLevelProps.filter(prop => !(prop in data));
            if (missingTopLevel.length === 0) {
                console.log('✓ All required top-level properties present');
            } else {
                console.log(`✗ Missing top-level properties: ${missingTopLevel.join(', ')}`);
            }

            // Test variants structure
            if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
                console.log(`✓ Has ${data.variants.length} variant(s)`);

                const variant = data.variants[0];

                // Check variant properties
                const requiredVariantProps = ['orientation', 'border', 'zones', 'connections'];
                const missingVariantProps = requiredVariantProps.filter(prop => !(prop in variant));
                if (missingVariantProps.length === 0) {
                    console.log('✓ Variant has all required properties');
                } else {
                    console.log(`✗ Variant missing properties: ${missingVariantProps.join(', ')}`);
                }

                // Check orientation
                if (variant.orientation && typeof variant.orientation === 'object') {
                    console.log('✓ Orientation structure present');
                    if ('mode' in variant.orientation) {
                        console.log(`  - Mode: ${variant.orientation.mode}`);
                    }
                } else {
                    console.log('✗ Orientation structure missing or invalid');
                }

                // Check border
                if (variant.border && typeof variant.border === 'object') {
                    console.log('✓ Border structure present');
                    const borderProps = ['cornerRadius', 'obstaclesWidth', 'waterWidth'];
                    const presentBorderProps = borderProps.filter(prop => prop in variant.border);
                    console.log(`  - Border properties: ${presentBorderProps.join(', ')}`);
                } else {
                    console.log('✗ Border structure missing or invalid');
                }

                // Check zones
                if (variant.zones && Array.isArray(variant.zones)) {
                    console.log(`✓ Has ${variant.zones.length} zone(s)`);

                    // Check first zone structure
                    const firstZone = variant.zones[0];
                    if (firstZone) {
                        const requiredZoneProps = [
                            'name', 'size', 'mainObjects', 'zoneBiome', 'contentBiome',
                            'guardedContentValue', 'unguardedContentValue', 'resourcesValue'
                        ];
                        const presentZoneProps = requiredZoneProps.filter(prop => prop in firstZone);
                        console.log(`✓ First zone has ${presentZoneProps.length}/${requiredZoneProps.length} required properties`);

                        // Check mainObjects
                        if (firstZone.mainObjects && Array.isArray(firstZone.mainObjects)) {
                            console.log(`✓ Zone has ${firstZone.mainObjects.length} main object(s)`);
                            if (firstZone.mainObjects.length > 0) {
                                const mainObj = firstZone.mainObjects[0];
                                const mainObjProps = ['type', 'guardChance', 'guardValue'];
                                const presentMainObjProps = mainObjProps.filter(prop => prop in mainObj);
                                console.log(`✓ First main object has ${presentMainObjProps.length}/${mainObjProps.length} required properties`);
                            }
                        }
                    }
                }

                // Check connections
                if (variant.connections && Array.isArray(variant.connections)) {
                    console.log(`✓ Has ${variant.connections.length} connection(s)`);

                    if (variant.connections.length > 0) {
                        const firstConn = variant.connections[0];
                        const connProps = ['name', 'from', 'to', 'connectionType'];
                        const presentConnProps = connProps.filter(prop => prop in firstConn);
                        console.log(`✓ First connection has ${presentConnProps.length}/${connProps.length} required properties`);
                    }
                }

            } else {
                console.log('✗ Invalid or missing variants');
            }

            // Test gameRules compatibility
            if (data.gameRules && typeof data.gameRules === 'object') {
                console.log('✓ GameRules structure present');
                const gameRulesProps = ['heroCountMin', 'heroCountMax', 'winConditions'];
                const presentGameRulesProps = gameRulesProps.filter(prop => prop in data.gameRules);
                console.log(`✓ GameRules has ${presentGameRulesProps.length}/${gameRulesProps.length} key properties`);
            }

            // Test zoneLayouts compatibility
            if (data.zoneLayouts && Array.isArray(data.zoneLayouts)) {
                console.log(`✓ Has ${data.zoneLayouts.length} zone layout(s)`);
                if (data.zoneLayouts.length > 0) {
                    const layoutProps = ['name', 'obstaclesFill', 'lakesFill'];
                    const presentLayoutProps = layoutProps.filter(prop => prop in data.zoneLayouts[0]);
                    console.log(`✓ First zone layout has ${presentLayoutProps.length}/${layoutProps.length} required properties`);
                }
            }

            // Test mandatoryContent compatibility
            if (data.mandatoryContent && Array.isArray(data.mandatoryContent)) {
                console.log(`✓ Has ${data.mandatoryContent.length} mandatory content preset(s)`);
                if (data.mandatoryContent.length > 0) {
                    const preset = data.mandatoryContent[0];
                    if (preset.content && Array.isArray(preset.content)) {
                        console.log(`✓ First preset has ${preset.content.length} content item(s)`);
                        if (preset.content.length > 0) {
                            const item = preset.content[0];
                            const itemProps = ['sid', 'isGuarded', 'rules'];
                            const presentItemProps = itemProps.filter(prop => prop in item);
                            console.log(`✓ First content item has ${presentItemProps.length}/${itemProps.length} required properties`);
                        }
                    }
                }
            }

            console.log(`✓ ${name} export structure validation completed`);
        }

        console.log('\n=== C# Compatibility Testing Summary ===');
        console.log('C# MapGenerator compatibility testing completed.');
        console.log('Note: Full C# compatibility requires testing with actual C# MapGenerator code.');

    } catch (error) {
        console.error('Fatal error during C# compatibility testing:', error);
        process.exit(1);
    }
}

// Run the tests
testCSharpCompatibility().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});