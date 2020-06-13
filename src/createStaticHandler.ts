import { QueryHandler } from "./App";
import { existsSync, promises as fsPromises } from "fs";
import { join } from "path";

/**
 * The type of static handler options
 */
export type StaticHandlerOptions = Partial<{
    /**
     * Default page path
     * @default 'index.html'
     */
    defaultPage: string | null;
    /**
     * Accepted HTTP methods
     * @defaults ['GET', 'HEAD']
     */
    methods: string[];
    /**
     * Whether to end the request with 404
     * if no matched pages are found
     * @default false
     */
    terminal: boolean;
}>;
/** dts2md break */
/**
 * Create a handler for static files
 */
export const createStaticHandler = (
    root = process.cwd(),
    options?: StaticHandlerOptions
): QueryHandler => {
    options = Object.assign({}, createStaticHandler.defaults, options);
    return async context => {
        if (
            context.resolved
            || !(options!.methods!.includes(context.request.method!))
        ) {
            return;
        }
        const path = join(root, context.path);
        if (existsSync(path)) {
            if ((await fsPromises.stat(path)).isFile()) {
                return context.endWithFile(path);
            } else if (options!.defaultPage) {
                const defaultPagePath = join(path, options!.defaultPage);
                if (existsSync(defaultPagePath)) {
                    return context.endWithFile(defaultPagePath);
                }
            }
        }
        if (options!.terminal) {
            context.endWithCode(404);
        }
    };
};
/** dts2md break */
/**
 * Default options for `createStaticHandler`
 */
createStaticHandler.defaults = {
    defaultPage: 'index.html',
    methods: ['GET', 'HEAD'],
    terminal: false,
} as Required<StaticHandlerOptions>;
