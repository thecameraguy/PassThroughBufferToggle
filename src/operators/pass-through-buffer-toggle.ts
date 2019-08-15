import { Operator } from 'rxjs/internal/Operator';
import { Subscriber } from 'rxjs/internal/Subscriber';
import { Observable } from 'rxjs/internal/Observable';
import { Subscription } from 'rxjs/internal/Subscription';
import { subscribeToResult } from 'rxjs/internal/util/subscribeToResult';
import { OuterSubscriber } from 'rxjs/internal/OuterSubscriber';
import { InnerSubscriber } from 'rxjs/internal/InnerSubscriber';
import { OperatorFunction, SubscribableOrPromise } from 'rxjs/internal/types';

/**
 * A pass-through toggle-able buffer.
 *
 * Works like bufferToggle operator but when there is no buffer open, values pass straight
 * through this operator and are emitted as an array of length 1.
 *
 * This is useful for using it as a bufferedGate. Open the gate to allow values to flow through,
 * close the gate to buffer up the values until the gate opens next time. When the gate opens,
 * buffered up values are emitted as an array and then new values are emitted as an array of
 * length 1 as soon as they arrive.
 *
 * It is possible to generate multiple buffers. Multiple buffers behave exactly like bufferToggle.
 *
 * The author took a heavy inspiration from bufferToggle.ts in RxJS source. It's actually mostly
 * bufferToggle with some minor modifications. We will be contributing this to RxJS project
 * if they want to take it and at the very least will be publishing this operator to npm.
 */
export function passThroughBufferToggle<T, O>(
    openings: SubscribableOrPromise<O>,
    closingSelector: (value: O) => SubscribableOrPromise<any>
): OperatorFunction<T, T[]> {

    return function passThroughBufferToggleOperatorFunction(source: Observable<T>) {
        return source.lift(new PassThroughBufferToggleOperator<T, O>(openings, closingSelector));
    };
}

class PassThroughBufferToggleOperator<T, O> implements Operator<T, T[]> {

    constructor(private openings: SubscribableOrPromise<O>,
        private closingSelector: (value: O) => SubscribableOrPromise<any>) {
    }

    call(subscriber: Subscriber<T[]>, source: any): any {
        return source.subscribe(new PassThroughBufferToggleSubscriber(subscriber, this.openings, this.closingSelector));
    }
}

interface BufferContext<T> {
    buffer: T[];
    subscription: Subscription;
}

class PassThroughBufferToggleSubscriber<T, O> extends OuterSubscriber<T, O> {
    private contexts: Array<BufferContext<T>> = [];

    constructor(destination: Subscriber<T[]>,
        private openings: SubscribableOrPromise<O>,
        private closingSelector: (value: O) => SubscribableOrPromise<any> | void) {
        super(destination);
        this.add(subscribeToResult(this, openings));
    }

    protected _next(value: T): void {
        const contexts = this.contexts;
        const len = contexts.length;
        if (len > 0) {
            for (let i = 0; i < len; i++) {
                contexts[i].buffer.push(value);
            }
        } else {
            this.destination.next([value]);
        }
    }

    protected _error(err: any): void {
        const contexts = this.contexts;
        while (contexts.length > 0) {
            const context = contexts.shift();
            context.subscription.unsubscribe();
            context.buffer = null;
            context.subscription = null;
        }
        this.contexts = null;
        super._error(err);
    }

    protected _complete(): void {
        const contexts = this.contexts;
        while (contexts.length > 0) {
            const context = contexts.shift();
            this.destination.next(context.buffer);
            context.subscription.unsubscribe();
            context.buffer = null;
            context.subscription = null;
        }
        this.contexts = null;
        super._complete();
    }

    notifyNext(outerValue: any, innerValue: O,
        outerIndex: number, innerIndex: number,
        innerSub: InnerSubscriber<T, O>): void {
        outerValue ? this.closeBuffer(outerValue) : this.openBuffer(innerValue);
    }

    notifyComplete(innerSub: InnerSubscriber<T, O>): void {
        this.closeBuffer((<any>innerSub).context);
    }

    private openBuffer(value: O): void {
        try {
            const closingSelector = this.closingSelector;
            const closingNotifier = closingSelector.call(this, value);
            if (closingNotifier) {
                this.trySubscribe(closingNotifier);
            }
        } catch (err) {
            this._error(err);
        }
    }

    private closeBuffer(context: BufferContext<T>): void {
        const contexts = this.contexts;

        if (contexts && context) {
            const { buffer, subscription } = context;
            this.destination.next(buffer);
            contexts.splice(contexts.indexOf(context), 1);
            this.remove(subscription);
            subscription.unsubscribe();
        }
    }

    private trySubscribe(closingNotifier: any): void {
        const contexts = this.contexts;

        const buffer: Array<T> = [];
        const subscription = new Subscription();
        const context = { buffer, subscription };
        contexts.push(context);

        const innerSubscription = subscribeToResult(this, closingNotifier, <any>context);

        if (!innerSubscription || innerSubscription.closed) {
            this.closeBuffer(context);
        } else {
            (<any>innerSubscription).context = context;

            this.add(innerSubscription);
            subscription.add(innerSubscription);
        }
    }
}

(<any>Observable).prototype.passThroughBufferToggle = passThroughBufferToggle;
