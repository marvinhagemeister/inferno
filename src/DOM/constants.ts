import { IObject } from "../core/shapes";

function constructDefaults(string: string, value: any): IObject {
	return string.split(',').reduce((res: IObject, cur) => {
		res[cur] = value;
		return res;
	}, {});
}

export interface UnitlessNumber extends IObject {
	animationIterationCount: true;
	borderImageOutset: true;
	borderImageSlice: true;
	borderImageWidth: true;
	boxFlex: true;
	boxFlexGroup: true;
	boxOrdinalGroup: true;
	columnCount: true;
	flex: true;
	flexGrow: true;
	flexPositive: true;
	flexShrink: true;
	flexNegative: true;
	flexOrder: true;
	gridRow: true;
	gridColumn: true;
	fontWeight: true;
	lineClamp: true;
	lineHeight: true;
	opacity: true;
	order: true;
	orphans: true;
	tabSize: true;
	widows: true;
	zIndex: true;
	zoom: true;
	fillOpacity: true;
	floodOpacity: true;
	stopOpacity: true;
	strokeDasharray: true;
	strokeDashoffset: true;
	strokeMiterlimit: true;
	strokeOpacity: true;
	strokeWidth: true;
}

export interface Namespaces extends IObject {
	"xlink:href": string;
	"xlink:arcrole": string;
	"xlink:actuate": string;
	"xlink:role": string;
	"xlink:titlef": string;
	"xlink:type": string;
}

export interface StrictProps extends IObject {
	volume: true;
	defaultValue: true;
	defaultChecked: true;
}

export interface BooleanProps extends IObject {
	muted: true;
	scroped: true;
	loop: true;
	open: true;
	checked: true;
	defaultasInferno: true;
	capture: true;
	disabled: true;
	readonly: true;
	required: true;
	autoplay: true;
	conrols: true;
	seamsless: true;
	reversed: true;
	allowfullscreen: true;
	novalidate: true;
}

export const xlinkNS = 'http://www.w3.org/1999/xlink';
export const xmlNS = 'http://www.w3.org/XML/1998/namespace';
export const svgNS = 'http://www.w3.org/2000/svg';

export const namespaces = Object.assign(
	constructDefaults('xlink:href,xlink:arcrole,xlink:actuate,xlink:role,xlink:titlef,xlink:type', xlinkNS),
	constructDefaults('xml:base,xml:lang,xml:space', xmlNS)
) as Namespaces;

export const strictProps = constructDefaults('volume,defaultValue,defaultChecked', true) as StrictProps;
export const booleanProps = constructDefaults('muted,scoped,loop,open,checked,default,capture,disabled,readonly,required,autoplay,controls,seamless,reversed,allowfullscreen,novalidate', true) as BooleanProps;
export const isUnitlessNumber = constructDefaults('animationIterationCount,borderImageOutset,borderImageSlice,borderImageWidth,boxFlex,boxFlexGroup,boxOrdinalGroup,columnCount,flex,flexGrow,flexPositive,flexShrink,flexNegative,flexOrder,gridRow,gridColumn,fontWeight,lineClamp,lineHeight,opacity,order,orphans,tabSize,widows,zIndex,zoom,fillOpacity,floodOpacity,stopOpacity,strokeDasharray,strokeDashoffset,strokeMiterlimit,strokeOpacity,strokeWidth,', true) as UnitlessNumber;
