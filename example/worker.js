import RNNoise from './rnnoise.js';
let wasmInterface;
let context;
async function transform(encodedFrame, controller) {
    const buffer = new Float32Array(encodedFrame.numberOfFrames * encodedFrame.numberOfChannels);
    for (let channel = 0; channel < encodedFrame.numberOfChannels; channel++) {
      const offset = encodedFrame.numberOfFrames * channel;
      const samples = buffer.subarray(offset, offset + encodedFrame.numberOfFrames);
      encodedFrame.copyTo(samples, {planeIndex: channel, format: 'f32-planar'});
      console.log(samples);
      wasmInterface._rnnoise_process_frame(
        context,
        samples,
        samples,
      );
    }
    encodedFrame.data = buffer;
    controller.enqueue(encodedFrame);
}

onmessage = async (event) => {
    wasmInterface = await RNNoise();
    context = wasmInterface._rnnoise_create();
    const source = event.data.source;
    const sink = event.data.sink;
    const transformer = new TransformStream({transform});
    source.pipeThrough(transformer).pipeTo(sink);
  };