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

    async init(audioCtx, videoCtx, rom) {
        this._module = await WebAssembly.compileStreaming(fetch("bytepusher.wasm"));
        this._audioctx = audioCtx;
        this._videoCtx = videoCtx;
        if(!audioCtx.audioWorklet) {
            alert("Audio worklets not supported!");
            return;
        }
        await audioCtx.audioWorklet.addModule("worklet.js");
        this._worklet = new AudioWorkletNode(audioCtx, "byte-pusher-processor", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            processorOptions: {
                data: rom,
                module: this._module
            }
        });
        this._worklet.port.onmessage = (e) => {
            switch(e.data.type) {
                case "video":
                    let imageData = new ImageData(e.data.data, 256, 256);
                    this._videoCtx.putImageData(imageData, 0, 0);
                    break;
            }
        };
        this._worklet.connect(audioCtx.destination);
    }

    keyup(code) {
        this._worklet.port.postMessage({type: "keyup", data: code});
    }

    keydown(code) {
        this._worklet.port.postMessage({type: "keydown", data: code});
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