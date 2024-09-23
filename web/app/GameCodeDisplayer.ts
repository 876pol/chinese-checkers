import {DisplayableBase} from "./DisplayableBase";
import {Colors, Fonts} from "./Constants";

export class GameCodeDisplayer extends DisplayableBase {
    private gameCode: string = "";

    constructor() {
        super();
    }

    setGameCode(gameCode: string) {
        this.gameCode = gameCode;
    }

    doDisplay() {
        this.p5.noStroke();
        this.p5.fill(Colors.TEXT);
        this.p5.textAlign(this.p5.RIGHT, this.p5.CENTER);
        this.p5.textSize(18);
        this.p5.textFont(Fonts.textFont);
        this.p5.text("Game Code: " + this.gameCode, 790, 20);
    }
}