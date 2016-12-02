import {
	EMPTY_OBJ,
	NO_OP,
	isArray,
	isAttrAnEvent,
	isInvalid,
	isNull,
	isNullOrUndef,
	isNumber,
	isObject,
	isString,
	isStringOrNumber,
	isUndefined,
	throwError,
} from './../shared';
import {
	VNode,
	IObject,
	VNodeFlags,
	createVoidVNode,
	isVNode,
	IProps,
	VNodeCreator,
} from '../core/shapes';
import {
	booleanProps,
	isUnitlessNumber,
	namespaces,
	strictProps,
} from './constants';
import {
	componentIdMap,
	getIncrementalId,
} from './devtools';
import {
	copyPropsTo,
	createStatelessComponentInput,
	insertOrAppend,
	isKeyed,
	removeAllChildren,
	replaceChild,
	replaceLastChildAndUnmount,
	replaceVNode,
	replaceWithNewNode,
	setTextContent,
	updateTextContent,
} from './utils';
import {
	mount,
	mountArrayChildren,
	mountComponent,
	mountElement,
	mountRef,
	mountStatelessComponentCallbacks,
	mountText,
	mountVoid,
} from './mounting';

import Component from '../component/es2015';
import Lifecycle from './lifecycle';
import cloneVNode from '../factories/cloneVNode';
import { componentToDOMNodeMap } from './rendering';
import processElement from './wrappers/processElement';
import { unmount } from './unmounting';

export function patch(lastVNode: VNode, nextVNode: VNode, parentDom: HTMLElement, lifecycle: Lifecycle, context: any, isSVG: boolean, isRecycling: boolean) {
	if (lastVNode !== nextVNode) {
		const lastFlags = lastVNode.flags;
		const nextFlags = nextVNode.flags;

		if (nextFlags & VNodeFlags.Component) {
			if (lastFlags & VNodeFlags.Component) {
				patchComponent(
					lastVNode,
					nextVNode,
					parentDom,
					lifecycle,
					context,
					isSVG,
					nextFlags & VNodeFlags.ComponentClass,
					isRecycling
				);
			} else {
				replaceVNode(
					parentDom,
					mountComponent(
						nextVNode,
						null,
						lifecycle,
						context,
						isSVG,
						nextFlags & VNodeFlags.ComponentClass
					),
					lastVNode,
					lifecycle,
					isRecycling
				);
			}
		} else if (nextFlags & VNodeFlags.Element) {
			if (lastFlags & VNodeFlags.Element) {
				patchElement(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling);
			} else {
				replaceVNode(
					parentDom,
					mountElement(
						nextVNode,
						null,
						lifecycle,
						context,
						isSVG
					),
					lastVNode,
					lifecycle,
					isRecycling
				);
			}
		} else if (nextFlags & VNodeFlags.Text) {
			if (lastFlags & VNodeFlags.Text) {
				patchText(lastVNode, nextVNode);
			} else {
				replaceVNode(parentDom, mountText(nextVNode, null), lastVNode, lifecycle, isRecycling);
			}
		} else if (nextFlags & VNodeFlags.Void) {
			if (lastFlags & VNodeFlags.Void) {
				patchVoid(lastVNode, nextVNode);
			} else {
				replaceVNode(parentDom, mountVoid(nextVNode, null), lastVNode, lifecycle, isRecycling);
			}
		} else {
			// Error case: mount new one replacing old one
			replaceLastChildAndUnmount(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling);
		}
	}
}

function unmountChildren(children: VNode, dom: HTMLElement, lifecycle: Lifecycle, isRecycling: boolean) {
	if (isVNode(children)) {
		unmount(children, dom, lifecycle, true, false, isRecycling);
	} else if (isArray(children)) {
		removeAllChildren(dom, children, lifecycle, false, isRecycling);
	} else {
		dom.textContent = '';
	}
}

