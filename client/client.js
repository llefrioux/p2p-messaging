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

// WebRTC connection to peer
var peerConnection;

// WebRTC data channel to peer
var peer;

// Client login
var clientLogin;

// Receiver login
var receiverLogin;

/*******************************************************************************
                           UI GLOBAL VARIABLES
 ******************************************************************************/

var loginView = document.getElementById("loginView");
var loginInput = document.getElementById("loginInput");
var logoutLabel = document.getElementById("logoutLabel");
var messageView = document.getElementById("messageView");
var receiverInput = document.getElementById("receiverInput");
var discussionInput = document.getElementById("discussionInput");
var messageInput = document.getElementById("messageInput");

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

      case "ice-candidate":
         onIceCandidateReceived(command);
         break;

      case "offer":
         onOfferReceived(command);
         break;

      case "answer":
         onAnswerReceived(command);
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
      alert(`Sorry this login is already used: ${clientLogin}`);
      return;
   }
   switchToMessageView(clientLogin);
}

// Handle ice-candidate message
function onIceCandidateReceived(command) {
   peerConnection.addIceCandidate(command.iceCandidate);
}

// Handle offer message
function onOfferReceived(command) {
   peerConnection.setRemoteDescription(command.offer);
   peerConnection.createAnswer().then((answer) => {
      peerConnection.setLocalDescription(answer);
      receiverLogin = command.from;
      sendToService({
         type: "answer",
         answer: answer,
         from: clientLogin,
         to: receiverLogin
      });
   }).catch((error) => {
      console.error(`Fail to create answer: ${error}`);
   });
}

// Handle answer message
function onAnswerReceived(command) {
   peerConnection.setRemoteDescription(command.answer)
      .catch((error) => {
         console.error(`Fail to handle answer: ${error}`);
      });
}

// Handle error message
function onErrorReceived(command) {
   console.error(`Service replies with error: ${command.message}`);
}

// Send a message to the service
function sendToService(message) {
   socket.send(JSON.stringify(message)); 
}

/*******************************************************************************
                         PEER-TO-PEER COMMUNICATION
 ******************************************************************************/

// Setup a local peer-to-peer connection
function setupPeerToPeer() {
   var iceServer = {
      urls: "stun:stun.l.google.com:19302"
   };
   peerConnection = new RTCPeerConnection(iceServer);
   peerConnection.onicecandidate = function (event) {
      sendToService({
         type: "ice-candidate",
         iceCandidate: event.candidate,
         from: clientLogin,
         to: receiverLogin
      });
   };
   peerConnection.ondatachannel = function (event) {
      event.channel.onmessage = function (event) {
         discussionInput.value += `${receiverLogin}: ${event.data}\n`;
      };
   };

   peer = peerConnection.createDataChannel("messaging-channel");
}

// Send a message to the peer
function sendToPeer(message) {
   if (peer.readyState === "open") {
      peer.send(message);
      return true;
   }
   return false;
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
   receiverInput.value = "";
   discussionInput.value = "";
   messageInput.value = "";
}

// Switch to message view mode
function switchToMessageView(login) {
   loginView.style.display = "none";
   messageView.style.display = "block";
   logoutLabel.textContent = `Welcome ${login}!`;
}

/*******************************************************************************
                           UI REGISTER CALLBACKS
 ******************************************************************************/

// Bind buttons to there handlers
loginButton.addEventListener("click", onLoginClick);
logoutButton.addEventListener("click", onLogoutClick);
connectToButton.addEventListener("click", onConnectToClick);
sendButton.addEventListener("click", onSendClick);

// Bind some Enter press (key code: 13) on input to associated button click
loginInput.addEventListener("keypress", function (event) {
   if (event.keyCode === 13) {
      event.preventDefault();
      loginButton.click();
   }
});
receiverInput.addEventListener("keypress", function (event) {
   if (event.keyCode === 13) {
      event.preventDefault();
      connectToButton.click();
   }
});
messageInput.addEventListener("keypress", function (event) {
   if (event.keyCode === 13) {
      event.preventDefault();
      sendButton.click();
   }
});

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
   setupPeerToPeer();
}

// Handler for logout click
function onLogoutClick() {
   sendToService({
      type: "logout",
      login: clientLogin
   });
   clientLogin = "";
   switchToLoginView();
}

// Handler for connect to
function onConnectToClick() {
   receiverLogin = receiverInput.value;
   peerConnection.createOffer().then((offer) => {
      peerConnection.setLocalDescription(offer);
      sendToService({
         type: "offer",
         offer: offer,
         from: clientLogin,
         to: receiverLogin
      });
   }).catch((error) => {
      console.error(`Fail to create offer: ${error}`);
   });
}

// Handler for send click
function onSendClick() {
   if (sendToPeer(messageInput.value)) {
      discussionInput.value += `${clientLogin}: ${messageInput.value}\n`;
      messageInput.value = "";
   }
}
