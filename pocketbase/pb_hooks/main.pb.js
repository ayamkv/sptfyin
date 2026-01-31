routerAdd('GET', '/hello/{name}', (e) => {
	let name = e.request.pathValue('name');
	console.log('Hello routerAdd is loaded');

	return e.json(200, { message: 'Hello ' + name });
});
