let processor;
let generator;

// Stream from getUserMedia
let stream;
// Output from the transform
let processedStream;

// Worker for processing
let worker;

document.getElementById('startButton').onclick = async () => {
    document.getElementById('startButton').disabled = true;
    stream = await navigator.mediaDevices.getUserMedia({audio: true});
    const audioTrack = stream.getAudioTracks()[0];
    processor = new MediaStreamTrackProcessor(audioTrack);
    generator = new MediaStreamTrackGenerator('audio');
    const source = processor.readable;
    const sink = generator.writable;
    worker = new Worker('worker.js', {type: 'module'});
    worker.postMessage({source, sink}, [source, sink]);

    processedStream = new MediaStream();
    processedStream.addTrack(generator);
    document.getElementById('audioOutput').srcObject = processedStream;
};