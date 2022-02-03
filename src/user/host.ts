import StateMachine from '../util/statemachine';
import { ChannelData, ChannelEventType, ChatService } from '../services/chatservice';
import { UserState, AllUserStates, UserSettings } from './user';

// TODO: Consider having an generic manager that connects to sendbird and then provide callbacks to handle different states only. Could be much cleaner that way - i.e. not repeating the state machine stuff. Could do that if we do more advanced interaction patterns. 

type User = {
    settings: UserSettings
    state: StateMachine,
    service: ChatService,
    channelData: ChannelData,
    replyTo: string
};

const delayFactor = 1;

function createStateMachine(user: User) {
    const sm = new StateMachine(AllUserStates, UserState.CREATED);
    sm.addTransitions(UserState.CREATED, [UserState.CONNECTED, UserState.ERROR]);
    sm.addTransitions(UserState.CONNECTED, [UserState.PENDING, UserState.DISCONNECTED, UserState.ERROR]);
    sm.addTransitions(UserState.PENDING, [UserState.SENT, UserState.DISCONNECTED, UserState.ERROR]);
    sm.addTransitions(UserState.SENT, [UserState.ANSWERED, UserState.DISCONNECTED, UserState.ERROR]);
    sm.addTransitions(UserState.ANSWERED, [UserState.PENDING, UserState.DISCONNECTED, UserState.ERROR]);
    sm.addStateListener(UserState.CONNECTED, () => onUserConnected(user));
    sm.addStateListener(UserState.SENT, () => onIncomingQuestion(user));
    sm.addStateListener(UserState.ANSWERED, () => onMessageAnswered(user));
    sm.addStateListener(UserState.ERROR, () => onError(user));
    sm.addStateChangeListener((state: string) => { 
        const p = { 
            now: (new Date()).toJSON(), 
            nickname: user.settings.nickname, 
            state
        };
        console.log(`${p.now} - [${p.nickname}] STATE --> ${p.state}`);
    });
    return sm;
}

async function delay(seconds = 2, randomSeconds = 0, random = true): Promise<void> {
    const promise = new Promise<void>((resolve) => {
        const milliseconds = Math.round(1000 * (seconds + randomSeconds * (random ? Math.random() : 1)));
        setTimeout(resolve, milliseconds * delayFactor);
    });
    return promise;
}

function getRandomMessage(messages: Array<string>) {
    return messages[Math.floor(messages.length * Math.random())];
}

async function replyToQuestion(user: User): Promise<any> {
    await delay(4, 10);
    const reply = user.replyTo + " " + getRandomMessage(user.settings.phrases.main);
    const message = await user.service.sendMessage(user.channelData, reply);
    return message;
}

export function createUser(settings: UserSettings, service: ChatService): User {
    const user: User = {
        settings,
        state: null,
        service,
        channelData: null,
        replyTo: null
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

async function onUserConnected(user: User) {
    const scopedHandler = (type: ChannelEventType, messageId: number, message: any, sender: any) => {
        return onMessageEvent(user, type, messageId, message, sender);
    };
    await user.service.setUserMetadata({ userColor: '#ff0000' });
    user.service.setMessageListener(user.channelData, scopedHandler);
    user.state.changeState(UserState.PENDING);
}

async function onIncomingQuestion(user: User) {
    const message = await replyToQuestion(user);
    user.state.changeState(UserState.ANSWERED);
}

function onMessageEvent(user: User, type: ChannelEventType, messageId: number, message?: any, sender?: any) {
    switch (type) {
        case ChannelEventType.RECEIVE:
            if (message.message.toLowerCase().startsWith(user.settings.nickname.toLowerCase())) { // cheap hack to do case insensitive check for nickname, could be improved.
                if (user.state.is(UserState.PENDING)) {
                    user.replyTo = sender.nickname;
                    user.state.changeState(UserState.SENT);
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

async function onMessageAnswered(user: User) {
    user.replyTo = null;
    user.state.changeState(UserState.PENDING);
}

async function onError(user: User) {
    console.error("An error has occurred. Will not continue");
    await stop(user);
}

export async function start(user: User, onDisconnect: () => void) {
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