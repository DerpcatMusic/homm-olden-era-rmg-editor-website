// Application constants and configuration
// This file contains constant values used throughout the RMG editor

// Canvas and rendering constants
export const CANVAS_DEFAULT_WIDTH = 800;
export const CANVAS_DEFAULT_HEIGHT = 600;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5.0;
export const ZOOM_STEP = 0.1;

// Zone and connection constants
export const ZONE_MIN_SIZE = 10;
export const ZONE_MAX_SIZE = 1000;
export const CONNECTION_SNAP_DISTANCE = 20;
export const ZONE_DEFAULT_COLOR = '#4A90E2';

// Validation constants
export const MAX_TEMPLATE_SIZE_MB = 10;
export const VALIDATION_TIMEOUT_MS = 5000;

// UI constants
export const SIDEBAR_WIDTH = 300;
export const PROPERTY_PANEL_HEIGHT = 200;
export const TOOLBAR_HEIGHT = 40;

// File handling constants
export const SUPPORTED_FILE_TYPES = ['.rmg.json', '.json'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Game data constants
export const DEFAULT_MAP_SIZE = 72;
export const MIN_MAP_SIZE = 36;
export const MAX_MAP_SIZE = 144;

// Performance constants
export const VALIDATION_CACHE_SIZE = 100;
export const RENDER_THROTTLE_MS = 16; // ~60 FPS

// Default template structure
export const DEFAULT_TEMPLATE = {
    version: '1.0',
    name: 'New RMG Template',
    description: 'A new random map generator template',
    // TODO: Add default template structure
};

// Error messages
export const ERROR_MESSAGES = {
    FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
    INVALID_FILE_TYPE: 'Unsupported file type',
    VALIDATION_FAILED: 'Template validation failed',
    LOAD_FAILED: 'Failed to load template',
    SAVE_FAILED: 'Failed to save template',
    EXPORT_FAILED: 'Failed to export template',
};

// Success messages
export const SUCCESS_MESSAGES = {
    TEMPLATE_LOADED: 'Template loaded successfully',
    TEMPLATE_SAVED: 'Template saved successfully',
    TEMPLATE_EXPORTED: 'Template exported successfully',
    VALIDATION_PASSED: 'Validation passed',
};