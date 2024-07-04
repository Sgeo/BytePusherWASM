const FRAME_TIME_MS = 1000/60;
const FRAME_TIME_S = 1/60;

const SPEC_KEYBOARD_LAYOUT = [
    0x1, 0x2, 0x3, 0xC,
    0x4, 0x5, 0x6, 0xD,
    0x7, 0x8, 0x9, 0xE,
    0xA, 0x0, 0xB, 0xF
];

const PHYSICAL_KEYBOARD_LAYOUT = [
    "Digit1", "Digit2", "Digit3", "Digit4",
    "KeyQ",   "KeyW",   "KeyE",   "KeyR",
    "KeyA",   "KeyS",   "KeyD",   "KeyF",
    "KeyZ",   "KeyX",   "KeyC",   "KeyV"
];

const KEYMAP = Array(16);

for(let i = 0; i < 16; i++) {
    KEYMAP[PHYSICAL_KEYBOARD_LAYOUT[i]] = 1 << SPEC_KEYBOARD_LAYOUT[i];
}

class BytePusher {

    async init(audioCtx) {
        this._instance = await WebAssembly.instantiateStreaming(fetch("bytepusher.wasm")).then(wa => wa.instance);
        this._main = new Uint8Array(this._instance.exports.main.buffer);
        this._video = new Uint8Array(this._instance.exports.video.buffer);
        this._audio = new Float32Array(this._instance.exports.audio.buffer, 0, 256);
        this._audioctx = audioCtx;
        this._audioBuffer = this._audioctx.createBuffer(1, 256, 256 * 60);
        this._audioBufferSourceNode = null;
        this._imageData = new ImageData(256, 256);
        this._keyboard = new DataView(this._instance.exports.main.buffer, 0, 2);
        this._prevVideoTime = performance.now();
        this._prevAudioTime = this._audioctx.currentTime;
    }

    keydown(code) {
        let value = KEYMAP[code];
        if(!value) return;
        let io = this._keyboard.getUint16(0, false);
        io = io | value;
        this._keyboard.setUint16(0, io, false);
    }

    keyup(code) {
        let value = KEYMAP[code];
        if(!value) return;
        let io = this._keyboard.getUint16(0, false);
        io = io & ~value;
        this._keyboard.setUint16(0, io, false);
    }

    load(arrayBuffer) {
        this._main.set(new Uint8Array(arrayBuffer));
    }

    processFrame() {
        this._instance.exports.frame();
        return {video: new Uint8Array(this._video), audio: new Float32Array(this._audio)};
    }

    renderFrame(canvasCtx, frame) {
        let {video, audio} = frame;
        this._imageData.data.set(video);
        canvasCtx.putImageData(this._imageData, 0, 0);
        this._audioBuffer.getChannelData(0).set(audio);
        this._audioBufferSourceNode = new AudioBufferSourceNode(this._audioctx);
        this._audioBufferSourceNode.buffer = this._audioBuffer;
        this._audioBufferSourceNode.connect(this._audioctx.destination);
        this._audioBufferSourceNode.start();
    }

    async keyboardLayout() {
        if(navigator.keyboard && navigator.keyboard.getLayoutMap) {
            let map = await navigator.keyboard.getLayoutMap();
            return PHYSICAL_KEYBOARD_LAYOUT.map(key => map.get(key));
        } else {
            return PHYSICAL_KEYBOARD_LAYOUT.map(key => key.slice(-1));
        }
    }
}

export { BytePusher }