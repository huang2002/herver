import { QueryHandler } from "./App";
import { STATUS_CODES } from "http";

export namespace Utils {

    export const requestLogger: QueryHandler = async (context, next) => {
        const startTimestamp = Date.now();
        await next();
        const endTime = new Date(),
            deltaTime = endTime.getTime() - startTimestamp,
            { statusCode } = context.response;
        console.log(
            `[${endTime.toISOString()}]`,
            context.request.method!.padEnd(5),
            context.request.url,
            '--',
            context.resolved ? statusCode : NaN,
            context.resolved ? STATUS_CODES[statusCode] : 'Unknown',
            `(used ${deltaTime}ms)`
        );
    };

}
