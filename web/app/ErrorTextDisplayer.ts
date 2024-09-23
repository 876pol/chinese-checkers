import {Colors, Fonts} from "./Constants";
import {DisplayableBase} from "./DisplayableBase";
import {DisplayCoordinate} from "./Coordinate";

export class ErrorTextDisplayer extends DisplayableBase {
    constructor(private location: DisplayCoordinate, private text: string) {
        super();
    }

    doDisplay() {
        this.p5.fill(Colors.TEXT_ERROR);
        this.p5.noStroke();
        this.p5.textStyle(this.p5.NORMAL);
        this.p5.textSize(20);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.textFont(Fonts.textFont);
        this.p5.text(this.text, this.location.x, this.location.y);
    }
}