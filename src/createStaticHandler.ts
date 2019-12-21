import { QueryHandler } from "./App";
import { existsSync, promises as fsPromises } from "fs";
import { join } from "path";

export type StaticHandlerOptions = Partial<{
    defaultPage: string | null;
}>;

export const createStaticHandler = (
    root = process.cwd(),
    options?: StaticHandlerOptions
): QueryHandler => {
    options = Object.assign({}, createStaticHandler.defaults, options);
    return async context => {
        const path = join(root, context.path);
        if (existsSync(path)) {
            if ((await fsPromises.stat(path)).isFile()) {
                return context.endWithFile(path);
            } else if (options!.defaultPage) {
                const defaultPagePath = join(path, options!.defaultPage);
                if (existsSync(path)) {
                    return context.endWithFile(defaultPagePath);
                }
            }
        }
        context.endWithCode(404);
    };
};

createStaticHandler.defaults = {
    defaultPage: 'index.html',
} as Required<StaticHandlerOptions>;
