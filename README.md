# herver

## Introduction

`herver` is a modern server lib which aims at being versatile but lightweight.

## Features

- :bulb: `Promise`-based APIs
- :package: Built-in router support
- :rocket: High extensibility
- :wrench: Useful utilities
- :books: [TypeScript](https://www.typescriptlang.org/) support

## Links

- [API Reference](https://github.com/huang2002/herver/wiki)
- [Changelog](./CHANGELOG.md)
- [License (MIT)](./LICENSE)

## Example

```js
// import APIs
const { App, Router, createStaticHandler } = require('herver');

// create an app and a router
const app = new App(),
    router = new Router();

// handle POST requests to `/echo` (e.g.: `POST /echo?msg=test`)
router.post('/echo', async (context, next) => {
    // end the response with the query parameter `msg`
    context.endWithContent('' + context.queries.get('msg'));
});

// serve all GET requests with corresponding static files in the public folder
router.get(/^\//, createStaticHandler('/path/to/public'));

// apply the router to the app and starts the app at port 8080
app.use(router.handler)
    .listen(8080);
```
