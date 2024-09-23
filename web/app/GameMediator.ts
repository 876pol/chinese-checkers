import {Mediator} from "./Mediator";
import {
    BoardButton,
    Button,
    ButtonTextDisplayer,
    RectangleButtonDisplayer,
    TriangleButtonDisplayer,
} from "./Button";
import {P5Singleton} from "./App";
import {Colors, GameConstants, Player} from "./Constants";
import {DisplayCoordinate, GameCoordinate, GameCoordinateArraySerializer, Pair, Vector2D} from "./Coordinate";
import {BackgroundDisplayer} from "./BackgroundDisplayer";
import {Connection, GameMessage} from "./WebSocketIO";
import {GameCodeDisplayer} from "./GameCodeDisplayer";
import {GameBoardArrowDisplayer} from "./GameBoardArrowDisplayer";
import {GamePlayerDisplayer} from "./GamePlayerDisplayer";
import {CircleGeometry, RectangleGeometry, TriangleGeometry} from "./Geometry";
import {GameWinnerDisplayer} from "./GameWinnerDisplayer";
import {CookieManager} from "./CookieManager";

export enum GamePlayerStatus {
    BOT = 0,
    HUMAN = 1,
    RECONNECTING = 2,
}

export class GamePlayer {
    private readonly _username: string;
    readonly player: Player;
    readonly playerStatus: GamePlayerStatus;
    readonly isTurn: boolean;
    readonly isLocalPlayer: boolean;

    constructor(username: string,
                player: Player,
                playerStatus: GamePlayerStatus,
                isTurn: boolean,
                isLocalPlayer: boolean) {
        this._username = username;
        this.player = player;
        this.playerStatus = playerStatus;
        this.isTurn = isTurn;
        this.isLocalPlayer = isLocalPlayer;
    }

    get username(): string {
        return this._username + (this.isLocalPlayer ? " (You)" : "");
    }
}

export class GameMediator implements Mediator {
    private p5: any;
    private board: Player[][];
    private currentMove: GameCoordinate[];
    private localPlayer: Player;
    private localPlayerTurn: boolean;
    private localPlayerSpectating: boolean;
    private highlightedPositions: GameCoordinate[];
    private players: GamePlayer[];
    private gameIsOver: boolean;
    private readonly backgroundDisplayer: BackgroundDisplayer;
    private readonly gameCodeDisplayer: GameCodeDisplayer;
    private readonly previousMoveDisplayer: GameBoardArrowDisplayer;
    private readonly currentMoveDisplayer: GameBoardArrowDisplayer;
    private readonly gamePlayerDisplayer: GamePlayerDisplayer;
    private boardButtonArr: BoardButton[];
    private readonly endTurnButton: Button;
    private readonly spectatingTextDisplayer: ButtonTextDisplayer;
    private readonly gameWinnerDisplayer: GameWinnerDisplayer;
    private readonly mainMenuButton: Button;
    private readonly backButton: Button;
    private readonly clearCurrentMoveButton: Button;

    constructor() {
        this.p5 = P5Singleton.getInstance();
        this.board = Array.from({length: GameConstants.BOARD_SIZE}, () =>
            Array.from({length: GameConstants.BOARD_SIZE}, () => Player.SPECTATOR)
        );
        this.currentMove = [];
        this.localPlayer = Player.SPECTATOR;
        this.localPlayerTurn = false;
        this.localPlayerSpectating = false;
        this.highlightedPositions = [];
        this.players = [];
        this.gameIsOver = false;
        this.boardButtonArr = [];
        this.backgroundDisplayer = new BackgroundDisplayer();
        this.gameCodeDisplayer = new GameCodeDisplayer();
        this.previousMoveDisplayer = new GameBoardArrowDisplayer(Colors.PREVIOUS_MOVE);
        this.currentMoveDisplayer = new GameBoardArrowDisplayer(Colors.CURRENT_MOVE);
        this.gamePlayerDisplayer = new GamePlayerDisplayer();
        const bottomRightCornerButtonGeometry: RectangleGeometry = new RectangleGeometry(
            DisplayCoordinate.fromCoordinates(610, 720),
            DisplayCoordinate.fromCoordinates(785, 785),
        );
        this.endTurnButton = new Button(bottomRightCornerButtonGeometry, [
            new RectangleButtonDisplayer(bottomRightCornerButtonGeometry),
            new ButtonTextDisplayer(bottomRightCornerButtonGeometry, "End Turn", 32)
        ], this);
        this.mainMenuButton = new Button(bottomRightCornerButtonGeometry, [
            new RectangleButtonDisplayer(bottomRightCornerButtonGeometry),
            new ButtonTextDisplayer(bottomRightCornerButtonGeometry, "Main Menu", 32)
        ], this);
        this.spectatingTextDisplayer = new ButtonTextDisplayer(
            new CircleGeometry(DisplayCoordinate.fromCoordinates(400, 30), 10),
            "You are spectating!",
            25
        );
        this.gameWinnerDisplayer = new GameWinnerDisplayer();
        const backButtonGeometry: TriangleGeometry = new TriangleGeometry(
            DisplayCoordinate.fromCoordinates(35, 10),
            DisplayCoordinate.fromCoordinates(10, 30),
            DisplayCoordinate.fromCoordinates(35, 50)
        )
        this.backButton = new Button(backButtonGeometry,
            [new TriangleButtonDisplayer(backButtonGeometry)],
            this
        );
        const clearCurrentMoveButtonGeometry: RectangleGeometry = new RectangleGeometry(
            DisplayCoordinate.fromCoordinates(15, 15),
            DisplayCoordinate.fromCoordinates(50, 50),
        );
        this.clearCurrentMoveButton = new Button(clearCurrentMoveButtonGeometry, [
            new RectangleButtonDisplayer(clearCurrentMoveButtonGeometry),
            new ButtonTextDisplayer(clearCurrentMoveButtonGeometry, "X", 30)
        ], this);
    }

