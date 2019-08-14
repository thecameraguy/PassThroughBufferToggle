# PassThroughBufferToggle
RxJS operator passThroughBufferToggle.

## Description
Works like bufferToggle operator but when there is no buffer open, values pass straight through this
operator and are emitted as an array of length 1.

This is useful for using it as a bufferedGate. Open the gate to allow values to flow through, close the
gate to buffer up the values until the gate opens next time. When the gate opens, buffered up values are
emitted as an array and then new values are emitted as an array of length 1 as soon as they arrive.

It is possible to generate multiple buffers. Multiple buffers behave exactly like bufferToggle.

The author took a heavy inspiration from bufferToggle.ts in RxJS source. It's actually mostly bufferToggle
with some minor modifications. We will be contributing this to RxJS project if they want to take it and at
the very least will be publishing this operator to npm.

## Usage

```typescript
import { interval } from 'rxjs';
import 'passthroughbuffertoggle/add/pass-through-buffer-toggle';

// emit every second
const sourceInterval = interval (1000);

// start buffering every 5 seconds
const startBufferInterval = interval (5000);

// stop buffering after 3 seconds of buffer start
const stopBufferInterval = (value) => {
    return interval(3000);
}

// [[1], [2], [3], [4,5,6], [7], [8], [9,10,11], ... ]
sourceInterval
    .passThroughBufferToggle(startBufferInterval, stopBufferInterval)
    .subscribe((value) => {
        console.log('Emitted:', value);
    });

```
