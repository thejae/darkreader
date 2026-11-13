import type {MessageBGtoCS, MessageCStoBG} from '../../definitions';
import {MessageTypeBGtoCS, MessageTypeCStoBG} from '../../utils/message';
import {shouldIgnoreCors} from '../../utils/network';
import {generateUID} from '../../utils/uid';

interface FetchRequest {
    url: string;
    responseType: 'data-url' | 'text';
    mimeType?: string;
    origin: string;
}

const resolvers = new Map<string, (data: string) => void>();
const rejectors = new Map<string, (reason?: any) => void>();
const FETCH_TIMEOUT_MS = 30000;

export async function bgFetch(request: FetchRequest): Promise<string> {
    if ((window as any).DarkReader?.Plugins?.fetch) {
        return (window as any).DarkReader.Plugins.fetch(request);
    }
    const parsedURL = new URL(request.url);
    if (parsedURL.origin !== request.origin && shouldIgnoreCors(parsedURL)) {
        throw new Error('Cross-origin limit reached');
    }
    return new Promise<string>((resolve, reject) => {
        const id = generateUID();
        // Without a timeout, a request the background never answers (MV3
        // service worker died, sender context invalidated) keeps its resolver
        // entry in the map forever and the page-side promise hangs.
        const timeout = setTimeout(() => {
            resolvers.delete(id);
            rejectors.delete(id);
            reject(new Error(`Unable to fetch ${request.url}: timed out`));
        }, FETCH_TIMEOUT_MS);
        resolvers.set(id, (data) => {
            clearTimeout(timeout);
            resolve(data);
        });
        rejectors.set(id, (reason) => {
            clearTimeout(timeout);
            reject(reason);
        });
        chrome.runtime.sendMessage<MessageCStoBG>({type: MessageTypeCStoBG.FETCH, data: request, id});
    });
}

chrome.runtime.onMessage.addListener(({type, data, error, id}: MessageBGtoCS) => {
    if (type === MessageTypeBGtoCS.FETCH_RESPONSE) {
        const resolve = resolvers.get(id!);
        const reject = rejectors.get(id!);
        resolvers.delete(id!);
        rejectors.delete(id!);
        if (error) {
            reject && reject(typeof error === 'string' ? new Error(error) : error);
        } else {
            resolve && resolve(data);
        }
    }
});
