const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketio = require('socket.io');
const request = require('request');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const verification_token = '22563988SHIP';

app.get('/webhook', (req, res) => {
  // Verify webhook
  if (req.query['hub.verify_token'] === 'verification_token') {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Error, wrong validation token');
  }
});

app.post('/webhook', (req, res) => {
  const data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach((entry) => {
      // Iterate over each messaging event
      entry.messaging.forEach((event) => {
        if (event.message) {
          // Handle message event
          handleMessageEvent(event);
        } else if (event.postback) {
          // Handle postback event
          handlePostbackEvent(event);
        }
      });
    });

    // Return a '200 OK' response to all events
    res.sendStatus(200);
  }
});

function handleMessageEvent(event) {
  // Extract sender PSID and message text
  const senderPsid = event.sender.id;
  const message = event.message.text;

  // Send the message to the client through socket.io
  io.emit('message', { senderPsid, message });

  // Respond to the message
  respondToMessage(senderPsid, message);
}

function handlePostbackEvent(event) {
  // Extract sender PSID and payload
  const senderPsid = event.sender.id;
  const payload = event.postback.payload;

  // Send the postback to the client through socket.io
  io.emit('postback', { senderPsid, payload });

  // Respond to the postback
  respondToPostback(senderPsid, payload);
}

function respondToMessage(senderPsid, message) {
  // Check if the message contains the word "help"
  if (message.toLowerCase().includes('help')) {
    // Send a message with instructions
    sendTextMessage(senderPsid, 'I can help you with the following:\n- Send me a "hi" to say hello\n- Send me a "bye" to say goodbye\n- Send me a "help" to see this message again');
  } else if (message.toLowerCase() === 'hi') {
    // Send a greeting
    sendTextMessage(senderPsid, 'Hello!');
  } else if (message.toLowerCase() === 'bye') {
    // Send a farewell
    sendTextMessage(senderPsid, 'Goodbye!');
  } else {
    // Send a default message
    sendTextMessage(senderPsid, 'I am not sure what you mean. Try sending "help" for instructions.');
  }
}

function respondToPostback(senderPsid, payload) {
  // Check the payload and respond accordingly
  if (payload === 'get_started') {
    sendTextMessage(senderPsid, 'Welcome! How can I help you today?');
  } else if (payload === 'menu') {
    sendTextMessage(senderPsid, 'Here is a list of options you can choose from:\n1. Option 1\n2. Option 2\n3. Option 3');
  } else {
    sendTextMessage(senderPsid, 'I am not sure what you mean. Try sending "help" for instructions.');
  }
}

function sendTextMessage(senderPsid, message) {
  // Construct the message body
  const requestBody = {
    recipient: {
      id: senderPsid
    },
    message: {
      text: message
    }
  };

  // Send the HTTP request to the Messenger Platform
  request({
    uri: 'https://graph.facebook.com/v8.0/me/messages',
    qs: { access_token: 'EAAddFCV3A4sBAL5DJFXjCwV1Hp4fZA1SIJyKtEneVxKNqf3pWnom3oiZBwxwGtcP9aIBdSNowMETL7bXzSWiY3zO7bf4iSadiRFZAPgJVRnKd0Ds5lfSXnYPkDoi87HwwuHURaTao0bHUAl82lFqgZCN3WEMZB8ERjKDpD7nmWU0Bj0FkMD3K6PfZAvdesctMZD' },
    method: 'POST',
    json: requestBody
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!');
    } else {
      console.error('Unable to send message:' + err);
    }
  });
}

// Start the server
server.listen(3000, () => {
  console.log('Server started on port 3000');
});
