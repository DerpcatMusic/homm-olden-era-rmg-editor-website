// Geometric calculation utilities
// This file contains functions for geometric operations used in the RMG editor

export function distance(p1: Point, p2: Point): number {
    // TODO: Calculate Euclidean distance between two points
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function pointInRectangle(point: Point, rect: Rectangle): boolean {
    // TODO: Check if point is inside rectangle
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
}

export function rectanglesOverlap(rect1: Rectangle, rect2: Rectangle): boolean {
    // TODO: Check if two rectangles overlap
    return !(rect1.x + rect1.width < rect2.x ||
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y ||
             rect2.y + rect2.height < rect1.y);
}

export function getBoundingBox(points: Point[]): Rectangle {
    // TODO: Calculate bounding box for array of points
    if (points.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    for (const point of points) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

export function clampPointToRectangle(point: Point, rect: Rectangle): Point {
    // TODO: Clamp point to be within rectangle bounds
    return {
        x: Math.max(rect.x, Math.min(rect.x + rect.width, point.x)),
        y: Math.max(rect.y, Math.min(rect.y + rect.height, point.y))
    };
}

export function lerp(a: number, b: number, t: number): number {
    // TODO: Linear interpolation between two values
    return a + (b - a) * t;
}

export function normalizeAngle(angle: number): number {
    // TODO: Normalize angle to 0-360 degrees
    angle = angle % 360;
    return angle < 0 ? angle + 360 : angle;
}

export function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

export function radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
}

// TODO: Import Point and Rectangle from models
interface Point {
    x: number;
    y: number;
}

interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}