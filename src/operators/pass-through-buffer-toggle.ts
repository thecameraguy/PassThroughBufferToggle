import { Operator } from 'rxjs/Operator';
import { Observable, SubscribableOrPromise } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { Subscription } from 'rxjs/Subscription';
import { OuterSubscriber } from 'rxjs/OuterSubscriber';
import { InnerSubscriber } from 'rxjs/InnerSubscriber';
import { subscribeToResult } from 'rxjs/util/subscribeToResult';

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
                    ): Observable<T[]> {

    return this.lift(new PassThroughBufferToggleOperator<T, O>(openings, closingSelector));
}

class PassThroughBufferToggleOperator<T, O> implements Operator<T, T[]> {
    constructor (
        private openings: SubscribableOrPromise<O>,
        private closingSelector: (value: O) => SubscribableOrPromise<any>) {
    }

    public call(subscriber: Subscriber<T[]>, source: any): any {
        return source.subscribe(new PassThroughBufferToggleSubscriber(subscriber, this.openings, this.closingSelector));
    }
}

interface BufferContext<T> {
    buffer: T[];
    subscription: Subscription;
}

class PassThroughBufferToggleSubscriber<T, O> extends OuterSubscriber<T, O> {
    private contexts: Array<BufferContext<T>> = [];

    constructor(
        public destination: Subscriber<T[]>,
        private openings: SubscribableOrPromise<O>,
        private closingSelector: (value: O) => SubscribableOrPromise<any> | void) {

        super(destination);
        this.add(subscribeToResult(this, openings));
    }

    public notifyNext(outerValue: any,
                        innerValue: O,
                        outerIndex: number,
                        innerIndex: number,
                        innerSubscriber: InnerSubscriber<T, O>): void {
        outerValue ? this.closeBuffer(outerValue) : this.openBuffer(innerValue);
    }

    public notifyComplete(innerSubscriber: InnerSubscriber<T, O>): void {
        this.closeBuffer((<any> innerSubscriber).context);
    }

    protected _next(value: T): void {
        const contexts: Array<BufferContext<T>> = this.contexts;
        const len = contexts.length;

        // Any buffers open? Start collecting the values;
        if (len > 0) {
            for (let i = 0; i < len; ++i) {
                contexts[i].buffer.push(value);
            }

        // All buffers are closed. Let the values through.
        } else {
            this.destination.next([value]);
        }

    }

    protected _error(err: any): void {
        const contexts: Array<BufferContext<T>> = this.contexts;

        while (contexts.length > 0) {
            const context = contexts.shift();
            this.clearContext(context);
        }

        this.contexts = null;
        super._error(err);
    }

    protected _complete(): void {
        const contexts: Array<BufferContext<T>> = this.contexts;

        while (contexts.length > 0) {
            const context = contexts.shift();
            this.destination.next(context.buffer);
            this.clearContext(context);
        }

        this.contexts = null;
        super._complete();
    }

    private clearContext(context: BufferContext<T>): void {
        context.subscription.unsubscribe();
        context.buffer = null;
        context.subscription = null;
    }

    private openBuffer(value: O): void {
        try {

            const closingSelector: (value: O) => SubscribableOrPromise<any> | void = this.closingSelector;
            const closingNotifier: any = closingSelector.call(this, value);

            if (closingNotifier) {
                this.trySubscribe(closingNotifier);
            }

        } catch (error) {
            this._error(error);
        }
    }

    private closeBuffer(context: BufferContext<T>): void {
        const contexts: Array<BufferContext<T>> = this.contexts;

        if (contexts && context) {

            const { buffer, subscription } = context;

            this.destination.next(buffer);
            contexts.splice(contexts.indexOf(context), 1);

            this.remove(subscription);
            subscription.unsubscribe();

        }
    }

    private trySubscribe(closingNotifier: any): void {
        const contexts: Array<BufferContext<T>> = this.contexts;

        const buffer: Array<T> = [];
        const subscription: Subscription = new Subscription();

        const context: BufferContext<T> = { buffer, subscription };
        contexts.push(context);

        const innerSubscription: Subscription = subscribeToResult(this, closingNotifier, <any> context);

        if (!innerSubscription || innerSubscription.closed) {

            this.closeBuffer(context);

        } else {

            (<any> innerSubscription).context = context;

            this.add(innerSubscription);
            subscription.add(innerSubscription);

        }
    }

}
