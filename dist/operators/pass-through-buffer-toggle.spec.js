"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jasmine");
var rxjs_1 = require("rxjs");
var pass_through_buffer_toggle_1 = require("./pass-through-buffer-toggle");
describe('passThroughBufferToggle', function () {
    var inputStream$;
    var openings$;
    var closings$;
    var closingSelector;
    beforeEach(function () {
        jasmine.clock().install();
        inputStream$ = new rxjs_1.Subject();
        openings$ = new rxjs_1.Subject();
        closings$ = new rxjs_1.Subject();
        closingSelector = createClosingSelector(closings$);
    });
    afterEach(function () {
        jasmine.clock().uninstall();
    });
    it('should emit values immediately when no buffer is open', function () {
        var emitted = [];
        inputStream$.pipe(pass_through_buffer_toggle_1.passThroughBufferToggle(openings$, closingSelector))
            .subscribe(function (value) {
            emitted = emitted.concat(value);
        });
        inputStream$.next(1);
        inputStream$.next(2);
        inputStream$.next(3);
        inputStream$.next(4);
        jasmine.clock().tick(1000);
        expect(emitted.length).toBe(4);
        expect(emitted).toEqual([1, 2, 3, 4]);
    });
    it('should not emit values when one buffer is open', function () {
        var emitted = [];
        inputStream$.pipe(pass_through_buffer_toggle_1.passThroughBufferToggle(openings$, closingSelector))
            .subscribe(function (value) {
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
    it('should not emit values when more than one buffer is open', function () {
        var emitted = [];
        inputStream$.pipe(pass_through_buffer_toggle_1.passThroughBufferToggle(openings$, closingSelector))
            .subscribe(function (value) {
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
    it('should emit all buffered values when buffers are closed', function () {
        var emitted = [];
        inputStream$.pipe(pass_through_buffer_toggle_1.passThroughBufferToggle(openings$, closingSelector))
            .subscribe(function (value) {
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
        expect(emitted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 5, 6, 7, 8]);
    });
    it('should continue emitting values when buffers are closed', function () {
        var emitted = [];
        inputStream$.pipe(pass_through_buffer_toggle_1.passThroughBufferToggle(openings$, closingSelector))
            .subscribe(function (value) {
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
        expect(emitted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 5, 6, 7, 8]);
        emitted = [];
        inputStream$.next(9);
        inputStream$.next(10);
        inputStream$.next(11);
        inputStream$.next(12);
        expect(emitted.length).toBe(4);
        expect(emitted).toEqual([9, 10, 11, 12]);
    });
});
var createClosingSelector = function (subject) {
    var selector = function (value) {
        return subject;
    };
    return selector;
};
//# sourceMappingURL=pass-through-buffer-toggle.spec.js.map