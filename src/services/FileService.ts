// File operations service
// This class handles local file I/O operations and local storage persistence

import { RMGTemplate } from '../models/rmg';
import { GameData } from '../models/types';
import { ValidationService } from './ValidationService';

export class FileService {
    private validationService: ValidationService;
    private readonly STORAGE_KEY_TEMPLATES = 'rmg_editor_templates';
    private readonly STORAGE_KEY_RECENT = 'rmg_editor_recent_templates';

    constructor(validationService?: ValidationService) {
        this.validationService = validationService || new ValidationService();
    }

    public async loadRMGFile(): Promise<RMGTemplate> {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.rmg.json,application/json';

            input.onchange = async (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (!file) {
                    reject(new Error('No file selected'));
                    return;
                }

                try {
                    // Validate file type and size
                    const isValid = await this.validateFileType(file);
                    if (!isValid) {
                        reject(new Error('Invalid file type or size. Please select a valid RMG JSON file under 10MB.'));
                        return;
                    }

                    const content = await this.readFileAsText(file);
                    const template = JSON.parse(content) as RMGTemplate;

                    // Validate template structure
                    const validationResult = await this.validationService.validateTemplate(template);
                    if (!validationResult.isValid) {
                        const errors = validationResult.errors
                            .filter(error => error.severity === 'error')
                            .map(error => `${error.field}: ${error.message}`)
                            .join('\n');
                        reject(new Error(`Invalid RMG template:\n${errors}`));
                        return;
                    }

                    // Add to recent templates
                    this.addToRecentTemplates((template as any).name || 'Unknown Template', file.name);

                    resolve(template);
                } catch (error) {
                    if (error instanceof SyntaxError) {
                        reject(new Error('Invalid JSON format in the selected file.'));
                    } else {
                        reject(error);
                    }
                }
            };

            input.click();
        });
    }

    public async saveRMGFile(template: RMGTemplate, filename: string): Promise<void> {
        try {
            // Validate template before saving
            const validationResult = await this.validationService.validateTemplate(template);
            if (!validationResult.isValid) {
                const errors = validationResult.errors
                    .filter(error => error.severity === 'error')
                    .map(error => `${error.field}: ${error.message}`)
                    .join('\n');
                throw new Error(`Cannot save invalid template:\n${errors}`);
            }

            const jsonString = JSON.stringify(template, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename.endsWith('.rmg.json') ? filename : `${filename}.rmg.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(link.href);

            // Save to local storage for template collection
            await this.saveTemplateToStorage(template, filename);

            // Show success feedback
            this.showUserFeedback(`Template "${(template as any).name || 'Unknown'}" saved successfully as ${filename}`, 'success');
        } catch (error) {
            this.showUserFeedback(`Failed to save template: ${(error as Error).message}`, 'error');
            throw error;
        }
    }

    private async readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    public async loadGameData(): Promise<GameData> {
        // Load game data files (Heroes OE configurations)
        // This might involve loading multiple JSON files or data sources
        // For now, return empty object as placeholder
        return {};
    }

    // Template collection management methods
    public async createTemplateCollection(name: string): Promise<string> {
        try {
            const collectionId = this.generateTemplateId(name, 'collection');
            const collection: TemplateCollection = {
                templates: [],
                lastUpdated: new Date()
            };

            localStorage.setItem(`${this.STORAGE_KEY_TEMPLATES}_${collectionId}`, JSON.stringify(collection));
            this.showUserFeedback(`Template collection "${name}" created successfully`, 'success');
            return collectionId;
        } catch (error) {
            this.showUserFeedback(`Failed to create template collection: ${(error as Error).message}`, 'error');
            throw error;
        }
    }

    public async addTemplateToCollection(collectionId: string, template: RMGTemplate, filename: string): Promise<void> {
        try {
            const collectionKey = `${this.STORAGE_KEY_TEMPLATES}_${collectionId}`;
            const stored = localStorage.getItem(collectionKey);
            if (!stored) {
                throw new Error('Template collection not found');
            }

            const collection: TemplateCollection = JSON.parse(stored);
            const templateId = this.generateTemplateId((template as any).name || 'Unknown', filename);

            const metadata: TemplateMetadata = {
                id: templateId,
                name: (template as any).name || 'Unknown Template',
                filename: filename,
                lastModified: new Date(),
                size: JSON.stringify(template).length
            };

            // Remove existing entry if it exists
            collection.templates = collection.templates.filter(t => t.id !== templateId);
            collection.templates.push(metadata);
            collection.lastUpdated = new Date();

            localStorage.setItem(collectionKey, JSON.stringify(collection));
            this.showUserFeedback(`Template added to collection successfully`, 'success');
        } catch (error) {
            this.showUserFeedback(`Failed to add template to collection: ${(error as Error).message}`, 'error');
            throw error;
        }
    }

    public getTemplateCollections(): { id: string; name: string; templateCount: number; lastUpdated: Date }[] {
        const collections: { id: string; name: string; templateCount: number; lastUpdated: Date }[] = [];

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${this.STORAGE_KEY_TEMPLATES}_`)) {
                    const collectionId = key.replace(`${this.STORAGE_KEY_TEMPLATES}_`, '');
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        const collection: TemplateCollection = JSON.parse(stored);
                        collections.push({
                            id: collectionId,
                            name: `Collection ${collectionId}`, // In a full implementation, we'd store the name
                            templateCount: collection.templates.length,
                            lastUpdated: new Date(collection.lastUpdated)
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load template collections:', error);
        }

        return collections;
    }

    public clearAllData(): void {
        try {
            // Clear all template-related data
            const keysToRemove: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith(this.STORAGE_KEY_TEMPLATES) || key === this.STORAGE_KEY_RECENT)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
            this.showUserFeedback('All template data cleared successfully', 'info');
        } catch (error) {
            this.showUserFeedback(`Failed to clear data: ${(error as Error).message}`, 'error');
        }
    }

    public async validateFileType(file: File): Promise<boolean> {
        const allowedTypes = ['application/json'];
        const allowedExtensions = ['.rmg.json', '.json'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        const hasValidType = allowedTypes.includes(file.type);
        const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        const hasValidSize = file.size <= maxSize && file.size > 0;

        return (hasValidType || hasValidExtension) && hasValidSize;
    }

    // Local storage operations for template collections
    private async saveTemplateToStorage(template: RMGTemplate, filename: string): Promise<void> {
        try {
            const collection = this.getTemplateCollection();
            const templateId = this.generateTemplateId(template.name, filename);

            const metadata: TemplateMetadata = {
                id: templateId,
                name: template.name,
                filename: filename,
                lastModified: new Date(),
                size: JSON.stringify(template).length
            };

            // Remove existing entry if it exists
            collection.templates = collection.templates.filter(t => t.id !== templateId);
            collection.templates.push(metadata);
            collection.lastUpdated = new Date();

            // Keep only the last 50 templates
            if (collection.templates.length > 50) {
                collection.templates = collection.templates.slice(-50);
            }

            localStorage.setItem(this.STORAGE_KEY_TEMPLATES, JSON.stringify(collection));
        } catch (error) {
            console.warn('Failed to save template to local storage:', error);
        }
    }

    private getTemplateCollection(): TemplateCollection {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY_TEMPLATES);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert date strings back to Date objects
                parsed.lastUpdated = new Date(parsed.lastUpdated);
                parsed.templates = parsed.templates.map((t: any) => ({
                    ...t,
                    lastModified: new Date(t.lastModified)
                }));
                return parsed;
            }
        } catch (error) {
            console.warn('Failed to load template collection from storage:', error);
        }

        return {
            templates: [],
            lastUpdated: new Date()
        };
    }

    public getSavedTemplates(): TemplateMetadata[] {
        return this.getTemplateCollection().templates;
    }

    public async loadTemplateFromStorage(templateId: string): Promise<RMGTemplate | null> {
        try {
            const collection = this.getTemplateCollection();
            const metadata = collection.templates.find(t => t.id === templateId);
            if (!metadata) return null;

            // For now, we can't load the actual template data from localStorage
            // as we only store metadata. In a full implementation, we'd store the template data too
            // or reconstruct it from the file system
            return null;
        } catch (error) {
            console.warn('Failed to load template from storage:', error);
            return null;
        }
    }

    public deleteTemplateFromStorage(templateId: string): void {
        try {
            const collection = this.getTemplateCollection();
            collection.templates = collection.templates.filter(t => t.id !== templateId);
            collection.lastUpdated = new Date();
            localStorage.setItem(this.STORAGE_KEY_TEMPLATES, JSON.stringify(collection));
        } catch (error) {
            console.warn('Failed to delete template from storage:', error);
        }
    }

    // Recent templates management
    private addToRecentTemplates(templateName: string, filename: string): void {
        try {
            const recent = this.getRecentTemplates();
            const recentTemplate: RecentTemplate = {
                name: templateName,
                filename: filename,
                loadedAt: new Date()
            };

            // Remove existing entry
            const filtered = recent.filter(t => t.name !== templateName);
            filtered.unshift(recentTemplate);

            // Keep only the last 10 recent templates
            const limited = filtered.slice(0, 10);

            localStorage.setItem(this.STORAGE_KEY_RECENT, JSON.stringify(limited));
        } catch (error) {
            console.warn('Failed to add to recent templates:', error);
        }
    }

    public getRecentTemplates(): RecentTemplate[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY_RECENT);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.map((t: any) => ({
                    ...t,
                    loadedAt: new Date(t.loadedAt)
                }));
            }
        } catch (error) {
            console.warn('Failed to load recent templates:', error);
        }
        return [];
    }

    // User feedback mechanism
    private showUserFeedback(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
        // Dispatch custom event for UI feedback
        const event = new CustomEvent('file-service-feedback', {
            detail: { message, type }
        });
        window.dispatchEvent(event);

        // Also log to console
        const logMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
        console[logMethod](`[FileService] ${message}`);
    }

    // Utility methods
    private generateTemplateId(name: string, filename: string): string {
        return btoa(`${name}_${filename}_${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '');
    }
}

// Template collection interfaces
export interface TemplateMetadata {
    id: string;
    name: string;
    filename: string;
    lastModified: Date;
    size: number;
}

export interface TemplateCollection {
    templates: TemplateMetadata[];
    lastUpdated: Date;
}

// Recent templates interface
export interface RecentTemplate {
    name: string;
    filename: string;
    loadedAt: Date;
}