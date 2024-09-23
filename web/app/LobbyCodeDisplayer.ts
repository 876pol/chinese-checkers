import {DisplayableBase} from "./DisplayableBase";
import {Colors, Fonts} from "./Constants";

export class LobbyCodeDisplayer extends DisplayableBase {
    private gameCode: string = "";

    constructor() {
        super();
    }

    setGameCode(gameCode: string) {
        this.gameCode = gameCode;
    }

    doDisplay() {
        this.p5.strokeWeight(1);
        this.p5.stroke(Colors.BUTTON_BORDER);
        this.p5.fill(Colors.BUTTON);
        this.p5.rect(150, 150, 500, 80, 12);

        this.p5.fill(Colors.TEXT);
        this.p5.noStroke();
        this.p5.textSize(35);
        this.p5.textStyle(this.p5.NORMAL);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.textFont(Fonts.textFont);
        this.p5.text("Game Code: " + this.gameCode, 400, 190);
    }
}