export function patchElement(lastVNode: VNode, nextVNode: VNode, parentDom: HTMLElement, lifecycle: Lifecycle, context: any, isSVG: boolean, isRecycling: boolean) {
	const nextTag = nextVNode.type;
	const lastTag = lastVNode.type;

	if (lastTag !== nextTag) {
		replaceWithNewNode(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling);
	} else {
		const dom = lastVNode.dom;
		const lastProps = lastVNode.props;
		const nextProps = nextVNode.props;
		const lastChildren = lastVNode.children;
		const nextChildren = nextVNode.children;
		const lastFlags = lastVNode.flags;
		const nextFlags = nextVNode.flags;
		const lastRef = lastVNode.ref;
		const nextRef = nextVNode.ref;

		nextVNode.dom = dom;
		if (isSVG || (nextFlags & VNodeFlags.SvgElement)) {
			isSVG = true;
		}
		if (lastChildren !== nextChildren) {
			patchChildren(lastFlags, nextFlags, lastChildren, nextChildren, dom as HTMLElement, lifecycle, context, isSVG, isRecycling);
		}
		if (!(nextFlags & VNodeFlags.HtmlElement)) {
			processElement(nextFlags, nextVNode, dom);
		}
		if (lastProps !== nextProps) {
			patchProps(
				lastProps,
				nextProps,
				dom as HTMLElement,
				lifecycle,
				context,
				isSVG
			);
		}
		if (nextRef) {
			if (lastRef !== nextRef || isRecycling) {
				mountRef(dom as HTMLElement, nextRef as any, lifecycle);
			}
		}
	}
}

function patchChildren(lastFlags, nextFlags, lastChildren, nextChildren, dom: HTMLElement, lifecycle: Lifecycle, context, isSVG: boolean, isRecycling: boolean) {
	let patchArray = false;
	let patchKeyed = false;

	if (nextFlags & VNodeFlags.HasNonKeyedChildren) {
		patchArray = true;
	} else if ((lastFlags & VNodeFlags.HasKeyedChildren)  && (nextFlags & VNodeFlags.HasKeyedChildren)) {
		patchKeyed = true;
		patchArray = true;
	} else if (isInvalid(nextChildren)) {
		unmountChildren(lastChildren, dom, lifecycle, isRecycling);
	} else if (isInvalid(lastChildren)) {
		if (isStringOrNumber(nextChildren)) {
			setTextContent(dom, nextChildren);
		} else {
			if (isArray(nextChildren)) {
				mountArrayChildren(nextChildren, dom, lifecycle, context, isSVG);
			} else {
				mount(nextChildren, dom, lifecycle, context, isSVG);
			}
		}
	} else if (isStringOrNumber(nextChildren)) {
		if (isStringOrNumber(lastChildren)) {
			updateTextContent(dom, nextChildren);
		} else {
			unmountChildren(lastChildren, dom, lifecycle, isRecycling);
			setTextContent(dom, nextChildren);
		}
	} else if (isArray(nextChildren)) {
		if (isArray(lastChildren)) {
			patchArray = true;
			if (isKeyed(lastChildren, nextChildren)) {
				patchKeyed = true;
			}
		} else {
			unmountChildren(lastChildren, dom, lifecycle, isRecycling);
			mountArrayChildren(nextChildren, dom, lifecycle, context, isSVG);
		}
	} else if (isArray(lastChildren)) {
		removeAllChildren(dom, lastChildren, lifecycle, false, isRecycling);
		mount(nextChildren, dom, lifecycle, context, isSVG);
	} else if (isVNode(nextChildren)) {
		if (isVNode(lastChildren)) {
			patch(lastChildren, nextChildren, dom, lifecycle, context, isSVG, isRecycling);
		} else {
			unmountChildren(lastChildren, dom, lifecycle, isRecycling);
			mount(nextChildren, dom, lifecycle, context, isSVG);
		}
	} else if (isVNode(lastChildren)) {
		// TODO: One test hits this line when passing invalid children what should be done?
		// debugger;
	} else {
		// debugger;
	}
	if (patchArray) {
		if (patchKeyed) {
			patchKeyedChildren(lastChildren, nextChildren, dom, lifecycle, context, isSVG, isRecycling);
		} else {
			patchNonKeyedChildren(lastChildren, nextChildren, dom, lifecycle, context, isSVG, isRecycling);
		}
	}
}

