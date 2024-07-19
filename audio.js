class BytePusherAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        this.audio = [];
        this.underrun = 0;
        this.port.onmessage = (event) => {
            this.audio.push(event.data);
        };
    }

    process(inputs, outputs, params) {
        if(this.audio[0]) {
            let sampleCount = outputs[0][0].length;
            let outgoing = new Float32Array(this.audio[0].buffer, 0, sampleCount);
            this.underrun = outgoing[outgoing.length - 1];
            let remaining = this.audio[0].length - sampleCount;
            if(remaining <= 0) {
                this.audio.shift();
            } else {
                this.audio[0] = new Float32Array(this.audio[0].buffer, sampleCount, remaining);
            }
            for(let output of outputs) {
                for(let channel of output) {
                    channel.set(outgoing);
                }
            }
        } else {
            console.log("Audio underrun");
            for(let output of outputs) {
                for(let channel of output) {
                    channel.fill(this.underrun);
                }
            }
        }
        return true;
    }
}

registerProcessor("bytepusher-audio-processor", BytePusherAudioProcessor);