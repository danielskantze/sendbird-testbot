# Tester for sendbird open channels chat

This tool can be used to simulate sendbird chat participants. Currently this tools supports open channels only. 

Everything is controlled through commands specified in package.json using default parameters. For more specific tweaking such the scripts in the bin-folder can be run directly. 

## Preparations

First install all dependencies:

`npm i`

First create a configuration file:

`npm run create-config-template`

Rename it to conf/local.json and enter your Sendbird AppID (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX). You can find the channelUrl of the chat you like in the sendbird dashboard: https://dashboard.sendbird.com/ 
## Running a single bot instance

This command will connect to a chat as a participant on the channelUrl with a specific nickname. 

`npm run start channelUrl nickname false`

Open the sendbird dashboard https://dashboard.sendbird.com/ and navigate to the chat. You can reply to the bot by starting the message with the nickname. The bot will send a thank you note for the reply, wait a bit and ask a new question. 

This command will connect to a chat as a host on the channelUrl with a specific nickname. 

`npm run start channelUrl nickname true`

## Details

The tool can act both as host (also called "operator") and participant. 

Consider this dialog

```
[1] redpenguin> eventhost What time is it?
[2] eventhost> redpenguin The time is 14:52
[3] redpenguin> Thank you eventhost. 
```

### Host mode

The host mode will wait until someone asks it a question (done by starting the message with the operator's nickname) `[1]` and then post a reply starting the the particpant's nickname first `[2]`. E.g:

### Participant mode

The participant mode will wait for a bit and then ask the operator a question `[1]`. It will then wait for the operator's reply `[2]` and then write a thank you note `[3]` (making sure that the message does not start with the operator nickname that would trigger another reply). After a while it picks another question and there is another cycle.

## Running the test with many bots

`npm run start-test channel_url number_of_participants`

This command will start a bunch of node processes in the background, one for each participant. Logs will be saved for each participant in the `logs`-folder. 

This command can also be used to start the test:

`bash bin/start-chat-test.sh channel_url number_of_participants` 

## Stopping the tests

This command will kill all processes with the string 'coupleness_chat_tester'

`npm run stop-test`

## Tips

You can also supply the channelUrl, the nickname and if the bot should act as a host or a participant in config files and start using:

E.g. `./conf/local-args-host.json:`

```
{
    "channelUrl": "sendbird_open_channel_...",
    "nickname": "testbot",
    "isHost": "true"
}
```

And then start with:

`npm run start -- -f ./conf/local-args-host.json`

## Customizations & further development

The delays before the user responds can be tweaked in the `user.ts` file. 

The nicknames are hard coded in the `start-chat-test.sh` file

The questions and responses are stored in the `content/participants.json` folder.