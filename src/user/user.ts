export type UserSettings = {
    id: string,
    nickname: string,
    channelUrl: string,
    phrases: UserPhrases
};

export type UserPhrases = {
    main: Array<string>,
    optional: Array<string>
}

export enum UserState {
    CREATED = 'created',
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    PENDING = 'pending',
    SENT = 'sent',
    ANSWERED = 'answered',
    ERROR = 'error'
}

export const AllUserStates = Object.keys(UserState).filter(k => k === k.toLowerCase()); // Hack to get all keys, typescript transpiles to a 2-way mapping in an object. Rely on the convention to write enum keys in UPPERCASE and their values in lowercase to do the filtering. 