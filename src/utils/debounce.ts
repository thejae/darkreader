export function debounce<F extends(...args: any[]) => any>(delay: number, fn: F): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const resolvers: Array<(value: Awaited<ReturnType<F>>) => void> = [];
    return (...args: Parameters<F>) => new Promise<Awaited<ReturnType<F>>>((resolve) => {
        // Each caller gets a promise that resolves when the debounced call
        // actually runs, so `await debounce(...)` waits for the real work
        // instead of returning at once with the write still pending.
        resolvers.push(resolve);
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = null;
            Promise.resolve(fn(...args)).then((value) => {
                resolvers.forEach((r) => r(value));
                resolvers.length = 0;
            });
        }, delay);
    });
}
