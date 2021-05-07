/*
 *@author PoJah
 *
 * This js file is the main file for PoBotYEET, a replacement for Nightbot.
 * Currently under developement :)
 */

// Imports
const tmi = require('tmi.js');
const fs = require('fs');
const fetch = require('node-fetch');
const mongo = require('mongodb');

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

// MongoDB connection info
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

// Global counters
var sheeshCount = 0;
var sessyTankCount = 0;

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {

  // Ignore messages from the bot and nightbot, and that don't have '!'
  if (self || context["username"].toLowerCase() == "nightbot" 
      || !msg.startsWith('!')) { return; }

  //Split entire message on " " for commands that require arguments
  const chatMessageArray = msg.split(" ")

  // Separate chat message into command and arguments (removing whitespace also)
  const commandName = chatMessageArray[0].toLowerCase();
  const userName = context["username"];
  const displayName = context["display-name"];
  const argument1 = chatMessageArray[1];

  // Switch statement checks for api / counter commands first
  switch(commandName) {
    case "!followage":
      if (chatMessageArray.length == 1) {
        followAgeCommand(target, displayName);
      }
      break;
    case "!quote":
      if (chatMessageArray.length == 1 || chatMessageArray.length == 2) {
        quoteCommand(target, argument1);
      }
      break;
    case "!addquote":
      if (chatMessageArray.length > 1) {
        var quoteToAdd = ""
        for (var i = 1; i < chatMessageArray.length; i++) {
          quoteToAdd += chatMessageArray[i];
          quoteToAdd += " "
        }
        addQuoteCommand(target, quoteToAdd.trim());
      }
      break;
    case "!delquote":
      if (chatMessageArray.length == 2) {
        deleteQuoteCommand(target, argument1);
      }
      break;
    case "!so": //TODO - this is a lazy version of this command, fix it to make it fit into a generic case
      if (chatMessageArray.length == 2) {
        client.say(target, 'Go check out ' + argument1 + ' at twitch.tv/' + argument1 + ' and drop a follow!')
        console.log(`* Executed !so command`)
      }
      break;
    case "!addcommand":
      if (userName == "pojah" && chatMessageArray.length > 2 && argument1.startsWith("!") && argument1.length > 1) {
        var commandToAdd = argument1;
        var commandValueToAdd = "";
        for (var i = 2; i < chatMessageArray.length; i++) {
          commandValueToAdd += chatMessageArray[i];
          commandValueToAdd += " "
        }
        addCommand(target, commandToAdd, commandValueToAdd.trim())
      } else {
        console.log(`* Could not add command, improper syntax`);
        client.say(target, `Command not added. Please use proper syntax: !addcommand !<commandName> <command to add>`);
      }
      break;
    case "!deletecommand":
      if (userName == "pojah" && chatMessageArray.length == 2 && argument1.startsWith("!") && argument1.length > 1) {
        deleteCommand(target, argument1);
      } else {
        console.log(`* Could not delete command, improper syntax`);
        client.say(target, `Command not deleted. Please use proper syntax: !deletecommand !<commandName>`);
      }
      break;
    default: // Default case is for basic (simple text) commands (found in mongodb)
      if (chatMessageArray.length == 1) {
        basicCommandMongoDb(target, displayName, commandName);
      }
      break;
  }

}

// Basic Commands from commands_list.json
// DEPRECATED in favor of using mongodb :)
//
// function basicCommand(target, user, commandName) {
//   // Get commands from json list with commands
//   fs.readFile('./commands_list.json', 'utf8', (err, jsonString) => {
//     if (err) {
//       console.log(`* commands_list.json file read failed: `, err);
//       return;
//     }
//     try {
//       // Parse the commands_list.json file
//       const basicCommands = JSON.parse(jsonString)

//       // Replace $(touser) with the actual user to be tagged in the command
//       var userReplacedCommand = basicCommands[commandName].value.replace('$(touser)', user)

//       // Execute command based on entry in commands_list.json
//       client.say(target, userReplacedCommand)
//       console.log(`* Executed ${commandName} command`)
//     } catch(err) {
//       console.log(`* Unknown Command ${commandName}`)
//     }
//   });
// }

