import {Displayable} from "./DisplayableBase";
import {Clickable} from "./Clickable";
import {KeyboardListener} from "./KeyboardListener";

abstract class P5EventPublisher<T> {
    private subscribers: T[] = [];

    public add(subscriber: T): void {
        if (this.subscribers.indexOf(subscriber) === -1) {
            this.subscribers.push(subscriber);
        }
    }

    public remove(subscriber: T): void {
        const index: number = this.subscribers.indexOf(subscriber);
        if (index !== -1) {
            this.subscribers.splice(index, 1);
        }
    }

    public publish(): void {
        const subscribersCopy: T[] = this.subscribers.slice(); // Create a shallow copy
        for (const subscriber: T of subscribersCopy) {
            this.notifySubscriber(subscriber);
        }
    }

    protected abstract notifySubscriber(subscriber: T): void;
}

export class P5Drawer extends P5EventPublisher<Displayable> {
    protected notifySubscriber(subscriber: Displayable): void {
        subscriber.display();
    }
}

export class P5MousePublisher extends P5EventPublisher<Clickable> {
    protected notifySubscriber(subscriber: Clickable): void {
        subscriber.onMouseClick();
    }
}

export class P5KeyPressedPublisher extends P5EventPublisher<KeyboardListener> {
    protected notifySubscriber(subscriber: KeyboardListener): void {
        subscriber.onKeyPressed();
    }
}