import { expect } from 'chai';
import { streamAsStaticMarkup } from './../renderToString.stream';
import concatStream from 'concat-stream-es6';
import createElement from './../../factories/createElement';
import createClass from './../../component/createClass';

describe('SSR Root Creation Streams - (non-JSX)', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div') as HTMLElement;
		container.style.display = 'none';
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	it('should throw with invalid children', () => {
		const test = (value: any) => createElement('a', null, true as any);

		return streamPromise(test('foo')).catch(err => {
			expect(err.toString()).to.equal('Error: invalid component');
		});
	});

	it('should use getChildContext', () => {
		const TestComponent = createClass({
			getChildContext() {
				return { hello: 'world' };
			},
			render() {
				return createElement('a', null, this.context.hello);
			}
		});
		return streamPromise(createElement(TestComponent)).then(function (output) {
			expect(output).to.equal('<a data-infernoroot>world</a>');
		});
	});

});

function streamPromise(dom: any) {
	return new Promise(function (res, rej) {
		streamAsStaticMarkup(dom)
		.on('error', rej)
		.pipe(concatStream(function (buffer: Buffer) {
			res(buffer.toString('utf-8'));
		}));
	});
}
