import 'jasmine';
import { Observable, Subject, pipe } from 'rxjs';
import { passThroughBufferToggle } from './pass-through-buffer-toggle';

describe('passThroughBufferToggle', () => {
    let inputStream$: Subject<number>;
    let openings$: Subject<boolean>;
    let closings$: Subject<boolean>;
    let closingSelector: (value: boolean) => Subject<boolean>;

    beforeEach(() => {
        jasmine.clock().install();
        inputStream$ = new Subject();
        openings$ = new Subject();
        closings$ = new Subject();
        closingSelector = createClosingSelector(closings$);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should emit values immediately when no buffer is open', () => {
        let emitted: number[] = [];
        inputStream$.pipe(
                passThroughBufferToggle(openings$, closingSelector)
            )
            .subscribe((value: number[]) => {
                emitted = emitted.concat(value);
            });

        inputStream$.next(1);
        inputStream$.next(2);
        inputStream$.next(3);
        inputStream$.next(4);

        jasmine.clock().tick(1000);

        expect(emitted.length).toBe(4);
        expect(emitted).toEqual([ 1, 2, 3, 4 ]);
    });
    it('should not emit values when one buffer is open', () => {
        let emitted: number[] = [];
        inputStream$.pipe(
                passThroughBufferToggle(openings$, closingSelector)
            )
            .subscribe((value: number[]) => {
                emitted = emitted.concat(value);
            });

        openings$.next(true);

        inputStream$.next(1);
        inputStream$.next(2);
        inputStream$.next(3);
        inputStream$.next(4);

        jasmine.clock().tick(1000);

        expect(emitted.length).toBe(0);
    });
    it('should not emit values when more than one buffer is open', () => {
        let emitted: number[] = [];
        inputStream$.pipe(
                passThroughBufferToggle(openings$, closingSelector)
            )
            .subscribe((value: number[]) => {
                emitted = emitted.concat(value);
            });

        openings$.next(true);

        inputStream$.next(1);
        inputStream$.next(2);
        inputStream$.next(3);
        inputStream$.next(4);

        openings$.next(true);

        inputStream$.next(5);
        inputStream$.next(6);
        inputStream$.next(7);
        inputStream$.next(8);

        jasmine.clock().tick(1000);

        expect(emitted.length).toBe(0);
    });
    it('should emit all buffered values when buffers are closed', () => {
        let emitted: number[] = [];
        inputStream$.pipe(
                passThroughBufferToggle(openings$, closingSelector)
            )
            .subscribe((value: number[]) => {
                emitted = emitted.concat(value);
            });

        openings$.next(true);

        inputStream$.next(1);
        inputStream$.next(2);
        inputStream$.next(3);
        inputStream$.next(4);

        openings$.next(true);

        inputStream$.next(5);
        inputStream$.next(6);
        inputStream$.next(7);
        inputStream$.next(8);

        closings$.next(true);

        jasmine.clock().tick(1000);

        expect(emitted.length).toBe(12);
        expect(emitted).toEqual([ 1, 2, 3, 4, 5, 6, 7, 8, 5, 6, 7, 8 ]);

    });
    it('should continue emitting values when buffers are closed', () => {
        let emitted: number[] = [];
        inputStream$.pipe(
                passThroughBufferToggle(openings$, closingSelector)
            )
            .subscribe((value: number[]) => {
                emitted = emitted.concat(value);
            });

        openings$.next(true);

        inputStream$.next(1);
        inputStream$.next(2);
        inputStream$.next(3);
        inputStream$.next(4);

        openings$.next(true);

        inputStream$.next(5);
        inputStream$.next(6);
        inputStream$.next(7);
        inputStream$.next(8);

        closings$.next(true);

        jasmine.clock().tick(1000);

        expect(emitted.length).toBe(12);
        expect(emitted).toEqual([ 1, 2, 3, 4, 5, 6, 7, 8, 5, 6, 7, 8 ]);

        emitted = [];

        inputStream$.next(9);
        inputStream$.next(10);
        inputStream$.next(11);
        inputStream$.next(12);

        expect(emitted.length).toBe(4);
        expect(emitted).toEqual([ 9, 10, 11, 12 ]);
    });

});

const createClosingSelector: (subject: Subject<boolean>) => ((value: boolean) => Subject<boolean>) = (subject) => {
    const selector = (value): Subject<boolean> => {
        return subject;
    };
    return selector;
};
