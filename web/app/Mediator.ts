import {Button} from "./Button";

export interface Mediator {
    notify(sender: Button, msg?: object): void;

    enable(): void;

    disable(): void;
}
