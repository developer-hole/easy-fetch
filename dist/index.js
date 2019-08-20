"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const querystring_1 = require("querystring");
exports.version = require('../package.json').version;
class HTTPError extends Error {
    constructor(message, res) {
        super(message);
        this.body = res.body;
        this.raw = res.raw;
        this.ok = res.ok;
        this.statusCode = res.statusCode;
        this.statusText = res.statusText;
        this.headers = res.headers;
        this.name = this.constructor.name;
    }
}
exports.HTTPError = HTTPError;
class Request {
    static get(url, options) {
        return new Request('GET', url, options);
    }
    static post(url, options) {
        return new Request('POST', url, options);
    }
    static patch(url, options) {
        return new Request('PATCH', url, options);
    }
    static delete(url, options) {
        return new Request('DELETE', url, options);
    }
    constructor(method, url, options = {}) {
        this._options = Object.assign({
            method,
            url,
            headers: {},
            query: undefined,
            data: undefined
        });
        if (options.headers) {
            this.set(options.headers);
        }
        if (options.body) {
            this.send(options.body);
        }
        this._options.userAgent = options.userAgent || `easy-fetch ${exports.version} https://github.com/developer-hole/easy-fetch`;
    }
    query(name, value) {
        if (this._options.query === undefined) {
            this._options.query = {};
        }
        if (typeof name === 'object') {
            Object.assign(this._options.query, name);
        }
        else if (value) {
            this._options.query[name] = value;
        }
        return this;
    }
    set(name, value) {
        if (typeof name === 'object') {
            for (const [k, v] of Object.entries(name)) {
                this._options.headers[k.toLowerCase()] = v;
            }
        }
        else if (value) {
            this._options.headers[name.toLowerCase()] = value;
        }
        return this;
    }
    send(data) {
        if (data !== null && typeof data === 'object') {
            const header = this._options.headers['content-type'];
            let serialize;
            if (header) {
                if (header.includes('application/json')) {
                    serialize = JSON.stringify;
                }
                else if (header.includes('urlencoded')) {
                    serialize = querystring_1.stringify;
                }
                else {
                    return this._options.body = data;
                }
            }
            else {
                this.set('Content-Type', 'application/json');
                serialize = JSON.stringify;
            }
            this._options.body = serialize(data);
        }
        else {
            this._options.body = data;
        }
        return this;
    }
    then(resolver, rejector) {
        if (this._response) {
            this._response = this._response.then(resolver, rejector);
        }
        else {
            this._response = this.execute().then(resolver, rejector);
        }
        return this._response;
    }
    catch(rejector) {
        return this.then(undefined, rejector);
    }
    end() {
        this.then(undefined, undefined);
    }
    async execute() {
        if (this._options.query) {
            let index = 0;
            for (const key of Object.keys(this._options.query)) {
                this._options.url += `${!index ? '?' : '&'}${key}=${this._options.query[key]}`;
                index++;
            }
        }
        if (!this._options.headers['user-agent'])
            this.set('user-agent', this._options.userAgent);
        try {
            const res = await node_fetch_1.default(this._options.url, { body: this._options.body, method: this._options.method, headers: this._options.headers });
            const result = await this._createResult(res);
            if (result.ok) {
                return result;
            }
            else {
                throw new HTTPError(`${res.status} ${res.statusText}`, result);
            }
        }
        catch (error) {
            throw new HTTPError(`${error.status} ${error.statusText}`, await this._createResult(error));
        }
    }
    _createResult(response) {
        return new Promise((resolve) => {
            const headers = {};
            for (const [key, value] of response.headers.entries()) {
                if (key && value)
                    headers[key] = value;
            }
            let result = '';
            response.body.on('data', chunk => { result += chunk; });
            response.body.on('end', () => resolve({
                get body() {
                    const type = response.headers.get('content-type');
                    let parsed;
                    if (type) {
                        if (/application\/json/.test(type)) {
                            try {
                                parsed = JSON.parse(result);
                            }
                            catch (_) {
                                parsed = String(result);
                            }
                        }
                        else if (/application\/x-www-form-urlencoded/.test(type)) {
                            parsed = querystring_1.parse(result);
                        }
                    }
                    if (!parsed)
                        parsed = result;
                    return parsed;
                },
                raw: result,
                ok: response.ok,
                statusCode: response.status,
                statusText: response.statusText,
                headers
            }));
        });
    }
}
exports.Request = Request;
