# Tester for sendbird open channels chat

This tool can be used to simulate sendbird chat participants. Currently this tools supports open channels only. 

Everything is controlled through commands specified in package.json using default parameters. For more specific tweaking such the scripts in the bin-folder can be run directly. 

## Preparations

First create a configuration file:

`npm run create-config-template`

Rename it to conf/local.json and enter your Sendbird AppID (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX). You can find the channelUrl of the chat you like in the sendbird dashboard: https://dashboard.sendbird.com/ 

`npm i`

## Running a single bot instance

This command will connect to a chat on the channelUrl with a specific nickname. 

`npm run start channelUrl nickname`

Open the sendbird dashboard https://dashboard.sendbird.com/ and navigate to the chat. You can reply to the bot by starting the message with the nickname. The bot will send a thank you note for the reply, wait a bit and ask a new question. 

### Example session

bot nickname is *breezynoodles* (notice the operator's response starting with 'breezynoodles').

`breezynoodles>How can we get more time for each other?`

`operator>breezynoodles That is a good question...`

`breezynoodles>Thank you for the reply`

`...`

## Running the test with many bots

`npm run start-test`

This command will start a bunch of node processes in the background, one for each participant. Logs will be saved for each participant in the `logs`-folder. 

`bash bin/start-chat-test.sh channel_url number_of_participants` can also be used to start the test.

## Stopping the tests

This command will kill all processes with the string 'coupleness_chat_tester'

`npm run stop-test`

## Customizations & further development

The delays before the user responds can be tweaked in the `user.ts` file. 

The nicknames are hard coded in the `start-chat-test.sh` file

The questions and responses are stored in the `content/participants.json` folder.