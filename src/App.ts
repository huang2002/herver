import { createServer, IncomingMessage, ServerResponse } from "http";
import { QueryContext } from "./QueryContext";
import { EventEmitter } from "events";

export type NextCallback = () => Promise<void>;

export type QueryHandler = (context: QueryContext, next: NextCallback) => Promise<void>;

export type AppOptions = Partial<{
    handlers: QueryHandler[];
    defaultCode: number;
}>;

/**
 * @event error
 */
export class App extends EventEmitter implements Required<AppOptions> {

    constructor(options?: AppOptions) {
        super();
        Object.assign(this, options);
    }

    handlers = new Array<QueryHandler>();
    defaultCode = 404;
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
            if (!context.ended) {
                context.endWithCode(this.defaultCode);
            }
        }, error => {
            if (!context.ended) {
                context.endWithCode(500);
            }
            this.emit('error', error);
        });
    }

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

    use(handler: QueryHandler) {
        this.handlers.push(handler);
        return this;
    }

    disuse(handler: QueryHandler) {
        const { handlers } = this,
            index = handlers.indexOf(handler);
        if (~index) {
            handlers.splice(index, 1);
        }
        return this;
    }

}
