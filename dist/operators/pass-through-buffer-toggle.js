"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Subscription_1 = require("rxjs/internal/Subscription");
var subscribeToResult_1 = require("rxjs/internal/util/subscribeToResult");
var OuterSubscriber_1 = require("rxjs/internal/OuterSubscriber");
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
function passThroughBufferToggle(openings, closingSelector) {
    return function passThroughBufferToggleOperatorFunction(source) {
        return source.lift(new PassThroughBufferToggleOperator(openings, closingSelector));
    };
}
exports.passThroughBufferToggle = passThroughBufferToggle;
var PassThroughBufferToggleOperator = /** @class */ (function () {
    function PassThroughBufferToggleOperator(openings, closingSelector) {
        this.openings = openings;
        this.closingSelector = closingSelector;
    }
    PassThroughBufferToggleOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new PassThroughBufferToggleSubscriber(subscriber, this.openings, this.closingSelector));
    };
    return PassThroughBufferToggleOperator;
}());
var PassThroughBufferToggleSubscriber = /** @class */ (function (_super) {
    __extends(PassThroughBufferToggleSubscriber, _super);
    function PassThroughBufferToggleSubscriber(destination, openings, closingSelector) {
        var _this = _super.call(this, destination) || this;
        _this.openings = openings;
        _this.closingSelector = closingSelector;
        _this.contexts = [];
        _this.add(subscribeToResult_1.subscribeToResult(_this, openings));
        return _this;
    }
    PassThroughBufferToggleSubscriber.prototype._next = function (value) {
        var contexts = this.contexts;
        var len = contexts.length;
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                contexts[i].buffer.push(value);
            }
        }
        else {
            this.destination.next([value]);
        }
    };
    PassThroughBufferToggleSubscriber.prototype._error = function (err) {
        var contexts = this.contexts;
        while (contexts.length > 0) {
            var context = contexts.shift();
            context.subscription.unsubscribe();
            context.buffer = null;
            context.subscription = null;
        }
        this.contexts = null;
        _super.prototype._error.call(this, err);
    };
    PassThroughBufferToggleSubscriber.prototype._complete = function () {
        var contexts = this.contexts;
        while (contexts.length > 0) {
            var context = contexts.shift();
            this.destination.next(context.buffer);
            context.subscription.unsubscribe();
            context.buffer = null;
            context.subscription = null;
        }
        this.contexts = null;
        _super.prototype._complete.call(this);
    };
    PassThroughBufferToggleSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
        outerValue ? this.closeBuffer(outerValue) : this.openBuffer(innerValue);
    };
    PassThroughBufferToggleSubscriber.prototype.notifyComplete = function (innerSub) {
        this.closeBuffer(innerSub.context);
    };
    PassThroughBufferToggleSubscriber.prototype.openBuffer = function (value) {
        try {
            var closingSelector = this.closingSelector;
            var closingNotifier = closingSelector.call(this, value);
            if (closingNotifier) {
                this.trySubscribe(closingNotifier);
            }
        }
        catch (err) {
            this._error(err);
        }
    };
    PassThroughBufferToggleSubscriber.prototype.closeBuffer = function (context) {
        var contexts = this.contexts;
        if (contexts && context) {
            var buffer = context.buffer, subscription = context.subscription;
            this.destination.next(buffer);
            contexts.splice(contexts.indexOf(context), 1);
            this.remove(subscription);
            subscription.unsubscribe();
        }
    };
    PassThroughBufferToggleSubscriber.prototype.trySubscribe = function (closingNotifier) {
        var contexts = this.contexts;
        var buffer = [];
        var subscription = new Subscription_1.Subscription();
        var context = { buffer: buffer, subscription: subscription };
        contexts.push(context);
        var innerSubscription = subscribeToResult_1.subscribeToResult(this, closingNotifier, context);
        if (!innerSubscription || innerSubscription.closed) {
            this.closeBuffer(context);
        }
        else {
            innerSubscription.context = context;
            this.add(innerSubscription);
            subscription.add(innerSubscription);
        }
    };
    return PassThroughBufferToggleSubscriber;
}(OuterSubscriber_1.OuterSubscriber));
//# sourceMappingURL=pass-through-buffer-toggle.js.map