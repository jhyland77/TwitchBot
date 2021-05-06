const tmi = require('tmi.js');
const fs = require('fs');

// Define configuration options
const opts = {
  identity: {
    username: "PoBotYEET",
    password: "oauth:36uls8kpmc41025yw90n1lyhebwe26"
  },
  channels: [
    "PoJah"
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = msg.trim();

  // Call basicCommand
  basicCommand(target, commandName)

}

// Basic Commands from commands_list.json
function basicCommand(target, commandName) {

  // Get commands from json list with commands
  fs.readFile('./commands_list.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.log(`* commands_list.json file read failed: `, err);
      return;
    }
    try {
      const basicCommands = JSON.parse(jsonString)
      client.say(target, basicCommands[commandName].value)
      console.log(`* Executed ${commandName} command`)
    } catch(err) {
      console.log(`* Unknown Command ${commandName}`)
    }
  });
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
