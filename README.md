# P2P Messaging

P2P Messaging is a peer-to-peer messaging application written in JavaScript.

There are two pieces of software: a web client, and a Node.js service.

## Client

The client is a web HTML page (index.html), with some JavaScript script
(client.js), and stylesheet (style.css).

One can launch the client by opening the index.html page in a browser.

Each client establishes a connection to the service using websocket.

While openning the application a client can sign in with a login.

While logged the client can logout and get back to previous sign in view.

Also a local peer-to-peer connection is established using webRTC. A client can
write a message and send it through this connection by using the send button.
When the message is received it is displayed in the second textarea.

## Service

The service is a Node.js web socket server written in JavaScript accepting
client connections.

A client can try to sign in by proposing a login. The service accepts only if
the login is not already used. A client can also logout. A map from login to
client connection is maintained accordingly.

### Get started

Node.js needs to be install on your machine.

The service depends only on the websocket npm package. However, you still need
to install dependencies of the service:
```bash
npm install
```

Then, you can run the service:
```bash
node service.js
```

Note: Service is configured to run by default on port 7777, but one can change
it by setting the environment variable `PORT`. If you do so, do not forget to
change port also in the client code.

### Received messages

Service accepts client connections and manages `login` and `logout` messages.

`login` messages are formed as follows:
```
{
   "type": "login",
   "login": string
}
```
`logout` messages are formed as follows:
```
{
   "type": "logout",
}
```

### Sent messages

Service responds to clients with `login` and `error` messages.

`login` messages are formed as follows:
```
{
   "type": "login",
   "success": boolean
}
```

`error` messages are formed as follows:
```
{
   "type": "error",
   "message": string
}
``` 
