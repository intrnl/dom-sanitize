/**
 * Return a booolean to allow or drop the attribute
 * Return a string to replace the attribute value
 * Return null to pass it on to another filter
 */
export type AttributeFilter = (name: string, value: string) => boolean | string | null;

/**
 * Sanitization options
 * - `*` as a wildcard for all.
 * - `*-` is a wildcard for custom elements.
 */
export interface SanitizeOptions {
	/** Array of elements that should not be removed */
	allowElements?: string[];
	/** Array of elements that should be removed but keep their child elements */
	blockElements?: string[];
	/** Array of elements that should be removed entirely */
	dropElements?: string[];

	/** Record of elements and an attribute filter */
	filterAttributes?: Record<string, AttributeFilter>;
	/** Record of elements and records of attributes to force set */
	setAttributes?: Record<string, Record<string, string | false>>;

	/** Whether comments should not be removed */
	allowComments?: boolean;
}

export const LINK_PROTOCOLS = new Set([
	'http:',
	'https:',
	'dat:',
	'dweb:',
	'ipfs:',
	'ipns:',
	'ssb:',
	'gopher:',
	'xmpp:',
	'magnet:',
	'gemini:',
]);

export const DEFAULT_OPTIONS: SanitizeOptions = {
	allowElements: [],
	blockElements: ['script'],
	dropElements: ['*-', 'iframe'],

	filterAttributes: {
		'*': (name, value) => {
			return false;
		},
		a: (name, value) => {
			if (name === 'href') {
				// Allow relative links
				if (value.startsWith('/') || value.startsWith('.')) {
					return true;
				}

				try {
					const parsed = new URL(value);

					if (LINK_PROTOCOLS.has(parsed.protocol)) {
						return true;
					}
				}
				catch {}

				return false;
			}

			return null;
		},
		img: (name, value) => {
			if (name === 'src' || name === 'height' || name === 'width' || name === 'alt') {
				return true;
			}

			return null;
		},
	},
	setAttributes: {
		a: {
			rel: 'noopener nofollow noreferrer ugc',
			target: '_blank',
		},
	},

	allowComments: false,
};

type Action = 'allow' | 'block' | 'drop';

const getElementAction = (node: Element, options: SanitizeOptions): Action => {
	const name = node.localName.toLowerCase();
	const isCustomElement = name.includes('-') || node.hasAttribute('is');

	if (
		options.allowElements
		&& (options.allowElements.includes(name) || (isCustomElement && options.allowElements.includes('*-')))
	) {
		return 'allow';
	}

	if (
		options.blockElements
		&& (options.blockElements.includes(name) || (isCustomElement && options.blockElements.includes('*-')))
	) {
		return 'block';
	}

	if (
		options.dropElements
		&& (options.dropElements.includes(name) || (isCustomElement && options.dropElements.includes('*-')))
	) {
		return 'drop';
	}

	return 'allow';
};

const sanitizeElementAttributes = (node: Element, options: SanitizeOptions) => {
	const tag = node.tagName.toLowerCase();
	const isCustomElement = tag.includes('-');

	const attributes = node.attributes;
	const filters: AttributeFilter[] = [];
	const forces: Record<string, string | false> = {};

	if (options.filterAttributes) {
		if (options.filterAttributes[tag]) {
			filters.push(options.filterAttributes[tag]);
		}

		if (isCustomElement && options.filterAttributes['*-']) {
			filters.push(options.filterAttributes['*-']);
		}

		if (options.filterAttributes['*']) {
			filters.push(options.filterAttributes['*']);
		}
	}

	if (options.setAttributes) {
		Object.assign(
			forces,
			options.setAttributes[tag],
			isCustomElement ? options.setAttributes['*-'] : null,
			options.setAttributes['*'],
		);
	}

	for (let idx = attributes.length - 1; idx >= 0; idx--) {
		const attr = attributes[idx];

		for (let j = 0, jl = filters.length; j < jl; j++) {
			const filter = filters[j];
			const result = filter(attr.name, attr.value);

			if (result === true) {
				break;
			}
			else if (result === false) {
				node.removeAttributeNode(attr);
				break;
			}
			else if (result == null) {
				continue;
			}
			else {
				attr.value = result;
			}
		}
	}

	for (const attr in forces) {
		const value = forces[attr];

		if (value === false) {
			continue;
		}

		node.setAttribute(attr, value);
	}
};

const isCommentNode = (node: Node): node is Comment => {
	return node.nodeType === Node.COMMENT_NODE;
};

const sanitizeNode = (node: Element | Comment, options: SanitizeOptions) => {
	if (isCommentNode(node)) {
		if (!options.allowComments) {
			return () => node.remove();
		}

		return;
	}

	const action = getElementAction(node, options);

	if (action === 'drop') {
		return () => node.remove();
	}

	if (action === 'block') {
		return () => {
			const parent = node.parentNode!;

			let child: ChildNode | null;
			while ((child = node.firstChild)) {
				parent.insertBefore(child, node);
			}

			node.remove();
		};
	}

	return () => sanitizeElementAttributes(node, options);
};

export const sanitize = (fragment: string | DocumentFragment, opts: SanitizeOptions) => {
	if (typeof fragment === 'string') {
		const template = document.createElement('template');
		template.innerHTML = fragment;

		fragment = template.content;
	}

	const actions: Array<() => void> = [];
	const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);

	let node: Node | null;

	while ((node = walker.nextNode())) {
		const act = sanitizeNode(node as Element | Comment, opts);

		if (act) {
			actions.push(act);
		}
	}

	for (let idx = actions.length - 1; idx >= 0; idx--) {
		const act = actions[idx];

		act();
	}

	return fragment;
};
