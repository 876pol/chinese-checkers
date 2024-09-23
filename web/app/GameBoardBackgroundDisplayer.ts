import {DisplayableBase} from "./DisplayableBase";
import {Player, GameConstants, DisplayConstants, Colors} from "./Constants";
import {DisplayCoordinate, GameCoordinate} from "./Coordinate";
import {CircleButtonDisplayer} from "./Button";
import {CircleGeometry} from "./Geometry";

export class GameBoardBackgroundDisplayer extends DisplayableBase {
    private buttonDisplayerArr: CircleButtonDisplayer[] = [];
    private readonly board: Player[][];

    constructor() {
        super();
        this.board = Array.from({length: GameConstants.BOARD_SIZE}, () =>
            Array.from({length: GameConstants.BOARD_SIZE}, () => Player.SPECTATOR)
        );
        // noinspection TypeScriptUnresolvedReference
        for (const [player, coordinates] of Object.entries(GameConstants.HOME)) {
            if (player == Player.SPECTATOR) continue;
            for (const coordinate: GameCoordinate of coordinates) {
                this.board[coordinate.x][coordinate.y] = player;
            }
        }

        for (let i: number = 0; i < GameConstants.BOARD_SIZE; i++) {
            for (let j: number = 0; j < GameConstants.BOARD_SIZE; j++) {
                try {
                    const gameCoordinate: GameCoordinate = GameCoordinate.fromCoordinates(i, j);
                    const player: Player = this.board[i][j];
                    const displayCoordinate: DisplayCoordinate = gameCoordinate.toDisplayCoordinate();
                    const circleGeometry: CircleGeometry = new CircleGeometry(
                        displayCoordinate,
                        DisplayConstants.CIR_DIAMETER / 2
                    );
                    this.buttonDisplayerArr.push(new CircleButtonDisplayer(
                        circleGeometry,
                        Colors.PLAYER[player],
                        Colors.PLAYER_DARK[player])
                    );
                } catch (e: Error) {
                }
            }
        }
    }

    doDisplay(): void {
        for (const buttonDisplayer: CircleButtonDisplayer of this.buttonDisplayerArr) {
            buttonDisplayer.display();
        }
    }
}