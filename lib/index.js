"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const lodash_1 = __importDefault(require("lodash"));
const events_1 = require("events");
class MikudosSocketIoClient {
    constructor({ uri, option = {} }, { rpcEventName } = { rpcEventName: 'rpc-call' }, saveTokenCallback = (token) => { }, getTokenMethod = () => this.jwt) {
        this.saveTokenCallback = saveTokenCallback;
        this.getTokenMethod = getTokenMethod;
        this.responseEventEmitter = new events_1.EventEmitter();
        this.rpcResEventEmitter = new events_1.EventEmitter();
        if (!uri)
            throw new Error('URI can not be null for new MikudosSocketIoClient at params[0].uri');
        this.jwt = this.getTokenMethod();
        this.rpcEventName = rpcEventName;
        this.socket = socket_io_client_1.default(uri, option);
        this.init();
    }
    init() {
        this.socket.on('connect', () => {
            console.log("TCL: MikudosSocketIoClient -> init -> 'connected'");
            this.reauthentication();
        });
        this.socket.on('disconnect', function () {
            console.log('TCL: disconnect');
        });
        this.socket.on('authentication', (data) => {
            this.responseEventEmitter.emit('authentication', data);
            this.jwt = lodash_1.default.get(data, 'accessToken');
            if (!this.jwt)
                return;
            this.saveTokenCallback.call(this, this.jwt);
        });
        this.socket.on(this.rpcEventName, (data) => {
            const method = String(data.method);
            this.rpcResEventEmitter.emit(method, lodash_1.default.omit(data, 'method'));
        });
    }
    async authentication(data) {
        this.socket.emit('authentication', data);
        return await this.getResponse('authentication');
    }
    async rpcCall(data) {
        this.socket.emit(this.rpcEventName, data);
        return await this.getRpcCallResponse(data.method);
    }
    async getResponse(name) {
        return await new Promise((resolve, reject) => {
            this.responseEventEmitter.once(name, data => {
                if (data.error)
                    reject(data);
                resolve(data);
            });
        });
    }
    async getRpcCallResponse(name) {
        return await new Promise((resolve, reject) => {
            this.rpcResEventEmitter.once(name, data => {
                if (data.error)
                    reject(data);
                resolve(data);
            });
        });
    }
    async reauthentication() {
        if (!this.jwt)
            return;
        // auto reauthentication
        this.socket.emit('authentication', {
            strategy: 'jwt',
            accessToken: this.jwt
        });
        return await this.getResponse('authentication');
    }
}
exports.MikudosSocketIoClient = MikudosSocketIoClient;
