/*******************************************************************************
MIT License

Copyright (c) 2021 Ludovic Le Frioux

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*******************************************************************************/

/*******************************************************************************
                              GLOBAL VARIABLES
 ******************************************************************************/

// Require websocket library
var WebSocket = require("ws");

// P2P Messaging service port
const PORT = process.env.PORT || 7777;

// Creating a websocket server at port PORT
var service = new WebSocket.Server({ port: PORT });
console.log(`service ready on port: ${PORT}`);

// All client connected to the service
var clients = {};

// Message header types
const Message = {
   ANSWER: "answer",
   ERROR: "error",
   ICE_CANDITATE: "ice-candidate",
   LOGIN: "login",
   LOGOUT: "logout",
   OFFER: "offer"
}

/*******************************************************************************
                           MESSAGING SERVICE
 ******************************************************************************/

// Handler for client connection
service.on("connection", function(connection) {
   // Handler for receiving client message
   connection.on("message", function(message) {
      // Try to parse the JSON command
      var command;
      try {
         command = JSON.parse(message);
      } catch (e) {
         console.log(`malformed: ${message}`);
         sendToClient(connection, {
            type: Message.ERROR,
            message: "Malformed command: " + message
         });
         return;
      }

      switch (command.type) {
         case Message.LOGIN:
            onLoginReceived(connection, command);
            break;

         // Handle peer-to-peer setup by transfering
         case Message.ANSWER:
         case Message.ICE_CANDITATE:
         case Message.OFFER:
            onTransferReceived(command);
            break;

         case Message.LOGOUT:
            onLogoutReceived(command);
            break;

         default:
            onUnknownReceived(command);
            break;
      }
   });

   // When a client closes the application
   connection.on("close", function() {
      onConnectionClose(connection);
   });
});

// Hanlde login message
function onLoginReceived(connection, command) {
   // The chosen login already exists then client is refused
   if(clients[command.login]) {
      console.log(`refused login: ${command.login}`);
      sendToClient(connection, {
         type: Message.LOGIN,
         success: false,
      });
      return;
   }
   // Register new login client
   console.log(`login: ${command.login}`);
   clients[command.login] = connection;
   connection.login = command.login;
   sendToClient(connection, {
      type: Message.LOGIN,
      success: true,
   });
}

// Handle offer, answer and ice-candidate message
function onTransferReceived(command) {
   console.log(`${command.type}: from ${command.from} to ${command.to}`);
   var otherConnection = clients[command.to];
   if (otherConnection) {
      sendToClient(otherConnection, command);
   }
}

// Handle logout message
function onLogoutReceived(command) {
   console.log(`logout: ${command.login}`);
   // Delete the client information
   delete clients[command.login];
}

// Handle unknown message
function onUnknownReceived(command) {
   console.log(`unknown: ${command.type}`);
   sendToClient(connection, {
      type: Message.ERROR,
      message: "Unknown command: " + command.type
   });
}

// Handle client connection closed
function onConnectionClose(connection) {
   if(connection.login) { // Delete the client information it exists
      console.log(`connection closed: ${connection.login}`);
      // Delete the client information
      delete clients[connection.login];
   }
}

// Use to send object as JSON string to client
function sendToClient(connection, message) {
   connection.send(JSON.stringify(message));
}
