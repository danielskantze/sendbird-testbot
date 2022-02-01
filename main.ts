import { basename } from 'path';
import { readConfig } from './src/config';
import { createSendbirdService } from './src/services/chatservice-sendbird';
import * as user from './src/user';
import { readJsonFile } from './src/util/file';
import { opaqueId } from './src/util/rnd';

let isRunning = false;

async function start(channelUrl:string, nickname:string) {
    const config = await readConfig('./conf/local.json');
    const phrases = await readJsonFile('./content/participants.json') as user.UserPhrases;
    const service = createSendbirdService({
        appId: config.appId
    });
    const u = user.createUser({
        id: opaqueId(),
        nickname: nickname,
        channelUrl,
        phrases: phrases
    }, service);
    await user.start(u, () => {
        isRunning = false;
    });
}

if (process.argv.length < 4) {
    console.log("\n");
    console.log("Usage", basename(process.argv[1]), "channelUrl nickname");
    console.log("\n");
    process.exit(1);
}

const channelUrl = process.argv[2];
const nickname = process.argv[3];

start(channelUrl, nickname);

process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    process.exit();
});

(function wait() {
    if (isRunning) {
        setTimeout(wait, 1000);
    }
})();
