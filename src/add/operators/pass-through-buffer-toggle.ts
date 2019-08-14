import { Observable } from 'rxjs/Observable';
import { passThroughBufferToggle } from '../../operators/pass-through-buffer-toggle';

/**
 * Addable passThroughBufferToggle operator. Just import this module to patch Observable and add
 * passThroughBufferToggle operator.
 *
 * See passThroughBufferToggle operator for more detail.
 *
 * The author took a heavy inspiration from bufferToggle.ts in RxJS source. It's actually mostly
 * bufferToggle with some minor modifications. We will be contributing this to RxJS project
 * if they want to take it and at the very least will be publishing this operator to npm.
 */

// Patch Observable with the new operator
(<any> Observable).prototype.passThroughBufferToggle = passThroughBufferToggle;
(<any> Observable).prototype._passThroughBufferToggle = passThroughBufferToggle;
// Merge rxjs/Rx Observable interface to include the new operator
declare module 'rxjs/Observable' {
    // tslint:disable-next-line:no-shadowed-variable
    interface Observable<T> {
        passThroughBufferToggle: typeof passThroughBufferToggle;
        _passThroughBufferToggle: typeof passThroughBufferToggle;
    }
}
