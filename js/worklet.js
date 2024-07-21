import {getLinear} from "./interpolated.js";

const GAIN = 0.7;
const FREQUENCY = 440;

class HearWaveformWorklet extends AudioWorkletProcessor
{
    constructor()
    {
        super();
        /**
         * @type {Waveform}
         */
        this.waveform = [
            {progress: 0, value: 0},
            {progress: 1, value: 0},
        ];

        this.step = 1 / sampleRate * FREQUENCY;
        this.cursor = 0;

        this.port.onmessage = e => {
            const data = e.data;
            switch (data.type)
            {
                case 0:
                    this.waveform = data.data;
                    break;

                case 1:
                    this.step = 1 / sampleRate * data.data;
                    break;

                default:
                    console.log(data)
            }
        }
    }

    /**
     * @param inputs {Float32Array[][]}
     * @param outputs {Float32Array[][]}
     * @returns {boolean}
     */
    process(inputs, outputs)
    {
        const output = outputs[0][0];

        if(this.waveform)

        for (let i = 0; i < output.length; i++)
        {
            output[i] = getLinear(this.cursor, this.waveform) * GAIN;
            this.cursor += this.step;
            if(this.cursor > 1)
            {
                this.cursor = 0;
            }
        }
        return true;
    }
}

registerProcessor("hear-waveform-worklet", HearWaveformWorklet);