import {DisplayableBase} from "./DisplayableBase";
import {Colors, Fonts, Player} from "./Constants";

export class TitleDisplayer extends DisplayableBase {
    constructor() {
        super();
    }

    doDisplay() {
        this.p5.stroke(0);
        this.p5.strokeWeight(5);
        this.p5.textSize(110);
        this.p5.textStyle(this.p5.BOLD);
        this.p5.textFont(Fonts.titleFont);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.fill(Colors.PLAYER[Player.RED]);
        this.p5.text("CHINESE", 400, 150);
        this.p5.fill(Colors.PLAYER[Player.GREEN]);
        this.p5.text("CHECKERS", 400, 260);
    }
}