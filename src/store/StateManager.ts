// Application state management
// This class handles centralized application state with reactive updates

export class StateManager {
    private state: EditorState;
    private observers: StateObserver[] = [];

    constructor(initialState: EditorState) {
        this.state = { ...initialState };
    }

    public getState(): EditorState {
        return { ...this.state };
    }

    public updateState(updates: Partial<EditorState>): void {
        // TODO: Update state and notify observers
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };

        // Notify observers of changes
        this.notifyObservers(oldState, this.state);
    }

    public subscribe(observer: StateObserver): () => void {
        // TODO: Add observer and return unsubscribe function
        this.observers.push(observer);

        return () => {
            const index = this.observers.indexOf(observer);
            if (index > -1) {
                this.observers.splice(index, 1);
            }
        };
    }

    private notifyObservers(oldState: EditorState, newState: EditorState): void {
        // TODO: Notify all observers of state changes
        this.observers.forEach(observer => {
            observer.onStateChange(oldState, newState);
        });
    }

    public getCurrentTemplate(): any {
        // TODO: Get current RMG template from state
        return this.state.currentTemplate || null;
    }

    public setCurrentTemplate(template: any): void {
        // TODO: Update current template in state
        this.updateState({ currentTemplate: template });
    }

    public isDirty(): boolean {
        // TODO: Check if there are unsaved changes
        return this.state.hasUnsavedChanges || false;
    }

    public markClean(): void {
        // TODO: Mark state as clean (no unsaved changes)
        this.updateState({ hasUnsavedChanges: false });
    }

    public markDirty(): void {
        // TODO: Mark state as dirty (has unsaved changes)
        this.updateState({ hasUnsavedChanges: true });
    }
}

export interface EditorState {
    currentTemplate?: any;
    hasUnsavedChanges?: boolean;
    // TODO: Define additional state properties
}

interface StateObserver {
    onStateChange(oldState: EditorState, newState: EditorState): void;
}