# TwitchBot
Bot for twitch.tv/PoJah

Pre-Requisites:
- Must have installed MongoDB (or have MongoDB running somewhere / accessible)
- May need to install the following npm packages - tmi.js, fs, node-fetch, mongodb
- In bot.js, change "const opts" to use your own identity / channel(s)
  - password needs to be generated here (after signing into your bot account):  https://twitchapps.com/tmi/
- In bot.js, change "var url" to point to your mongodb instance
- Recommended to create a new account to be your bot. I believe this should work posting from your own account, but I have not tested.
- Created originally by build on the following: https://dev.twitch.tv/docs/irc/

To Run the Bot: 
- Download and install nodejs (I'm using v16.1.0 at the time of writing this)
- Run the following to install your dependencies
  - npm install tmi.js
  - npm install fs
  - npm install node-fetch
  - npm install mongodb
- Run the following to run the bot
  - node bot.js

Will add more to this README as necessary :)
