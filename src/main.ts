// Main entry point for the RMG Editor web application
// This file initializes the application and starts the main event loop

import { App } from './App';

async function main(): Promise<void> {
    try {
        console.log('Starting RMG Editor...');

        // Create and initialize the main application
        const app = new App();

        // Initialize the application
        await app.initialize();

        // Start the application
        await app.start();

        console.log('RMG Editor started successfully');

    } catch (error) {
        console.error('Failed to start RMG Editor:', error);

        // Show user-friendly error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Failed to start RMG Editor: ${errorMessage}`);

        // Exit with error code in Node.js environment
        if (typeof process !== 'undefined' && process.exit) {
            process.exit(1);
        }
    }
}

// Handle unhandled promise rejections
if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        console.error('Uncaught error:', event.error);
        event.preventDefault();
    });
}

// Start the application when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
} else {
    // For Node.js or other environments
    main();
}