// Add command
function addCommand(target, commandName, commandValue) {
  MongoClient.connect(url, function(err, db) {
    // On error, close db connection and throw error
    if (err) {
      db.close();
      throw err;
    }

    var dbo = db.db("mydb");
    var myobj = { name: `${commandName}`, value: `${commandValue}` };

    if (commandValue.includes("$(count)")) {
      myobj = { name: `${commandName}`, value: `${commandValue}`, count: 0};
    }

    // Insert document if possible, and respond back to client (chat)
    dbo.collection("commands").insertOne(myobj, function(err, res) {
      if (err) {
        db.close();
        throw err;
      }

      console.log("Document inserted for ", commandName);
      client.say(target, `The following command was added: ${commandName}`);

      // Close db connection
      db.close();
    });
  });
}

// Delete command
function deleteCommand(target, commandName) {
  MongoClient.connect(url, function(err, db) {
    // On error, close db connection and throw error
    if (err) {
      db.close();
      throw err;
    }

    var dbo = db.db("mydb");
    var query = { name: `${commandName}` };

    // Delete document if possible, and respond back to client (chat)
    dbo.collection("commands").deleteOne(query, function(err, res) {
      if (err) {
        db.close();
        throw err;
      }

      if (res) {
        console.log("Document deleted for ", commandName);
        client.say(target, `The following command was deleted: ${commandName}`);
      } else {
        console.log(`* Could not delete command: ${commandName}`);
      }

      // Close db connection
      db.close();
    });
  });
}

// Execute Basic Commands from MongoDB
function basicCommandMongoDb(target, user, commandName) {
  MongoClient.connect(url, function(err, db) {
    if (err) {
      db.close();
      throw err;
    }
    var dbo = db.db("mydb");
    var query = { name: `${commandName}`}

    // We want to keep track of how often each command is called.
    var incrementJson = { $inc: {count: 1} }

    // Call findOneAndUpdate to update the count for each command when called.
    dbo.collection("commands").findOneAndUpdate(query, incrementJson, function(err, response) {
        if (err) { 
          db.close()
          throw err; 
        }

        // PoBotYEET should only speak if there is an entry in mongoDb
        if (response && response.value) {
          var commandObject = response.value

          // Replace $(touser) with the actual user (display name) to be tagged in the command
          var userReplacedCommand = commandObject.value.replace('$(touser)', user)
          // Replace $(count) with the real count in mongoDb
          var counterReplacedCommand = userReplacedCommand.replace('$(count)', commandObject.count + 1)

          client.say(target, counterReplacedCommand)
          console.log(`* Executed ${commandName} command`)
        } else {
          console.log(`* Unknown Command ${commandName}`)
        }

        db.close();
    });
  });
}

// Function to call followage api and execute command
async function followAgeCommand(target, user) {
  const response = await fetch(`https://beta.decapi.me/twitch/followage/PoJah/${user}`);
  const followAge = await response.text()

  client.say(target, `${user} has been following for: ${followAge}`)
  console.log(`* Executed !followage command`)
}

// Function to call quote api and execute command
async function quoteCommand(target, quoteNumber) {

  // Base URL for getting quotes
  var url = `https://twitch.center/customapi/quote?token=fcca0d5c`

  // We only want to add an argument to the api if one was given
  if (quoteNumber) {
    url = url + `&data=${quoteNumber}`
  }

  const response = await fetch(url);
  const quote = await response.text()

  client.say(target, quote)
  console.log(`* Executed !quote command`)
}

// Function to call add quote api and execute command
async function addQuoteCommand(target, quoteToAdd) {
  const response = await fetch(`https://twitch.center/customapi/addquote?token=e0a096b9b8801b86&data=${quoteToAdd}`);
  const apiResponseText = await response.text()

  client.say(target, apiResponseText)
  console.log(`* Executed !addquote command`)
}

// Function to call delete quote api and execute command
async function deleteQuoteCommand(target, quoteToDelete) {
  const response = await fetch(`https://twitch.center/customapi/delquote?token=e0a096b9b8801b86&data=${quoteToDelete}`);
  const apiResponseText = await response.text()

  client.say(target, apiResponseText)
  console.log(`* Executed !delquote command`)
}

// Function to call counter based commands (to increment said counter)
function counterCommand(target, beginMessage, counter, endMessage) {
  client.say(target, beginMessage + counter + endMessage);
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
