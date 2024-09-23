import * as p5 from 'p5';
import {Colors, DisplayConstants, Fonts, Images} from "./Constants";
import {Displayable} from "./DisplayableBase";
import {Clickable} from "./Clickable";
import {KeyboardListener} from "./KeyboardListener";
import {MenuMediator} from "./MenuMediator";
import {WebSocketIO} from "./WebSocketIO";
import {ReconnectingDisplayer} from "./ReconnectingDisplayer";
import {CircleGeometry} from "./Geometry";
import {DisplayCoordinate} from "./Coordinate";
import {Button, ButtonImageDisplayer, CircleButtonDisplayer} from "./Button";
import {LobbyMediator} from "./LobbyMediator";
import {GameBoardBackgroundDisplayer} from "./GameBoardBackgroundDisplayer";
import {GameMediator} from "./GameMediator";

export class P5Singleton {
    private static instance: p5 | null = null;

    private constructor() {
    }

    public static createInstance(sketch: (p: p5) => void, node: string): p5 {
        if (!P5Singleton.instance) {
            P5Singleton.instance = new p5(sketch, node);
            Fonts.load();
            Images.load();
        } else {
            console.warn("p5 instance already created. Returning the existing instance.");
        }
        return P5Singleton.instance;
    }

    public static getInstance(): p5 {
        if (!P5Singleton.instance) {
            throw new Error("p5 instance has not been created yet. Call createInstance() first.");
        }
        return P5Singleton.instance;
    }
}

abstract class P5EventPublisher<T> {
    private subscribers: T[] = [];

    public add(subscriber: T): void {
        if (this.subscribers.indexOf(subscriber) === -1) {
            this.subscribers.push(subscriber);
        }
    }

    public remove(subscriber: T): void {
        const index: number = this.subscribers.indexOf(subscriber);
        if (index !== -1) {
            this.subscribers.splice(index, 1);
        }
    }

    public publish(): void {
        const subscribersCopy: T[] = this.subscribers.slice(); // Create a shallow copy
        for (const subscriber: T of subscribersCopy) {
            this.notifySubscriber(subscriber);
        }
    }

    protected abstract notifySubscriber(subscriber: T): void;
}

export class P5Drawer extends P5EventPublisher<Displayable> {
    protected notifySubscriber(subscriber: Displayable): void {
        subscriber.display();
    }
}

export class P5MousePublisher extends P5EventPublisher<Clickable> {
    protected notifySubscriber(subscriber: Clickable): void {
        subscriber.onMouseClick();
    }
}

export class P5KeyPressedPublisher extends P5EventPublisher<KeyboardListener> {
    protected notifySubscriber(subscriber: KeyboardListener): void {
        subscriber.onKeyPressed();
    }
}


const s = (p5): void => {
    p5.drawer = new P5Drawer();
    p5.mousePublisher = new P5MousePublisher();
    p5.keyPressedPublisher = new P5KeyPressedPublisher();
    // p5.webSocketIO = new WebSocketIO(
    //     location.href.replace('http://', 'ws://')
    //         .replace('https://', 'wss://')
    //     + 'ws'
    // );
    p5.activeScreen = "";

    p5.setup = (): void => {
        p5.createCanvas(DisplayConstants.CANVAS_WIDTH, DisplayConstants.CANVAS_HEIGHT);
        p5.webSocketIO = new WebSocketIO("wss://chinese-checkers-multiplayer-online.fly.dev/ws");
        p5.menuMediator = new MenuMediator();
        p5.lobbyMediator = new LobbyMediator();
        p5.gameMediator = new GameMediator();
        p5.switchToMenu();
    };

    p5.draw = (): void => {
        p5.cursor("auto");
        p5.drawer.publish();
        if (!p5.webSocketIO.connected()) {
            p5.webSocketIO.connect();
            new ReconnectingDisplayer().display();
        }
    };

    p5.mouseClicked = (): void => {
        if (!p5.webSocketIO.connected()) return;
        p5.mousePublisher.publish();
    };

    p5.keyPressed = (): void => {
        if (!p5.webSocketIO.connected()) return;
        p5.keyPressedPublisher.publish();
    };

    p5.switchToMenu = (): void => {
        if (p5.activeScreen != "menu") {
            p5.lobbyMediator.disable();
            p5.menuMediator.enable();
            p5.gameMediator.disable();
        }
        p5.activeScreen = "menu";
    }

    p5.switchToLobby = (): void => {
        if (p5.activeScreen != "lobby") {
            p5.menuMediator.disable();
            p5.lobbyMediator.enable();
            p5.gameMediator.disable();
        }
        p5.activeScreen = "lobby";
    }

    p5.switchToGame = (): void => {
        if (p5.activeScreen != "game") {
            p5.menuMediator.disable();
            p5.lobbyMediator.disable();
            p5.gameMediator.enable();
        }
        p5.activeScreen = "game";
    }
};

P5Singleton.createInstance(s, "p5sketch")