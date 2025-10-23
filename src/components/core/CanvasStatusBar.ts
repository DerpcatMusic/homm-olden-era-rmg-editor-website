// Status bar component for canvas editor
// Displays current selection, zoom level, and other status information

export class CanvasStatusBar {
    private container: HTMLElement;
    private statusText!: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.createStatusBar();
    }

    private createStatusBar(): void {
        this.container.innerHTML = '';

        const statusBar = document.createElement('div');
        statusBar.className = 'canvas-status-bar';
        statusBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.9);
            border-top: 1px solid #ccc;
            padding: 4px 12px;
            font-size: 12px;
            color: #666;
            z-index: 1000;
        `;

        this.statusText = document.createElement('span');
        this.statusText.textContent = 'Ready';
        statusBar.appendChild(this.statusText);

        this.container.appendChild(statusBar);
    }

    public updateStatus(text: string): void {
        this.statusText.textContent = text;
    }

    public updateSelection(selectedZone: number | null, selectedConnection: number | null, zoom: number): void {
        let status = `Zoom: ${(zoom * 100).toFixed(0)}%`;

        if (selectedZone !== null) {
            status += ` | Selected Zone: ${selectedZone}`;
        } else if (selectedConnection !== null) {
            status += ` | Selected Connection: ${selectedConnection}`;
        } else {
            status += ' | No selection';
        }

        this.updateStatus(status);
    }

    public show(): void {
        this.container.style.display = 'block';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }
}