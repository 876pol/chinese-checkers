import {Mediator} from "./Mediator";
import {
    Button,
    ButtonImageDisplayer,
    ButtonTextDisplayer,
    CircleButtonDisplayer, RectangleButtonDisplayer,
    TriangleButtonDisplayer
} from "./Button";
import {P5Singleton} from "./App";
import {LobbyCodeDisplayer} from "./LobbyCodeDisplayer";
import {LobbyPlayerDisplayer} from "./LobbyPlayerDisplayer";
import {Colors, Images, Player} from "./Constants";
import {DisplayCoordinate} from "./Coordinate";
import {CircleGeometry, RectangleGeometry, TriangleGeometry} from "./Geometry";
import {BackgroundDisplayer} from "./BackgroundDisplayer";
import {Connection, LobbyMessage} from "./WebSocketIO";
import {GameBoardBackgroundDisplayer} from "./GameBoardBackgroundDisplayer";
import {TransparentOverlayDisplayer} from "./TransparentOverlayDisplayer";

enum LobbyPlayerStatus {
    EMPTY = 0,
    BOT = 1,
    HUMAN = 2,
    CURRENT_PLAYER = 3
}

export class LobbyPlayer {
    username: string;
    player: Player;
    playerStatus: LobbyPlayerStatus;

    constructor(player: Player) {
        this.player = player;
        this.setEmpty();
    }

    setEmpty(): void {
        this.username = "";
        this.playerStatus = LobbyPlayerStatus.EMPTY;
    }

    setBot(): void {
        this.username = "Bot";
        this.playerStatus = LobbyPlayerStatus.BOT;
    }

    setHuman(username: string): void {
        this.username = username;
        this.playerStatus = LobbyPlayerStatus.HUMAN;
    }

    setCurrentPlayer(username: string): void {
        this.username += username + " (You)"
        this.playerStatus = LobbyPlayerStatus.CURRENT_PLAYER;
    }
}

export class LobbyMediator implements Mediator {
    private p5: any;
    private readonly lobbyPlayerArr: Map<Player, LobbyPlayer> = new Map();
    private readonly backgroundDisplayer: BackgroundDisplayer;
    private readonly gameBoardDisplayer: GameBoardBackgroundDisplayer;
    private readonly transparentOverlayDisplayer: TransparentOverlayDisplayer;
    private readonly gameCodeDisplayer: LobbyCodeDisplayer;
    private readonly lobbyPlayerDisplayerArr: Map<Player, LobbyPlayerDisplayer> = new Map();
    private readonly joinButtonArr: Map<Player, Button> = new Map();
    private readonly exitButtonArr: Map<Player, Button> = new Map();
    private readonly addBotButtonArr: Map<Player, Button> = new Map();
    private readonly removeBotButtonArr: Map<Player, Button> = new Map();
    private readonly backButton: Button;
    private readonly startButton: Button;

