import {getLinear} from "./interpolated.js";

const canvas = document.getElementById("waveform");
/**
 * @type {CanvasRenderingContext2D}
 */
const context = canvas.getContext("2d");

const initial = [
    {progress: 0, value: 0},
    {progress: 1, value: 0},
];

const square = [
    {progress: 0, value: -1},
    {progress: 0.499999999, value: -1},
    {progress: 0.5, value: 1},
    {progress: 1, value: 1}
];

const saw = [
    {progress: 0, value: -1},
    {progress: 1, value: 1}
]

const sine = [];
const sinLen = 20;
for (let i = 0; i < sinLen; i++)
{
    const sin = Math.sin(2 * Math.PI * (i / (sinLen - 1)));
    sine.push({
        progress: i / (sinLen - 1),
        value: sin
    });
}
console.log(sine)

/**
 * @type {Waveform}
 */
let waveform = structuredClone(initial);

/**
 * @type {AudioWorkletNode}
 */
let worklet = undefined;

async function ensureContext()
{
    if(worklet !== undefined)
    {
        return;
    }
    console.log("creating context");
    const context = new AudioContext({
        sampleRate: 44100
    });
    await context.audioWorklet.addModule("js/worklet.js");
    worklet = new AudioWorkletNode(context, 'hear-waveform-worklet');
    worklet.connect(context.destination);
}

/**
 * @param data {{progress: number, value: number}}
 */
function addToWaveform(data)
{
    waveform.push(data);
    waveform.sort((a, b) => a.progress - b.progress);
    if(worklet)
    {
        worklet.port.postMessage({type: 0, data: waveform});
    }
    renderWaveform(waveform);
}

/**
 * @param data {Waveform}
 */
function setWaveform(data)
{
    ensureContext().then(() => {
        waveform = data;
        if(worklet)
        {
            worklet.port.postMessage({type: 0, data: waveform});
        }
        renderWaveform(waveform);
    });
}

/**
 * @param waveform {Waveform}
 */
function renderWaveform(waveform)
{
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    const multiplier = height / 2;
    const offset = height / 2;
    context.moveTo(0, waveform[0].progress * multiplier + offset);
    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.beginPath();
    for (let i = 0; i < width; i++)
    {
        context.lineTo(i, getLinear(i / width, waveform) * multiplier + offset);
    }
    context.stroke();

    for (const w of waveform)
    {
        context.beginPath();
        context.arc(w.progress * width, w.value * multiplier + offset, 10, 0, 2 * Math.PI);
        context.stroke();
    }
}

canvas.onclick = async e => {
    await ensureContext();
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    const value = (relativeY / rect.height) * 2 - 1;
    const form = {
        value: value,
        progress: relativeX / rect.width
    }
    addToWaveform(form);

}

document.getElementById("clear").onclick = () => {
    setWaveform(structuredClone(initial));
}

document.getElementById("square").onclick = () => setWaveform(structuredClone(square));
document.getElementById("saw").onclick = () => setWaveform(structuredClone(saw));
document.getElementById("sine").onclick = () => setWaveform(structuredClone(sine));

document.getElementById("frequency").oninput = e => {
    if(worklet)
    {
        worklet.port.postMessage({type: 1, data: parseInt(e.target.value)});
    }
}

renderWaveform(waveform);