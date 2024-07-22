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

class BytePusherProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super(options);
        let { data, module } = options.processorOptions;
        WebAssembly.instantiate(module).then(instance => {
            this.instance = instance;
            new Uint8Array(this.instance.exports.main.buffer).set(new Uint8Array(data));
            this.audio0 = new Float32Array(this.instance.exports.audio.buffer, 0, 128);
            this.audio1 = new Float32Array(this.instance.exports.audio.buffer, 128 * Float32Array.BYTES_PER_ELEMENT, 128);
            this.audios = [];
            this.video = new Uint8ClampedArray(this.instance.exports.video.buffer);
            this.keyboard = new DataView(this.instance.exports.main.buffer, 0, 2);
            this.port.onmessage = (e) => {
                switch(e.data.type) {
                    case "keyup":
                    case "keydown":
                        this[e.data.type](e.data.data);
                        break;
                }
            };
        });
    }

    process([input], [output], parameters) {
        if(!this.instance) {
            return true;
        }
        if((currentFrame & 128) === 0) {
            this.frame();
        }
        let audio = this.audios.shift();
        if(audio) {
            output[0].set(audio);
        } else {
            console.log("Underrun");
        }
        return true;
    }

    frame() {
        this.instance.exports.frame();
        this.audios.push(this.audio0.slice());
        this.audios.push(this.audio1.slice());
        this.port.postMessage({type: "video", data: this.video});
    }

    keydown(code) {
        let value = KEYMAP[code];
        if(!value) return;
        let io = this.keyboard.getUint16(0, false);
        io = io | value;
        this.keyboard.setUint16(0, io, false);
    }

    keyup(code) {
        let value = KEYMAP[code];
        if(!value) return;
        let io = this.keyboard.getUint16(0, false);
        io = io & ~value;
        this.keyboard.setUint16(0, io, false);
    }
}

registerProcessor("byte-pusher-processor", BytePusherProcessor);