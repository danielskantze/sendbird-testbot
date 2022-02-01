export interface ChannelData {
    channel: any,
    handler: any,
    handlerId: string
}

export type ChannelListener = (type:ChannelEventType, messageId:number, message?:any) => any;

export enum ChannelEventType {
    RECEIVE = 'receive',
    UPDATE = 'update',
    DELETE = 'delete'
}

export interface ChatService {
    connect: (userId: string, nickname: string) => Promise<void>,
    disconnect: () => Promise<void>,
    listChannels: () => Promise<Array<any>>,
    getChannel: (url: string) => Promise<any>,
    joinChannel: (url: string) => Promise<ChannelData>,
    sendMessage: (channelData: ChannelData, text: string) => Promise<any>,
    setMessageListener: (channelData: ChannelData, listener:ChannelListener) => void,
    clearMessageListener: (channelData: ChannelData) => void,
    createGroupCounter: (channelData: ChannelData, counter: string) => Promise<number>,
    incrementGroupCounter: (channelData: ChannelData, counter: string) => Promise<number>
    incrementOrCreateGroupCounter: (channelData: ChannelData, counter: string) => Promise<number>
}