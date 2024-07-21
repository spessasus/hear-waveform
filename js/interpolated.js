/**
 * @typedef {{progress: number, value: number}[]} Waveform
 */


/**
 * @param progress {number}
 * @param array {Waveform}
 * @returns {number}
 */
export function getLinear(progress, array)
{
    // Find the two nearest values
    let lower = null;
    let upper = null;

    for (let i = 0; i < array.length; i++)
    {
        if (array[i].progress <= progress)
        {
            lower = array[i];
            upper = array[(i + 1) % array.length];
        }
        else
        {
            break;
        }
    }

    // If progress is out of bounds
    if (lower === null || upper === null)
    {
        throw new Error("Progress is out of bounds of the array");
    }

    // Linear interpolation formula
    const progressRange = upper.progress - lower.progress;
    const valueRange = upper.value - lower.value;
    const progressFraction = (progress - lower.progress) / progressRange;

    return lower.value + progressFraction * valueRange;
}