export function patchComponent(lastVNode: VNode, nextVNode: VNode, parentDom: HTMLElement, lifecycle: Lifecycle, context: any, isSVG: boolean, isClass: number | boolean, isRecycling: boolean) {
	const lastType = lastVNode.type;
	const nextType = nextVNode.type as VNodeCreator;
	const nextProps = nextVNode.props || EMPTY_OBJ;
	const lastKey = lastVNode.key;
	const nextKey = nextVNode.key;

	if (lastType !== nextType) {
		if (isClass) {
			replaceWithNewNode(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling);
		} else {
			const lastInput = (lastVNode.children as VNode)._lastInput || lastVNode.children;
			const nextInput = createStatelessComponentInput(nextVNode, nextType, nextProps, context);

			patch(lastInput, nextInput, parentDom, lifecycle, context, isSVG, isRecycling);
			const dom = nextVNode.dom = nextInput.dom;

			nextVNode.children = nextInput;
			mountStatelessComponentCallbacks(nextVNode.ref, dom, lifecycle);
			unmount(lastVNode, null, lifecycle, false, true, isRecycling);
		}
	} else {
		if (isClass) {
			if (lastKey !== nextKey) {
				replaceWithNewNode(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling);
				return false;
			}
			const instance = lastVNode.children;

			if ((instance as Component<any, any>)._unmounted) {
				if (isNull(parentDom)) {
					return true;
				}
				replaceChild(
					parentDom,
					mountComponent(
						nextVNode,
						null,
						lifecycle,
						context,
						isSVG,
						nextVNode.flags & VNodeFlags.ComponentClass
					),
					lastVNode.dom
				);
			} else {
				const defaultProps = (nextType as any).defaultProps;
				const lastProps = (instance as Component<any, any>).props;

				if ((instance as Component<any, any>)._devToolsStatus.connected && !(instance as any)._devToolsId) {
					componentIdMap.set((instance as Component<any, any>)._devToolsId = getIncrementalId(), instance);
				}
				lifecycle.fastUnmount = false;
				if (!isUndefined(defaultProps)) {
					copyPropsTo(lastProps, nextProps);
					nextVNode.props = nextProps;
				}
				const lastState = (instance as Component<any, any>).state;
				const nextState = (instance as Component<any, any>).state;
				let childContext = (instance as Component<any, any>).getChildContext();

				nextVNode.children = instance;
				(instance as Component<any, any>)._isSVG = isSVG;
				if (!isNullOrUndef(childContext)) {
					childContext = Object.assign({}, context, childContext);
				} else {
					childContext = context;
				}
				const lastInput = (instance as Component<any, any>)._lastInput;
				let nextInput = (instance as Component<any, any>)._updateComponent(lastState, nextState, lastProps, nextProps, context, false);
				let didUpdate = true;

				(instance as Component<any, any>)._childContext = childContext;
				if (isInvalid(nextInput)) {
					nextInput = createVoidVNode();
				} else if (isArray(nextInput)) {
					if (process.env.NODE_ENV !== 'production') {
						throwError('a valid Inferno VNode (or null) must be returned from a component render. You may have returned an array or an invalid object.');
					}
					throwError();
				} else if (nextInput === NO_OP) {
					nextInput = lastInput;
					didUpdate = false;
				} else if (isObject(nextInput) && nextInput.dom) {
					nextInput = cloneVNode(nextInput);
				}
				if (nextInput.flags & VNodeFlags.Component) {
					nextInput.parentVNode = nextVNode;
				} else if (lastInput.flags & VNodeFlags.Component) {
					lastInput.parentVNode = nextVNode;
				}
				(instance as Component<any, any>)._lastInput = nextInput;
				(instance as Component<any, any>)._vNode = nextVNode;
				if (didUpdate) {
					patch(lastInput, nextInput, parentDom, lifecycle, childContext, isSVG, isRecycling);
					(instance as Component<any, any>).componentDidUpdate(lastProps, lastState);
					componentToDOMNodeMap.set(instance, nextInput.dom);
				}
				nextVNode.dom = nextInput.dom;
			}
		} else {
			let shouldUpdate = true;
			const lastProps = lastVNode.props;
			const nextHooks = nextVNode.ref;
			const nextHooksDefined = !isNullOrUndef(nextHooks);
			const lastInput = lastVNode.children;
			let nextInput = lastInput;

			nextVNode.dom = lastVNode.dom;
			nextVNode.children = lastInput;
			if (lastKey !== nextKey) {
				shouldUpdate = true;
			} else {
				if (nextHooksDefined && !isNullOrUndef((nextHooks as any).onComponentShouldUpdate)) {
					shouldUpdate = (nextHooks as any).onComponentShouldUpdate(lastProps, nextProps);
				}
			}
			if (shouldUpdate !== false) {
				if (nextHooksDefined && !isNullOrUndef((nextHooks as any).onComponentWillUpdate)) {
					lifecycle.fastUnmount = false;
					(nextHooks as any).onComponentWillUpdate(lastProps, nextProps);
				}
				nextInput = nextType(nextProps, context);

				if (isInvalid(nextInput)) {
					nextInput = createVoidVNode();
				} else if (isArray(nextInput)) {
					if (process.env.NODE_ENV !== 'production') {
						throwError('a valid Inferno VNode (or null) must be returned from a component render. You may have returned an array or an invalid object.');
					}
					throwError();
				} else if (isObject(nextInput) && (nextInput as VNode).dom) {
					nextInput = cloneVNode(nextInput as any);
				}
				if ((nextInput as any) !== NO_OP) {
					patch(lastInput as any, nextInput as any, parentDom, lifecycle, context, isSVG, isRecycling);
					nextVNode.children = nextInput;
					if (nextHooksDefined && !isNullOrUndef((nextHooks as any).onComponentDidUpdate)) {
						lifecycle.fastUnmount = false;
						(nextHooks as any).onComponentDidUpdate(lastProps, nextProps);
					}
					nextVNode.dom = (nextInput as any).dom;
				}
			}
			if ((nextInput as VNode).flags & VNodeFlags.Component) {
				(nextInput as VNode).parentVNode = nextVNode;
			} else if ((lastInput as VNode).flags & VNodeFlags.Component) {
				(lastInput as VNode).parentVNode = nextVNode;
			}
		}
	}
	return false;
}

