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
 ******************************************************************************/

/*******************************************************************************
                              GLOBAL VARIABLES
 ******************************************************************************/

// Web socket connection to service
var socket = new WebSocket("ws://localhost:7777");

// Client login
var clientLogin;

/*******************************************************************************
                           UI GLOBAL VARIABLES
 ******************************************************************************/

var loginView = document.getElementById("loginView");
var loginInput = document.getElementById("loginInput");
var logoutLabel = document.getElementById("logoutLabel");

/*******************************************************************************
                           SERVICE COMMUNICATION
 ******************************************************************************/

// Handler for message received from the service
socket.onmessage = function (message) {
   // Try to parse JSON command
   var command = JSON.parse(message.data);

   // Call the correct handler depending on command type
   switch(command.type) {
      case "login":
         onLoginReceived(command);
         break;

      case "error":
         onErrorReceived(command);
         break;

      default: // Nothing is done is command type is unknown
         break;
   }
};

// Handle login message
function onLoginReceived(command) {
   if (command.success === false) {
      alert("Sorry this login is already used...");
      return;
   }
   switchToMessageView(clientLogin);
}

// Handle error message
function onErrorReceived(command) {
   console.err("Service replies with error: " + command.message);
}

// Send a message to the service
function sendToService(message) {
   socket.send(JSON.stringify(message)); 
}

/*******************************************************************************
                             UI VIEW MODIFIERS
 ******************************************************************************/

// Set login view mode when loading the page
switchToLoginView();

// Switch to login view mode
function switchToLoginView() {
   loginView.style.display = "block";
   messageView.style.display = "none";
   loginInput.value = "";
   logoutLabel.textContent = "";
}

// Switch to message view mode
function switchToMessageView(login) {
   loginView.style.display = "none";
   messageView.style.display = "block";
   logoutLabel.textContent = "Welcome " + login + "!";
}

/*******************************************************************************
                               UI CALLBACKS
 ******************************************************************************/

// Handler for login click
function onLoginClick() {
   clientLogin = loginInput.value;
   sendToService({
      type: "login",
      login: clientLogin
   });
}

// Handler for logout click
function onLogoutClick() {
   clientLogin = "";
   sendToService({
      type: "logout"
   });
   switchToLoginView();
}
