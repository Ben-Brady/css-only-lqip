# Lean Rada LQIP

Based on the amazing work of Lean Rada (Kalabasa) in their blog post at https://leanrada.com/notes/css-only-lqip.


## Usage

Make sure you include this CSS

```ts
[style*="--lqip:"] {
	--lqip-base-clr: oklab(calc(mod(round(down, calc((var(--lqip) + pow(2, 19)) / pow(2, 6))), 4) / 3 * 0.6 + 0.2) calc(mod(round(down, calc((var(--lqip) + pow(2, 19)) / pow(2, 3))), 8) / 8 * 0.7 - 0.35) calc((mod(calc(var(--lqip) + pow(2, 19)), 8) + 1) / 8 * 0.7 - 0.35));

	background-image:
		radial-gradient(50% 75% at 16.67% 25%, hsl(0 0% calc(mod(round(down, calc((var(--lqip) + pow(2, 19)) / pow(2, 18))), 4) / 3 * 60% + 20%)), transparent),
		radial-gradient(50% 75% at 50% 25%, hsl(0 0% calc(mod(round(down, calc((var(--lqip) + pow(2, 19)) / pow(2, 16))), 4) / 3 * 60% + 20%)), transparent),
		radial-gradient(50% 75% at 83.33% 25%, hsl(0 0% calc(mod(round(down, calc((var(--lqip) + pow(2, 19)) / pow(2, 14))), 4) / 3 * 60% + 20%)), transparent),
		radial-gradient(50% 75% at 16.67% 75%, hsl(0 0% calc(mod(round(down, calc((var(--lqip) + pow(2, 19)) / pow(2, 12))), 4) / 3 * 60% + 20%)), transparent),
		radial-gradient(50% 75% at 50% 75%, hsl(0 0% calc(mod(round(down, calc((var(--lqip) + pow(2, 19)) / pow(2, 10))), 4) / 3 * 60% + 20%)), transparent),
		radial-gradient(50% 75% at 83.33% 75%, hsl(0 0% calc(mod(round(down, calc((var(--lqip) + pow(2, 19)) / pow(2, 8))), 4) / 3 * 60% + 20%)), transparent),
		linear-gradient(0deg, var(--lqip-base-clr), var(--lqip-base-clr));
}
```

and then you can set an image's placeholder by setting the css attribute `--lqip`

```ts
import "@nnilky/leanrada-lqdip/lqip.css";

export default function Image(props: { href: string }) {
    const lqip = encodeToLqip(resolve(props.href))
    return <img
        src={props.href}
        style={{ "--lqip": lqip }}
    />
}
```
