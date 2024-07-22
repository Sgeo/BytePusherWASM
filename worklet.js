class BytePusherProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super(options);
        let { data, module } = options.processorOptions;
        WebAssembly.instantiate(module).then(instance => {
            this.instance = instance;
            new Uint8Array(this.instance.exports.main.buffer).set(new Uint8Array(data));
            this.audio0 = new Float32Array(this.instance.exports.audio.buffer, 0, 128);
            this.audio1 = new Float32Array(this.instance.exports.audio.buffer, 128, 128);
            this.audios = [];
            this.video = new Uint8Array(this.instance.exports.video.buffer);
            this.firstRun = true;
        });
    }

    process([input], [output], parameters) {
        if(!this.instance) {
            return true;
        }
        if(this.firstRun) {
            this.firstRun = false;
            for(let i = 0; i < 50; i++) {
                this.frame();
            }
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
    }
}

registerProcessor("byte-pusher-processor", BytePusherProcessor);