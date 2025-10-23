// Validation helper functions
// This file contains utility functions for validation operations

export function isValidRMGTemplate(obj: any): obj is RMGTemplate {
    // TODO: Implement RMG template validation
    return true;
}

export function validateRequired(value: any, fieldName: string): ValidationError | null {
    // TODO: Check if required field is present and valid
    if (value === null || value === undefined || value === '') {
        return {
            field: fieldName,
            message: `${fieldName} is required`,
            severity: 'error'
        };
    }
    return null;
}

export function validateRange(value: number, min: number, max: number, fieldName: string): ValidationError | null {
    // TODO: Check if numeric value is within range
    if (typeof value !== 'number' || isNaN(value)) {
        return {
            field: fieldName,
            message: `${fieldName} must be a number`,
            severity: 'error'
        };
    }

    if (value < min || value > max) {
        return {
            field: fieldName,
            message: `${fieldName} must be between ${min} and ${max}`,
            severity: 'error'
        };
    }

    return null;
}

export function validateStringLength(value: string, minLength: number, maxLength: number, fieldName: string): ValidationError | null {
    // TODO: Check string length constraints
    if (typeof value !== 'string') {
        return {
            field: fieldName,
            message: `${fieldName} must be a string`,
            severity: 'error'
        };
    }

    if (value.length < minLength) {
        return {
            field: fieldName,
            message: `${fieldName} must be at least ${minLength} characters`,
            severity: 'error'
        };
    }

    if (value.length > maxLength) {
        return {
            field: fieldName,
            message: `${fieldName} must be no more than ${maxLength} characters`,
            severity: 'warning'
        };
    }

    return null;
}

export function combineValidationResults(...results: (ValidationError | null)[]): ValidationError[] {
    // TODO: Combine multiple validation results, filtering out nulls
    return results.filter((result): result is ValidationError => result !== null);
}

// Error boundary utilities
export class ErrorBoundary {
    private static instance: ErrorBoundary;
    private errorHandlers: ((error: Error, context?: any) => void)[] = [];

    static getInstance(): ErrorBoundary {
        if (!ErrorBoundary.instance) {
            ErrorBoundary.instance = new ErrorBoundary();
        }
        return ErrorBoundary.instance;
    }

    addErrorHandler(handler: (error: Error, context?: any) => void): void {
        this.errorHandlers.push(handler);
    }

    removeErrorHandler(handler: (error: Error, context?: any) => void): void {
        const index = this.errorHandlers.indexOf(handler);
        if (index > -1) {
            this.errorHandlers.splice(index, 1);
        }
    }

    handleError(error: Error, context?: any): void {
        console.error('Error boundary caught error:', error, context);

        // Call all registered handlers
        this.errorHandlers.forEach(handler => {
            try {
                handler(error, context);
            } catch (handlerError) {
                console.error('Error in error handler:', handlerError);
            }
        });

        // If no handlers caught it, re-throw
        if (this.errorHandlers.length === 0) {
            throw error;
        }
    }

    async wrapAsync<T>(fn: () => Promise<T>, context?: any): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            this.handleError(error as Error, context);
            throw error;
        }
    }

    wrapSync<T>(fn: () => T, context?: any): T {
        try {
            return fn();
        } catch (error) {
            this.handleError(error as Error, context);
            throw error;
        }
    }
}

// Performance monitoring utilities
export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private measurements: Map<string, number[]> = new Map();

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    startMeasurement(name: string): () => void {
        const startTime = performance.now();
        return () => {
            const endTime = performance.now();
            const duration = endTime - startTime;

            if (!this.measurements.has(name)) {
                this.measurements.set(name, []);
            }

            const measurements = this.measurements.get(name)!;
            measurements.push(duration);

            // Keep only last 100 measurements
            if (measurements.length > 100) {
                measurements.shift();
            }

            console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
        };
    }

    getAverageTime(name: string): number {
        const measurements = this.measurements.get(name);
        if (!measurements || measurements.length === 0) {
            return 0;
        }

        return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
    }

    getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
        const measurements = this.measurements.get(name);
        if (!measurements || measurements.length === 0) {
            return null;
        }

        return {
            avg: this.getAverageTime(name),
            min: Math.min(...measurements),
            max: Math.max(...measurements),
            count: measurements.length
        };
    }
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate: boolean = false
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };

        const callNow = immediate && !timeout;

        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(later, wait);

        if (callNow) {
            func(...args);
        }
    };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Memory usage monitoring
export class MemoryMonitor {
    private static instance: MemoryMonitor;
    private memoryHistory: number[] = [];
    private maxHistorySize = 50;

    static getInstance(): MemoryMonitor {
        if (!MemoryMonitor.instance) {
            MemoryMonitor.instance = new MemoryMonitor();
        }
        return MemoryMonitor.instance;
    }

    recordMemoryUsage(): void {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);

            this.memoryHistory.push(usedMB);

            if (this.memoryHistory.length > this.maxHistorySize) {
                this.memoryHistory.shift();
            }
        }
    }

    getCurrentMemoryUsage(): number {
        if ('memory' in performance) {
            return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
        }
        return 0;
    }

    getMemoryHistory(): number[] {
        return [...this.memoryHistory];
    }

    getAverageMemoryUsage(): number {
        if (this.memoryHistory.length === 0) return 0;
        return Math.round(this.memoryHistory.reduce((sum, mem) => sum + mem, 0) / this.memoryHistory.length);
    }
}

// TODO: Import types from models
interface RMGTemplate {
    // TODO: Define RMGTemplate interface
}

interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}