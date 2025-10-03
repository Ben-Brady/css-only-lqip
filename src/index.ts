#!/usr/bin/env node
import sharp from "sharp";
import { rgbToOkLab, rgbToOkLabL, type OklabFormat } from "./convert.js";
import { getPalette } from "./thief.js";
import { existsSync } from "node:fs";

export type EncodingOptions = {
    /**
     * Disables the check to see if images have opacity
     * roughly halfs the speed
     */
    enableOpaqueCheck?: boolean;

    /**
     * The number of pixels to skip when sampling
     *
     * So if the sample rate is 10, 1 in every 10 pixels are sampled
     */
    sampleRate?: number;
};

/**
 * Encode an image into a single number for a placeholder
 *
 * Based on https://leanrada.com/notes/css-only-lqip/
 */
export const encodeToLqip = async (
    filepath: string,
    options?: EncodingOptions,
): Promise<number | null> => {
    try {
        if (!existsSync(filepath)) return null;
        const value = await analyzeImage(filepath, options ?? {});
        if (!value) return null;

        const { ll, aaa, bbb, values } = value;
        const ca = Math.round(values.a * 0b11);
        const cb = Math.round(values.b * 0b11);
        const cc = Math.round(values.c * 0b11);
        const cd = Math.round(values.d * 0b11);
        const ce = Math.round(values.e * 0b11);
        const cf = Math.round(values.f * 0b11);

        const lqip =
            -(2 ** 19) +
            ((ca & 0b11) << 18) +
            ((cb & 0b11) << 16) +
            ((cc & 0b11) << 14) +
            ((cd & 0b11) << 12) +
            ((ce & 0b11) << 10) +
            ((cf & 0b11) << 8) +
            ((ll & 0b11) << 6) +
            ((aaa & 0b111) << 3) +
            (bbb & 0b111);

        // sanity check (+-999999 is the max int range in css in major browsers)
        if (lqip < -999_999) return null;
        if (lqip > 999_999) return null;
        return lqip;
    } catch (error) {
        console.error(error);
        return null;
    }
};

type ImageData = {
    ll: number;
    aaa: number;
    bbb: number;
    values: {
        a: number;
        b: number;
        c: number;
        d: number;
        e: number;
        f: number;
    };
};

async function analyzeImage(filepath: string, options: EncodingOptions): Promise<ImageData | null> {
    const img = sharp(filepath);
    if (options.enableOpaqueCheck === true) {
        const stats = await img.stats();
        if (!stats.isOpaque) return null;
    }

    const previewPromise = sharp(filepath)
        .resize(3, 2, { fit: "fill" })
        .sharpen({ sigma: 1 })
        .removeAlpha()
        .toFormat("raw", { bitdepth: 8 })
        .toBuffer();

    const dominantColorPromise = getPalette(img, options);
    const [preview, dominantColor] = await Promise.all([previewPromise, dominantColorPromise]);

    const raw = rgbToOkLab(dominantColor);
    const { ll, aaa, bbb } = findOklabBits(raw);
    const { L: baseL, a: baseA, b: baseB } = bitsToLab(ll, aaa, bbb);
    console.log(
        "dominant rgb",
        dominantColor,
        "lab",
        Number(raw.L.toFixed(4)),
        Number(raw.a.toFixed(4)),
        Number(raw.b.toFixed(4)),
        "compressed",
        Number(baseL.toFixed(4)),
        Number(baseA.toFixed(4)),
        Number(baseB.toFixed(4)),
    );

    const getPixelValue = (index: number) => {
        const r = preview.readUint8(index * 3);
        const g = preview.readUint8(index * 3 + 1);
        const b = preview.readUint8(index * 3 + 2);
        const L = rgbToOkLabL({ r, g, b });
        return clamp(0.5 + L - baseL, 0, 1);
    };

    return {
        ll,
        aaa,
        bbb,
        values: {
            a: getPixelValue(0),
            b: getPixelValue(1),
            c: getPixelValue(2),
            d: getPixelValue(3),
            e: getPixelValue(4),
            f: getPixelValue(5),
        },
    };
}

// find the best bit configuration that would produce a color closest to target
function findOklabBits(target: OklabFormat) {
    const targetChroma = Math.hypot(target.a, target.b);
    const scaledTargetA = scaleComponentForDiff(target.a, targetChroma);
    const scaledTargetB = scaleComponentForDiff(target.b, targetChroma);

    let bestBits = [0, 0, 0];
    let bestDifference = Infinity;

    for (let lli = 0; lli <= 0b11; lli++) {
        for (let aaai = 0; aaai <= 0b111; aaai++) {
            for (let bbbi = 0; bbbi <= 0b111; bbbi++) {
                const L = bitsToLabL(lli);
                const a = bitsToLabA(aaai);
                const b = bitsToLabB(bbbi);

                const chroma = Math.hypot(a, b);
                const scaledA = scaleComponentForDiff(a, chroma);
                const scaledB = scaleComponentForDiff(b, chroma);

                const difference = Math.hypot(
                    L - target.L,
                    scaledA - scaledTargetA,
                    scaledB - scaledTargetB,
                );

                if (difference < bestDifference) {
                    bestDifference = difference;
                    bestBits = [lli, aaai, bbbi];
                }
            }
        }
    }

    return {
        ll: bestBits[0],
        aaa: bestBits[1],
        bbb: bestBits[2],
    };
}

// Scales a or b of Oklab to move away from the center
// so that euclidean comparison won't be biased to the center
function scaleComponentForDiff(x: number, chroma: number) {
    return x / (1e-6 + Math.pow(chroma, 0.5));
}

const bitsToLabA = (aaa: number) => (aaa / 0b1000) * 0.7 - 0.35;
const bitsToLabB = (bbb: number) => ((bbb + 1) / 0b1000) * 0.7 - 0.35;
const bitsToLabL = (ll: number) => (ll / 0b11) * 0.6 + 0.2;

function bitsToLab(ll: number, aaa: number, bbb: number) {
    const L = (ll / 0b11) * 0.6 + 0.2;
    const a = (aaa / 0b1000) * 0.7 - 0.35;
    const b = ((bbb + 1) / 0b1000) * 0.7 - 0.35;
    return { L, a, b };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
