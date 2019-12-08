import io from 'socket.io-client';
import _ from 'lodash';
import { EventEmitter } from 'events';

export class MikudosSocketIoClient {
    socket: any;
    state: boolean = false;
    authenticated: boolean = false;
    rpcEventName: string;
    chatEventName: string;
    duplexEventName: string;
    jwt?: string;
    responseEventEmitter: EventEmitter = new EventEmitter();
    rpcResEventEmitter: EventEmitter = new EventEmitter();
    chatEventEmitter: EventEmitter = new EventEmitter();
    duplexEventEmitter: EventEmitter = new EventEmitter();
    constructor(
        { uri, option = {} }: any,
        {
            rootNamespace = '',
            rpcEventName = 'rpc-call',
            chatEventName = 'message',
            duplexEventName = 'stream-call'
        } = {},
        public saveTokenCallback = (token: string) => {},
        public getTokenMethod = () => this.jwt
    ) {
        if (!uri)
            throw new Error(
                'URI can not be null for new MikudosSocketIoClient at params[0].uri'
            );
        if (rootNamespace && !rootNamespace.startsWith('/'))
            throw new Error('namespace not valid, is must start with /');
        this.jwt = this.getTokenMethod();
        this.rpcEventName = rpcEventName;
        this.chatEventName = chatEventName;
        this.duplexEventName = duplexEventName;
        this.socket = io(`${uri}${rootNamespace}`, option);
        this.init();
    }

    init() {
        this.socket.on('connect', () => {
            this.state = true;
            this.reauthentication();
        });
        this.socket.on('disconnect', () => {
            console.log('TCL: disconnect');
            this.state = false;
            this.authenticated = false;
        });
        this.socket.on('authentication', (data: any) => {
            this.responseEventEmitter.emit('authentication', data);
            this.jwt = _.get(data, 'accessToken');
            if (!this.jwt) return;
            this.authenticated = true;
            this.saveTokenCallback.call(this, this.jwt);
        });
        this.socket.on(this.rpcEventName, (data: any) => {
            const method = String(data.method);
            this.rpcResEventEmitter.emit(method, _.omit(data, 'method'));
        });

        // handle chat events
        this.socket.on(this.chatEventName, (data: any) => {
            this.chatEventEmitter.emit('chat', data);
        });
        this.socket.on(`join ${this.chatEventName}`, (data: any) => {
            this.chatEventEmitter.emit('join', data);
        });
        this.socket.on(`leave ${this.chatEventName}`, (data: any) => {
            this.chatEventEmitter.emit('leave', data);
        });
    }

    checkConnection() {
        if (!this.state) throw new Error('connection not stable');
    }

    async authentication(data: object) {
        this.checkConnection();
        return await new Promise((resolve, reject) => {
            this.socket.emit('authentication', data, (data: any) => {
                if (data.error) reject(data);
                resolve(data);
            });
        });
    }

    async rpcCall(data: any) {
        this.checkConnection();
        return await new Promise((resolve, reject) => {
            this.socket.emit(this.rpcEventName, data, (data: any) => {
                if (data.error) reject(data);
                resolve(data);
            });
        });
    }

    async reauthentication() {
        if (!this.jwt) return;
        // auto reauthentication
        return await new Promise((resolve, reject) => {
            this.socket.emit(
                'authentication',
                {
                    strategy: 'jwt',
                    accessToken: this.jwt
                },
                (data: any) => {
                    if (data.error) reject(data);
                    resolve(data);
                }
            );
        });
    }

    async sendChat(data: any = { message: 'test message', room: 'test' }) {
        return await new Promise((resolve, reject) => {
            this.socket.emit(this.chatEventName, data, (data: any) => {
                if (data.error) reject(data);
                resolve(data);
            });
        });
    }

    async joinChat(data: any = { room: 'test' }) {
        return await new Promise((resolve, reject) => {
            this.socket.emit(
                `join ${this.chatEventName}`,
                data,
                (data: any) => {
                    if (data.error) reject(data);
                    resolve(data);
                }
            );
        });
    }

    async leaveChat(data: any = { room: 'test' }) {
        return await new Promise((resolve, reject) => {
            this.socket.emit(
                `leave ${this.chatEventName}`,
                data,
                (data: any) => {
                    if (data.error) reject(data);
                    resolve(data);
                }
            );
        });
    }

    async duplexCall(method: string, data: any, room: string = '') {
        return await new Promise((resolve, reject) => {
            this.socket.emit(
                this.duplexEventName,
                {
                    method,
                    room,
                    data
                },
                (data: any) => {
                    if (data.error) reject(data);
                    // handle duplex events
                    this.socket.on(
                        `${this.duplexEventName} ${method}`,
                        (md: any) => this.duplexEventEmitter.emit(method, md)
                    );
                    resolve(data);
                }
            );
        });
    }

    async duplexSend(method: string, data: any) {
        return await new Promise((resolve, reject) => {
            this.socket.emit(
                `${this.duplexEventName} send`,
                { method, data },
                (data: any) => {
                    if (data.error) reject(data);
                    resolve(data);
                }
            );
        });
    }

    async duplexCancelCall(method: string, data: any = null) {
        return await new Promise((resolve, reject) => {
            this.socket.emit(
                `${this.duplexEventName} cancel`,
                { method, data },
                (data: any) => {
                    if (data.error) reject(data);
                    resolve(data);
                }
            );
        });
    }
}
