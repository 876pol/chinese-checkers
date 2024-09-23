import {Displayable, DisplayableBase} from "./DisplayableBase";
import {Geometry, RectangleGeometry} from "./Geometry";
import {Colors, Fonts} from "./Constants";
import {Clickable, MouseInteractionHandler} from "./Clickable";
import {KeyboardListener} from "./KeyboardListener";

abstract class InputBarDisplayer extends DisplayableBase {
    protected readonly geometry: Geometry;
    protected selected: boolean = false;

    protected constructor(geometry: Geometry) {
        super();
        this.geometry = geometry;
    }

    abstract doDisplay(): void;

    setInputBarSelected(inputBarSelected: boolean): void {
        this.selected = inputBarSelected;
    }
}

export class RectangleInputBarDisplayer extends InputBarDisplayer {
    readonly geometry: RectangleGeometry;

    constructor(geometry: RectangleGeometry) {
        super(geometry);
    }

    doDisplay(): void {
        this.p5.strokeWeight(this.selected ? 3 : 1);
        this.p5.stroke(Colors.BUTTON_BORDER);
        this.p5.fill(Colors.BUTTON);
        this.p5.rect(
            this.geometry.topLeft.x,
            this.geometry.topLeft.y,
            this.geometry.width(),
            this.geometry.height(),
            8
        );
    }
}

export class InputBarTextDisplayer extends InputBarDisplayer {
    protected readonly geometry: RectangleGeometry;
    private text: string = "";
    private caratPosition: number = 0;
    private readonly placeholderText: string = null;
    private readonly textSize: number;
    private lastActionTime: Date = new Date();
    protected selected: boolean = false;

    constructor(geometry: RectangleGeometry, textSize: number, placeholderText: string) {
        super(geometry);
        this.textSize = textSize;
        this.placeholderText = placeholderText;
    }

    setText(text: string): void {
        this.text = text;
    }

    setCaratPosition(caratPosition: number): void {
        this.caratPosition = caratPosition;
    }

    resetLastActionTime(): void {
        this.lastActionTime = new Date();
    }

    applyStyle(): void {
        this.p5.fill(Colors.TEXT);
        this.p5.noStroke();
        this.p5.textStyle(this.p5.NORMAL);
        this.p5.textSize(this.textSize);
        this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
        this.p5.textFont(Fonts.textFont);
    }

    private displayPlaceholderText(): void {
        this.applyStyle();
        this.p5.fill(Colors.TEXT_LIGHT);
        this.p5.text(this.placeholderText, this.geometry.topLeft.x + 10, this.geometry.centre().y);
    }

    private displayText(selected: boolean): void {
        this.applyStyle();
        let xPosition: number = this.geometry.topLeft.x + 10;
        for (let i: number = 0; i < this.text.length; i++) {
            xPosition += 1;
            if (selected && this.caratPosition === i) this.displayCarat(xPosition);
            this.p5.text(this.text[i], xPosition, this.geometry.centre().y);
            xPosition += this.p5.textWidth(this.text[i]);
        }
        if (selected && this.caratPosition === this.text.length) this.displayCarat(xPosition);
    }

    private displayCarat(xPosition: number) {
        const timeDifferenceMilliseconds: number = new Date() - this.lastActionTime;
        if (timeDifferenceMilliseconds > 1500 && timeDifferenceMilliseconds % 1000 > 500) return;
        this.p5.push();
        this.p5.stroke(Colors.TEXT);
        this.p5.strokeWeight(2);
        this.p5.line(xPosition, this.geometry.topLeft.y + 9, xPosition, this.geometry.bottomRight.y - 9);
        this.p5.pop();
    }

    doDisplay(): void {
        if (!this.selected && this.text === "") {
            this.displayPlaceholderText();
        } else {
            this.displayText(this.selected);
        }
    }
}

export class InputBar extends MouseInteractionHandler implements Displayable, Clickable, KeyboardListener {
    private text: string = "";
    private caratPosition: number = 0;
    private selected: boolean = false;
    private prevKeyPressed: number = null;
    private nextKeyRepeatTime: Date = null;

