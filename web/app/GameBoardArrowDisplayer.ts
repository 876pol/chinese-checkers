import {DisplayableBase} from "./DisplayableBase";
import {DisplayCoordinate, GameCoordinate, Vector2D} from "./Coordinate";

export class GameBoardArrowDisplayer extends DisplayableBase {
    private coordinateArr: GameCoordinate[];

    constructor(private color: string) {
        super();
        this.coordinateArr = [];
    }

    setCoordinateArr(coordinateArr: GameCoordinate[]) {
        this.coordinateArr = coordinateArr;
    }

    doDisplay() {
        this.p5.strokeWeight(4);
        this.p5.stroke(this.color);
        this.p5.fill(this.color);
        this.p5.noStroke();
        if (this.coordinateArr.length >= 1) {
            const c1: DisplayCoordinate = this.coordinateArr[0].toDisplayCoordinate()
            this.p5.circle(c1.x, c1.y, 8);
            if (this.coordinateArr.length >= 2) {
                const c2 = this.coordinateArr[this.coordinateArr.length - 1].toDisplayCoordinate();
                this.p5.circle(c2.x, c2.y, 8);
            }
        }
        for (let i = 1; i < this.coordinateArr.length; i++) {
            const from: DisplayCoordinate = this.coordinateArr[i - 1].toDisplayCoordinate();
            const to: DisplayCoordinate = this.coordinateArr[i].toDisplayCoordinate();
            this.p5.stroke(this.color);
            this.p5.line(from.x, from.y, to.x, to.y);

            this.p5.noStroke();
            this.p5.circle(to.x, to.y, 4);

            const m0: Vector2D = from.vector.add(to.vector).divide(2)
            const d0: Vector2D = to.vector.subtract(from.vector).divide(10);
            const mag: number = d0.abs();
            const d1: Vector2D = d0.multiply(8.5 / mag)
            const d2: Vector2D = d1.rotate(135);
            const d3: Vector2D = d1.rotate(-135);
            const m1: Vector2D = m0.add(d1.divide(5));

            const c1: Vector2D = m1.add(d1);
            const c2: Vector2D = m1.add(d2);
            const c3: Vector2D = m1.add(d3);

            this.p5.triangle(c1.x, c1.y, c2.x, c2.y, c3.x, c3.y);
        }
    }
}