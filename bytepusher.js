class BytePusher {
    async init(audioCtx) {
        this._instance = await WebAssembly.instantiateStreaming(fetch("bytepusher.wasm")).then(wa => wa.instance);
        this._main = new Uint8Array(this._instance.exports.main.buffer);
        this._video = new Uint8Array(this._instance.exports.video.buffer);
        this._audio = new Float32Array(this._instance.exports.audio.buffer, 0, 256);
        this._audioctx = audioCtx;
        this._audioBuffer = this._audioctx.createBuffer(1, 256, 256 * 60);
    }

    load(arrayBuffer) {
        this._main.set(new Uint8Array(arrayBuffer));
    }

    processFrame() {
        this._instance.exports.frame();
        let imageData = new ImageData(256, 256);
        imageData.data.set(this._video);
        return {video: imageData, audio: this._audio};
    }

    frame(canvasCtx) {
        let {video, audio} = this.processFrame();
        canvasCtx.putImageData(video, 0, 0);
        this._audioBuffer.getChannelData(0).set(audio);
        let audioBufferSource = new AudioBufferSourceNode(this._audioctx);
        audioBufferSource.buffer = this._audioBuffer;
        audioBufferSource.connect(this._audioctx.destination);
        audioBufferSource.start();
    }
}

export { BytePusher }