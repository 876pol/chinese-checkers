import {P5Singleton} from "./App";
import {Player} from "./Constants";

export interface Connection {
    name: string;
    color: Player;
    is_bot: boolean;
    connected: boolean;
}

export interface LobbyMessage {
    id: string;
    type: string;
    status: number;
    user_id: string;
    color: Player;
    connections: Connection[];
}

export interface GameMessage {
    id: string; // Game id
    type: string; // should always be "game_state"
    board: Player[][]; // 17x17 grid representing the board
    players: Player[]; // list of players in the game
    turn: number; // index of the current player in `players`
    status: number; // 0 if in lobby, 1 if in game, 2 if game over
    prev_moves: number[][]; // array of length 2 arrays representing the most recent move
    connections: Connection[];
    user_id: string; // unique code for the current user, allows for reconnections
    color: Player; // player color
}

export class WebSocketIO {
    websocket: WebSocket;
    private numReconnectAttempts: number = 0;
    private lastReconnectAttempt: Date = new Date(0);
    private p5: any;

    constructor(private websocketURL: string) {
        this.p5 = P5Singleton.getInstance();
    }

    connected(): boolean {
        return this.websocket && this.websocket.readyState === WebSocket.OPEN;
    }

    connect(): void {
        if (this.connected()) return;
        const timeDifferenceSeconds: number = (new Date().getTime() - this.lastReconnectAttempt.getTime()) / 1000;
        if (timeDifferenceSeconds < 3 || this.numReconnectAttempts >= 3) return;

        this.websocket = new WebSocket(this.websocketURL);
        // does not work when `this.websocket.onopen = this.onopen;`
        this.websocket.onopen = (): void => this.onopen();
        this.websocket.onmessage = (event: MessageEvent) => this.onmessage(event);
        this.numReconnectAttempts++;
        this.lastReconnectAttempt = new Date();
    }

    disconnect(): void {
        this.websocket.close();
    }

    private onopen(): void {
        this.numReconnectAttempts = 0;
    }

    private onmessage(event: MessageEvent): void {
        const msg = JSON.parse(event.data);
        console.log(msg);
        if (msg.type === "status") {
            if (msg.status === "InvalidWebSocketAction: Game does not exist") {
                this.p5.switchToMenu();
                this.p5.menuMediator.notify(this, msg);
            }
        } else if (msg.type === "game_state") {
            if (msg.status === 0) { // lobby
                this.p5.switchToLobby();
                this.p5.lobbyMediator.notify(this, msg);
            } else { // game
                this.p5.switchToGame();
                this.p5.gameMediator.notify(this, msg);
            }
        }
    }

    private sendObject(obj: any): void {
        if (this.connected()) {
            this.websocket.send(JSON.stringify(obj));
        } else {
            console.error("WebSocket is not open.");
        }
    }

    sendCreateGame = (name: string) => this.sendObject({
        "type": "create",
        "name": name
    });
    sendJoinGame = (gameId: string, name: string) => this.sendObject({
        "type": "join",
        "game_id": gameId,
        "name": name
    });
    sendReconnectGame = (gameId: string, userId: string) => this.sendObject({
        "type": "reconnect",
        "game_id": gameId,
        "user_id": userId
    });
    sendSelectColor = (color: string) => this.sendObject({
        "type": "select_color",
        "color": color
    });
    sendAddBot = (color: string) => this.sendObject({
        "type": "add_bot",
        "color": color
    });
    sendRemoveBot = (color: string) => this.sendObject({
        "type": "remove_bot",
        "color": color
    });
    sendStartGame = () => this.sendObject({
        "type": "start"
    });
    sendMakeMove = (moves: any[]) => this.sendObject({
        "type": "move",
        "moves": moves
    });
}