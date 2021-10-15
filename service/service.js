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

// Require websocket library 
var WebSocket = require("ws");

// P2P Messaging service port
const PORT = process.env.PORT || 7777;

// Creating a websocket server at port PORT 
var service = new WebSocket.Server({ port: PORT }); 
console.log("Service is ready on port: " + PORT);

// All client connected to the service
var clients = {};

// Handler for client connection
service.on("connection", function(connection) {
   // Handler for receiving client message
   connection.on("message", function(message) {
      // Try to parse the JSON command 
      var command; 
      try {
         command = JSON.parse(message); 
      } catch (e) { 
         console.log("Service received a malformed command.")
         sendToClient(connection, { 
            type: "error", 
            message: "Malformed command: " + message
         });
         return;
      }

      switch (command.type) { 
            // Handle login message
         case "login": 
            if(clients[command.login]) { 
               // The chosen login already exists then client is refused
               console.log("Login refused: " + command.login);
               sendToClient(connection, { 
                  type: "login", 
                  success: false,
               }); 
               return;
            }
            // Register new login client
            console.log("New login: " + command.login);
            clients[command.login] = connection; 
            connection.login = command.login; 

            sendToClient(connection, { 
               type: "login", 
               success: true,
            }); 
            break;

            // Handle logout message
         case "logout":
            // Delete the client information
            console.log("Client logout: " + connection.login);
            delete clients[connection.login]; 
            break;

            // Handle unknown type message
         default: 
            sendToClient(connection, { 
               type: "error", 
               message: "Unknown command: " + command.type 
            }); 
            break;
      }  
   });

   // When a client closes the application
   connection.on("close", function() { 
      if(connection.login) {
         // Delete the client information
         console.log("Client left: " + connection.login);
         delete clients[connection.login]; 
      } 
   });
});

// Use to send object as JSON string to client
function sendToClient(connection, message) { 
   connection.send(JSON.stringify(message)); 
}
