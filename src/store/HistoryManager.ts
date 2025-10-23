// Undo/redo functionality
// This class manages the history of state changes for undo/redo operations

export class HistoryManager {
    private history: EditorState[] = [];
    private currentIndex: number = -1;
    private maxHistorySize: number = 50;

    constructor() {
        // TODO: Initialize history manager
    }

    public pushState(state: EditorState): void {
        // TODO: Add new state to history, removing any redo states
        // Remove any states after current index (for when we're not at the end)
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Add new state
        this.history.push({ ...state });
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    public canUndo(): boolean {
        return this.currentIndex > 0;
    }

    public canRedo(): boolean {
        return this.currentIndex < this.history.length - 1;
    }

    public undo(): EditorState | null {
        // TODO: Return previous state if available
        if (!this.canUndo()) return null;

        this.currentIndex--;
        return { ...this.history[this.currentIndex] };
    }

    public redo(): EditorState | null {
        // TODO: Return next state if available
        if (!this.canRedo()) return null;

        this.currentIndex++;
        return { ...this.history[this.currentIndex] };
    }

    public clear(): void {
        // TODO: Clear history
        this.history = [];
        this.currentIndex = -1;
    }

    public getHistorySize(): number {
        return this.history.length;
    }

    public getCurrentIndex(): number {
        return this.currentIndex;
    }
}

// TODO: Import EditorState from StateManager or models
interface EditorState {
    // TODO: Define EditorState interface
}