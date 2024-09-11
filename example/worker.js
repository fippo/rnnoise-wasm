import RNNoise from './rnnoise.js';

let wasmInterface;
let context;
let wasmPcmInput;
let wasmPcmInputF32Index;
async function transform(encodedFrame, controller) {
    const buffer = new Float32Array(encodedFrame.numberOfFrames * encodedFrame.numberOfChannels);
    for (let channel = 0; channel < encodedFrame.numberOfChannels; channel++) {
      const offset = encodedFrame.numberOfFrames * channel;
      const samples = buffer.subarray(offset, offset + encodedFrame.numberOfFrames);
      encodedFrame.copyTo(samples, {planeIndex: channel, format: 'f32-planar'});
      for (let i = 0; i < encodedFrame.numberOfFrames; i++) {
        wasmInterface.HEAPF32[wasmPcmInputF32Index + i] = samples[i] * 32768;
      }
      const res = wasmInterface._rnnoise_process_frame(
        context,
        wasmPcmInput,
        wasmPcmInput
      );
      for (let i = 0; i < encodedFrame.numberOfFrames; i++) {
        samples[i] = wasmInterface.HEAPF32[wasmPcmInputF32Index + i] / 32768;
      }
    }
    encodedFrame.data = buffer;
    controller.enqueue(encodedFrame);
}

onmessage = async (event) => {
    wasmInterface = await RNNoise();
    context = wasmInterface._rnnoise_create();
    wasmPcmInput = wasmInterface._malloc(480 * 4);
    wasmPcmInputF32Index = wasmPcmInput >> 2;
    const source = event.data.source;
    const sink = event.data.sink;
    const transformer = new TransformStream({transform});
    source.pipeThrough(transformer).pipeTo(sink);
  };
