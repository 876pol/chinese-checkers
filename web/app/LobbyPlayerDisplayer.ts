import {DisplayableBase} from "./DisplayableBase";
import {Colors, Fonts} from "./Constants";
import {RectangleGeometry} from "./Geometry";
import {LobbyPlayer} from "./LobbyMediator";

export class LobbyPlayerDisplayer extends DisplayableBase {

    constructor(private geometry: RectangleGeometry,
                private lobbyPlayer: LobbyPlayer) {
        super();
    }

    setLobbyPlayer(lobbyPlayer: LobbyPlayer): void {
        this.lobbyPlayer = lobbyPlayer;
    }

    doDisplay(): void {
        this.p5.strokeWeight(1);
        this.p5.stroke(Colors.PLAYER_DARK[this.lobbyPlayer.player]);
        this.p5.fill(Colors.PLAYER_LIGHT[this.lobbyPlayer.player]);
        this.p5.rect(
            this.geometry.topLeft.x,
            this.geometry.topLeft.y,
            this.geometry.width(),
            this.geometry.height(),
            12
        );

        this.p5.fill(Colors.TEXT);
        this.p5.noStroke();
        this.p5.textSize(35);
        this.p5.textStyle(this.p5.NORMAL);
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        this.p5.textFont(Fonts.textFont);
        this.p5.text(this.lobbyPlayer.username, this.geometry.topLeft.x + 10, this.geometry.centre().y);
    }
}