export function patchText(lastVNode: VNode, nextVNode: VNode) {
	const nextText = nextVNode.children as string;
	const dom = lastVNode.dom;

	nextVNode.dom = dom;

	if (lastVNode.children !== nextText) {
		(dom as Node).nodeValue = nextText;
	}
}

export function patchVoid(lastVNode: VNode, nextVNode: VNode) {
	nextVNode.dom = lastVNode.dom;
}

export function patchNonKeyedChildren(lastChildren, nextChildren, dom: HTMLElement, lifecycle: Lifecycle, context, isSVG: boolean, isRecycling: boolean) {
	let lastChildrenLength = lastChildren.length;
	let nextChildrenLength = nextChildren.length;
	let commonLength = lastChildrenLength > nextChildrenLength ? nextChildrenLength : lastChildrenLength;
	let i;
	let nextNode = null;
	let newNode;

	// Loop backwards so we can use insertBefore
	if (lastChildrenLength < nextChildrenLength) {
		for (i = nextChildrenLength - 1; i >= commonLength; i--) {
			let child = nextChildren[i];

			if (!isInvalid(child)) {
				if (child.dom) {
					nextChildren[i] = child = cloneVNode(child);
				}
				newNode = mount(child, null, lifecycle, context, isSVG);
				insertOrAppend(dom, newNode, nextNode);
				nextNode = newNode;
			}
		}
	} else if (nextChildrenLength === 0) {
		removeAllChildren(dom, lastChildren, lifecycle, false, isRecycling);
	} else if (lastChildrenLength > nextChildrenLength) {
		for (i = commonLength; i < lastChildrenLength; i++) {
			const child = lastChildren[i];

			if (!isInvalid(child)) {
				unmount(lastChildren[i], dom, lifecycle, false, false, isRecycling);
			}
		}
	}

	for (i = commonLength - 1; i >= 0; i--) {
		const lastChild = lastChildren[i];
		let nextChild = nextChildren[i];

		if (isInvalid(nextChild)) {
			if (!isInvalid(lastChild)) {
				unmount(lastChild, dom, lifecycle, true, false, isRecycling);
			}
		} else {
			if (nextChild.dom) {
				nextChildren[i] = nextChild = cloneVNode(nextChild);
			}
			if (isInvalid(lastChild)) {
				newNode = mount(nextChild, null, lifecycle, context, isSVG);
				insertOrAppend(dom, newNode, nextNode);
				nextNode = newNode;
			} else {
				patch(lastChild, nextChild, dom, lifecycle, context, isSVG, isRecycling);
				nextNode = nextChild.dom;
			}
		}
	}
}

