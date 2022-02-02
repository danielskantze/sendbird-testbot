import SendBird, { AdminMessage, FileMessage, SendBirdInstance, UserMessage } from "sendbird";
import { ChannelData, ChannelEventType, ChatService, ChannelListener } from "./chatservice";

type SendbirdConfig = {
    appId: string
}

async function sbConnect(sb: SendBirdInstance, userId: string, nickname:string): Promise<void> {
    await sb.connect(userId);
    const promise = new Promise<void>((resolve, reject) => {
        sb.updateCurrentUserInfo(nickname, null, (user:SendBird.User, error?:SendBird.SendBirdError) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        })
    });
    return promise;
}

async function sbDisconnect(sb: SendBirdInstance): Promise<void> {
    await sb.disconnect();
}

function sbListChannels(sb: SendBirdInstance): Promise<Array<any>> {
    const query = sb.OpenChannel.createOpenChannelListQuery();
    const promise = new Promise<Array<any>>((resolve, reject) => {
        query.next((openChannels, error) => {
            if (error) {
                reject(error);
            } else {
                resolve(openChannels);
            }
        })
    });
    return promise;
}

function sbCreateGroupCounter(sb: SendBirdInstance, channelData: ChannelData, counter: string): Promise<number> {
    const { channel } = channelData;
    const promise = new Promise<number>((resolve, reject) => {
        const counters = {};
        counters[counter] = 1;
        channel.createMetaCounters(counters, (response, error) => {
            if (error) {
                reject(error);
            } else {
                resolve(response[counter] as number);
            }
        });
    });
    return promise;
}

function sbIncrementGroupCounter(sb: SendBirdInstance, channelData: ChannelData, counter: string): Promise<number> {
    const { channel } = channelData;    
    const promise = new Promise<number>((resolve, reject) => {
        const counters = {};
        counters[counter] = 1;
        channel.increaseMetaCounters(counters, (response, error) => {
            if (error) {
                reject(error);
            } else {
                resolve(response[counter] as number);
            }
        });
    });
    return promise;
}

async function sbSetUserMetadata(sb:SendBirdInstance, metadata:Record<string, string>): Promise<any> {
    const user = sb.currentUser;
    const promise = new Promise<any>((resolve, reject) => {
        user.updateMetaData(metadata, true, (response, error) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
    return promise;
}

async function sbIncrementOrCreateGroupCounter(sb: SendBirdInstance, channelData: ChannelData, counter: string): Promise<number> {
    const { channel } = channelData;
    const promise = new Promise<number>((resolve, reject) => {
        const counters = {};
        counters[counter] = 1;
        channel.increaseMetaCounters(counters, (response, error) => {
            if (error) {
                channel.createMetaCounters(counters, (response, error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(response);
                    }
                });
            } else {
                resolve(response[counter] as number);
            }
        });
    });
    return promise;
}

function sbGetChannel(sb: SendBirdInstance, url: any): Promise<any> {
    const promise = new Promise((resolve, reject) => {
        sb.OpenChannel.getChannel(url, (channel, error) => {
            if (error) {
                reject(error);
            } else {
                resolve(channel)
            }
        });
    });
    return promise;
}

function sbJoinChannel(sb: SendBirdInstance, url: any): Promise<ChannelData> {
    const promise = new Promise<ChannelData>((resolve, reject) => {
        sb.OpenChannel.getChannel(url, (channel, error) => {
            if (error) {
                reject(error);
            } else {
                channel.enter((response, error) => {
                    if (error) {
                        reject(error);
                    } else {
                        const handler = new sb.ChannelHandler();
                        const handlerId = '' + (Date.now() + Math.random());
                        resolve({ channel, handler, handlerId });
                    }
                });
            }
        });
    });
    return promise;
}

function sbSendMessage(sb: SendBirdInstance, channelData: any, text: string): Promise<any> {
    const { channel } = channelData;
    const promise = new Promise<any>((resolve, reject) => {
        const params = new sb.UserMessageParams();
        params.message = text;
        params.mentionType = 'users';                       // Either 'users' or 'channel'
        params.pushNotificationDeliveryOption = 'default';  // Either 'default' or 'suppress'
        channel.sendUserMessage(params, function (userMessage, error) {
            if (error) {
                reject(error);
            } else {
                resolve(userMessage)
            }
        });
    });
    return promise;
}

function sbSetMessageListener(sb:SendBirdInstance, channelData: ChannelData, listener:ChannelListener) {
    const handler:SendBird.ChannelHandler = channelData.handler;
    sb.addChannelHandler(channelData.handlerId, handler);
    const triggerListenerFn = (channel, message: AdminMessage | UserMessage | FileMessage) => {
        if (message.messageType === 'admin') {
            listener(ChannelEventType.RECEIVE, message.messageId, message, {});    
        } else if ((message.messageType === 'user') || (message.messageType === 'file')) {
            const { sender } = (message as UserMessage | FileMessage);
            listener(ChannelEventType.RECEIVE, message.messageId, message, sender);
        }
    };
    handler.onMessageReceived = triggerListenerFn;
    handler.onMessageUpdated = triggerListenerFn;
    handler.onMessageDeleted = (channel, messageId:number) => listener(ChannelEventType.DELETE, messageId);
}

function sbClearMessageListener(sb:SendBirdInstance, channelData: ChannelData) {
    const { handler } = channelData;
    handler.onMessageReceived = null;
    handler.onMessageUpdated = null;
    handler.onMessageDeleted = null;
    sb.removeChannelHandler(channelData.handlerId);
}

export function createSendbirdService(config: SendbirdConfig): ChatService {
    const sb = new SendBird({ appId: config.appId, localCacheEnabled: false })

    return {
        connect: (userId: string, nickname: string) => sbConnect(sb, userId, nickname),
        disconnect: () => sbDisconnect(sb),
        listChannels: () => sbListChannels(sb),
        getChannel: (url: string) => sbGetChannel(sb, url),
        joinChannel: (url: string) => sbJoinChannel(sb, url),
        setUserMetadata: (metadata:Record<string, string>) => sbSetUserMetadata(sb, metadata),
        setMessageListener: (channelData: ChannelData, listener:ChannelListener) => sbSetMessageListener(sb, channelData, listener),
        clearMessageListener: (channelData: ChannelData) => sbClearMessageListener(sb, channelData),
        sendMessage: (channelData: ChannelData, text: string) => sbSendMessage(sb, channelData, text),
        createGroupCounter: (channelData: ChannelData, counter: string) => sbCreateGroupCounter(sb, channelData, counter),
        incrementGroupCounter: (channelData: ChannelData, counter: string) => sbIncrementGroupCounter(sb, channelData, counter),
        incrementOrCreateGroupCounter: (channelData: ChannelData, counter: string) => sbIncrementOrCreateGroupCounter(sb, channelData, counter)
    }
}