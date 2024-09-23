import {DisplayableBase} from "./DisplayableBase";
import {DisplayCoordinate, GameCoordinate, Vector2D} from "./Coordinate";
import {Colors, Player} from "./Constants";

export class BackgroundDisplayer extends DisplayableBase {
    constructor() {
        super();
    }

    private static readonly HEXAGON_CORNERS: GameCoordinate[] = [
        [8, 12], [12, 12], [12, 8], [8, 4], [4, 4], [4, 8]
    ].map(([x, y]) => GameCoordinate.fromCoordinates(x, y));

    private static readonly TRIANGLE_CORNERS: { [key in Player]: GameCoordinate[] } = {
        [Player.SPECTATOR]: null,
        [Player.RED]: [[4, 0], [4, 3], [7, 3]].map(([x, y]) => GameCoordinate.fromCoordinates(x, y)),
        [Player.BLUE]: [[0, 4], [3, 7], [3, 4]].map(([x, y]) => GameCoordinate.fromCoordinates(x, y)),
        [Player.YELLOW]: [[4, 12], [7, 12], [4, 9]].map(([x, y]) => GameCoordinate.fromCoordinates(x, y)),
        [Player.GREEN]: [[9, 13], [12, 16], [12, 13]].map(([x, y]) => GameCoordinate.fromCoordinates(x, y)),
        [Player.ORANGE]: [[13, 12], [16, 12], [13, 9]].map(([x, y]) => GameCoordinate.fromCoordinates(x, y)),
        [Player.PURPLE]: [[12, 7], [9, 4], [12, 4]].map(([x, y]) => GameCoordinate.fromCoordinates(x, y))
    };

    private static getCentroidOf(coordinates: GameCoordinate[]): DisplayCoordinate {
        return new DisplayCoordinate(
            coordinates.reduce(
                (prev: Vector2D, curr: GameCoordinate) => prev.add(curr.toDisplayCoordinate().vector),
                new Vector2D(0, 0),
            ).divide(coordinates.length)
        );
    }

    private displayPolygon(coordinates: GameCoordinate[], extensionLength: number) {
        this.p5.beginShape();
        const centre: DisplayCoordinate = BackgroundDisplayer.getCentroidOf(coordinates);
        for (const coordinate: GameCoordinate of coordinates) {
            const nextVertex = coordinate.toDisplayCoordinate().vector
                .subtract(centre.vector)
                .extend(extensionLength)
                .add(centre.vector);
            this.p5.vertex(nextVertex.x, nextVertex.y);
        }
        this.p5.endShape(this.p5.CLOSE);
    }

    private displayHexagon() {
        this.p5.fill(Colors.GRAY_LIGHT);
        this.p5.stroke(Colors.GRAY);
        this.p5.strokeWeight(0.5);
        this.displayPolygon(BackgroundDisplayer.HEXAGON_CORNERS, 6);
    }

    private displayTriangles() {
        for (const player: Player of Object.keys(BackgroundDisplayer.TRIANGLE_CORNERS)) {
            if (player == Player.SPECTATOR) continue;
            this.p5.fill(Colors.PLAYER_LIGHT[player]);
            this.p5.stroke(Colors.PLAYER[player]);
            this.p5.strokeWeight(0.5);
            this.displayPolygon(BackgroundDisplayer.TRIANGLE_CORNERS[player], 10);
        }
    }

    doDisplay() {
        this.p5.background(Colors.BACKGROUND);
        this.displayHexagon();
        this.displayTriangles();
    }
}