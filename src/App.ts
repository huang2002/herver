import { createServer, IncomingMessage, ServerResponse } from "http";
import { QueryContext } from "./QueryContext";
import { EventEmitter } from "events";

/**
 * Type of `next` callbacks
 */
export type NextCallback = () => Promise<void>;
/** dts2md break */
/**
 * Type of query handlers
 * @param context A query context object used to deal with the query
 * @param next A callback which returns a promise resolved after all
 * trailing handlers are finished
 */
export type QueryHandler = (context: QueryContext, next: NextCallback) => Promise<void>;
/** dts2md break */
/**
 * Type of app options (see corresponding properties in `App` for details)
 */
export type AppOptions = Partial<{
    handlers: QueryHandler[];
    defaultCode: number;
}>;
/** dts2md break */
/**
 * Class of server apps
 * @event error Emits when an error occurs
 */
export class App extends EventEmitter implements Required<AppOptions> {
    /** dts2md break */
    constructor(options?: AppOptions) {
        super();
        Object.assign(this, options);
    }
    /** dts2md break */
    /**
     * Query handlers (can be added using the `use` method)
     */
    handlers = new Array<QueryHandler>();
    /** dts2md break */
    /**
     * Default status code
     * @default 404
     */
    defaultCode = 404;
    /** dts2md break */
    /**
     * Unique request listener
     */
    readonly listener = this._listener.bind(this);

    private _listener(request: IncomingMessage, response: ServerResponse) {
        const { handlers } = this,
            context = new QueryContext(request, response);
        let i = 0;
        const next = async () => {
            while (i < handlers.length) {
                await handlers[i++](context, next);
            }
        };
        next().then(() => {
            if (!context.resolved) {
                context.endWithCode(this.defaultCode);
            }
        }, error => {
            if (!context.resolved) {
                context.endWithCode(500);
            }
            this.emit('error', error);
        });
    }
    /** dts2md break */
    /**
     * Start a server at the given port and returns it
     * @returns The server instance created
     */
    listen(port: number, listeningListener?: () => void) {
        const server = createServer(this.listener),
            onError = (error: Error) => {
                server.close();
                this.emit('error', error);
            };
        server.on('error', onError);
        server.once('close', () => {
            server.off('error', onError);
        });
        server.listen(port, listeningListener);
        return server;
    }
    /** dts2md break */
    /**
     * Add the given handler to the app
     */
    use(handler: QueryHandler) {
        this.handlers.push(handler);
        return this;
    }
    /** dts2md break */
    /**
     * Remove the given handler from the app
     */
    disuse(handler: QueryHandler) {
        const { handlers } = this,
            index = handlers.indexOf(handler);
        if (~index) {
            handlers.splice(index, 1);
        }
        return this;
    }

}