    enable(): void {
        this.refresh();
    }

    disable(): void {
        this.disableAllComponents();
    }

    notify(sender: Button, msg?: object): void {
        if (sender === this.p5.webSocketIO) {
            this.handleWebSocketMessage(msg);
        } else if (sender === this.endTurnButton) {
            this.p5.webSocketIO.sendMakeMove(GameCoordinateArraySerializer.serialize(this.currentMove));
        } else if (sender === this.mainMenuButton) {
            this.p5.switchToMenu();
            this.p5.webSocketIO.disconnect();
        } else if (sender === this.backButton) {
            this.p5.switchToMenu();
            this.p5.webSocketIO.disconnect();
        } else if (sender === this.clearCurrentMoveButton) {
            this.currentMove = [];
            this.refresh();
        } else {
            this.handleBoardButtonPressed(msg as GameCoordinate)
        }
    }

    private handleWebSocketMessage(msg): void {
        if (msg.type !== "game_state") return;
        msg = msg as GameMessage;
        if (msg.status === 2) {
            this.gameIsOver = true;
            for (const player: GamePlayer of this.players) {
                if (!player.isTurn) continue;
                this.gameWinnerDisplayer.setWinner(player.player);
            }
            CookieManager.delete("gameCode");
            CookieManager.delete("userId");
        }
        this.gameCodeDisplayer.setGameCode(msg.id);
        this.board = msg.board;
        this.currentMove = [];
        this.localPlayer = msg.color;
        this.localPlayerTurn = (msg.players[msg.turn] === this.localPlayer && !this.gameIsOver);
        this.localPlayerSpectating = true;
        this.highlightedPositions = [];
        this.players = [];
        for (const connection: Connection of msg.connections) {
            if (connection.color === Player.SPECTATOR) continue;
            this.localPlayerSpectating &= (connection.color !== this.localPlayer);
            this.players.push(new GamePlayer(
                connection.name,
                connection.color,
                connection.is_bot
                    ? GamePlayerStatus.BOT
                    : !connection.connected
                        ? GamePlayerStatus.RECONNECTING
                        : GamePlayerStatus.HUMAN,
                connection.color === msg.players[msg.turn] && !this.gameIsOver,
                connection.color === this.localPlayer
            ))
        }
        this.players.sort((a: GamePlayer, b: GamePlayer) => a.player - b.player);
        this.gamePlayerDisplayer.setGamePlayerArr(this.players);
        this.previousMoveDisplayer.setCoordinateArr(GameCoordinateArraySerializer.deserialize(msg.prev_moves));
        this.currentMoveDisplayer.setCoordinateArr(this.currentMove);
        if (!this.localPlayerSpectating && !this.gameIsOver) {
            CookieManager.set("gameCode", msg.id);
            CookieManager.set("userId", msg.user_id);
        }
        this.refresh();
    }

    private handleBoardButtonPressed(coordinate): void {
        if (this.board[coordinate.x][coordinate.y] === Player.SPECTATOR) {
            this.currentMove.push(coordinate);
        } else {
            if (this.currentMove.length !== 0 && this.currentMove[0].equals(coordinate)) {
                this.currentMove = [];
            } else {
                this.currentMove = [coordinate];
            }
        }
        this.refresh();
    }

