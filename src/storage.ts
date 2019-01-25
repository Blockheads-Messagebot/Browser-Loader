import { Storage as AStorage } from '@bhmb/bot'

// A cache to avoid repeatedly parsing large JSON objects
// when getting stuff from storage.
const storageCache = new Map<string, any>()

// Keys which should be written back to localStorage when possible.
const writeback = new Set<string>()

// Write to localStorage every 10 seconds max
setInterval(() => {
    if (writeback.size === 0) return

    for (const key of writeback) {
        localStorage.setItem(key, JSON.stringify(storageCache.get(key)))
    }
    writeback.clear()
}, 10 * 1000)

export class Storage extends AStorage {
    constructor(private head: string) {
        super()
        // For readability
        this.head += '/'
    }

    get<T>(key: string, fallback: T): T {
        const fullKey = this.head + key
        // Get the cached value if there is one.
        if (storageCache.has(fullKey)) {
            return storageCache.get(fullKey)
        }

        try {
            // JSON.parse correctly handles null so it's fine to declare this as string.
            const item = localStorage.getItem(fullKey) as string
            const parsed = JSON.parse(item)
            if (parsed != null) {
                storageCache.set(fullKey, parsed)
                return parsed
            }
            return fallback
        } catch {
            return fallback
        }
    }

    set(key: string, value: any): void {
        const fullKey = this.head + key
        storageCache.set(fullKey, value)
        writeback.add(fullKey)
    }

    clear(prefix: string = ''): void {
        this.keys(prefix)
            .forEach(key => {
                writeback.delete(this.head + key)
                storageCache.delete(this.head + key)
                localStorage.removeItem(this.head + key)
            })
    }

    keys(prefix: string = ''): string[] {
        return Object.keys(localStorage)
            .filter(key => key.startsWith(this.head + prefix))
            .map(key => key.substr(this.head.length))
    }

    prefix(prefix: string): AStorage {
        return new Storage(this.head + prefix)
    }
}
