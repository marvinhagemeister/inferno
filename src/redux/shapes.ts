import { IProps } from "../core/shapes";

export interface Action {
	type: string;
	[key: string]: any;
}

export interface Dispatch {
	(action: Action): any;
}

export interface Store {
	getState(): any;
	dispatch(action: Action): void;
}

export interface IProps extends IProps {
	store: Store;
}
