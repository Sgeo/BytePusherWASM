class BytePusher {
    async init(audioCtx) {
        this._instance = await WebAssembly.instantiateStreaming(fetch("bytepusher.wasm")).then(wa => wa.instance);
        this._main = new Uint8Array(this._instance.exports.main.buffer);
        this._video = new Uint8Array(this._instance.exports.video.buffer);
        this._audio = new Float32Array(this._instance.exports.audio.buffer, 0, 256);
        this._audioctx = audioCtx;
        this._audioBuffer = this._audioctx.createBuffer(1, 256, 256 * 60);
        this._audioBufferSourceNode = null;
    }

    load(arrayBuffer) {
        this._main.set(new Uint8Array(arrayBuffer));
    }

    processFrame() {
        this._instance.exports.frame();
        return {video: this._video, audio: this._audio};
    }

    frame(canvasCtx) {
        let {video, audio} = this.processFrame();
        let imageData = new ImageData(256, 256);
        imageData.data.set(video);
        canvasCtx.putImageData(imageData, 0, 0);
        this._audioBuffer.getChannelData(0).set(audio);
        if(!this._audioBufferSourceNode) {
            this._audioBufferSourceNode = new AudioBufferSourceNode(this._audioctx);
            this._audioBufferSourceNode.loop = true;
            this._audioBufferSourceNode.buffer = this._audioBuffer;
            this._audioBufferSourceNode.connect(this._audioctx.destination);
            this._audioBufferSourceNode.start();
        }
    }
}

export { BytePusher }