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

// WebRTC socket connection to peer
var peer;

// Client login
var clientLogin;

/*******************************************************************************
                           UI GLOBAL VARIABLES
 ******************************************************************************/

var loginView = document.getElementById("loginView");
var loginInput = document.getElementById("loginInput");
var logoutLabel = document.getElementById("logoutLabel");
var messageView = document.getElementById("messageView");
var messageInput = document.getElementById("messageInput");
var discussionInput = document.getElementById("discussionInput");

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
   setupLocalPeerToPeer();
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
                         PEER-TO-PEER COMMUNICATION
 ******************************************************************************/

// Setup a local peer-to-peer connection
function setupLocalPeerToPeer() {
   var peer1 = new RTCPeerConnection(null);
   peer1.onicecandidate = function(event) {
      peer2.addIceCandidate(event.candidate);
   };

   peer = peer1.createDataChannel("messaging-channel");

   var peer2 = new RTCPeerConnection(null);
   peer2.onicecandidate = function (event) {
      peer1.addIceCandidate(event.candidate);
   };
   peer2.ondatachannel = function (event) {
      event.channel.onmessage = function (event) {
         discussionInput.value = event.data;
      };
   };

   peer1.createOffer().then((offer) => {
      peer1.setLocalDescription(offer);
      peer2.setRemoteDescription(offer);
      peer2.createAnswer().then((answer) => {
         peer2.setLocalDescription(answer);
         peer1.setRemoteDescription(answer);
      });
   });
}

// Send a message to the peer
function sendToPeer(message) {
   peer.send(message);
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
   messageInput.value = "";
   discussionInput.value = "";
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

// Handler for send click
function onSendClick() {
   sendToPeer(messageInput.value);
}
