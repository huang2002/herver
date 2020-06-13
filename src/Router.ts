import { QueryHandler, NextCallback } from "./App";
import { QueryContext } from "./QueryContext";
/**
 * Type of route descriptions
 */
export type RouteDescription = string | RegExp;
/** dts2md break */
/**
 * Type of route objects
 */
export interface Route {
    /**
     * Accepted HTTP methods
     */
    methods: string[];
    /**
     * The route description
     */
    description: RouteDescription;
    /**
     * The handler of the route
     */
    handler: QueryHandler;
}
/** dts2md break */
/**
 * The class of routers
 */
export class Router {
    /** dts2md break */
    /**
     * The key used to store routing result
     */
    storeKey = 'ROUTING_RESULT';
    /** dts2md break */
    /**
     * Route objects (can be added using the utility methods)
     */
    routes = new Array<Route>();
    /** dts2md break */
    /**
     * The unique hander of the router
     * (use this in your app to make the router work)
     */
    readonly handler: QueryHandler = this._handler.bind(this);

    private async _handler(context: QueryContext, next: NextCallback) {
        if (context.resolved) {
            return;
        }
        const { routes } = this,
            { path } = context,
            { method } = context.request;
        for (let i = 0; i < routes.length; i++) {
            if (!routes[i].methods.includes(method!)) {
                continue;
            }
            const { description } = routes[i],
                routingResult = typeof description === 'string' ?
                    description === path :
                    path.match(description);
            if (routingResult) {
                const { storeKey } = this;
                context.store[storeKey] = routingResult;
                await routes[i].handler(context, next);
                delete context.store[storeKey];
                return;
            }
        }
    }
    /** dts2md break */
    /**
     * Add a route
     */
    addRoute(methods: string[], description: RouteDescription, handler: QueryHandler) {
        this.routes.push({ methods, description, handler });
        return this;
    }
    /** dts2md break */
    /**
     * Utility methods similar to `addRoute`,
     * which add routes of specific HTTP methods
     * determined by their names
     */
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
