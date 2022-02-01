import crypto from 'crypto';

export function opaqueId(seed:string = null):string {
    const s = seed ? seed : "" + (Date.now() + Math.random())
    const hash = crypto.createHash('md5').update(s).digest('hex');
    return hash;
}