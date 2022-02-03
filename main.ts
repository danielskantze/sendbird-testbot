import { basename } from 'path';
import { readConfig } from './src/config';
import { createSendbirdService } from './src/services/chatservice-sendbird';
import * as user from './src/user/user';
import { readJsonFile } from './src/util/file';
import { opaqueId } from './src/util/rnd';

let isRunning = false;

async function start(channelUrl: string, nickname: string) {
    const config = await readConfig('./conf/local.json');
    const phrases = (await readJsonFile('./content/participants.json')) as user.UserPhrases;
    const service = createSendbirdService({ appId: config.appId });
    const u = user.createUser(
        {
            id: opaqueId(),
            nickname: nickname,
            channelUrl,
            phrases: phrases
        },
        service
    );
    await user.start(u, () => {
        isRunning = false;
    });
}

async function processArguments(args: Array<string>): Promise<Record<string, string>> {
    const result:Record<string, string> = {};
    
    if (args.length < 3) {
        throw new Error('Wrong number of arguments');
    }
    if (args[1] === '-f') {
        try {
            return await readJsonFile(args[2]);
        } catch (e) {
            throw new Error('Unable to read ' + args[2]);
        }
    } 
    return {
        channelUrl: args[1],
        nickname: args[2]
    }
}

function main(args:Array<string>):void {
    processArguments(args)
        .then(({ channelUrl, nickname }) => {
            console.log(channelUrl, nickname);
            start(channelUrl, nickname);
        })
        .catch(error => {
            console.log(error);
            console.log('\nUsage:\n');
            console.log(basename(process.argv[0]), 'channelUrl nickname');
            console.log('\nor\n');
            console.log(basename(process.argv[0]), '-f launchdata.json');
            console.log('Where launchdata.json contains an object with channelUrl nickname as properties');
            console.log('\n');
            process.exit(0);
        });
}

process.on('SIGINT', function () {
    console.log('Caught interrupt signal');
    process.exit();
});

main(process.argv.slice(1));

(function wait() {
    if (isRunning) {
        setTimeout(wait, 1000);
    }
})();
