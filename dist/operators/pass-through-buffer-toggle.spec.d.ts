import 'jasmine';
import { passThroughBufferToggle } from './pass-through-buffer-toggle';
declare module 'rxjs/Observable' {
    interface Observable<T> {
        passThroughBufferToggle: typeof passThroughBufferToggle;
        _passThroughBufferToggle: typeof passThroughBufferToggle;
    }
}
