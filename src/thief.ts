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

import { type Sharp } from "sharp";
import quantize from "@lokesh.dhakar/quantize";
import type { EncodingOptions } from ".";

export async function getPalette(img: Sharp, options: EncodingOptions): Promise<number[]> {
    const pixels = await img.raw().toBuffer();
    const pixelArray = createPixelArray(pixels, options.sampleRate ?? 10);

    const cmap = quantize(pixelArray, 4);
    if (!cmap) throw new Error("Could not quanitze pixels");

    const palette = cmap.palette();
    const dominantColor = palette[0];
    return dominantColor;
}

function createPixelArray(pixels: Buffer<ArrayBufferLike>, sampleRate: number) {
    const pixelArray = [];

    for (let i = 0; i < pixels.length; i += sampleRate) {
        let offset = i * 3;
        let r = pixels[offset];
        let g = pixels[offset + 1];
        let b = pixels[offset + 2];
        pixelArray.push([r, g, b]);
    }

    return pixelArray;
}
