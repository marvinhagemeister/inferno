import {
	isArray,
	isInvalid,
	isNullOrUndef,
	isStatefulComponent,
	isStringOrNumber,
	isUndefined,
} from '../shared';

import Component from "../component/es2015";

import cloneVNode from '../factories/cloneVNode';

export interface DevToolsStatus {
	connected: boolean;
}

export interface IObject {
	[key: string]: any;
}

export interface IProps extends IObject {
	id?: string;
	className?: string;
	children?: any;
	key?: string | number;
	ref?: any;
	style?: IObject;
	dangerouslySetInnerHTML?: {
		__html: string
	};
}

export interface VType {
	flags: VNodeFlags;
}

export type InfernoInput = VNode | VNode[] | null | String | String[] | number | number[];

export const enum VNodeFlags {
	Text = 1,
	HtmlElement = 1 << 1,

	ComponentClass = 1 << 2,
	ComponentFunction = 1 << 3,
	ComponentUnknown = 1 << 4,

	HasKeyedChildren = 1 << 5,
	HasNonKeyedChildren = 1 << 6,

	SvgElement = 1 << 7,
	MediaElement = 1 << 8,
	InputElement = 1 << 9,
	TextareaElement = 1 << 10,
	SelectElement = 1 << 11,
	Void = 1 << 12,
	Element = HtmlElement | SvgElement | MediaElement | InputElement | TextareaElement | SelectElement,
	Component = ComponentFunction | ComponentClass | ComponentUnknown
}

export interface NodeState {
	_lifecycle?: any;
	_lastInput?: any;
	_unmounted?: boolean;
	_ignoreSetState?: boolean;
	_devToolsStatus?: DevToolsStatus;
}

export type CallbackRef = (args?: any) => any;

export type VNodeCreator = (nextProps?: IProps, context?: any) => VNode;
export type VNodeType = string | (new() => Component<any, any>) | VNodeCreator;

export interface VNode extends NodeState {
	children: Component<any, any> | String | Array<String | VNode> | VNode | null;
	dom: VNode | HTMLElement | Element | Text | null;
	flags: VNodeFlags;
	key: string | number | null;
	props: IProps | null;
	ref: Component<any, any> | CallbackRef | null;
	type: VNodeType;
	parentVNode?: VNode;
	value?: string;
	checked?: boolean;
	name?: string;
	multiple?: boolean;
}

function _normalizeVNodes(nodes: any[], result: VNode[], i: number): void {
	for (; i < nodes.length; i++) {
		let n = nodes[i];

		if (!isInvalid(n)) {
			if (Array.isArray(n)) {
				_normalizeVNodes(n, result, 0);
			} else {
				if (isStringOrNumber(n)) {
					n = createTextVNode(n);
				} else if (isVNode(n) && n.dom) {
					n = cloneVNode(n);
				}
				result.push(n as VNode);
			}
		}
	}
}

export interface VNodeArray extends Array<VNode> {
	$?: any | boolean;
}

export function normalizeVNodes(nodes: VNodeArray): VNode[] {
	let newNodes;

	// we assign $ which basically means we've flagged this array for future note
	// if it comes back again, we need to clone it, as people are using it
	// in an immutable way
	// tslint:disable
	if (nodes['$']) {
		nodes = nodes.slice();
	} else {
		nodes['$'] = true;
	}
	// tslint:enable
	for (let i = 0; i < nodes.length; i++) {
		const n: any = nodes[i];

		if (isInvalid(n)) {
			if (!newNodes) {
				newNodes = nodes.slice(0, i) as VNode[];
			}
			newNodes.push(n);
		} else if (Array.isArray(n)) {
			const result = (newNodes || nodes).slice(0, i) as VNode[];

			_normalizeVNodes(nodes, result, i);
			return result;
		} else if (isStringOrNumber(n)) {
			if (!newNodes) {
				newNodes = nodes.slice(0, i) as VNode[];
			}
			newNodes.push(createTextVNode(n));
		} else if (isVNode(n) && n.dom) {
			if (!newNodes) {
				newNodes = nodes.slice(0, i) as VNode[];
			}
			newNodes.push(cloneVNode(n));
		} else if (newNodes) {
			newNodes.push(cloneVNode(n));
		}
	}
	return newNodes || nodes as VNode[];
}

function normalize(vNode: VNode) {
	const props = vNode.props;
	const children = vNode.children;

	if (props) {
		if (!(vNode.flags & VNodeFlags.Component) && isNullOrUndef(children) && !isNullOrUndef(props.children)) {
			vNode.children = props.children;
		}
		if (props.ref) {
			vNode.ref = props.ref;
		}
		if (!isNullOrUndef(props.key)) {
			vNode.key = props.key;
		}
	}
	if (!isInvalid(children)) {
		if (isArray(children)) {
			vNode.children = normalizeVNodes(children as VNodeArray);
		} else if (isVNode(children) && (children as VNode).dom) {
			vNode.children = cloneVNode(children as VNode);
		}
	}
}

export function createVNode(flags: VNodeFlags, type?: VNodeType, props?: IProps, children?: any, key?: string | number, ref?: any, noNormalise?: boolean): VNode {
	if (flags & VNodeFlags.ComponentUnknown) {
		flags = isStatefulComponent(type) ? VNodeFlags.ComponentClass : VNodeFlags.ComponentFunction;
	}
	const vNode: VNode = {
		children: isUndefined(children) ? null : children,
		dom: null,
		flags: flags || 0,
		key: key === undefined ? null : key,
		props: props || null,
		ref: ref || null,
		type
	};
	if (!noNormalise) {
		normalize(vNode);
	}
	return vNode;
}

// when a components root VNode is also a component, we can run into issues
// this will recursively look for vNode.parentNode if the VNode is a component
export function updateParentComponentVNodes(vNode: VNode, dom: HTMLElement) {
	if (vNode.flags & VNodeFlags.Component) {
		const parentVNode = vNode.parentVNode;

		if (parentVNode) {
			parentVNode.dom = dom;
			updateParentComponentVNodes(parentVNode, dom);
		}
	}
}

export function createVoidVNode() {
	return createVNode(VNodeFlags.Void);
}

export function createTextVNode(text: string | number) {
	return createVNode(VNodeFlags.Text, null, null, text);
}

export function isVNode(o: any): boolean {
	return !!o.flags;
}
