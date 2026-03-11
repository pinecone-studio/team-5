import worker from '../src/index';

describe('App', () => {
	it('should return Hello World', async () => {
		const request = new Request('http://localhost:8787/');
		const response = await worker.fetch(request);
		const text = await response.text();
		expect(text).toEqual('Hello, World!');
	});
});