    constructor(private geometry: RectangleGeometry,
                private shapeDisplayer: InputBarDisplayer,
                private textDisplayer: InputBarTextDisplayer,
                private maxLength: number) {
        super();
    }

    mouseIsHovering(): boolean {
        return this.geometry.containsPoint(this.mouseCoordinate.x, this.mouseCoordinate.y);
    }

    display(): void {
        if (this.mouseIsHovering()) this.p5.cursor("text");
        this.handleKeyHeld();

        this.shapeDisplayer.setInputBarSelected(this.selected);
        this.shapeDisplayer.display();

        this.textDisplayer.setInputBarSelected(this.selected);
        this.textDisplayer.setText(this.text);
        this.textDisplayer.setCaratPosition(this.caratPosition);
        this.textDisplayer.display();
    }

    onMouseClick(): void {
        this.selected = this.mouseIsHovering();
        if (this.mouseIsHovering()) {
            this.textDisplayer.resetLastActionTime();
            this.updateCaratLocation();
        }
    }

    reset(): void {
        this.text = "";
        this.caratPosition = 0;
        this.selected = false;
        this.prevKeyPressed = null;
        this.nextKeyRepeatTime = null;
    }

    getText(): string {
        return this.text;
    }

    private updateCaratLocation() {
        this.textDisplayer.applyStyle(); // need for textWidth() to function properly
        let xPosition: number = this.geometry.topLeft.x + 10;
        this.caratPosition = this.text.length;
        for (let i: number = 0; i < this.text.length; i++) {
            xPosition += 1;
            const textWidth = this.p5.textWidth(this.text[i]);
            if (this.mouseCoordinate.x < xPosition + textWidth / 2) {
                this.caratPosition = i;
                break;
            }
            xPosition += textWidth;
        }
    }

    onKeyPressed(): void {
        if (!this.selected) return;
        this.handleCurrentlyPressedKey();
        this.setNextDeleteTime(500);
        this.prevKeyPressed = this.p5.keyCode;
    }

    private handleCurrentlyPressedKey(): void {
        if (this.p5.key.length === 1) this.insertCharacter();
        if (this.p5.keyCode === this.p5.BACKSPACE) this.deleteCharacter();
        if (this.p5.keyCode === this.p5.LEFT_ARROW) this.moveCaratLeft();
        if (this.p5.keyCode === this.p5.RIGHT_ARROW) this.moveCaratRight();
    }

    private insertCharacter() {
        if (this.text.length >= this.maxLength) return;
        this.text = this.text.slice(0, this.caratPosition) +
            this.p5.key +
            this.text.slice(this.caratPosition);
        this.caratPosition++;
        this.textDisplayer.resetLastActionTime();
    }

    private deleteCharacter() {
        if (this.caratPosition === 0) return;
        this.text = this.text.slice(0, this.caratPosition - 1) +
            this.text.slice(this.caratPosition);
        this.caratPosition--;
        this.textDisplayer.resetLastActionTime();
    }

    private moveCaratLeft() {
        if (this.caratPosition === 0) return;
        this.caratPosition--;
        this.textDisplayer.resetLastActionTime();
    }

    private moveCaratRight() {
        if (this.caratPosition === this.text.length) return;
        this.caratPosition++;
        this.textDisplayer.resetLastActionTime();
    }

    private handleKeyHeld() {
        if (this.nextKeyRepeatTime !== null && this.p5.keyIsPressed && this.p5.keyCode === this.prevKeyPressed) {
            if (this.nextKeyRepeatTime < new Date()) {
                this.handleCurrentlyPressedKey();
                this.setNextDeleteTime(30);
            }
        } else {
            this.nextKeyRepeatTime = null;
            this.prevKeyPressed = null;
        }
    }

    private setNextDeleteTime(millisecondsInFuture: number): void {
        const currDate: Date = new Date();
        currDate.setTime(currDate.getTime() + millisecondsInFuture);
        this.nextKeyRepeatTime = currDate;
    }
}