    constructor() {
        this.p5 = P5Singleton.getInstance();
        this.backgroundDisplayer = new BackgroundDisplayer();
        this.gameBoardDisplayer = new GameBoardBackgroundDisplayer();
        this.transparentOverlayDisplayer = new TransparentOverlayDisplayer();
        this.gameCodeDisplayer = new LobbyCodeDisplayer();
        for (let player: Player = Player.RED; player <= Player.PURPLE; player++) {
            this.lobbyPlayerArr.set(player, new LobbyPlayer(player));
            const geometry: RectangleGeometry = new RectangleGeometry(
                DisplayCoordinate.fromCoordinates(150, 250 + (player - 1) * 55),
                DisplayCoordinate.fromCoordinates(650, 298 + (player - 1) * 55),
            );
            this.lobbyPlayerDisplayerArr.set(player,
                new LobbyPlayerDisplayer(geometry, this.lobbyPlayerArr.get(player))
            );

            const circleGeometry1: CircleGeometry = new CircleGeometry(
                DisplayCoordinate.fromCoordinates(572, 274 + (player - 1) * 55),
                19
            );
            const circleGeometry2: CircleGeometry = new CircleGeometry(
                DisplayCoordinate.fromCoordinates(617, 274 + (player - 1) * 55),
                19
            );
            const joinIconGeometry: CircleGeometry = new CircleGeometry(
                DisplayCoordinate.fromCoordinates(573, 272 + (player - 1) * 55),
                19
            );
            const exitIconGeometry: CircleGeometry = new CircleGeometry(
                DisplayCoordinate.fromCoordinates(619, 274 + (player - 1) * 55),
                19
            );
            const removeBotIconGeometry: CircleGeometry = new CircleGeometry(
                DisplayCoordinate.fromCoordinates(618, 269 + (player - 1) * 55),
                19
            );
            this.joinButtonArr.set(player, new Button(circleGeometry1, [
                    new CircleButtonDisplayer(circleGeometry1, Colors.BUTTON, Colors.BUTTON_DARK),
                    new ButtonTextDisplayer(joinIconGeometry, "+", 35)
                ], this
            ));
            this.addBotButtonArr.set(player, new Button(circleGeometry2, [
                    new CircleButtonDisplayer(circleGeometry2, Colors.BUTTON, Colors.BUTTON_DARK),
                    new ButtonImageDisplayer(circleGeometry2, Images.robotImg)
                ], this
            ));
            this.exitButtonArr.set(player, new Button(circleGeometry2, [
                    new CircleButtonDisplayer(circleGeometry2, Colors.BUTTON, Colors.BUTTON_DARK),
                    new ButtonImageDisplayer(exitIconGeometry, Images.exitImg)
                ], this
            ));
            this.removeBotButtonArr.set(player, new Button(circleGeometry2, [
                    new CircleButtonDisplayer(circleGeometry2, Colors.BUTTON, Colors.BUTTON_DARK),
                    new ButtonTextDisplayer(removeBotIconGeometry, "x", 35)
                ], this
            ));
        }

        const backButtonGeometry: TriangleGeometry = new TriangleGeometry(
            DisplayCoordinate.fromCoordinates(35, 10),
            DisplayCoordinate.fromCoordinates(10, 30),
            DisplayCoordinate.fromCoordinates(35, 50)
        )
        this.backButton = new Button(backButtonGeometry,
            [new TriangleButtonDisplayer(backButtonGeometry)],
            this
        );

        const startButtonGeometry: RectangleGeometry = new RectangleGeometry(
            DisplayCoordinate.fromCoordinates(300, 600),
            DisplayCoordinate.fromCoordinates(500, 660),
        );
        this.startButton = new Button(startButtonGeometry, [
            new RectangleButtonDisplayer(startButtonGeometry),
            new ButtonTextDisplayer(startButtonGeometry, "Start", 30)
        ], this);
    }

    enable(): void {
        this.refresh();
    }

    disable(): void {
        this.disableAllComponents();
    }

    notify(sender: Button, msg?: object): void {
        if (sender === this.backButton) {
            this.p5.switchToMenu();
            this.p5.webSocketIO.disconnect();
        } else if (sender === this.p5.webSocketIO) {
            if (msg.type === "game_state") {
                msg = msg as LobbyMessage;
                this.gameCodeDisplayer.setGameCode(msg.id);
                for (let player: Player = Player.RED; player <= Player.PURPLE; player++) {
                    this.lobbyPlayerArr.set(player, new LobbyPlayer(player));
                }
                for (const connection: Connection of msg.connections) {
                    if (connection.color === Player.SPECTATOR) continue;
                    if (connection.is_bot) {
                        this.lobbyPlayerArr.get(connection.color).setBot();
                    } else if (connection.color === msg.color) {
                        this.lobbyPlayerArr.get(connection.color).setCurrentPlayer(connection.name);
                    } else {
                        this.lobbyPlayerArr.get(connection.color).setHuman(connection.name);
                    }
                }
                this.refresh();
            }
        } else if (sender === this.startButton) {
            this.p5.webSocketIO.sendStartGame();
        } else {
            for (const [player, button] of this.joinButtonArr.entries()) {
                if (sender !== button) continue;
                this.p5.webSocketIO.sendSelectColor(player);
            }
            for (const [player, button] of this.exitButtonArr.entries()) {
                if (sender !== button) continue;
                this.p5.webSocketIO.sendSelectColor(0);
            }
            for (const [player, button] of this.addBotButtonArr.entries()) {
                if (sender !== button) continue;
                this.p5.webSocketIO.sendAddBot(player)
            }
            for (const [player, button] of this.removeBotButtonArr.entries()) {
                if (sender !== button) continue;
                this.p5.webSocketIO.sendRemoveBot(player)
            }
        }
    }

