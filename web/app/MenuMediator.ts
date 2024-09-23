import {Mediator} from "./Mediator";
import {Button, ButtonTextDisplayer, RectangleButtonDisplayer, TriangleButtonDisplayer} from "./Button";
import {BackgroundDisplayer} from "./BackgroundDisplayer";
import {TitleDisplayer} from "./TitleDisplayer";
import {ButtonSeparatorDisplayer} from "./ButtonSeparatorDisplayer";
import {InputBar, InputBarTextDisplayer, RectangleInputBarDisplayer} from "./InputBar";
import {P5Singleton} from "./App";
import {RectangleGeometry, TriangleGeometry} from "./Geometry";
import {DisplayCoordinate} from "./Coordinate";
import {ErrorTextDisplayer} from "./ErrorTextDisplayer";
import {GameBoardBackgroundDisplayer} from "./GameBoardBackgroundDisplayer";
import {TransparentOverlayDisplayer} from "./TransparentOverlayDisplayer";

export class MenuMediator implements Mediator {
    private p5: any;
    private readonly backgroundDisplayer: BackgroundDisplayer;
    private readonly gameBoardDisplayer: GameBoardBackgroundDisplayer;
    private readonly transparentOverlayDisplayer: TransparentOverlayDisplayer;
    private readonly titleDisplayer: TitleDisplayer;
    private readonly buttonSeparatorDisplayer: ButtonSeparatorDisplayer;
    private readonly createGameButton: Button;
    private readonly joinGameButton: Button;
    private readonly gameCodeInputBar: InputBar;
    private readonly gameCodeErrorMessage: ErrorTextDisplayer;
    private readonly nameInputBar: InputBar;
    private readonly enterLobbyButton: Button;
    private readonly backButton: Button;
    private readonly nameErrorMessage: ErrorTextDisplayer;
    private readonly invalidGameCodeErrorMessage: ErrorTextDisplayer;
    private actionType: string = "";

    constructor() {
        this.p5 = P5Singleton.getInstance();

        this.backgroundDisplayer = new BackgroundDisplayer();
        this.gameBoardDisplayer = new GameBoardBackgroundDisplayer();
        this.transparentOverlayDisplayer = new TransparentOverlayDisplayer();
        this.titleDisplayer = new TitleDisplayer();
        this.buttonSeparatorDisplayer = new ButtonSeparatorDisplayer();

        const createGameButtonGeometry: RectangleGeometry = new RectangleGeometry(
            DisplayCoordinate.fromCoordinates(200, 385),
            DisplayCoordinate.fromCoordinates(600, 465)
        );
        this.createGameButton = new Button(createGameButtonGeometry, [
                new RectangleButtonDisplayer(createGameButtonGeometry),
                new ButtonTextDisplayer(createGameButtonGeometry, "Create Game", 35)
            ], this
        );

        const joinGameButtonGeometry: RectangleGeometry = new RectangleGeometry(
            DisplayCoordinate.fromCoordinates(200, 605),
            DisplayCoordinate.fromCoordinates(600, 685)
        );
        this.joinGameButton = new Button(joinGameButtonGeometry, [
                new RectangleButtonDisplayer(joinGameButtonGeometry),
                new ButtonTextDisplayer(joinGameButtonGeometry, "Join Game", 35)
            ], this
        );

        const gameCodeInputBarGeometry: RectangleGeometry = new RectangleGeometry(
            DisplayCoordinate.fromCoordinates(200, 540),
            DisplayCoordinate.fromCoordinates(600, 590)
        );
        this.gameCodeInputBar = new InputBar(gameCodeInputBarGeometry,
            new RectangleInputBarDisplayer(gameCodeInputBarGeometry),
            new InputBarTextDisplayer(gameCodeInputBarGeometry, 30, "Enter game code"),
            8
        );

        this.gameCodeErrorMessage = new ErrorTextDisplayer(
            DisplayCoordinate.fromCoordinates(400, 710),
            "Game code must be 8 characters long!"
        );

        const nameInputButtonGeometry: RectangleGeometry = new RectangleGeometry(
            DisplayCoordinate.fromCoordinates(200, 350),
            DisplayCoordinate.fromCoordinates(600, 400)
        );
        this.nameInputBar = new InputBar(nameInputButtonGeometry,
            new RectangleInputBarDisplayer(nameInputButtonGeometry),
            new InputBarTextDisplayer(nameInputButtonGeometry, 30, "Enter your name"),
            20
        );

        const enterLobbyButtonGeometry: RectangleGeometry = new RectangleGeometry(
            DisplayCoordinate.fromCoordinates(325, 420),
            DisplayCoordinate.fromCoordinates(475, 480)
        );
        this.enterLobbyButton = new Button(enterLobbyButtonGeometry, [
                new RectangleButtonDisplayer(enterLobbyButtonGeometry),
                new ButtonTextDisplayer(enterLobbyButtonGeometry, "Next", 30)
            ], this
        );

        const backButtonGeometry: TriangleGeometry = new TriangleGeometry(
            DisplayCoordinate.fromCoordinates(35, 10),
            DisplayCoordinate.fromCoordinates(10, 30),
            DisplayCoordinate.fromCoordinates(35, 50)
        )
        this.backButton = new Button(backButtonGeometry,
            [new TriangleButtonDisplayer(backButtonGeometry)],
            this
        );

        this.nameErrorMessage = new ErrorTextDisplayer(
            DisplayCoordinate.fromCoordinates(400, 530),
            "Name must be between 1 and 20 characters long!"
        );

        this.invalidGameCodeErrorMessage = new ErrorTextDisplayer(
            DisplayCoordinate.fromCoordinates(400, 530),
            "Invalid game code!"
        );
    }

