// Test script to test export functionality without game data dependency
// This script tests the export conversion logic directly

const fs = require('fs');
const path = require('path');

// Import our services (compiled JavaScript)
const { ExportService } = require('./dist/services/ExportService');
const { ValidationService } = require('./dist/services/ValidationService');

async function testExportFunctionality() {
    console.log('Testing RMG Editor export functionality...\n');

    try {
        // Initialize services without game data service to avoid URL issues
        const validationService = new ValidationService();
        const exportService = new ExportService(validationService);

        // Test files
        const testFiles = [
            'Shamrock.rmg.json',
            'Memory Lane.rmg.json'
        ];

        for (const filename of testFiles) {
            console.log(`\n=== Testing export for ${filename} ===`);

            try {
                // Read the RMG file
                const filePath = path.join(__dirname, '..', filename);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const template = JSON.parse(fileContent);

                console.log(`✓ Successfully loaded ${filename}`);

                // Test the conversion logic directly (bypass validation that requires game data)
                console.log('\nTesting export conversion...');

                // Create a mock export service that skips validation
                const mockExportService = {
                    convertToRMGFormat: (template) => {
                        try {
                            console.log('Template structure check:');
                            console.log('- Has variants:', !!template.variants);
                            if (template.variants && template.variants.length > 0) {
                                console.log('- First variant has orientation:', !!template.variants[0].orientation);
                                console.log('- First variant has border:', !!template.variants[0].border);
                            }
                            return exportService.convertToRMGFormat(template);
                        } catch (error) {
                            console.log('Error in convertToRMGFormat:', error.message);
                            console.log('Error stack:', error.stack);
                            throw error;
                        }
                    },
                    downloadFile: (data, filename) => {
                        const jsonString = JSON.stringify(data, null, 2);
                        const exportPath = path.join(__dirname, filename);
                        fs.writeFileSync(exportPath, jsonString, 'utf8');
                        console.log(`✓ Exported file saved to ${exportPath}`);
                        return exportPath;
                    }
                };

                // Convert template to RMG format
                console.log('Converting template to RMG format...');
                const rmgJson = mockExportService.convertToRMGFormat(template);
                console.log('✓ Template converted to RMG format');

                // Verify the converted structure has expected properties
                const expectedProperties = [
                    'name', 'gameMode', 'sizeX', 'sizeZ', 'gameRules',
                    'variants', 'zoneLayouts', 'mandatoryContent', 'contentCountLimits'
                ];

                const missingProperties = expectedProperties.filter(prop => !(prop in rmgJson));
                if (missingProperties.length === 0) {
                    console.log('✓ Converted RMG JSON has all expected properties');
                } else {
                    console.log(`✗ Missing properties in converted RMG JSON: ${missingProperties.join(', ')}`);
                }

                // Check variants structure
                if (rmgJson.variants && Array.isArray(rmgJson.variants) && rmgJson.variants.length > 0) {
                    console.log(`✓ RMG JSON has ${rmgJson.variants.length} variant(s)`);

                    const variant = rmgJson.variants[0];
                    if (variant.zones && Array.isArray(variant.zones)) {
                        console.log(`✓ First variant has ${variant.zones.length} zone(s)`);
                    }

                    if (variant.connections && Array.isArray(variant.connections)) {
                        console.log(`✓ First variant has ${variant.connections.length} connection(s)`);
                    }
                } else {
                    console.log('✗ RMG JSON missing or invalid variants');
                }

                // Export the file
                const exportFilename = `${filename.replace('.rmg.json', '')}_exported_test.rmg.json`;
                const exportPath = mockExportService.downloadFile(rmgJson, exportFilename);

                // Verify exported file
                if (fs.existsSync(exportPath)) {
                    const exportedContent = fs.readFileSync(exportPath, 'utf8');
                    const exportedTemplate = JSON.parse(exportedContent);
                    console.log('✓ Exported file is valid JSON');
                    console.log(`  - Exported name: ${exportedTemplate.name}`);
                    console.log(`  - Exported size: ${exportedTemplate.sizeX}x${exportedTemplate.sizeZ}`);
                    console.log(`  - Exported variants: ${exportedTemplate.variants?.length || 0}`);
                } else {
                    console.log('✗ Exported file not found');
                }

            } catch (error) {
                console.log(`✗ Error testing export for ${filename}:`, error.message);
            }
        }

        console.log('\n=== Export Testing Summary ===');
        console.log('RMG Editor export functionality testing completed.');

    } catch (error) {
        console.error('Fatal error during export testing:', error);
        process.exit(1);
    }
}

// Run the tests
testExportFunctionality().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});