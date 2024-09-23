import {DisplayCoordinate} from "./Coordinate";
import {P5Singleton} from "./App";

export interface Clickable {
    onMouseClick(): void;
}

export abstract class MouseInteractionHandler {
    protected p5: any;

    protected constructor() {
        this.p5 = P5Singleton.getInstance();
    }

    protected get mouseIsPressed(): boolean {
        return this.p5.mouseIsPressed;
    }

    protected get mouseCoordinate(): DisplayCoordinate {
        return DisplayCoordinate.fromCoordinates(this.p5.mouseX, this.p5.mouseY);
    }

    protected abstract mouseIsHovering(): boolean;
}