export function patchKeyedChildren(
	a: VNode[],
	b: VNode[],
	dom,
	lifecycle: Lifecycle,
	context,
	isSVG: boolean,
	isRecycling: boolean
) {
	let aLength = a.length;
	let bLength = b.length;
	let aEnd = aLength - 1;
	let bEnd = bLength - 1;
	let aStart = 0;
	let bStart = 0;
	let i;
	let j;
	let aNode;
	let bNode;
	let nextNode;
	let nextPos;
	let node;

	if (aLength === 0) {
		if (bLength !== 0) {
			mountArrayChildren(b, dom, lifecycle, context, isSVG);
		}
		return;
	} else if (bLength === 0) {
		removeAllChildren(dom, a, lifecycle, false, isRecycling);
		return;
	}
	let aStartNode = a[aStart];
	let bStartNode = b[bStart];
	let aEndNode = a[aEnd];
	let bEndNode = b[bEnd];

	if (bStartNode.dom) {
		b[bStart] = bStartNode = cloneVNode(bStartNode);
	}
	if (bEndNode.dom) {
		b[bEnd] = bEndNode = cloneVNode(bEndNode);
	}
	// Step 1
	/* eslint no-constant-condition: 0 */
	outer: while (true) {
		// Sync nodes with the same key at the beginning.
		while (aStartNode.key === bStartNode.key) {
			patch(aStartNode, bStartNode, dom, lifecycle, context, isSVG, isRecycling);
			aStart++;
			bStart++;
			if (aStart > aEnd || bStart > bEnd) {
				break outer;
			}
			aStartNode = a[aStart];
			bStartNode = b[bStart];
			if (bStartNode.dom) {
				b[bStart] = bStartNode = cloneVNode(bStartNode);
			}
		}

		// Sync nodes with the same key at the end.
		while (aEndNode.key === bEndNode.key) {
			patch(aEndNode, bEndNode, dom, lifecycle, context, isSVG, isRecycling);
			aEnd--;
			bEnd--;
			if (aStart > aEnd || bStart > bEnd) {
				break outer;
			}
			aEndNode = a[aEnd];
			bEndNode = b[bEnd];
			if (bEndNode.dom) {
				b[bEnd] = bEndNode = cloneVNode(bEndNode);
			}
		}

		// Move and sync nodes from right to left.
		if (aEndNode.key === bStartNode.key) {
			patch(aEndNode, bStartNode, dom, lifecycle, context, isSVG, isRecycling);
			insertOrAppend(dom, bStartNode.dom, aStartNode.dom);
			aEnd--;
			bStart++;
			aEndNode = a[aEnd];
			bStartNode = b[bStart];
			if (bStartNode.dom) {
				b[bStart] = bStartNode = cloneVNode(bStartNode);
			}
			continue;
		}

		// Move and sync nodes from left to right.
		if (aStartNode.key === bEndNode.key) {
			patch(aStartNode, bEndNode, dom, lifecycle, context, isSVG, isRecycling);
			nextPos = bEnd + 1;
			nextNode = nextPos < b.length ? b[nextPos].dom : null;
			insertOrAppend(dom, bEndNode.dom, nextNode);
			aStart++;
			bEnd--;
			aStartNode = a[aStart];
			bEndNode = b[bEnd];
			if (bEndNode.dom) {
				b[bEnd] = bEndNode = cloneVNode(bEndNode);
			}
			continue;
		}
		break;
	}

	if (aStart > aEnd) {
		if (bStart <= bEnd) {
			nextPos = bEnd + 1;
			nextNode = nextPos < b.length ? b[nextPos].dom : null;
			while (bStart <= bEnd) {
				node = b[bStart];
				if (node.dom) {
					b[bStart] = node = cloneVNode(node);
				}
				bStart++;
				insertOrAppend(dom, mount(node, null, lifecycle, context, isSVG), nextNode);
			}
		}
	} else if (bStart > bEnd) {
		while (aStart <= aEnd) {
			unmount(a[aStart++], dom, lifecycle, false, false, isRecycling);
		}
	} else {
		aLength = aEnd - aStart + 1;
		bLength = bEnd - bStart + 1;
		const aNullable: Array<VNode | null> = a;
		const sources = new Array(bLength);

		// Mark all nodes as inserted.
		for (i = 0; i < bLength; i++) {
			sources[i] = -1;
		}
		let moved = false;
		let pos = 0;
		let patched = 0;

		if ((bLength <= 4) || (aLength * bLength <= 16)) {
			for (i = aStart; i <= aEnd; i++) {
				aNode = a[i];
				if (patched < bLength) {
					for (j = bStart; j <= bEnd; j++) {
						bNode = b[j];
						if (aNode.key === bNode.key) {
							sources[j - bStart] = i;

							if (pos > j) {
								moved = true;
							} else {
								pos = j;
							}
							if (bNode.dom) {
								b[j] = bNode = cloneVNode(bNode);
							}
							patch(aNode, bNode, dom, lifecycle, context, isSVG, isRecycling);
							patched++;
							aNullable[i] = null;
							break;
						}
					}
				}
			}
		} else {
			const keyIndex = new Map();

			for (i = bStart; i <= bEnd; i++) {
				node = b[i];
				keyIndex.set(node.key, i);
			}
			for (i = aStart; i <= aEnd; i++) {
				aNode = a[i];

				if (patched < bLength) {
					j = keyIndex.get(aNode.key);

					if (!isUndefined(j)) {
						bNode = b[j];
						sources[j - bStart] = i;
						if (pos > j) {
							moved = true;
						} else {
							pos = j;
						}
						if (bNode.dom) {
							b[j] = bNode = cloneVNode(bNode);
						}
						patch(aNode, bNode, dom, lifecycle, context, isSVG, isRecycling);
						patched++;
						aNullable[i] = null;
					}
				}
			}
		}
		if (aLength === a.length && patched === 0) {
			removeAllChildren(dom, a, lifecycle, false, isRecycling);
			while (bStart < bLength) {
				node = b[bStart];
				if (node.dom) {
					b[bStart] = node = cloneVNode(node);
				}
				bStart++;
				insertOrAppend(dom, mount(node, null, lifecycle, context, isSVG), null);
			}
		} else {
			i = aLength - patched;
			while (i > 0) {
				aNode = aNullable[aStart++];
				if (!isNull(aNode)) {
					unmount(aNode, dom, lifecycle, false, false, isRecycling);
					i--;
				}
			}
			if (moved) {
				let seq = lis_algorithm(sources);
				j = seq.length - 1;
				for (i = bLength - 1; i >= 0; i--) {
					if (sources[i] === -1) {
						pos = i + bStart;
						node = b[pos];
						if (node.dom) {
							b[pos] = node = cloneVNode(node);
						}
						nextPos = pos + 1;
						nextNode = nextPos < b.length ? b[nextPos].dom : null;
						insertOrAppend(dom, mount(node, dom, lifecycle, context, isSVG), nextNode);
					} else {
						if (j < 0 || i !== seq[j]) {
							pos = i + bStart;
							node = b[pos];
							nextPos = pos + 1;
							nextNode = nextPos < b.length ? b[nextPos].dom : null;
							insertOrAppend(dom, node.dom, nextNode);
						} else {
							j--;
						}
					}
				}
			} else if (patched !== bLength) {
				for (i = bLength - 1; i >= 0; i--) {
					if (sources[i] === -1) {
						pos = i + bStart;
						node = b[pos];
						if (node.dom) {
							b[pos] = node = cloneVNode(node);
						}
						nextPos = pos + 1;
						nextNode = nextPos < b.length ? b[nextPos].dom : null;
						insertOrAppend(dom, mount(node, null, lifecycle, context, isSVG), nextNode);
					}
				}
			}
		}
	}
}

