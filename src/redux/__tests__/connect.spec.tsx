import { expect } from 'chai';
import connect from './../connect';
import { createStore } from 'redux';
import Component from './../../component/es2015';
import { render } from './../../DOM/rendering';
import * as Inferno from '../../testUtils/inferno';
import { Action, Dispatch } from '../shapes';
Inferno; // suppress ts 'never used' error

/* tslint:disable max-classes-per-file */

class BasicComponent extends Component<any, any> {
	props: any;
	state: any;
	render() {
		return (
			<div>{this.props.test}</div>
		);
	}
}

class BasicComponent1 extends Component<any, any> {
	props: any;
	state: any;
	handleClick() {
		this.props.action();
	}
	render() {
		return (
			<a onClick={this.handleClick.bind(this)}>{this.props.test}</a>
		);
	}
}

describe('connect', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		container.style.display = 'none';
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
		render(null, container);
	});

	it('should return function', () => {
		expect(connect()).to.be.a('function');
	});

	it('should have correct WrappedComponent', () => {
		const connectFunc = connect();
		const ConnectedComponent = connectFunc(BasicComponent);
		expect(ConnectedComponent.WrappedComponent).to.equal(BasicComponent);
	});

	it('should have correct mapStateToProps', () => {
		const store = createStore(() => {
			return { test: 1 };
		});
		const mapStateToProps = (state: any) => state;
		const ConnectedComponent = connect(mapStateToProps)(BasicComponent);
		render(<ConnectedComponent store={store}/>, container);
		expect(container.innerHTML).to.equal('<div>1</div>');
	});

	it('should have correct mapDispatchToProps', () => {
		const store = createStore((state = { test: 1 }, action: Action) => {
			if (action && action.type === 'TEST_ACTION') {
				return { test: 2 };
			}
			return state;
		});
		const mapDispatchToProps = (dispatch: Dispatch) => {
			return {
				action: () => {
					dispatch({ type: 'TEST_ACTION' });
				}
			};
		};
		const mapStateToProps = (state: any) => state;
		const ConnectedComponent = connect(mapStateToProps, mapDispatchToProps)(BasicComponent1);
		store.subscribe(() => {
			render(<ConnectedComponent store={store}/>, container);
		});
		store.dispatch({ type: '' } as any);
		expect(container.innerHTML).to.equal('<a>1</a>');
		container.querySelector('a').click();
		expect(container.innerHTML).to.equal('<a>2</a>');
	});

	it('should have correct mapDispatchToProps', () => {
		const store = createStore((state = { test: 1 }, action: Action) => {
			if (action && action.type === 'TEST_ACTION') {
				return { test: 2 };
			}
			return state;
		});
		const mapDispatchToProps = (dispatch: Dispatch) => {
			return {
				action: () => {
					dispatch({ type: 'TEST_ACTION' });
				}
			};
		};
		const mapStateToProps = (state: any) => state;
		const ConnectedComponent = connect(mapStateToProps, mapDispatchToProps)(BasicComponent1);
		store.subscribe(() => {
			render(<ConnectedComponent store={store}/>, container);
		});
		store.dispatch({ type: '' } as any);
		expect(container.innerHTML).to.equal('<a>1</a>');
		container.querySelector('a').click();
		expect(container.innerHTML).to.equal('<a>2</a>');
	});

	it('should have correct mapDispatchToProps using action creators map', () => {
		const store = createStore((state = { test: 1 }, action: Action) => {
			if (action && action.type === 'TEST_ACTION') {
				return { test: 2 };
			}
			return state;
		});
		const mapDispatchToProps = {
			action: () => {
				return { type: 'TEST_ACTION' };
			}
		};
		const mapStateToProps = (state: any) => state;
		const ConnectedComponent = connect(mapStateToProps, mapDispatchToProps)(BasicComponent1);
		store.subscribe(() => {
			render(<ConnectedComponent store={store}/>, container);
		});
		store.dispatch({ type: '' } as any);
		expect(container.innerHTML).to.equal('<a>1</a>');
		container.querySelector('a').click();
		expect(container.innerHTML).to.equal('<a>2</a>');
	});
});
