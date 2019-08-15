import { Observable, SubscribableOrPromise } from 'rxjs/Observable';
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
export declare function passThroughBufferToggle<T, O>(openings: SubscribableOrPromise<O>, closingSelector: (value: O) => SubscribableOrPromise<any>): Observable<T[]>;
