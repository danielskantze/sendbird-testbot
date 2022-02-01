# Tester for sendbird open channels chat

This tool can be used to simulate sendbird chat participants.

Everything is controlled through commands specified in package.json using default parameters. For more specific tweaking such the scripts in the bin-folder can be run directly. 

## Preparations

First create a configuration file:

`npm run create-config-template`

Rename it to conf/local.json and enter your Sendbird AppID (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)

`npm i`

## Running a single bot instance

This command will connect to a chat on the channelUrl with a specific nickname. 

`npm run start channelUrl nickname`

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