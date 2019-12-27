import { QueryHandler, NextCallback } from "./App";
import { QueryContext } from "./QueryContext";

export type RouteDescription = string | RegExp;

export interface Route {
    methods: string[];
    description: RouteDescription;
    handler: QueryHandler;
}

export class Router {

    storeKey = 'ROUTE_RESULT';
    routes = new Array<Route>();
    readonly handler: QueryHandler = this._handler.bind(this);

    private async _handler(context: QueryContext, next: NextCallback) {
        if (context.ended) {
            return;
        }
        const { routes } = this,
            { path } = context;
        for (let i = 0; i < routes.length; i++) {
            const { description } = routes[i],
                routeResult = typeof description === 'string' ?
                    description === path :
                    path.match(description);
            if (routeResult) {
                const { storeKey } = this;
                context.store[storeKey] = routeResult;
                await routes[i].handler(context, next);
                delete context.store[storeKey];
                return;
            }
        }
    }

    addRoute(methods: string[], description: RouteDescription, handler: QueryHandler) {
        this.routes.push({ methods, description, handler });
        return this;
    }

    get(description: RouteDescription, handler: QueryHandler) {
        return this.addRoute(['GET'], description, handler);
    }

    post(description: RouteDescription, handler: QueryHandler) {
        return this.addRoute(['POST'], description, handler);
    }

    put(description: RouteDescription, handler: QueryHandler) {
        return this.addRoute(['PUT'], description, handler);
    }

    patch(description: RouteDescription, handler: QueryHandler) {
        return this.addRoute(['PATCH'], description, handler);
    }

    delete(description: RouteDescription, handler: QueryHandler) {
        return this.addRoute(['DELETE'], description, handler);
    }

    head(description: RouteDescription, handler: QueryHandler) {
        return this.addRoute(['HEAD'], description, handler);
    }

}
