import io from 'socket.io-client';
import _ from 'lodash';
import { EventEmitter } from 'events';

export class MikudosSocketIoClient {
    socket: any;
    rpcEventName: string;
    jwt?: string;
    responseEventEmitter: EventEmitter = new EventEmitter();
    rpcResEventEmitter: EventEmitter = new EventEmitter();
    constructor(
        { uri, option = {} }: any,
        { rpcEventName } = { rpcEventName: 'rpc-call' },
        public saveTokenCallback = (token: string) => {},
        public getTokenMethod = () => this.jwt
    ) {
        if (!uri)
            throw new Error(
                'URI can not be null for new MikudosSocketIoClient at params[0].uri'
            );
        this.jwt = this.getTokenMethod();
        this.rpcEventName = rpcEventName;
        this.socket = io(uri, option);
        this.init();
    }

    init() {
        this.socket.on('connect', () => {
            console.log("TCL: MikudosSocketIoClient -> init -> 'connected'");
            this.reauthentication();
        });
        this.socket.on('disconnect', function() {
            console.log('TCL: disconnect');
        });
        this.socket.on('authentication', (data: any) => {
            this.responseEventEmitter.emit('authentication', data);
            this.jwt = _.get(data, 'accessToken');
            if (!this.jwt) return;
            this.saveTokenCallback.call(this, this.jwt);
        });
        this.socket.on(this.rpcEventName, (data: any) => {
            const method = String(data.method);
            this.rpcResEventEmitter.emit(method, _.omit(data, 'method'));
        });
    }

    async authentication(data: object) {
        this.socket.emit('authentication', data);
        return await this.getResponse('authentication');
    }

    async rpcCall(data: any) {
        this.socket.emit(this.rpcEventName, data);
        return await this.getRpcCallResponse(data.method);
    }

    async getResponse(name: string) {
        return await new Promise((resolve, reject) => {
            this.responseEventEmitter.once(name, data => {
                if (data.error) reject(data);
                resolve(data);
            });
        });
    }

    async getRpcCallResponse(name: string) {
        return await new Promise((resolve, reject) => {
            this.rpcResEventEmitter.once(name, data => {
                if (data.error) reject(data);
                resolve(data);
            });
        });
    }

    async reauthentication() {
        if (!this.jwt) return;
        // auto reauthentication
        this.socket.emit('authentication', {
            strategy: 'jwt',
            accessToken: this.jwt
        });
        return await this.getResponse('authentication');
    }
}
