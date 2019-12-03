![Mikudos Client](https://img.shields.io/badge/MIKUDOS-Client-blue?style=for-the-badge&logo=appveyor)

# [![Mikudos](https://raw.githubusercontent.com/mikudos/doc/master/mikudos-logo.png)](https://mikudos.github.io/doc)

# MIKUDOS SOCKETIO CLIENT

mikudos-socketio-client for connection and call methods and sync events on mikudos-socketio-app server, which is provided only for socket.io connection.

![node version](https://img.shields.io/node/v/mikudos-socketio-client) ![version](https://img.shields.io/github/package-json/v/mikudos/mikudos-socketio-client) [![npm version](https://img.shields.io/npm/v/mikudos-socketio-client)](https://www.npmjs.com/package/mikudos-socketio-client) ![license](https://img.shields.io/npm/l/mikudos-socketio-client) ![downloads](https://img.shields.io/npm/dw/mikudos-socketio-client) ![collaborators](https://img.shields.io/npm/collaborators/mikudos-socketio-client) ![typescript](https://img.shields.io/npm/types/mikudos-socketio-client)

## Usage

Import the mikudos-socketio-client module:

```ts
import { MikudosSocketIoClient } from 'mikudos-socketio-client';
```

```js
var { MikudosSocketIoClient } = require('mikudos-socketio-client');
```

### MikudosSocketIoClient

General client for MikudosSocketIoClient:

```js & ts
const client = new MikudosSocketIoClient(
    {
        // same uri and option string will pass to socket.io generator as io(uri, option);
        uri: 'ws://localhost:3030',
        option: {}
    },
    {
        rpcEventName: 'rpc-call' // the path for remote rpc-call
    },
    token => {
        saveToken(token);
    },
    () => window.localstorage.jwt
);
```

### Authentication

Authentication the client connection.

```js
client
    .authentication({
        strategy: 'local',
        email: 'email',
        password: 'password'
    })
    .then(res => {
        console.log('TCL: res', res);
    })
    .catch(err => {
        console.log('TCL: err', err);
    });

client
    .authentication({
        strategy: 'jwt',
        accessToken: 'your_token' || 'Bearer your_token'
    })
    .then(res => {
        console.log('TCL: res', res);
    })
    .catch(err => {
        console.log('TCL: err', err);
    });
```

### Call JSON-rpc server method

```js
client
    .rpcCall({
        method: 'rpc_1.add',
        params: [1, 6],
        id: 4
    })
    .then(res => {
        console.log('TCL: res', res);
    })
    .catch(err => {
        console.log('TCL: err', err);
    });
```

# License

[MIT](LICENSE)
