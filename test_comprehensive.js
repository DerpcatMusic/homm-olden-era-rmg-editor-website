// Comprehensive test suite for RMG Editor functionality
// This script runs all tests and validates core functionality

const fs = require('fs');
const path = require('path');

// Import our services (compiled JavaScript)
const { ExportService } = require('./dist/services/ExportService');
const { ValidationService } = require('./dist/services/ValidationService');

async function runComprehensiveTests() {
    console.log('='.repeat(60));
    console.log('COMPREHENSIVE RMG EDITOR TEST SUITE');
    console.log('='.repeat(60));
    console.log('');

    const testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
    };

    try {
        // Initialize services
        const validationService = new ValidationService();
        const exportService = new ExportService(validationService);

        console.log('✓ Services initialized successfully\n');

        // Test 1: File Loading
        console.log('TEST 1: File Loading');
        console.log('-'.repeat(30));

        const testFiles = [
            { name: 'Shamrock', path: path.resolve(__dirname, '..', 'Shamrock.rmg.json') },
            { name: 'Memory Lane', path: path.resolve(__dirname, '..', 'Memory Lane.rmg.json') }
        ];

        console.log('Test files paths:');
        testFiles.forEach(f => console.log(`  ${f.name}: ${f.path}`));
        console.log('');

        for (const testFile of testFiles) {
            testResults.total++;
            try {
                console.log(`Loading ${testFile.name} from: ${testFile.path}`);
                const content = fs.readFileSync(testFile.path, 'utf8');
                const data = JSON.parse(content);

                console.log(`✓ ${testFile.name}: Successfully loaded (${data.sizeX}x${data.sizeZ})`);
                testResults.passed++;
            } catch (error) {
                console.log(`✗ ${testFile.name}: Failed to load - ${error.message}`);
                testResults.failed++;
                testResults.errors.push(`File Loading - ${testFile.name}: ${error.message}`);
            }
        }
        console.log('');

        // Test 2: JSON Structure Validation
        console.log('TEST 2: JSON Structure Validation');
        console.log('-'.repeat(35));

        for (const testFile of testFiles) {
            testResults.total++;
            try {
                const content = fs.readFileSync(testFile.path, 'utf8');
                const data = JSON.parse(content);

                // Check required top-level properties
                const required = ['name', 'gameMode', 'sizeX', 'sizeZ', 'variants'];
                const missing = required.filter(prop => !(prop in data));

                if (missing.length === 0) {
                    console.log(`✓ ${testFile.name}: Valid JSON structure`);
                    testResults.passed++;
                } else {
                    console.log(`✗ ${testFile.name}: Missing properties: ${missing.join(', ')}`);
                    testResults.failed++;
                    testResults.errors.push(`JSON Structure - ${testFile.name}: Missing ${missing.join(', ')}`);
                }
            } catch (error) {
                console.log(`✗ ${testFile.name}: JSON validation failed - ${error.message}`);
                testResults.failed++;
                testResults.errors.push(`JSON Structure - ${testFile.name}: ${error.message}`);
            }
        }
        console.log('');

        // Test 3: Export Functionality
        console.log('TEST 3: Export Functionality');
        console.log('-'.repeat(25));

        for (const testFile of testFiles) {
            testResults.total++;
            try {
                const content = fs.readFileSync(testFile.path, 'utf8');
                const template = JSON.parse(content);

                // Create mock export service
                const mockExportService = {
                    convertToRMGFormat: (template) => {
                        return exportService.convertToRMGFormat(template);
                    },
                    downloadFile: (data, filename) => {
                        const exportPath = path.join(__dirname, filename);
                        fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), 'utf8');
                        return exportPath;
                    }
                };

                const rmgJson = mockExportService.convertToRMGFormat(template);
                const exportFilename = `${testFile.name.replace(' ', '_')}_comprehensive_test.rmg.json`;
                const exportPath = mockExportService.downloadFile(rmgJson, exportFilename);

                // Verify export
                const exportedContent = fs.readFileSync(exportPath, 'utf8');
                const exportedData = JSON.parse(exportedContent);

                if (exportedData.name && exportedData.variants) {
                    console.log(`✓ ${testFile.name}: Successfully exported`);
                    testResults.passed++;
                } else {
                    console.log(`✗ ${testFile.name}: Export structure invalid`);
                    testResults.failed++;
                    testResults.errors.push(`Export - ${testFile.name}: Invalid structure`);
                }
            } catch (error) {
                console.log(`✗ ${testFile.name}: Export failed - ${error.message}`);
                testResults.failed++;
                testResults.errors.push(`Export - ${testFile.name}: ${error.message}`);
            }
        }
        console.log('');

        // Test 4: C# Compatibility Structure
        console.log('TEST 4: C# Compatibility Structure');
        console.log('-'.repeat(32));

        for (const testFile of testFiles) {
            testResults.total++;
            try {
                const exportFilename = `${testFile.name.replace(' ', '_')}_comprehensive_test.rmg.json`;
                const exportPath = path.join(__dirname, exportFilename);

                if (!fs.existsSync(exportPath)) {
                    console.log(`✗ ${testFile.name}: Export file not found for compatibility test`);
                    testResults.failed++;
                    testResults.errors.push(`C# Compatibility - ${testFile.name}: Export file missing`);
                    continue;
                }

                const exportedContent = fs.readFileSync(exportPath, 'utf8');
                const data = JSON.parse(exportedContent);

                // Check C# MapDescription compatibility
                let isCompatible = true;
                const issues = [];

                // Required properties
                const requiredProps = ['name', 'sizeX', 'sizeZ', 'gameRules', 'variants'];
                for (const prop of requiredProps) {
                    if (!(prop in data)) {
                        isCompatible = false;
                        issues.push(`Missing ${prop}`);
                    }
                }

                // Variants structure
                if (data.variants && Array.isArray(data.variants)) {
                    const variant = data.variants[0];
                    if (variant) {
                        const variantProps = ['orientation', 'zones', 'connections'];
                        for (const prop of variantProps) {
                            if (!(prop in variant)) {
                                isCompatible = false;
                                issues.push(`Missing variant.${prop}`);
                            }
                        }
                    } else {
                        isCompatible = false;
                        issues.push('No variants found');
                    }
                } else {
                    isCompatible = false;
                    issues.push('Invalid variants structure');
                }

                if (isCompatible) {
                    console.log(`✓ ${testFile.name}: C# compatible structure`);
                    testResults.passed++;
                } else {
                    console.log(`✗ ${testFile.name}: C# compatibility issues: ${issues.join(', ')}`);
                    testResults.failed++;
                    testResults.errors.push(`C# Compatibility - ${testFile.name}: ${issues.join(', ')}`);
                }
            } catch (error) {
                console.log(`✗ ${testFile.name}: C# compatibility test failed - ${error.message}`);
                testResults.failed++;
                testResults.errors.push(`C# Compatibility - ${testFile.name}: ${error.message}`);
            }
        }
        console.log('');

        // Test 5: Data Integrity
        console.log('TEST 5: Data Integrity Checks');
        console.log('-'.repeat(25));

        for (const testFile of testFiles) {
            testResults.total++;
            try {
                const content = fs.readFileSync(testFile.path, 'utf8');
                const originalData = JSON.parse(content);

                const exportFilename = `${testFile.name.replace(' ', '_')}_comprehensive_test.rmg.json`;
                const exportPath = path.join(__dirname, exportFilename);
                const exportedContent = fs.readFileSync(exportPath, 'utf8');
                const exportedData = JSON.parse(exportedContent);

                // Check key data preservation
                let dataIntact = true;
                const integrityIssues = [];

                if (originalData.name !== exportedData.name) {
                    dataIntact = false;
                    integrityIssues.push('Name mismatch');
                }

                if (originalData.sizeX !== exportedData.sizeX || originalData.sizeZ !== exportedData.sizeZ) {
                    dataIntact = false;
                    integrityIssues.push('Size mismatch');
                }

                if (originalData.variants?.length !== exportedData.variants?.length) {
                    dataIntact = false;
                    integrityIssues.push('Variant count mismatch');
                }

                if (dataIntact) {
                    console.log(`✓ ${testFile.name}: Data integrity maintained`);
                    testResults.passed++;
                } else {
                    console.log(`✗ ${testFile.name}: Data integrity issues: ${integrityIssues.join(', ')}`);
                    testResults.failed++;
                    testResults.errors.push(`Data Integrity - ${testFile.name}: ${integrityIssues.join(', ')}`);
                }
            } catch (error) {
                console.log(`✗ ${testFile.name}: Data integrity check failed - ${error.message}`);
                testResults.failed++;
                testResults.errors.push(`Data Integrity - ${testFile.name}: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('Fatal error during comprehensive testing:', error);
        testResults.errors.push(`Fatal: ${error.message}`);
        testResults.failed++;
        testResults.total++;
    }

    // Print summary
    console.log('');
    console.log('='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.errors.length > 0) {
        console.log('');
        console.log('ERROR DETAILS:');
        testResults.errors.forEach((error, i) => {
            console.log(`${i + 1}. ${error}`);
        });
    }

    console.log('');
    if (testResults.failed === 0) {
        console.log('🎉 ALL TESTS PASSED! RMG Editor is fully functional.');
    } else {
        console.log('❌ Some tests failed. Please review the errors above.');
    }

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the comprehensive tests
runComprehensiveTests();