export const NO_OP = '$NO_OP';
export const ERROR_MSG = 'a runtime error occured! Use Inferno in development environment to find the error.';

export const isBrowser = typeof window !== 'undefined' && window.document;

export function toArray(children: any) {
	return isArray(children) ? children : (children ? [children] : children);
}

// this is MUCH faster than .constructor === Array and instanceof Array
// in Node 7 and the later versions of V8, slower in older versions though
export const isArray = Array.isArray;

export function isStatefulComponent(o: any) {
	return !isUndefined(o.prototype) && !isUndefined(o.prototype.render);
}

export function isStringOrNumber(obj: any) {
	return isString(obj) || isNumber(obj);
}

export function isNullOrUndef(obj: any) {
	return isUndefined(obj) || isNull(obj);
}

export function isInvalid(obj: any) {
	return isNull(obj) || obj === false || isTrue(obj) || isUndefined(obj);
}

export function isFunction(obj: any) {
	return typeof obj === 'function';
}

export function isAttrAnEvent(attr: string) {
	return attr[0] === 'o' && attr[1] === 'n' && attr.length > 3;
}

export function isString(obj: any) {
	return typeof obj === 'string';
}

export function isNumber(obj: any) {
	return typeof obj === 'number';
}

export function isNull(obj: any) {
	return obj === null;
}

export function isTrue(obj: any) {
	return obj === true;
}

export function isUndefined(obj: any) {
	return obj === undefined;
}

export function isObject(o: any) {
	return typeof o === 'object';
}

export function throwError(message?: string) {
	if (!message) {
		message = ERROR_MSG;
	}
	throw new Error(`Inferno Error: ${ message }`);
}

export function warning(condition: boolean, message: string) {
	if (!condition) {
		console.error(message);
	}
}

export const EMPTY_OBJ = {};
