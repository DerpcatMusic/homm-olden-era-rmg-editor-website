// Event communication system
// This class handles event-based communication between components

export class EventBus {
    private listeners: Map<string, EventListener[]> = new Map();

    constructor() {
        // TODO: Initialize event bus
    }

    public on(event: string, listener: EventListener): () => void {
        // TODO: Register event listener and return unsubscribe function
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        this.listeners.get(event)!.push(listener);

        return () => {
            this.off(event, listener);
        };
    }

    public off(event: string, listener: EventListener): void {
        // TODO: Remove event listener
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(listener);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
    }

    public emit(event: string, data?: any): void {
        // TODO: Emit event to all registered listeners
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`Error in event listener for '${event}':`, error);
                }
            });
        }
    }

    public clear(): void {
        // TODO: Remove all listeners
        this.listeners.clear();
    }

    public getListenerCount(event: string): number {
        // TODO: Get number of listeners for an event
        return this.listeners.get(event)?.length || 0;
    }

    public getAllEvents(): string[] {
        // TODO: Get list of all registered events
        return Array.from(this.listeners.keys());
    }
}

type EventListener = (data?: any) => void;