// // https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function lis_algorithm(a: any[]) {
	let p = a.slice(0);
	let result: any[] = [];
	result.push(0);
	let i;
	let j;
	let u;
	let v;
	let c;

	for (i = 0; i < a.length; i++) {
		if (a[i] === -1) {
			continue;
		}

		j = result[result.length - 1];
		if (a[j] < a[i]) {
			p[i] = j;
			result.push(i);
			continue;
		}

		u = 0;
		v = result.length - 1;

		while (u < v) {
			c = ((u + v) / 2) | 0;
			if (a[result[c]] < a[i]) {
				u = c + 1;
			} else {
				v = c;
			}
		}

		if (a[i] < a[result[u]]) {
			if (u > 0) {
				p[i] = result[u - 1];
			}
			result[u] = i;
		}
	}

	u = result.length;
	v = result[u - 1];

	while (u-- > 0) {
		result[u] = v;
		v = p[v];
	}

	return result;
}

// TODO we can shorten this code and put it in constants for smaller size bundles
// these are handled by other parts of Inferno, e.g. input wrappers
const skipProps: IObject = {
	children: true,
	ref: true,
	key: true,
	selected: true,
	checked: true,
	value: true,
	multiple: true
};

const dehyphenProps = {
	textAnchor: 'text-anchor'
};

