import { readJsonFile } from './util/file';

export type Config = {
    appId: string,
    operator: string
};

export async function readConfig(path:string):Promise<Config> {
    const config:Config = {
        appId: '',
        operator: ''
    };
    const json = await readJsonFile(path);
    Object.assign(config, json);
    return config;
}