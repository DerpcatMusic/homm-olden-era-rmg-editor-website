// Test script to load and validate RMG files
// This script tests the RMG Editor functionality with example files

const fs = require('fs');
const path = require('path');

// Import our services (compiled JavaScript)
const { ExportService } = require('./dist/services/ExportService');
const { ValidationService } = require('./dist/services/ValidationService');
const { GameDataService } = require('./dist/services/GameDataService');

async function testRMGFiles() {
    console.log('Starting RMG Editor testing...\n');

    try {
        // Initialize services
        const gameDataService = new GameDataService();
        const validationService = new ValidationService(gameDataService);
        const exportService = new ExportService(validationService, gameDataService);

        // Test files
        const testFiles = [
            'Shamrock.rmg.json',
            'Memory Lane.rmg.json'
        ];

        for (const filename of testFiles) {
            console.log(`\n=== Testing ${filename} ===`);

            try {
                // Read the RMG file
                const filePath = path.join(__dirname, '..', filename);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const template = JSON.parse(fileContent);

                console.log(`✓ Successfully loaded ${filename}`);
                console.log(`  - Name: ${template.name}`);
                console.log(`  - Size: ${template.sizeX}x${template.sizeZ}`);
                console.log(`  - Game Mode: ${template.gameMode}`);
                console.log(`  - Variants: ${template.variants?.length || 0}`);

                // Validate the template
                console.log('\nValidating template...');
                const validationResult = await validationService.validateTemplate(template);

                if (validationResult.isValid) {
                    console.log('✓ Template validation passed');
                } else {
                    console.log('✗ Template validation failed:');
                    validationResult.errors.forEach(error => {
                        console.log(`  - ${error.severity.toUpperCase()}: ${error.field} - ${error.message}`);
                    });
                }

                // Test export functionality
                console.log('\nTesting export functionality...');
                const exportFilename = `${filename.replace('.rmg.json', '')}_exported.rmg.json`;

                await exportService.exportTemplate(template, exportFilename);
                console.log(`✓ Template exported successfully to ${exportFilename}`);

                // Verify exported file exists and is valid JSON
                const exportedPath = path.join(__dirname, exportFilename);
                if (fs.existsSync(exportedPath)) {
                    const exportedContent = fs.readFileSync(exportedPath, 'utf8');
                    const exportedTemplate = JSON.parse(exportedContent);
                    console.log('✓ Exported file is valid JSON');
                    console.log(`  - Exported name: ${exportedTemplate.name}`);
                    console.log(`  - Exported size: ${exportedTemplate.sizeX}x${exportedTemplate.sizeZ}`);
                } else {
                    console.log('✗ Exported file not found');
                }

            } catch (error) {
                console.log(`✗ Error testing ${filename}:`, error.message);
            }
        }

        console.log('\n=== Testing Summary ===');
        console.log('RMG Editor testing completed.');

    } catch (error) {
        console.error('Fatal error during testing:', error);
        process.exit(1);
    }
}

// Run the tests
testRMGFiles().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});