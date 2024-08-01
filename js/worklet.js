import {getLinear} from "./interpolated.js";

const FREQUENCY = 440;
const GAIN = 0.5;

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

        /**
         * @type {{vol: number, step: number, cur: number, note: number}[][]}
         */
        this.channels = [];
        for (let i = 0; i < 16; i++)
        {
            this.channels.push([]);
        }

        this.gain = GAIN;

        this.mainVol = 0.5;

        this.mainStep = 1 / sampleRate * FREQUENCY;

        this.port.onmessage = e => {
            const data = e.data;
            switch (data.type)
            {
                case 0:
                    this.waveform = data.data;
                    break;

                case 1:
                    this.gain = GAIN;
                    this.mainStep = 1 / sampleRate * data.data;
                    this.ensureNormalMode();
                    break;

                case 2:
                    this.gain = GAIN;
                    this.mainVol = data.data / 100;
                    this.ensureNormalMode();
                    break;

                case 3:
                    this.gain = 0.2;
                    const ch = this.channels[data.data[0]];
                    const vol = data.data[1] / 250;
                    const step = 1 / sampleRate * data.data[2];
                    const note = data.data[3];
                    if(vol === 0)
                    {
                        const index = ch.findIndex(n => n.note === note);
                        if(index !== -1)
                        {
                            ch.splice(index, 1);
                        }
                    }
                    else
                    {
                        ch.push({
                            vol: vol,
                            step: step,
                            cur: 0,
                            note: note
                        });
                    }
                    break;

                default:
                    console.log(data)
            }
        }
        this.ensureNormalMode()
    }

    ensureNormalMode()
    {
        this.channels.forEach((c, i) => {
            if(i === 0)
            {
                if(c.length > 0)
                {
                    c.length = 1;
                    c[0].step = this.mainStep;
                    c[0].vol = this.mainVol;
                }
                else
                {
                    c.push({
                        note: 0,
                        step: this.mainStep,
                        vol: this.mainVol,
                        cur: 0,
                    })
                }
            }
            else
            {
                c.length = 0;
            }
        })
    }

    /**
     * @param inputs {Float32Array[][]}
     * @param outputs {Float32Array[][]}
     * @returns {boolean}
     */
    process(inputs, outputs)
    {
        const output = outputs[0][0];

        for (let i = 0; i < output.length; i++)
        {
            for(const ch of this.channels)
            {
                for(const n of ch)
                {
                    output[i] += getLinear(n.cur, this.waveform) * n.vol * this.gain;
                    n.cur += n.step;
                    if(n.cur > 1)
                    {
                        n.cur = 0;
                    }
                }
            }
        }
        return true;
    }
}

registerProcessor("hear-waveform-worklet", HearWaveformWorklet);