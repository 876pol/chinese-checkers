import {DisplayableBase} from "./DisplayableBase";
import {Colors, DisplayConstants, Fonts} from "./Constants";

export class ReconnectingDisplayer extends DisplayableBase {
    constructor() {
        super();
    }

    doDisplay() {
        this.p5.noStroke();
        this.p5.fill(Colors.BACKGROUND_TRANSPARENT);
        this.p5.rect(0, 0, DisplayConstants.CANVAS_WIDTH, DisplayConstants.CANVAS_HEIGHT);

        this.p5.fill(Colors.TEXT);
        this.p5.textSize(50);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.textFont(Fonts.textFont);
        this.p5.text(
            this.p5.webSocketIO.numReconnectAttempts >= 3 ? "Unable to connect..." : "Connecting...",
            400, 400
        );
    }
}