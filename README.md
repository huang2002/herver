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

## API Reference

The reference here is written in [TypeScript](https://www.typescriptlang.org/) style.

```ts
/**
 * @desc a map of MIME types (some common ones are available out of the box)
 */
const mimeTypes: Map<string, string>;

/**
 * @desc the type of compression options used in responding methods
 */
interface CompressionOptions {

    /**
     * @desc accepted compression encodings (in priority order)
     * @default ['br','gzip','deflate']
     */
    compression?: string[] | null;

    /**
     * @desc the compression options passed to compressor
     */
    zlibOptions?: ZlibOptions;
    brotliOptions?: BrotliOptions;

}

/**
 * @desc the query context class (usually used internally to create query contexts)
 * @param T the type of the context store object
 */
class QueryContext<T extends {} = any> {

    /**
     * @desc the compression defaults
     */
    static compressionDefaults: CompressionOptions;

    /**
     * @desc the constructor
     * @param request the request instance
     * @param response the response instance
     * @param store the initial store values (optional)
     */
    constructor(request: IncomingMessage, response: ServerResponse, store?: Partial<T>);

    /**
     * @desc the original request/response instance
     */
    readonly request: IncomingMessage;
    readonly response: ServerResponse;

    /**
     * @desc the store object (this can be used to share data between handlers)
     */
    store: Partial<T>;

    /**
     * @desc the request path (without query string)
     */
    readonly path: string;

    /**
     * @desc the raw query string
     */
    readonly queryString: string;

    /**
     * @desc query map parsed from the query string
     */
    readonly queries: ReadonlyMap<string, string | string[]>;

    /**
     * @desc whether the query has been resolved
     * (the following utility methods will set this property to `true`
     * automatically, but if you handle a query without them, you'll
     * need to set this property to `true` to tell other handlers that
     * this query has been resolved to avoid potential conflict)
     */
    resolved: boolean;

    /**
     * @desc redirect the request (the response will be ended afterwards)
     * @param location the target location
     * @param code redirecting code (optional; default: 302)
     */
    redirect(location: string, code?: number): void;

    /**
     * @desc end the response with specific status code
     * @param code an http status code
     * @param content the response body (optional)
     */
    endWithCode(code: number, content?: string): void;

    /**
     * @desc end the response with specific content
     * @param content the response body
     * @param options the compression options (optional)
     */
    endWithContent(content: string, options?: CompressionOptions): void;

    /**
     * @desc end the response with specific file (the MIME type will be
     * automatically set in the response headers according to `mimeTypes`)
     * @param path the file path
     * @param options the compression options (optional)
     */
    endWithFile(path: string, options?: CompressionOptions): void;

    /**
     * @desc create an output stream (the response will be regarded as ended afterwards)
     * @param options the compression options (optional)
     */
    createOutput(options?: CompressionOptions): ServerResponse | BrotliCompress;

}

/**
 * @desc the type of next callbacks
 * @returns a promise resolved when all subsequent handlers are resolved
 */
type NextCallback = () => Promise<void>;

/**
 * @desc the type of query handlers
 * @param context the query context
 * @param next the next callback
 * @returns a promise solved when operations are finished (or rejected on errors)
 */
type QueryHandler = (context: QueryContext, next: NextCallback) => Promise<void>;

/**
 * @desc the type of app options
 */
interface AppOptions {

    /**
     * @desc initial query handlers
     */
    handlers?: QueryHandler[];

    /**
     * @desc the default status code used when a response isn't ended
     * after all handlers have finished
     */
    defaultCode?: number;

}

/**
 * @desc the application class
 * @event error emitted on errors with the error being the only parameter
 */
class App extends EventEmitter {

    /**
     * @desc the constructor
     * @param options the app options (optional)
     */
    constructor(options?: AppOptions);

    /**
     * @desc the query handlers in use
     */
    handlers: QueryHandler[];

    /**
     * @desc the default status code
     */
    defaultCode: number;

    /**
     * @desc the listener to be attached to the server
     */
    readonly listener: (request: IncomingMessage, response: ServerResponse) => void;

    /**
     * @desc serve the app on the specific port (an http server
     * will be created internally; if you prefer a custom server,
     * create it yourself and use the `listener` as its handler)
     */
    listen(port: number, listeningListener?: () => void): Server;

    /**
     * @desc add the given handler to the app (note that the employing
     * order will affect the executing order of query handlers)
     * @example
     * ```js
     * // this should be employed first so that it can measure
     * // the executing time of all the subsequent handlers
     * app.use(async (context, next) => {
     *     console.time('responding');
     *     await next();
     *     console.timeEnd('responding');
     * });
     * // this should be employed afterwards as it only employs the router
     * app.use(router.handler);
     * ```
     */
    use(handler: QueryHandler): this;

    /**
     * @desc remove a handler
     */
    disuse(handler: QueryHandler): this;

}

/**
 * @desc the type of route descriptions
 */
type RouteDescription = string | RegExp;

/**
 * @desc the type of route objects
 */
interface Route {

    /**
     * @desc accepted http methods
     */
    methods: string[];

    /**
     * @desc the route description (used to match request path)
     */
    description: RouteDescription;

    /**
     * @desc the query handler of the route
     */
    handler: QueryHandler;

}

/**
 * @desc the router class
 */
class Router {

    /**
     * @desc the key to routing results saved in context stores
     * @example
     * ```js
     * router.get('/foo', async (context, next) => {
     *     // this will always be `true`
     *     const routingResult = context.store[Router.storeKey];
     * });
     * router.get(/^\/echo\/(.*)/, async (context, next) => {
     *     // this will be a `RegExpMatchArray` instance
     *     const routingResult = context.store[Router.storeKey];
     * });
     * ```
     */
    storeKey: string;

    /**
     * @desc the routes defined in this router
     */
    routes: Route[];

    /**
     * @desc the router handler (attach this to your app to employ the router;
     * this handler will find the first route matching the request path and
     * act as the query handler of the route; if there is no such a route,
     * it just passes without doing anything else)
     */
    readonly handler: QueryHandler;

    /**
     * @desc define a new route
     * @param methods accepted http methods
     * @param description the route description
     * @param handler the query handler of the route
     */
    addRoute(methods: string[], description: RouteDescription, handler: QueryHandler): this;

    /**
     * @desc define a route handling a specific method (identical to `addRoute`)
     */
    get(description: RouteDescription, handler: QueryHandler): this;
    post(description: RouteDescription, handler: QueryHandler): this;
    put(description: RouteDescription, handler: QueryHandler): this;
    patch(description: RouteDescription, handler: QueryHandler): this;
    delete(description: RouteDescription, handler: QueryHandler): this;
    head(description: RouteDescription, handler: QueryHandler): this;

}

/**
 * @desc the static handler options
 */
interface StaticHandlerOptions {

    /**
     * @desc the default page to serve (set this to null if you don't need one)
     * @default 'index.html'
     */
    defaultPage?: string | null;

    /**
     * @desc accepted http methods
     * @defaults ['GET', 'HEAD']
     */
    methods: string[];

    /**
     * @desc whether to respond 404 when no file matches
     * @default false
     */
    terminal: boolean;

}

/**
 * @desc create a query handler that serves static files
 * @param root the root path (optional; default: `process.cwd()`)
 * @param options the options (optional)
 */
function createStaticHandler(root?: string, options?: StaticHandlerOptions): QueryHandler;

namespace createStaticHandler {

    /**
     * @desc the defaults of static handler options
     * (accessed via `createStaticHandler.defaults`)
     */
    const defaults: Required<StaticHandlerOptions>;

}

/**
 * @desc built-in utilities
 */
namespace Utils {

    /**
     * @desc a basic request logger
     */
    const requestLogger: QueryHandler;

}
```
