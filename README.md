# dom-sanitize

Lightweight DOM sanitization library

```js
import { DEFAULT_OPTIONS, sanitize } from '@intrnl/dom-sanitize';

const result = sanitize(`<img src=x onerror=alert(1)//>`, DEFAULT_OPTIONS);

// `result` returns a DocumentFragment, you can convert this by creating a template element
const template = document.createElement('template');

// Append document fragment to another, this empties out `result`
template.content.appendChild(result);

// `<img src="x">`
template.innerHTML;
```