    enable(): void {
        this.reset();
    }

    disable(): void {
        this.disableAllComponents();
    }

    notify(sender: Button, msg?: object): void {
        if (sender === this.createGameButton) {
            this.actionType = "create";
            this.switchToEnterNameScreen();
        } else if (sender === this.joinGameButton) {
            if (this.gameCodeInputBar.getText().length === 8) {
                this.actionType = "join";
                this.switchToEnterNameScreen();
            } else {
                this.p5.drawer.add(this.gameCodeErrorMessage);
            }
        } else if (sender === this.backButton) {
            this.switchToMainScreen();
            this.p5.drawer.remove(this.nameErrorMessage);
            this.p5.drawer.remove(this.invalidGameCodeErrorMessage);
        } else if (sender === this.enterLobbyButton) {
            if (this.nameInputBar.getText().length === 0) {
                this.p5.drawer.add(this.nameErrorMessage);
                this.p5.drawer.remove(this.invalidGameCodeErrorMessage);
            } else {
                if (this.actionType === "create") {
                    this.p5.webSocketIO.sendCreateGame(this.nameInputBar.getText());
                } else if (this.actionType === "join") {
                    this.p5.webSocketIO.sendJoinGame(this.gameCodeInputBar.getText(), this.nameInputBar.getText());
                }
            }
        } else if (sender === this.p5.webSocketIO) {
            if (msg.type === "status") {
                if (msg.status === "InvalidWebSocketAction: Game does not exist") {
                    this.p5.drawer.add(this.invalidGameCodeErrorMessage);
                    this.p5.drawer.remove(this.nameErrorMessage);
                }
            }
        }
    }

    reset(): void {
        this.gameCodeInputBar.reset();
        this.nameInputBar.reset();
        this.switchToMainScreen();
    }

    private switchToMainScreen(): void {
        this.disableAllComponents();
        this.p5.drawer.add(this.backgroundDisplayer);
        this.p5.drawer.add(this.gameBoardDisplayer);
        this.p5.drawer.add(this.transparentOverlayDisplayer);
        this.p5.drawer.add(this.titleDisplayer);
        this.p5.drawer.add(this.buttonSeparatorDisplayer);
        this.p5.drawer.add(this.createGameButton);
        this.p5.drawer.add(this.joinGameButton);
        this.p5.drawer.add(this.gameCodeInputBar);

        this.p5.mousePublisher.add(this.createGameButton);
        this.p5.mousePublisher.add(this.joinGameButton);
        this.p5.mousePublisher.add(this.gameCodeInputBar);

        this.p5.keyPressedPublisher.add(this.gameCodeInputBar);
    }

    private switchToEnterNameScreen(): void {
        this.disableAllComponents();
        this.p5.drawer.add(this.backgroundDisplayer);
        this.p5.drawer.add(this.gameBoardDisplayer);
        this.p5.drawer.add(this.transparentOverlayDisplayer);
        this.p5.drawer.add(this.backButton);
        this.p5.drawer.add(this.enterLobbyButton);
        this.p5.drawer.add(this.nameInputBar);
        this.p5.mousePublisher.add(this.backButton);
        this.p5.mousePublisher.add(this.enterLobbyButton);
        this.p5.mousePublisher.add(this.nameInputBar);
        this.p5.keyPressedPublisher.add(this.nameInputBar);
    }

    private disableAllComponents(): void {
        this.p5.drawer.remove(this.backgroundDisplayer);
        this.p5.drawer.remove(this.gameBoardDisplayer);
        this.p5.drawer.remove(this.transparentOverlayDisplayer);
        this.p5.drawer.remove(this.titleDisplayer);
        this.p5.drawer.remove(this.buttonSeparatorDisplayer);
        this.p5.drawer.remove(this.createGameButton);
        this.p5.drawer.remove(this.joinGameButton);
        this.p5.drawer.remove(this.gameCodeInputBar);
        this.p5.drawer.remove(this.backButton);
        this.p5.drawer.remove(this.enterLobbyButton);
        this.p5.drawer.remove(this.nameInputBar);
        this.p5.drawer.remove(this.gameCodeErrorMessage);
        this.p5.drawer.remove(this.nameErrorMessage);
        this.p5.drawer.remove(this.invalidGameCodeErrorMessage);

        this.p5.mousePublisher.remove(this.createGameButton);
        this.p5.mousePublisher.remove(this.joinGameButton);
        this.p5.mousePublisher.remove(this.gameCodeInputBar);
        this.p5.mousePublisher.remove(this.backButton);
        this.p5.mousePublisher.remove(this.enterLobbyButton);
        this.p5.mousePublisher.remove(this.nameInputBar);

        this.p5.keyPressedPublisher.remove(this.gameCodeInputBar);
        this.p5.keyPressedPublisher.remove(this.nameInputBar);
    }
}