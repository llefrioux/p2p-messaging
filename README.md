# P2P Messaging

<img style="float: right" src="client/p2p_messaging.png" width="60"/>

This project is a simple peer-to-peer (P2P) messaging application written in
JavaScript.

There are two pieces of software: a web client, and a Node.js service.

## Client

The client is a responsive web HTML page build using Bootstrap. It also uses
some JavaScript code to manage events and communication with the service and
other peers.

A user can launch the client by opening the index.html page in a browser.

Each client establishes a connection to the service using websocket.

While openning the application a user can join with a login.

When logged the user can sign out and get back to previous join in view.

A user can connect to another by typing the targeted user login and clicking on
connect to. This will established a P2P connection using WebRTC
between the two users. This connection is settled via the service.

The user can then write messages and send them directly to the other through
this connection by using the send button. When messages are received from the
other user they are displayed in chronological order in the discussion
textarea.

It is possible to leave the conversation by clicking on the disconnect from
button. From there the user can start again and again other conversations with
the same user or with others.

## Service

The service is a Node.js web socket server written in JavaScript accepting
client connections.

A client can try to sign in by proposing a login. The service accepts only if
the login is not already used. A client can also logout. A map from login to
client connection is maintained accordingly.

The service is also used as intermediate for establishing P2P connection
between clients.

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

Note: The service is configured to run by default on port 7777, but you can
change it by setting the environment variable `PORT`. If you do so, do not
forget to change port also in the client code.

### Join in and sign out

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
   "login": string
}
```

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

### Establishing P2P communication

Service is used as intermediate to established P2P connection between users.
It acts as a signaling service and transfers `offer`, `answer` and
`ice-candidate` messages from a user to another.

`offer` messages are formed as follows:
```
{
   "type": "offer",
   "offer": offer_object,
   "from": loginFrom,
   "to": loginTo
}
```

`answer` messages are formed as follows:
```
{
   "type": "answer",
   "answer": answer_object,
   "from": loginFrom,
   "to": loginTo
}
```

`ice-candidate` messages are formed as follows:
```
{
   "type": "ice-candidate",
   "ice-candidate": candidate_object,
   "from": loginFrom,
   "to": loginTo
}
```