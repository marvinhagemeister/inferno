import {
	isArray,
	isNullOrUndef,
	isStringOrNumber,
} from '../shared';

import { VNode, VNodeFlags } from '../core/shapes';

const comparer = document.createElement('div');

export function innerHTML(HTML: string) {
	comparer.innerHTML = HTML;
	return comparer.innerHTML;
}

export function createStyler(CSS: string) {
	if (typeof CSS === 'undefined' || CSS === null) {
		return CSS;
	}
	comparer.style.cssText = CSS;
	return comparer.style.cssText;
}

export function style(CSS: string | string[]): string | string[] {
	if (CSS instanceof Array) {
		return CSS.map(createStyler);
	} else {
		return createStyler(CSS);
	}
}

export function createContainerWithHTML(html: string) {
	const container = document.createElement('div');

	container.innerHTML = html;
	return container;
}

export function validateNodeTree(node: VNode | number | String) {
	if (!node) {
		return true;
	}
	if (isStringOrNumber(node)) {
		return true;
	}
	node = node as VNode;
	if (!node.dom) {
		return false;
	}
	const children = node.children;
	const flags = node.flags;

	if (flags & VNodeFlags.Element) {
		if (!isNullOrUndef(children)) {
			if (isArray(children)) {
				for (let child of children) {
					const val = validateNodeTree(child);

					if (!val) {
						return false;
					}
				}
			} else {
				const val = validateNodeTree(children as any);

				if (!val) {
					return false;
				}
			}
		}
	}
	return true;
}

export function waits(timer: number, done: any) {
	setTimeout(done, timer);
}

export function triggerEvent(name: string, element: Element) {
	let eventType: string;

	if (name === 'click' || name === 'dblclick' || name === 'mousedown' || name === 'mouseup') {
		eventType = 'MouseEvents';
	} else if (name === 'focus' || name === 'change' || name === 'blur' || name === 'select') {
		eventType = 'HTMLEvents';
	} else {
		throw new Error('Unsupported `"' + name + '"`event');
	}

	const event = document.createEvent(eventType);
	event.initEvent(name, name !== 'change', true);
	element.dispatchEvent(event);
}