export function patchProp(prop: string, lastValue: any, nextValue: any, dom: HTMLElement, isSVG: boolean) {
	if (skipProps[prop]) {
		return;
	}
	if (booleanProps[prop]) {
		dom[prop] = nextValue ? true : false;
	} else if (strictProps[prop]) {
		const value = isNullOrUndef(nextValue) ? '' : nextValue;

		if (dom[prop] !== value) {
			dom[prop] = value;
		}
	} else if (lastValue !== nextValue) {
		if (isNullOrUndef(nextValue)) {
			dom.removeAttribute(prop);
		} else if (prop === 'className') {
			if (isSVG) {
				dom.setAttribute('class', nextValue);
			} else {
				dom.className = nextValue;
			}
		} else if (prop === 'style') {
			patchStyle(lastValue, nextValue, dom);
		} else if (isAttrAnEvent(prop)) {
			const eventName = prop.toLowerCase();
			const event = dom[eventName];

			if (!event || !event.wrapped) {
				dom[eventName] = nextValue;
			}
		} else if (prop === 'dangerouslySetInnerHTML') {
			const lastHtml = lastValue && lastValue.__html;
			const nextHtml = nextValue && nextValue.__html;

			if (lastHtml !== nextHtml) {
				if (!isNullOrUndef(nextHtml)) {
					dom.innerHTML = nextHtml;
				}
			}
		} else if (prop !== 'childrenType' && prop !== 'ref' && prop !== 'key') {
			const dehyphenProp = dehyphenProps[prop];
			const ns = namespaces[prop];

			if (ns) {
				dom.setAttributeNS(ns, dehyphenProp || prop, nextValue);
			} else {
				dom.setAttribute(dehyphenProp || prop, nextValue);
			}
		}
	}
}

function patchProps(lastProps: IProps, nextProps: IProps, dom: HTMLElement, lifecycle: Lifecycle, context, isSVG: boolean) {
	lastProps = lastProps || EMPTY_OBJ;
	nextProps = nextProps || EMPTY_OBJ;

	if (nextProps !== EMPTY_OBJ) {
		for (let prop in nextProps) {
			// do not add a hasOwnProperty check here, it affects performance
			const nextValue = nextProps[prop];
			const lastValue = lastProps[prop];

			if (isNullOrUndef(nextValue)) {
				removeProp(prop, dom);
			} else {
				patchProp(prop, lastValue, nextValue, dom, isSVG);
			}
		}
	}
	if (lastProps !== EMPTY_OBJ) {
		for (let prop in lastProps) {
			// do not add a hasOwnProperty check here, it affects performance
			if (isNullOrUndef(nextProps[prop])) {
				removeProp(prop, dom);
			}
		}
	}
}

// We are assuming here that we come from patchProp routine
// -nextAttrValue cannot be null or undefined
export function patchStyle(lastAttrValue: any, nextAttrValue: any, dom: HTMLElement) {
	if (isString(nextAttrValue)) {
		dom.style.cssText = nextAttrValue;
	} else if (isNullOrUndef(lastAttrValue)) {
		for (let style in nextAttrValue) {
			// do not add a hasOwnProperty check here, it affects performance
			const value = nextAttrValue[style];

			if (isNumber(value) && !isUnitlessNumber[style]) {
				dom.style[style] = value + 'px';
			} else {
				dom.style[style] = value;
			}
		}
	} else {
		for (let style in nextAttrValue) {
			// do not add a hasOwnProperty check here, it affects performance
			const value = nextAttrValue[style];

			if (isNumber(value) && !isUnitlessNumber[style]) {
				dom.style[style] = value + 'px';
			} else {
				dom.style[style] = value;
			}
		}
		for (let style in lastAttrValue) {
			if (isNullOrUndef(nextAttrValue[style])) {
				dom.style[style] = '';
			}
		}
	}
}

function removeProp(prop: string, dom: HTMLElement) {
	if (prop === 'className') {
		dom.removeAttribute('class');
	} else if (prop === 'value') {
		(dom as HTMLInputElement).value = '';
	} else if (prop === 'style') {
		dom.style.cssText = null;
		dom.removeAttribute('style');
	} else {
		dom.removeAttribute(prop);
	}
}
