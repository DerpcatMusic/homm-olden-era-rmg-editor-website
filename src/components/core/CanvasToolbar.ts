// Toolbar component for canvas editing operations
// Provides UI controls for zoom, pan, and editing operations

export class CanvasToolbar {
    private container: HTMLElement;
    private onZoomIn: () => void;
    private onZoomOut: () => void;
    private onFitToView: () => void;
    private onCreateZone: () => void;
    private onDeleteSelected: () => void;

    constructor(
        container: HTMLElement,
        callbacks: {
            onZoomIn: () => void;
            onZoomOut: () => void;
            onFitToView: () => void;
            onCreateZone: () => void;
            onDeleteSelected: () => void;
        }
    ) {
        this.container = container;
        this.onZoomIn = callbacks.onZoomIn;
        this.onZoomOut = callbacks.onZoomOut;
        this.onFitToView = callbacks.onFitToView;
        this.onCreateZone = callbacks.onCreateZone;
        this.onDeleteSelected = callbacks.onDeleteSelected;

        this.createToolbar();
    }

    private createToolbar(): void {
        this.container.innerHTML = '';

        const toolbar = document.createElement('div');
        toolbar.className = 'canvas-toolbar';
        toolbar.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 8px;
            display: flex;
            gap: 8px;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        // Zoom controls
        const zoomInBtn = this.createButton('Zoom In (+)', '🔍+', this.onZoomIn);
        const zoomOutBtn = this.createButton('Zoom Out (-)', '🔍-', this.onZoomOut);
        const fitBtn = this.createButton('Fit to View', '📐', this.onFitToView);

        // Separator
        const separator1 = document.createElement('div');
        separator1.style.cssText = 'width: 1px; background: #ccc; margin: 0 4px;';

        // Edit controls
        const createZoneBtn = this.createButton('Create Zone', '➕', this.onCreateZone);
        const deleteBtn = this.createButton('Delete Selected', '🗑️', this.onDeleteSelected);

        toolbar.appendChild(zoomInBtn);
        toolbar.appendChild(zoomOutBtn);
        toolbar.appendChild(fitBtn);
        toolbar.appendChild(separator1);
        toolbar.appendChild(createZoneBtn);
        toolbar.appendChild(deleteBtn);

        this.container.appendChild(toolbar);
    }

    private createButton(title: string, text: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = text;
        button.title = title;
        button.style.cssText = `
            padding: 6px 12px;
            border: 1px solid #ccc;
            border-radius: 3px;
            background: white;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        `;

        button.onmouseover = () => button.style.backgroundColor = '#f0f0f0';
        button.onmouseout = () => button.style.backgroundColor = 'white';
        button.onclick = onClick;

        return button;
    }

    public updateSelection(hasSelection: boolean): void {
        // Update button states based on selection
        const buttons = this.container.querySelectorAll('button');
        const deleteBtn = buttons[buttons.length - 1] as HTMLButtonElement;
        deleteBtn.disabled = !hasSelection;
        deleteBtn.style.opacity = hasSelection ? '1' : '0.5';
    }

    public show(): void {
        this.container.style.display = 'block';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }
}