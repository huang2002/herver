import { QueryHandler } from "./App";
import { existsSync, promises as fsPromises } from "fs";
import { join } from "path";

/**
 * The type of static handler options
 */
export type StaticHandlerOptions = Partial<{
    /**
     * Default page pathes
     * @defaults ['index.html']
     */
    defaultPages: string[] | null;
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
            } else if (options!.defaultPages) {
                const defaultPages = options!.defaultPages;
                for (let i = 0; i < defaultPages.length; i++) {
                    const defaultPagePath = join(path, defaultPages[i]);
                    if (existsSync(defaultPagePath)) {
                        if (context.path.endsWith('/')) {
                            return context.endWithFile(defaultPagePath);
                        } else {
                            return context.redirect(context.path + '/');
                        }
                    }
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
    defaultPages: ['index.html'],
    methods: ['GET', 'HEAD'],
    terminal: false,
} as Required<StaticHandlerOptions>;
