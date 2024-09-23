import {P5Singleton} from "./App";

export interface Displayable {
    display(): void;
}

export abstract class DisplayableBase implements Displayable {
    protected p5;

    protected constructor() {
        this.p5 = P5Singleton.getInstance();
    }

    display(): void {
        this.p5.push();
        this.doDisplay();
        this.p5.pop();
    }

    protected abstract doDisplay(): void;
}
