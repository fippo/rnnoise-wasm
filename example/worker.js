import RNNoise from './rnnoise.js';

let wasmInterface;
let context;
let wasmPcmInput;
let wasmPcmInputF32Index;
async function transform(data, controller) {
    const buffer = new Float32Array(data.numberOfFrames * data.numberOfChannels);
    for (let channel = 0; channel < data.numberOfChannels; channel++) {
      const offset = data.numberOfFrames * channel;
      const samples = buffer.subarray(offset, offset + data.numberOfFrames);
      data.copyTo(samples, {planeIndex: channel, format: 'f32-planar'});
      for (let i = 0; i < data.numberOfFrames; i++) {
        wasmInterface.HEAPF32[wasmPcmInputF32Index + i] = samples[i] * 32768;
      }
      const res = wasmInterface._rnnoise_process_frame(
        context,
        wasmPcmInput,
        wasmPcmInput
      );
      for (let i = 0; i < data.numberOfFrames; i++) {
        samples[i] = wasmInterface.HEAPF32[wasmPcmInputF32Index + i] / 32768;
      }
    }
    controller.enqueue(new AudioData({
      format: 'f32-planar',
      sampleRate: data.sampleRate,
      numberOfFrames: data.numberOfFrames,
      numberOfChannels: data.numberOfChannels,
      timestamp: data.timestamp,
      data: buffer
    }));
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