    private disableAllComponents(): void {
        this.p5.drawer.remove(this.backgroundDisplayer);
        this.p5.drawer.remove(this.gameBoardDisplayer);
        this.p5.drawer.remove(this.transparentOverlayDisplayer);
        this.p5.drawer.remove(this.gameCodeDisplayer);
        this.p5.drawer.remove(this.backButton);
        this.p5.mousePublisher.remove(this.backButton);
        this.p5.drawer.remove(this.startButton);
        this.p5.mousePublisher.remove(this.startButton);
        for (const displayer of this.lobbyPlayerDisplayerArr.values()) {
            this.p5.drawer.remove(displayer);
        }
        for (const button of this.joinButtonArr.values()) {
            this.p5.drawer.remove(button);
            this.p5.mousePublisher.remove(button);
        }
        for (const button of this.exitButtonArr.values()) {
            this.p5.drawer.remove(button);
            this.p5.mousePublisher.remove(button);
        }
        for (const button of this.addBotButtonArr.values()) {
            this.p5.drawer.remove(button);
            this.p5.mousePublisher.remove(button);
        }
        for (const button of this.removeBotButtonArr.values()) {
            this.p5.drawer.remove(button);
            this.p5.mousePublisher.remove(button);
        }
    }

    private refresh(): void {
        this.disableAllComponents();
        this.p5.drawer.add(this.backgroundDisplayer);
        this.p5.drawer.add(this.gameBoardDisplayer);
        this.p5.drawer.add(this.transparentOverlayDisplayer);
        this.p5.drawer.add(this.gameCodeDisplayer);
        this.p5.drawer.add(this.backButton);
        this.p5.mousePublisher.add(this.backButton);
        this.p5.drawer.add(this.startButton);
        this.p5.mousePublisher.add(this.startButton);
        for (const lobbyPlayer: LobbyPlayer of this.lobbyPlayerArr.values()) {
            this.lobbyPlayerDisplayerArr.get(lobbyPlayer.player).setLobbyPlayer(lobbyPlayer);
            this.p5.drawer.add(this.lobbyPlayerDisplayerArr.get(lobbyPlayer.player));
            if (lobbyPlayer.playerStatus === LobbyPlayerStatus.EMPTY) {
                this.p5.drawer.add(this.joinButtonArr.get(lobbyPlayer.player));
                this.p5.drawer.add(this.addBotButtonArr.get(lobbyPlayer.player));
                this.p5.mousePublisher.add(this.joinButtonArr.get(lobbyPlayer.player));
                this.p5.mousePublisher.add(this.addBotButtonArr.get(lobbyPlayer.player));
            } else if (lobbyPlayer.playerStatus === LobbyPlayerStatus.BOT) {
                this.p5.drawer.add(this.removeBotButtonArr.get(lobbyPlayer.player));
                this.p5.mousePublisher.add(this.removeBotButtonArr.get(lobbyPlayer.player));
            } else if (lobbyPlayer.playerStatus === LobbyPlayerStatus.HUMAN) {
                // no buttons
            } else if (lobbyPlayer.playerStatus === LobbyPlayerStatus.CURRENT_PLAYER) {
                this.p5.drawer.add(this.exitButtonArr.get(lobbyPlayer.player));
                this.p5.mousePublisher.add(this.exitButtonArr.get(lobbyPlayer.player));
            }
        }

    }
}