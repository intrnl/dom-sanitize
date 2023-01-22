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

Note that this will result in the browser having to do double the work if you're
inserting the resulting HTML string to a live document, here's one way you might
get around doing that on React

```tsx
import React from 'react';
import { DEFAULT_OPTIONS, sanitize } from '@intrnl/dom-sanitize';

const App = () => {
	const ref = React.useRef<HTMLDivElement>();
	const [html, setHtml] = React.useState('<div></div>');

	React.useLayoutEffect(() => {
		const result = sanitize(html, DEFAULT_OPTIONS);
		ref.current!.appendChild(result);

		return () => ref.current!.innerHTML = '';
	}, [html]);

	return <div ref={ref} />;
};
```
