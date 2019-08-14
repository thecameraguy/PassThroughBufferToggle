"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable_1 = require("rxjs/Observable");
var pass_through_buffer_toggle_1 = require("../../operators/pass-through-buffer-toggle");
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
Observable_1.Observable.prototype.passThroughBufferToggle = pass_through_buffer_toggle_1.passThroughBufferToggle;
Observable_1.Observable.prototype._passThroughBufferToggle = pass_through_buffer_toggle_1.passThroughBufferToggle;
//# sourceMappingURL=pass-through-buffer-toggle.js.map