    private updateHighlightedPositions() {
        this.highlightedPositions = [];
        if (this.currentMove.length === 0 || !this.localPlayerTurn) return;
        const start: GameCoordinate = this.currentMove[this.currentMove.length - 1];
        for (const d: Vector2D of GameConstants.DIR) {
            const v1: Vector2D = start.vector.add(d);
            if (!GameCoordinate.isValid(v1)) continue;
            const c1: GameCoordinate = new GameCoordinate(v1);
            if (this.board[c1.x][c1.y] === Player.SPECTATOR) {
                if (this.board[start.x][start.y] === this.localPlayer &&
                    !Pair.arrContainsPair(this.currentMove, c1)) {
                    this.highlightedPositions.push(c1);
                }
            } else {
                if (this.currentMove.length === 2 &&
                    Pair.arrContainsPair(
                        GameConstants.DIR,
                        this.currentMove[1].vector.subtract(this.currentMove[0].vector)
                    )) {
                    continue;
                }
                const v2: Vector2D = v1.add(d);
                if (GameCoordinate.isValid(v2) && !Pair.arrContainsPair(this.currentMove, v2)) {
                    this.highlightedPositions.push(new GameCoordinate(v2));
                }
            }
        }
    }

    private disableAllComponents(): void {
        this.p5.drawer.remove(this.backgroundDisplayer);
        this.p5.drawer.remove(this.gameCodeDisplayer);
        for (const boardButton: BoardButton of this.boardButtonArr) {
            this.p5.drawer.remove(boardButton);
            this.p5.mousePublisher.remove(boardButton);
        }
        this.p5.drawer.remove(this.previousMoveDisplayer);
        this.p5.drawer.remove(this.currentMoveDisplayer);
        this.p5.drawer.remove(this.gamePlayerDisplayer);
        this.p5.drawer.remove(this.endTurnButton);
        this.p5.drawer.remove(this.spectatingTextDisplayer);
        this.p5.drawer.remove(this.gameWinnerDisplayer);
        this.p5.drawer.remove(this.mainMenuButton);
        this.p5.drawer.remove(this.backButton);
        this.p5.drawer.remove(this.clearCurrentMoveButton);
        this.p5.mousePublisher.remove(this.endTurnButton);
        this.p5.mousePublisher.remove(this.mainMenuButton);
        this.p5.mousePublisher.remove(this.backButton);
        this.p5.mousePublisher.remove(this.clearCurrentMoveButton);
    }

    private refresh(): void {
        this.updateHighlightedPositions();
        this.currentMoveDisplayer.setCoordinateArr(this.currentMove);
        this.disableAllComponents();
        this.p5.drawer.add(this.backgroundDisplayer);
        this.p5.drawer.add(this.gameCodeDisplayer);
        this.boardButtonArr = [];
        for (let i: number = 0; i < GameConstants.BOARD_SIZE; i++) {
            for (let j: number = 0; j < GameConstants.BOARD_SIZE; j++) {
                if (!GameCoordinate.isValid(new Vector2D(i, j))) continue;
                const button: BoardButton = new BoardButton(
                    GameCoordinate.fromCoordinates(i, j),
                    this.board[i][j],
                    this,
                    this.localPlayerTurn && (
                        this.localPlayer === this.board[i][j] ||
                        Pair.arrContainsPair(this.highlightedPositions, new Vector2D(i, j))
                    )
                );
                this.boardButtonArr.push(button);
                this.p5.drawer.add(button);
                this.p5.mousePublisher.add(button);
            }
        }
        this.p5.drawer.add(this.previousMoveDisplayer);
        this.p5.drawer.add(this.currentMoveDisplayer);
        this.p5.drawer.add(this.gamePlayerDisplayer);
        if (this.localPlayerSpectating) {
            this.p5.drawer.add(this.spectatingTextDisplayer);
            this.p5.drawer.add(this.backButton);
            this.p5.mousePublisher.add(this.backButton);
        }
        if (this.gameIsOver) {
            this.p5.drawer.add(this.gameWinnerDisplayer);
            this.p5.drawer.add(this.mainMenuButton);
            this.p5.mousePublisher.add(this.mainMenuButton);
        } else if (this.localPlayerTurn) {
            this.p5.drawer.add(this.endTurnButton);
            this.p5.mousePublisher.add(this.endTurnButton);
            if (this.currentMove.length > 0) {
                this.p5.drawer.add(this.clearCurrentMoveButton);
                this.p5.mousePublisher.add(this.clearCurrentMoveButton);
            }
        }
    }
}