import fs from 'fs';

export function readJsonFile(path: string): Promise<any> {
    const promise = new Promise<any>((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            }
        });    
    });
    return promise;
}