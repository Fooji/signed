"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./types"));
const crypto_1 = require("crypto");
const querystring = require("querystring");
const Types = require("./types");
class Signature {
    constructor(options) {
        this.secret = Array.isArray(options.secret) ? options.secret : [options.secret];
        this.ttl = options.ttl;
    }
    ;
    sign(url, options = {}) {
        const data = {
            r: Math.floor(Math.random() * 10000000000).toString()
        };
        const exp = (options.ttl ? Math.ceil(+new Date() / 1000) + options.ttl : null) ||
            options.exp ||
            (this.ttl ? Math.ceil(+new Date() / 1000) + this.ttl : null);
        if (exp) {
            data.e = exp;
        }
        if (options.addr) {
            data.a = options.addr;
        }
        if (options.method) {
            data.m = (Array.isArray(options.method) ? options.method.join(',') : options.method).toUpperCase();
        }
        url += (url.indexOf('?') == -1 ? '?' : '&') + 'signed=' + querystring.stringify(data, ';', ':') + ';';
        const hash = crypto_1.createHash('md5');
        hash.update(url, 'utf8');
        hash.update(this.secret[0]);
        url += hash.digest('hex');
        return url;
    }
    verifyString(str, sign) {
        for (let i = 0; i < this.secret.length; i++) {
            const hash = crypto_1.createHash('md5');
            hash.update(str, 'utf8');
            hash.update(this.secret[i], 'utf8');
            if (hash.digest('hex') == sign)
                return true;
        }
        return false;
    }
    verifyUrl(req, addressReader) {
        const url = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.url}`;
        if (url.length < 33 || !this.verifyString(url.substring(0, url.length - 32), url.substr(-32))) {
            return Types.VerifyResult.blackholed;
        }
        // get signed data
        let lastAmpPos = url.lastIndexOf('&signed=');
        if (lastAmpPos == -1) {
            lastAmpPos = url.lastIndexOf('?signed=');
        }
        if (lastAmpPos == -1) {
            return Types.VerifyResult.blackholed;
        }
        const data = querystring.parse(url.substring(lastAmpPos + 8, url.length - 33), ';', ':');
        req.url = url.substr(0, lastAmpPos);
        // check additional conditions
        if (data.a && addressReader && data.a != addressReader(req)) {
            return Types.VerifyResult.blackholed;
        }
        if (data.m && data.m.indexOf(req.method) == -1) {
            return Types.VerifyResult.blackholed;
        }
        if (data.e && data.e < Math.ceil(+new Date() / 1000)) {
            return Types.VerifyResult.expired;
        }
        return Types.VerifyResult.ok;
    }
    verifier({ blackholed = (req, res, next) => {
            const err = new Error('Blackholed');
            err.status = 403;
            next(err);
        }, expired = (req, res, next) => {
            const err = new Error('Expired');
            err.status = 410;
            next(err);
        }, addressReader = req => req.connection.remoteAddress } = {}) {
        return (req, res, next) => {
            switch (this.verifyUrl(req, addressReader)) {
                case Types.VerifyResult.ok:
                    next();
                    break;
                case Types.VerifyResult.blackholed:
                    return blackholed(req, res, next);
                case Types.VerifyResult.expired:
                    return expired(req, res, next);
            }
        };
    }
    ;
}
function default_1(options) {
    return new Signature(options);
}
exports.default = default_1;
//# sourceMappingURL=index.js.map