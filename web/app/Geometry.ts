import {DisplayCoordinate, Vector2D} from "./Coordinate";

export interface Geometry {
    containsPoint(x: number, y: number): boolean;

    centre(): DisplayCoordinate;
}

export class RectangleGeometry implements Geometry {
    constructor(public topLeft: DisplayCoordinate,
                public bottomRight: DisplayCoordinate) {
    }

    height(): number {
        return this.bottomRight.y - this.topLeft.y;
    }

    width(): number {
        return this.bottomRight.x - this.topLeft.x;
    }

    containsPoint(x: number, y: number): boolean {
        return this.topLeft.x <= x && x <= this.bottomRight.x &&
            this.topLeft.y <= y && y <= this.bottomRight.y;
    }

    centre(): DisplayCoordinate {
        return DisplayCoordinate.fromCoordinates(
            (this.topLeft.x + this.bottomRight.x) / 2,
            (this.topLeft.y + this.bottomRight.y) / 2
        );
    }
}

export class TriangleGeometry implements Geometry {

    constructor(public p1: DisplayCoordinate,
                public p2: DisplayCoordinate,
                public p3: DisplayCoordinate) {
    }

    centre(): DisplayCoordinate {
        return DisplayCoordinate.fromCoordinates(
            this.p1.x + this.p2.x + this.p3.x,
            this.p1.y + this.p2.y + this.p3.y
        );
    }

    private triangleArea(p1: DisplayCoordinate,
                         p2: DisplayCoordinate,
                         p3: DisplayCoordinate): number {
        return Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2.0);
    }

    containsPoint(x: number, y: number): boolean {
        const displayCoord: DisplayCoordinate = DisplayCoordinate.fromCoordinates(x, y);
        const areaOrig = this.triangleArea(this.p1, this.p2, this.p3);
        const area1 = this.triangleArea(displayCoord, this.p1, this.p2);
        const area2 = this.triangleArea(displayCoord, this.p2, this.p3);
        const area3 = this.triangleArea(displayCoord, this.p3, this.p1);
        const totalArea = area1 + area2 + area3;

        const epsilon = 0.000001;
        return Math.abs(totalArea - areaOrig) < epsilon;
    }
}

export class CircleGeometry implements Geometry {
    constructor(private _centre: DisplayCoordinate, public radius: number) {

    }

    centre(): DisplayCoordinate {
        return this._centre;
    }

    containsPoint(x: number, y: number): boolean {
        return this._centre.vector.subtract(new Vector2D(x, y)).abs() < this.radius;
    }

}