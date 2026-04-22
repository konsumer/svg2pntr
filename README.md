# svg2pntr

Convert an SVG file into a series of C pntr drawing functions.


```sh
npx -y svg2pntr <input.svg> [output.h]
```

You can see an [example](./example/).

You can also use it in your code:

```js
import { readFile } from 'node:fs/promises'
import svg2pntr from 'svg2pntr'

console.log(svg2pntr(await readFile('tiger.svg', 'utf8') , 'tiger'))
```