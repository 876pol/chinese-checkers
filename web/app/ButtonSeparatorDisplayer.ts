import {DisplayableBase} from "./DisplayableBase";
import {Colors, Fonts} from "./Constants";

export class ButtonSeparatorDisplayer extends DisplayableBase {
    constructor() {
        super();
    }

    doDisplay() {
        this.p5.fill(Colors.GRAY_DARK);
        this.p5.strokeWeight(1);
        this.p5.stroke(Colors.GRAY_DARK);
        this.p5.line(50, 502, 375, 502);
        this.p5.line(425, 502, 750, 502);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.textSize(20);
        this.p5.textFont(Fonts.textFont);
        this.p5.text("OR", 400, 502);
    }
}