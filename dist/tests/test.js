"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const express = require("express");
const request = require("request");
const TEST_PORT = 23001;
function makeRequest(path, { expectedCode = 200 } = {}) {
    return new Promise((resolve, reject) => {
        request(path, (err, response, body) => {
            if (err) {
                reject(err);
                return;
            }
            if (response.statusCode != expectedCode) {
                err = new Error(`Wrong status code: ${response.statusCode}`);
                err.statusCode = response.statusCode;
                reject(err);
                return;
            }
            resolve(body);
        });
    });
}
describe('test1', function () {
    this.timeout(10000);
    let signature, app, server;
    it('should create signature', () => {
        signature = __1.default({
            secret: 'Xd<dMf72sj;6'
        });
    });
    it('should start server', () => __awaiter(this, void 0, void 0, function* () {
        app = express();
        app.get('/try', signature.verifier(), function (res, req) {
            req.send('ok');
        });
        const v1 = express.Router();
        v1.get('/try', signature.verifier(), (_, req) => req.send('ok'));
        app.use('/v1', v1);
        yield new Promise((resolve, reject) => {
            server = app.listen(TEST_PORT, err => {
                err ? reject(err) : resolve();
            });
        });
    }));
    it('should be 200', () => __awaiter(this, void 0, void 0, function* () {
        yield makeRequest(signature.sign(`http://localhost:${TEST_PORT}/try`));
    }));
    it('should be 200 (with baseUrl)', () => __awaiter(this, void 0, void 0, function* () {
        yield makeRequest(signature.sign(`http://localhost:${TEST_PORT}/v1/try`));
    }));
    it('should be 200 (address check)', () => __awaiter(this, void 0, void 0, function* () {
        yield makeRequest(signature.sign(`http://localhost:${TEST_PORT}/try`, {
            addr: '::ffff:127.0.0.1'
        }));
    }));
    it('should be 200 (method check)', () => __awaiter(this, void 0, void 0, function* () {
        yield makeRequest(signature.sign(`http://localhost:${TEST_PORT}/try`, {
            method: 'get,post'
        }));
    }));
    it('should be 200 (ttl check)', () => __awaiter(this, void 0, void 0, function* () {
        yield makeRequest(signature.sign(`http://localhost:${TEST_PORT}/try`, {
            ttl: 5
        }));
    }));
    it('should be 200 (expiration check)', () => __awaiter(this, void 0, void 0, function* () {
        yield makeRequest(signature.sign(`http://localhost:${TEST_PORT}/try`, {
            exp: Date.now() + 5000
        }));
    }));
    it('should be 403 (bad token)', () => __awaiter(this, void 0, void 0, function* () {
        yield makeRequest(signature.sign(`http://localhost:${TEST_PORT}/try`) + '1', { expectedCode: 403 });
    }));
    it('should be 403 (address check)', () => __awaiter(this, void 0, void 0, function* () {
        yield makeRequest(signature.sign(`http://localhost:${TEST_PORT}/try`, {
            addr: '127.0.0.2'
        }), {
            expectedCode: 403
        });
    }));
    it('should be 403 (method check)', () => __awaiter(this, void 0, void 0, function* () {
        yield makeRequest(signature.sign(`http://localhost:${TEST_PORT}/try`, {
            method: 'post,delete'
        }), {
            expectedCode: 403
        });
    }));
    it('should be 410 (ttl check)', () => __awaiter(this, void 0, void 0, function* () {
        const link = signature.sign(`http://localhost:${TEST_PORT}/try`, {
            ttl: 1
        });
        yield new Promise(resolve => setTimeout(resolve, 2000));
        yield makeRequest(link, { expectedCode: 410 });
    }));
    it('should be 410 (expiration check)', () => __awaiter(this, void 0, void 0, function* () {
        const link = signature.sign(`http://localhost:${TEST_PORT}/try`, {
            exp: Math.floor(Date.now() / 1000)
        });
        yield new Promise(resolve => setTimeout(resolve, 2000));
        yield makeRequest(link, { expectedCode: 410 });
    }));
    it('should stop server', () => __awaiter(this, void 0, void 0, function* () {
        yield new Promise(resolve => {
            server.close(() => {
                resolve();
            });
        });
    }));
});
//# sourceMappingURL=test.js.map