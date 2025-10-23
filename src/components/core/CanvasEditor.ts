// Main visual editing interface for zones and connections
// This class handles the HTML5 canvas for RMG template editing

import { EventBus } from '../../store/EventBus';
import { StateManager } from '../../store/StateManager';
import { Zone, Connection, RMGTemplate } from '../../models/rmg';
import { distance, pointInRectangle } from '../../utils/geometry';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasStatusBar } from './CanvasStatusBar';

interface Point {
    x: number;
    y: number;
}

interface CanvasTransform {
    zoom: number;
    panX: number;
    panY: number;
}

interface SelectionState {
    selectedZone: number | null;
    selectedConnection: number | null;
    isDragging: boolean;
    dragStart: Point | null;
    dragOffset: Point | null;
}

export class CanvasEditor {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private eventBus: EventBus;
    private stateManager: StateManager;
    private toolbar: CanvasToolbar | null = null;
    private statusBar: CanvasStatusBar | null = null;

    // View transformation
    private transform: CanvasTransform = {
        zoom: 1,
        panX: 0,
        panY: 0
    };

    // Interaction state
    private selection: SelectionState = {
        selectedZone: null,
        selectedConnection: null,
        isDragging: false,
        dragStart: null,
        dragOffset: null
    };

    // Mouse state
    private isMouseDown: boolean = false;
    private lastMousePos: Point = { x: 0, y: 0 };

    // Zone positions (for layout)
    private zonePositions: Map<number, Point> = new Map();

    // Constants
    private readonly ZONE_RADIUS = 30;
    private readonly CONNECTION_WIDTH = 3;
    private readonly MIN_ZOOM = 0.1;
    private readonly MAX_ZOOM = 5.0;
    private readonly ZOOM_FACTOR = 1.2;

    constructor(canvas: HTMLCanvasElement, eventBus: EventBus, stateManager: StateManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.eventBus = eventBus;
        this.stateManager = stateManager;

        this.initializeCanvas();
        this.setupEventHandlers();
        this.setupStateObservers();
        this.initializeZonePositions();
        this.initializeToolbar();
        this.initializeStatusBar();
    }

    private initializeCanvas(): void {
        // Set canvas size to match container
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Enable high DPI support
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // Set canvas styles
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    private setupEventHandlers(): void {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

        // Window resize
        window.addEventListener('resize', this.onResize.bind(this));
    }

    private setupStateObservers(): void {
        this.stateManager.subscribe({
            onStateChange: (oldState, newState) => {
                if (oldState.currentTemplate !== newState.currentTemplate) {
                    this.onTemplateChanged(newState.currentTemplate);
                }
            }
        });
    }

    private initializeZonePositions(): void {
        // Initialize zone positions in a circular layout
        // This is a simple layout algorithm - could be improved
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        const centerX = this.canvas.width / 4; // Divide by 4 to account for DPR scaling
        const centerY = this.canvas.height / 4;
        const radius = Math.min(centerX, centerY) * 0.6;

        (template as any).variants[0]?.zones.forEach((zone: any, index: number) => {
            const angle = (index / (template as any).variants[0].zones.length) * 2 * Math.PI;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            this.zonePositions.set(index, { x, y });
        });
    }

    private onTemplateChanged(template: RMGTemplate | null | undefined): void {
        if (template) {
            this.initializeZonePositions();
        } else {
            this.zonePositions.clear();
        }
        this.render();
    }

    private onMouseDown(event: MouseEvent): void {
        const point = this.getCanvasPoint(event);
        this.isMouseDown = true;
        this.lastMousePos = point;

        // Check for zone selection
        const template = this.stateManager.getCurrentTemplate();
        if (template) {
            const variant = (template as any).variants[0];
            if (variant) {
                // Check zones
                for (let i = 0; i < variant.zones.length; i++) {
                    const zonePos = this.zonePositions.get(i);
                    if (zonePos && distance(point, zonePos) <= this.ZONE_RADIUS) {
                        this.selection.selectedZone = i;
                        this.selection.selectedConnection = null;
                        this.selection.isDragging = true;
                        this.selection.dragStart = point;
                        this.selection.dragOffset = {
                            x: zonePos.x - point.x,
                            y: zonePos.y - point.y
                        };
                        this.eventBus.emit('canvas:zone-selected', { zoneIndex: i });
                        this.updateToolbarState();
                        this.updateStatusBar();
                        this.render();
                        return;
                    }
                }

                // Check connections
                for (let i = 0; i < variant.connections.length; i++) {
                    const connection = variant.connections[i];
                    const fromPos = this.zonePositions.get(connection.from);
                    const toPos = this.zonePositions.get(connection.to);
                    if (fromPos && toPos && this.isPointOnConnection(point, fromPos, toPos)) {
                        this.selection.selectedConnection = i;
                        this.selection.selectedZone = null;
                        this.eventBus.emit('canvas:connection-selected', { connectionIndex: i });
                        this.updateToolbarState();
                        this.updateStatusBar();
                        this.render();
                        return;
                    }
                }
            }
        }

        // Clear selection if clicking empty space
        this.selection.selectedZone = null;
        this.selection.selectedConnection = null;
        this.render();
    }

    private onMouseMove(event: MouseEvent): void {
        const point = this.getCanvasPoint(event);

        if (this.isMouseDown && !this.selection.isDragging) {
            // Pan the view
            const dx = point.x - this.lastMousePos.x;
            const dy = point.y - this.lastMousePos.y;
            this.pan(dx, dy);
        } else if (this.selection.isDragging && this.selection.selectedZone !== null && this.selection.dragOffset) {
            // Drag selected zone
            const newPos = {
                x: point.x + this.selection.dragOffset.x,
                y: point.y + this.selection.dragOffset.y
            };
            this.zonePositions.set(this.selection.selectedZone, newPos);
            this.render();
        }

        this.lastMousePos = point;
    }

    private onMouseUp(event: MouseEvent): void {
        this.isMouseDown = false;
        this.selection.isDragging = false;
        this.selection.dragStart = null;
        this.selection.dragOffset = null;
    }

    private onWheel(event: WheelEvent): void {
        event.preventDefault();
        const point = this.getCanvasPoint(event);

        if (event.deltaY < 0) {
            this.zoomIn(point);
        } else {
            this.zoomOut(point);
        }
    }

    private onTouchStart(event: TouchEvent): void {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.onMouseDown(mouseEvent);
        }
    }

