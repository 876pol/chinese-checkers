import {CircleGeometry, Geometry, RectangleGeometry, TriangleGeometry} from "./Geometry";
import {Colors, DisplayConstants, Fonts, Player} from "./Constants";
import {Displayable, DisplayableBase} from "./DisplayableBase";
import {Clickable, MouseInteractionHandler} from "./Clickable";
import {Mediator} from "./Mediator";
import * as p5 from "p5";
import {DisplayCoordinate, GameCoordinate} from "./Coordinate";

export enum ButtonState {
    UNPRESSED = 0,
    HOVERING = 1,
    PRESSED = 2,
}

abstract class ButtonDisplayer extends DisplayableBase {
    protected readonly geometry: Geometry;
    protected buttonState: ButtonState = ButtonState.UNPRESSED;

    protected constructor(geometry: Geometry) {
        super();
        this.geometry = geometry;
    }

    abstract doDisplay(): void;

    setButtonState(buttonState: ButtonState): void {
        this.buttonState = buttonState;
    }
}

export class ButtonTextDisplayer extends ButtonDisplayer {
    protected readonly geometry: Geometry;
    private readonly text: string;
    private readonly textSize: number;

    constructor(geometry: Geometry, text: string, textSize: number) {
        super(geometry);
        this.text = text;
        this.textSize = textSize;
    }

    doDisplay(): void {
        this.p5.fill(Colors.TEXT);
        this.p5.noStroke();
        this.p5.textStyle(this.p5.NORMAL);
        this.p5.textSize(this.textSize);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.textFont(Fonts.textFont);
        this.p5.text(this.text, this.geometry.centre().x, this.geometry.centre().y);
    }
}

export class ButtonImageDisplayer extends ButtonDisplayer {
    protected readonly geometry: Geometry;
    private readonly image: p5.Image;

    constructor(geometry: Geometry, image: p5.Image) {
        super(geometry);
        this.image = image;
    }

    doDisplay(): void {
        this.p5.image(
            this.image,
            this.geometry.centre().x - this.image.width / 2,
            this.geometry.centre().y - this.image.height / 2
        );
    }
}


export class RectangleButtonDisplayer extends ButtonDisplayer {
    readonly geometry: RectangleGeometry;

    constructor(geometry: RectangleGeometry) {
        super(geometry);
    }

    doDisplay(): void {
        this.p5.strokeWeight(1);
        this.p5.stroke(Colors.BUTTON_BORDER);
        this.p5.fill(this.buttonState == ButtonState.UNPRESSED ? Colors.BUTTON : Colors.BUTTON_DARK);
        this.p5.rect(
            this.geometry.topLeft.x,
            this.geometry.topLeft.y,
            this.geometry.width(),
            this.geometry.height(),
            8
        );
    }
}

export class TriangleButtonDisplayer extends ButtonDisplayer {
    readonly geometry: TriangleGeometry;

    constructor(geometry: TriangleGeometry) {
        super(geometry);
    }

    doDisplay(): void {
        this.p5.noStroke();
        this.p5.fill(this.buttonState == ButtonState.UNPRESSED ? Colors.BACK_BUTTON : Colors.BACK_BUTTON_DARK);
        this.p5.triangle(
            this.geometry.p1.x, this.geometry.p1.y,
            this.geometry.p2.x, this.geometry.p2.y,
            this.geometry.p3.x, this.geometry.p3.y
        );
    }
}

export class CircleButtonDisplayer extends ButtonDisplayer {
    readonly geometry: CircleGeometry;

    constructor(geometry: CircleGeometry, private color: string, private colorHover) {
        super(geometry);
    }

    doDisplay(): void {
        this.p5.stroke(Colors.BUTTON_BORDER);
        this.p5.strokeWeight(1);
        this.p5.fill(this.buttonState === ButtonState.UNPRESSED ? this.color : this.colorHover);
        this.p5.circle(this.geometry.centre().x, this.geometry.centre().y, this.geometry.radius * 2);
    }

}

export class Button extends MouseInteractionHandler implements Displayable, Clickable {
    constructor(protected geometry: Geometry,
                protected displayerArr: ButtonDisplayer[],
                protected mediator: Mediator) {
        super();
    }

    mouseIsHovering(): boolean {
        return this.geometry.containsPoint(this.mouseCoordinate.x, this.mouseCoordinate.y);
    }

    getButtonState(): ButtonState {
        if (this.mouseIsPressed && this.mouseIsHovering()) {
            return ButtonState.PRESSED;
        } else if (this.mouseIsHovering()) {
            return ButtonState.HOVERING;
        } else {
            return ButtonState.UNPRESSED;
        }
    }

    display(): void {
        if (this.mouseIsHovering()) this.p5.cursor("pointer");
        for (const displayer: ButtonDisplayer of this.displayerArr) {
            displayer.setButtonState(this.getButtonState());
            displayer.display();
        }
    }

    onMouseClick(): void {
        if (this.mouseIsHovering() && this.mediator !== null) this.mediator.notify(this);
    }
}

export class BoardButton extends Button {
    constructor(private gameCoordinate: GameCoordinate, player: Player, mediator: Mediator, private active: boolean) {
        const displayCoordinate: DisplayCoordinate = gameCoordinate.toDisplayCoordinate();
        const circleGeometry: CircleGeometry = new CircleGeometry(
            displayCoordinate,
            DisplayConstants.CIR_DIAMETER / 2
        );
        if (active && player === Player.SPECTATOR) {
            super(circleGeometry, [
                new CircleButtonDisplayer(circleGeometry, Colors.GRAY, Colors.GRAY_DARK)
            ], mediator);
        } else {
            super(circleGeometry, [
                new CircleButtonDisplayer(circleGeometry, Colors.PLAYER[player], Colors.PLAYER_DARK[player])
            ], mediator);
        }
    }

    display(): void {
        if (this.active && this.mouseIsHovering()) this.p5.cursor("pointer");
        for (const displayer: ButtonDisplayer of this.displayerArr) {
            displayer.setButtonState(this.active ? this.getButtonState() : ButtonState.UNPRESSED);
            displayer.display();
        }
    }

    onMouseClick(): void {
        if (this.active && this.mouseIsHovering() && this.mediator !== null) {
            this.mediator.notify(this, this.gameCoordinate);
        }
    }
}