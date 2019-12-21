import { QueryHandler } from "./App";

export namespace Utils {

    export const requestLogger: QueryHandler = async (context, next) => {
        const startTimestamp = Date.now();
        await next();
        const endTime = new Date(),
            deltaTime = endTime.getTime() - startTimestamp;
        console.log(
            `[${endTime.toISOString()}]`,
            context.request.method,
            context.path,
            '--',
            context.ended ? context.response.statusCode : NaN,
            `(used ${deltaTime}ms)`
        );
    };

}
