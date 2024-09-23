import {DisplayConstants} from "./Constants";

export class Vector2D {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(other: Vector2D): Vector2D {
        return new Vector2D(this.x + other.x, this.y + other.y);
    }

    subtract(other: Vector2D): Vector2D {
        return new Vector2D(this.x - other.x, this.y - other.y);
    }

    multiply(scalar: number): Vector2D {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    divide(scalar: number): Vector2D {
        if (scalar === 0) {
            throw new Error("Division by zero is not allowed.");
        }
        return new Vector2D(this.x / scalar, this.y / scalar);
    }

    abs(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    norm(): Vector2D {
        return this.divide(this.abs());
    }

    extend(extensionLength: number): Vector2D {
        return this.add(this.norm().multiply(extensionLength));
    }
}

export class GameCoordinate {
    vector: Vector2D;
    private static readonly BOARD_SIZE: number = 17;
    private static readonly LIMITS: number[][] = [
        [4, 5], [4, 6], [4, 7], [4, 8], [0, 13], [1, 13], [2, 13], [3, 13], [4, 13],
        [4, 14], [4, 15], [4, 16], [4, 17], [9, 13], [10, 13], [11, 13], [12, 13],
    ];

    constructor(vector: Vector2D) {
        if (!GameCoordinate.isValid(vector)) throw new Error("Invalid GameCoordinate");
        this.vector = vector;
    }

    static fromCoordinates(x: number, y: number): GameCoordinate {
        return new GameCoordinate(new Vector2D(x, y));
    }

    get x(): number {
        return this.vector.x;
    }

    get y(): number {
        return this.vector.y;
    }

    private static isValid(coordinate: Vector2D): boolean {
        return 0 <= coordinate.x && coordinate.x < this.BOARD_SIZE &&
            this.LIMITS[coordinate.x][0] <= coordinate.y && coordinate.y < this.LIMITS[coordinate.x][1];
    }

    private static allValid(): GameCoordinate[] {
        let validCoordinates: GameCoordinate[] = [];
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            for (let j = this.LIMITS[i][0]; j < this.LIMITS[i][1]; j++) {
                validCoordinates.push(new GameCoordinate(new Vector2D(i, j)));
            }
        }
        return validCoordinates;
    }

    toDisplayCoordinate(): DisplayCoordinate {
        const {
            CIR_DIAMETER, CIR_H_PADDING, CIR_V_PADDING, BOARD_H_PADDING, BOARD_V_PADDING
        } = DisplayConstants;
        const offset = -Math.floor(this.vector.y / 2) + (this.vector.y % 2 === 0 ? 2 : 1.5);
        return new DisplayCoordinate(new Vector2D(
            (this.vector.x + offset) * (CIR_DIAMETER + CIR_H_PADDING) + BOARD_H_PADDING,
            this.vector.y * (CIR_DIAMETER + CIR_V_PADDING) + BOARD_V_PADDING
        ));
    }
}

export class DisplayCoordinate {
    vector: Vector2D

    constructor(vector: Vector2D) {
        this.vector = vector;
    }

    static fromCoordinates(x: number, y: number): DisplayCoordinate {
        return new DisplayCoordinate(new Vector2D(x, y));
    }

    get x(): number {
        return this.vector.x;
    }

    get y(): number {
        return this.vector.y;
    }
}