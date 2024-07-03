class BytePusher {
    async init() {
        this._instance = await WebAssembly.instantiateStreaming(fetch("bytepusher.wasm")).then(wa => wa.instance);
        this._array = new Uint8Array(this._instance.exports.main.buffer);
        this._video = new Uint8Array(this._instance.exports.video.buffer);
    }

    load(arrayBuffer) {
        this._array.set(new Uint8Array(arrayBuffer));
    }

    frame(canvasCtx) {
        this._instance.exports.frame();
        let imageData = new ImageData(256, 256);
        imageData.data.set(this._video);
        canvasCtx.putImageData(imageData, 0, 0);
    }
}

export { BytePusher }