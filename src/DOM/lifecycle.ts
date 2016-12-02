export type Listener = () => any;

export default class Lifecycle {
	public listeners: Listener[] = [];
	public fastUnmount = true;

	addListener(callback: () => any) {
		this.listeners.push(callback);
	}
	trigger() {
		for (let i = 0; i < this.listeners.length; i++) {
			this.listeners[i]();
		}
	}
}
