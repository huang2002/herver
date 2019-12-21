import { IncomingMessage, ServerResponse } from "http";
import { parse } from "querystring";
import { createReadStream } from "fs";
import { createBrotliCompress, ZlibOptions, BrotliOptions, createGzip, createDeflate } from "zlib";
import { extname } from "path";
import { mimeTypes } from "./mimeTypes";

export type CompressionOptions = Partial<{
    compression: string[] | null;
    zlibOptions: ZlibOptions;
    brotliOptions: BrotliOptions;
}>;

export class QueryContext<T extends {} = any> {

    static compressionDefaults: CompressionOptions = {
        compression: ['br', 'gzip', 'deflate'],
    };

    constructor(
        readonly request: IncomingMessage,
        readonly response: ServerResponse,
        public store: Partial<T> = {}
    ) {
        const { url } = request as { url: string },
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

    readonly path: string;
    readonly queryString: string;
    readonly queries: ReadonlyMap<string, string | string[]>;
    private _ended = false;

    private _assertWritable() {
        if (this.response.writableEnded) {
            throw new Error('the response has ended');
        }
    }

    get ended() {
        return this.response.writableEnded || this._ended;
    }

    redirect(location: string, code = 302) {
        this._assertWritable();
        this.response.writeHead(code, { Location: location }).end();
        this._ended = true;
    }

    endWithCode(code: number, content?: string) {
        this._assertWritable();
        const { response } = this;
        response.statusCode = code;
        response.end(content);
        this._ended = true;
    }

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
            this._ended = true;
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
            this._ended = true;
            return compressionStream;
        }
    }

    endWithContent(content: string, options: CompressionOptions = {}) {
        this.createOutput(options).end(content);
    }

    endWithFile(path: string, options: CompressionOptions = {}) {
        const ext = extname(path);
        if (mimeTypes.has(ext)) {
            this.response.setHeader('Content-Type', mimeTypes.get(ext)!);
        }
        createReadStream(path).pipe(this.createOutput(options));
    }

}
