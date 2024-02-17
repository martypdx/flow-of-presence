
export function subject(transform, options) {
    if(!options && typeof transform === 'object') {
        options = transform;
        transform = null;
    }

    let initialValue, startWith;
    if(options) {
        initialValue = options.initialValue;
        startWith = options.startWith;
        if(initialValue !== undefined) {
            if(startWith !== undefined) {
                throw new Error('Cannot specify both initialValue and startWith option');
            }
            if(!transform) {
                throw new Error('Cannot specify initialValue without a transform function');
            }
        }
    }

    const relay = { resolve: null };

    function dispatch(payload) {
        if(transform) payload = transform(payload);
        if(relay.resolve) relay.resolve(payload);
        else startWith = payload;
    }

    async function* generator() {
        if(initialValue !== undefined) {
            yield transform(initialValue);
        }
        if(startWith !== undefined) {
            yield startWith;
        }

        while(true) {
            const { promise, resolve } = Promise.withResolvers();
            relay.resolve = resolve;
            yield await promise;
        }
    }

    const asyncIterator = generator();
    return [asyncIterator, dispatch];
}


export function multicast(iterator) {
    return new Multicast(iterator);
}

class Multicast {
    consumers = [];
    constructor(subject) {
        this.subject = subject;
        this.#start();
    }

    async #start() {
        for await(let value of this.subject) {
            for(let consumer of this.consumers) {
                consumer(value);
            }
        }
    }

    subscriber(transform, options) {
        const [dispatch, iterator] = subject(transform, options);
        this.consumers.push(dispatch);
        return iterator;
    }
}
