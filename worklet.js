class BytePusherProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super(options);
        let { data, module } = options.processorOptions;
        WebAssembly.instantiate(module).then(instance => {
            this.instance = instance;
            new Uint8Array(this.instance.exports.main.buffer).set(new Uint8Array(data));
            this.audio0 = new Float32Array(this.instance.exports.audio.buffer, 0, 128);
            this.audio1 = new Float32Array(this.instance.exports.audio.buffer, 128, 128);
            this.video = new Uint8Array(this.instance.exports.video.buffer);
        });
    }

    process([input], [output], parameters) {
        if(!this.instance) {
            return true;
        }
        if((currentFrame & 128) === 0) {
            this.instance.exports.frame();
            for(let channel of output) {
                channel.set(this.audio0);
            }
            //this.port.postMessage(this.video);
        } else {
            for(let channel of output) {
                channel.set(this.audio1);
            }
        }
        return true;
    }
}

registerProcessor("byte-pusher-processor", BytePusherProcessor);