    private onTouchMove(event: TouchEvent): void {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.onMouseMove(mouseEvent);
        }
    }

    private onTouchEnd(event: TouchEvent): void {
        event.preventDefault();
        const mouseEvent = new MouseEvent('mouseup');
        this.onMouseUp(mouseEvent);
    }

    private onResize(): void {
        this.initializeCanvas();
        this.render();
    }

    private getCanvasPoint(event: MouseEvent | WheelEvent): Point {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) / this.transform.zoom - this.transform.panX / this.transform.zoom,
            y: (event.clientY - rect.top) / this.transform.zoom - this.transform.panY / this.transform.zoom
        };
    }

    private isPointOnConnection(point: Point, from: Point, to: Point): boolean {
        const dist = distance(from, to);
        if (dist === 0) return false;

        const t = ((point.x - from.x) * (to.x - from.x) + (point.y - from.y) * (to.y - from.y)) / (dist * dist);
        const clampedT = Math.max(0, Math.min(1, t));

        const closest = {
            x: from.x + clampedT * (to.x - from.x),
            y: from.y + clampedT * (to.y - from.y)
        };

        return distance(point, closest) <= this.CONNECTION_WIDTH;
    }

    public render(): void {
        // Clear canvas
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        // Apply transformation
        this.ctx.save();
        this.ctx.translate(this.transform.panX, this.transform.panY);
        this.ctx.scale(this.transform.zoom, this.transform.zoom);

        const template = this.stateManager.getCurrentTemplate();
        if (template) {
            const variant = (template as any).variants[0];
            if (variant) {
                // Render connections first (behind zones)
                this.renderConnections(variant.connections);

                // Render zones
                this.renderZones(variant.zones);
            }
        }

        this.ctx.restore();
    }

    private renderZones(zones: Zone[]): void {
        zones.forEach((zone, index) => {
            const pos = this.zonePositions.get(index);
            if (!pos) return;

            // Zone circle
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, this.ZONE_RADIUS, 0, 2 * Math.PI);

            if (this.selection.selectedZone === index) {
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.strokeStyle = '#2E7D32';
            } else {
                this.ctx.fillStyle = '#2196F3';
                this.ctx.strokeStyle = '#0D47A1';
            }

            this.ctx.fill();
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Zone label
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(zone.name || `Zone ${index}`, pos.x, pos.y);
        });
    }

    private renderConnections(connections: Connection[]): void {
        connections.forEach((connection, index) => {
            const fromPos = this.zonePositions.get(connection.from);
            const toPos = this.zonePositions.get(connection.to);
            if (!fromPos || !toPos) return;

            this.ctx.beginPath();
            this.ctx.moveTo(fromPos.x, fromPos.y);
            this.ctx.lineTo(toPos.x, toPos.y);

            if (this.selection.selectedConnection === index) {
                this.ctx.strokeStyle = '#FF9800';
                this.ctx.lineWidth = this.CONNECTION_WIDTH + 2;
            } else {
                this.ctx.strokeStyle = '#757575';
                this.ctx.lineWidth = this.CONNECTION_WIDTH;
            }

            this.ctx.stroke();

            // Connection label
            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2;
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(connection.name || `Conn ${index}`, midX, midY);
        });
    }

    public zoomIn(center?: Point): void {
        this.setZoom(this.transform.zoom * this.ZOOM_FACTOR, center);
    }

    public zoomOut(center?: Point): void {
        this.setZoom(this.transform.zoom / this.ZOOM_FACTOR, center);
    }

    private setZoom(newZoom: number, center?: Point): void {
        const clampedZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, newZoom));
        if (clampedZoom === this.transform.zoom) return;

        if (center) {
            // Zoom towards mouse position
            const zoomRatio = clampedZoom / this.transform.zoom;
            this.transform.panX = center.x - (center.x - this.transform.panX) * zoomRatio;
            this.transform.panY = center.y - (center.y - this.transform.panY) * zoomRatio;
        }

        this.transform.zoom = clampedZoom;
        this.render();
    }

    public pan(dx: number, dy: number): void {
        this.transform.panX += dx;
        this.transform.panY += dy;
        this.render();
    }

    public fitToView(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        // Calculate bounds of all zones
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        this.zonePositions.forEach(pos => {
            minX = Math.min(minX, pos.x - this.ZONE_RADIUS);
            maxX = Math.max(maxX, pos.x + this.ZONE_RADIUS);
            minY = Math.min(minY, pos.y - this.ZONE_RADIUS);
            maxY = Math.max(maxY, pos.y + this.ZONE_RADIUS);
        });

        if (minX === Infinity) return;

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const canvasWidth = this.canvas.width / window.devicePixelRatio;
        const canvasHeight = this.canvas.height / window.devicePixelRatio;

        const scaleX = canvasWidth / contentWidth;
        const scaleY = canvasHeight / contentHeight;
        const scale = Math.min(scaleX, scaleY) * 0.8; // 80% to add some padding

        this.transform.zoom = scale;
        this.transform.panX = (canvasWidth - contentWidth * scale) / 2 - minX * scale;
        this.transform.panY = (canvasHeight - contentHeight * scale) / 2 - minY * scale;

        this.render();
    }

    public getSelectedZone(): number | null {
        return this.selection.selectedZone;
    }

    public getSelectedConnection(): number | null {
        return this.selection.selectedConnection;
    }

    public clearSelection(): void {
        this.selection.selectedZone = null;
        this.selection.selectedConnection = null;
        this.updateToolbarState();
        this.updateStatusBar();
        this.render();
    }

    private initializeToolbar(): void {
        // Create toolbar container
        const toolbarContainer = document.createElement('div');
        toolbarContainer.id = 'canvas-toolbar-container';
        toolbarContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;

        // Insert toolbar container into DOM (assuming canvas has a parent)
        const canvasParent = this.canvas.parentElement;
        if (canvasParent) {
            canvasParent.style.position = 'relative';
            canvasParent.appendChild(toolbarContainer);

            this.toolbar = new CanvasToolbar(toolbarContainer, {
                onZoomIn: () => this.zoomIn(),
                onZoomOut: () => this.zoomOut(),
                onFitToView: () => this.fitToView(),
                onCreateZone: () => this.eventBus.emit('zone:create'),
                onDeleteSelected: () => this.deleteSelected()
            });

            this.updateToolbarState();
        }
    }

    private updateToolbarState(): void {
        if (this.toolbar) {
            const hasSelection = this.selection.selectedZone !== null || this.selection.selectedConnection !== null;
            this.toolbar.updateSelection(hasSelection);
        }
    }

    private initializeStatusBar(): void {
        // Create status bar container
        const statusBarContainer = document.createElement('div');
        statusBarContainer.id = 'canvas-status-bar-container';
        statusBarContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;

        // Insert status bar container into DOM
        const canvasParent = this.canvas.parentElement;
        if (canvasParent) {
            canvasParent.appendChild(statusBarContainer);
            this.statusBar = new CanvasStatusBar(statusBarContainer);
            this.updateStatusBar();
        }
    }

    private updateStatusBar(): void {
        if (this.statusBar) {
            this.statusBar.updateSelection(
                this.selection.selectedZone,
                this.selection.selectedConnection,
                this.transform.zoom
            );
        }
    }

    private deleteSelected(): void {
        if (this.selection.selectedZone !== null) {
            this.eventBus.emit('zone:delete', { zoneIndex: this.selection.selectedZone });
            this.clearSelection();
        } else if (this.selection.selectedConnection !== null) {
            this.eventBus.emit('connection:delete', { connectionIndex: this.selection.selectedConnection });
            this.clearSelection();
        }
    }
}