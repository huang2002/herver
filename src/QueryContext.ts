import { IncomingMessage, ServerResponse } from "http";
import { parse } from "querystring";
import { createReadStream } from "fs";
import { createBrotliCompress, ZlibOptions, BrotliOptions, createGzip, createDeflate } from "zlib";
import { extname } from "path";
import { mimeTypes } from "./mimeTypes";

/**
 * Type of compression options
 */
export type CompressionOptions = Partial<{
    /**
     * Accepted compression encodings (in preferred order)
     * @defaults ['br', 'gzip', 'deflate']
     */
    compression: string[] | null;
    /**
     * Options for specific encodings
     */
    zlibOptions: ZlibOptions;
    brotliOptions: BrotliOptions;
}>;
/** dts2md break */
/**
 * Class of query context objects
 * (usually created internally)
 */
export class QueryContext<T extends {} = any> {
    /** dts2md break */
    /**
     * Default compression options
     */
    static compressionDefaults: CompressionOptions = {
        compression: ['br', 'gzip', 'deflate'],
    };
    /** dts2md break */
    /**
     * @param request Native(nodejs provided) request object
     * @param response Native(nodejs provided) response object
     */
    constructor(
        readonly request: IncomingMessage,
        readonly response: ServerResponse,
        public store: Partial<T> = {}
    ) {
        const { url } = request as { url: string; },
            queryIndex = url.indexOf('?');
        if (~queryIndex) {
            this.path = url.slice(0, queryIndex);
            this.queryString = url.slice(queryIndex + 1);
            this.queries = new Map(Object.entries(parse(this.queryString)));
        } else {
            this.path = url;
            this.queryString = '';
            this.queries = new Map();
        }
    }
    /** dts2md break */
    /**
     * The requested path (without query string)
     */
    readonly path: string;
    /** dts2md break */
    /**
     * The query string (without leading character `?`)
     */
    readonly queryString: string;
    /** dts2md break */
    /**
     * Parsed queries
     */
    readonly queries: ReadonlyMap<string, string | string[]>;
    /** dts2md break */
    /**
     * Whether the query has been resolved
     * (automatically set to `true` when using built-in responding methods)
     */
    resolved = false;
    /** dts2md break */
    private _assertWritable() {
        if (this.resolved) {
            throw new Error('the query has been resolved');
        }
        if (this.response.writableEnded) {
            throw new Error('the response has ended');
        }
    }
    /** dts2md break */
    /**
     * Redirect the query to the given location
     * (default code: 302)
     */
    redirect(location: string, code = 302) {
        this._assertWritable();
        this.response.writeHead(code, { Location: location }).end();
        this.resolved = true;
    }
    /** dts2md break */
    /**
     * End the query with the given HTTP code
     * (with content optionally)
     */
    endWithCode(code: number, content?: string) {
        this._assertWritable();
        const { response } = this;
        response.statusCode = code;
        response.end(content);
        this.resolved = true;
    }
    /** dts2md break */
    /**
     * Create an output stream to pipe response content
     * (this will set `this.resolved` to true)
     */
    createOutput(options: CompressionOptions = {}) {
        this._assertWritable();
        options = Object.assign({}, QueryContext.compressionDefaults, options);
        const { request, response } = this,
            { compression } = options,
            _acceptEncoding = request.headers['accept-encoding'],
            acceptEncoding = typeof _acceptEncoding === 'string' ?
                _acceptEncoding.split(',').map(e => e.trim()) :
                _acceptEncoding,
            encoding = acceptEncoding && compression &&
                compression.find(e => acceptEncoding.includes(e));
        if (!encoding) {
            this.resolved = true;
            return response;
        } else {
            let compressionStream;
            switch (encoding) {
                case 'br':
                    response.setHeader('Content-Encoding', 'br');
                    compressionStream = createBrotliCompress(options.brotliOptions);
                    break;
                case 'gzip':
                    response.setHeader('Content-Encoding', 'gzip');
                    compressionStream = createGzip(options.zlibOptions);
                    break;
                case 'deflate':
                    response.setHeader('Content-Encoding', 'deflate');
                    compressionStream = createDeflate(options.zlibOptions);
                    break;
                default:
                    throw new Error('unsupported compression encoding');
            }
            compressionStream.pipe(response);
            this.resolved = true;
            return compressionStream;
        }
    }
    /** dts2md break */
    /**
     * End the query with the given content
     * (with optional compression options)
     */
    endWithContent(content: string, options: CompressionOptions = {}) {
        this.createOutput(options).end(content);
    }
    /** dts2md break */
    /**
     * End the query with the file at the given path
     * (with optional compression options; MIME type
     * is automatically detected by the file extension
     * using the `mimeType` map)
     */
    endWithFile(path: string, options: CompressionOptions = {}) {
        const ext = extname(path);
        if (mimeTypes.has(ext)) {
            this.response.setHeader('Content-Type', mimeTypes.get(ext)!);
        }
        createReadStream(path).pipe(this.createOutput(options));
    }

}
