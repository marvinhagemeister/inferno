import { isFunction, isNull, isUndefined } from '../shared';
import { DevToolsStatus } from '../core/shapes';
import { render, roots } from './rendering';

interface DevtoolsData {
	type: string;
	data: any;
}

export const devToolsStatus: DevToolsStatus = {
	connected: false
};

const internalIncrementer = {
	id: 0
};

export const componentIdMap = new Map();

export function getIncrementalId() {
	return internalIncrementer.id++;
}

function sendToDevTools(global: any, data: DevtoolsData) {
	const event = new CustomEvent('inferno.client.message', {
		detail: JSON.stringify(data, (key, val) => {
			if (!isNull(val) && !isUndefined(val)) {
				if (key === '_vComponent' || !isUndefined(val.nodeType)) {
					return;
				} else if (isFunction(val)) {
					return `$$f:${ val.name }`;
				}
			}
			return val;
		})
	});
	global.dispatchEvent(event);
}

function rerenderRoots() {
	for (let i = 0; i < roots.length; i++) {
		const root = roots[i];

		render(root.input, root.dom);
	}
}

export function initDevToolsHooks(global: any) {
	global.__INFERNO_DEVTOOLS_GLOBAL_HOOK__ = roots;

	global.addEventListener('inferno.devtools.message', function (message: any) {
		const detail = JSON.parse(message.detail);
		const type = detail.type;

		switch (type) {
			case 'get-roots':
				if (!devToolsStatus.connected) {
					devToolsStatus.connected = true;
					rerenderRoots();
					sendRoots(global);
				}
				break;
			default:
				// TODO:?
				break;
		}
	});
}

export function sendRoots(global: any) {
	sendToDevTools(global, { type: 'roots', data: roots });
}
