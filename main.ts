import { basename } from 'path';
import { readConfig } from './src/config';
import { createSendbirdService } from './src/services/chatservice-sendbird';
import { UserPhrases, UserSettings } from './src/user/user';
import * as participant from './src/user/participant';
import * as host from './src/user/host';
import { readJsonFile } from './src/util/file';
import { opaqueId } from './src/util/rnd';

let isRunning = false;

async function start(channelUrl: string, nickname: string, isHost:boolean, isGroundhogDay: boolean) {
    const phrasesFile = isHost ? './content/host.json' : './content/participants.json';
    const config = await readConfig('./conf/local.json');
    const phrases = (await readJsonFile(phrasesFile)) as UserPhrases;
    const service = createSendbirdService({ appId: config.appId });
    const userConfig: UserSettings = {
        id: opaqueId(),
        nickname: nickname,
        channelUrl,
        phrases: phrases,
        isGroundhogDay
    };
    if (isHost) {
        const u = host.createUser(userConfig, service);
        await host.start(u, () => { isRunning = false; });
    
    } else {
        const u = participant.createUser(userConfig, service, config.operator);
        await participant.start(u, () => { isRunning = false; });            
    }
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
        nickname: args[2],
        isHost: args.length < 4 ? 'false' : args[3],
        isGroundhogDay: args.length < 5 ? 'false' : args[4]
    }
}

function main(args:Array<string>):void {
    processArguments(args)
        .then(({ channelUrl, nickname, isHost, isGroundhogDay }) => {
            console.log(channelUrl, nickname);
            const isHostParam = isHost.toLowerCase() === 'true';
            const isGroundhogDayParam = isGroundhogDay.toLowerCase() !== 'false';
            start(channelUrl, nickname, isHostParam, isGroundhogDayParam);
        })
        .catch(error => {
            console.log(error);
            console.log('\nUsage:\n');
            console.log(basename(args[0]), 'channelUrl nickname is_host');
            console.log('\nor\n');
            console.log(basename(args[0]), '-f launchdata.json');
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
