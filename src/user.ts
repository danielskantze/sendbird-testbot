import StateMachine from './util/statemachine';
import { ChannelData, ChannelEventType, ChatService } from './services/chatservice';

export type UserPhrases = {
    questions: Array<string>,
    thankyouPhrases: Array<string>
}

type UserSettings = {
    id: string,
    nickname: string,
    channelUrl: string,
    phrases: UserPhrases
};

enum UserState {
    CREATED = 'created',
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    PENDING = 'pending',
    SENT = 'sent',
    ANSWERED = 'answered',
    ERROR = 'error'
}

const AllUserStates = Object.keys(UserState).filter(k => k === k.toLowerCase()); // Hack to get all keys, typescript transpiles to a 2-way mapping in an object. Rely on the convention to write enum keys in UPPERCASE and their values in lowercase to do the filtering. 

type User = {
    settings: UserSettings
    state: StateMachine,
    service: ChatService,
    channelData: ChannelData,
    questionMessageId: number,
    replyMessage: any
};

function createStateMachine(user:User) {
    const sm = new StateMachine(AllUserStates, UserState.CREATED);
    sm.addTransitions(UserState.CREATED, [UserState.CONNECTED, UserState.ERROR]);
    sm.addTransitions(UserState.CONNECTED, [UserState.PENDING, UserState.DISCONNECTED, UserState.ERROR]);
    sm.addTransitions(UserState.PENDING, [UserState.SENT, UserState.DISCONNECTED, UserState.ERROR]);
    sm.addTransitions(UserState.SENT, [UserState.ANSWERED, UserState.DISCONNECTED, UserState.ERROR]);
    sm.addTransitions(UserState.ANSWERED, [UserState.PENDING, UserState.DISCONNECTED, UserState.ERROR]);
    sm.addStateListener(UserState.CONNECTED, () => onUserConnected(user));
    sm.addStateListener(UserState.PENDING, () => onPendingInteraction(user));
    sm.addStateListener(UserState.ANSWERED, () => onMessageAnswered(user));
    sm.addStateListener(UserState.ERROR, () => onError(user));
    sm.addStateChangeListener((state:string) => { console.log("[", user.settings.nickname, "] STATE --> ", state); });
    return sm;
}

async function delay(seconds = 2, randomSeconds = 0, random = true):Promise<void> {
    const promise = new Promise<void>((resolve) => {
        const milliseconds = Math.round(1000 * (seconds + randomSeconds * (random ? Math.random() : 1)));
        setTimeout(resolve, milliseconds);
    });
    return promise;
}

function getRandomMessage(messages:Array<string>) {
    return messages[Math.floor(messages.length * Math.random())];
}

async function askQuestion(user:User):Promise<any> {
    await delay(4, 20);
    const question = getRandomMessage(user.settings.phrases.questions);
    const message = await user.service.sendMessage(user.channelData, question);
    return message;
}

async function sendThankyou(user:User):Promise<any> {
    await delay(4, 10);
    const phrase = getRandomMessage(user.settings.phrases.thankyouPhrases);
    const message = await user.service.sendMessage(user.channelData, phrase);
    await delay(4, 20);
    return message;
}

export function createUser(settings: UserSettings, service: ChatService): User {
    const user: User = {
        settings,
        state: null,
        service,
        channelData: null,
        questionMessageId: null,
        replyMessage: null
    };
    user.state = createStateMachine(user);
    return user;
}

/**
 * 
 * @param service A connected instance of the chat service
 * @param user 
 */

async function connectUser(user: User) {
    await user.service.connect(user.settings.id, user.settings.nickname);
    const channel = await user.service.joinChannel(user.settings.channelUrl);
    user.channelData = channel;
}

async function onUserConnected(user:User) {
    const scopedHandler = (type:ChannelEventType, messageId:number, message:any) => {
        return onMessageEvent(user, type, messageId, message);
    };
    user.service.setMessageListener(user.channelData, scopedHandler);
    user.state.changeState(UserState.PENDING);
}

async function onPendingInteraction(user:User) {
    user.replyMessage = null;
    user.questionMessageId = null;
    const message = await askQuestion(user);
    user.questionMessageId = message.messageId;
    user.state.changeState(UserState.SENT);
}

function onMessageEvent(user: User, type:ChannelEventType, messageId:number, message?:any) {
    switch (type) {
        case ChannelEventType.RECEIVE:
            if (message.isOperatorMessage && message.message.startsWith(user.settings.nickname)) {
                if (user.state.is(UserState.SENT)) {
                    user.replyMessage = message;
                    user.state.changeState(UserState.ANSWERED);
                } 
            }
            break;
        case ChannelEventType.UPDATE:
            console.log("Received event, message", messageId, "updated");
            break;
        case ChannelEventType.DELETE:
            console.log("Received event, message", messageId, "deleted");
            break;
    }
}

async function onMessageAnswered(user:User) {
    await sendThankyou(user);
    user.state.changeState(UserState.PENDING);
}

async function onError(user:User) {
    console.error("An error has occurred. Will not continue");
    await stop(user);
}

export async function start(user: User, onDisconnect:() => void) {
    if (user.state.is(UserState.CREATED)) {
        user.state.addStateListener(UserState.DISCONNECTED, onDisconnect);
        try {
            await connectUser(user);
            user.state.changeState(UserState.CONNECTED);
        } catch (e) {
            console.error(e);
            user.state.changeState(UserState.ERROR);
        }
    }
}

export async function stop(user: User) {
    if (user.state.isOneOf([UserState.CREATED, UserState.DISCONNECTED])) {
        return;
    }
    await user.service.disconnect();
    user.state.changeState(UserState.DISCONNECTED);
}