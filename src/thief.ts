/*
The MIT License (MIT)

Copyright (c) 2015 Lokesh Dhakar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { type NdArray } from "ndarray";
import { getPixels } from "ndarray-pixels";
import { type Sharp } from "sharp";
import quantize from "@lokesh.dhakar/quantize";

function createPixelArray(pixels: any, pixelCount: number, quality: number) {
    const pixelArray = [];

    for (let i = 0; i < pixelCount; i += quality) {
        let offset = i * 4;
        let r = pixels[offset];
        let g = pixels[offset + 1];
        let b = pixels[offset + 2];
        pixelArray.push([r, g, b]);
    }

    return pixelArray;
}

function validateOptions(colorCount: number, quality: number) {
    if (typeof colorCount === "undefined" || !Number.isInteger(colorCount)) {
        colorCount = 10;
    } else if (colorCount === 1) {
        throw new Error(
            "`colorCount` should be between 2 and 20. To get one color, call `getColor()` instead of `getPalette()`",
        );
    } else {
        colorCount = Math.max(colorCount, 2);
        colorCount = Math.min(colorCount, 20);
    }

    if (typeof quality === "undefined" || !Number.isInteger(quality) || quality < 1) quality = 10;

    return { colorCount, quality };
}

type PixelGrid = NdArray<Uint8Array<ArrayBufferLike>>;

async function loadImg(img: Sharp): Promise<PixelGrid> {
    const [buffer, metadata] = await Promise.all([img.toBuffer(), img.metadata()]);
    const { format } = metadata;
    if (!format) throw new Error(`Could not find format`);

    return await getPixels(buffer, format);
}

export async function getColor(img: Sharp, quality: number) {
    const pallete = await getPalette(img, 5, quality);
    return pallete[0];
}

export async function getPalette(img: Sharp, colorCount = 10, quality = 10) {
    const options = validateOptions(colorCount, quality);
    const pixels = await loadImg(img);

    const pixelCount = pixels.shape[0]! * pixels.shape[1]!;
    const pixelArray = createPixelArray(pixels.data, pixelCount, options.quality);

    const cmap = quantize(pixelArray, options.colorCount);
    const palette = cmap ? cmap.palette() : null;

    return palette;
}
