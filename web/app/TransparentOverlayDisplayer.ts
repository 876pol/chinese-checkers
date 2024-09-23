import {DisplayableBase} from "./DisplayableBase";
import {Colors, DisplayConstants} from "./Constants";

export class TransparentOverlayDisplayer extends DisplayableBase {
    constructor() {
        super();
    }

    doDisplay() {
        this.p5.noStroke();
        this.p5.fill(Colors.BACKGROUND_TRANSPARENT);
        this.p5.rect(0, 0, DisplayConstants.CANVAS_WIDTH, DisplayConstants.CANVAS_HEIGHT);
    }
}