import { Storage as AStorage } from '@bhmb/bot'

export class Storage extends AStorage {
    constructor(private head: string) {
        super()
        // For readability
        this.head += '/'
    }

    get<T>(key: string, fallback: T): T {
        // JSON.parse correctly handles null so it's fine to declare this as string.
        let item = localStorage.getItem(this.head + key) as string
        try {
            let parsed = JSON.parse(item)
            return parsed == null ? fallback : parsed
        } catch {
            return fallback
        }
    }

    set(key: string, value: any): void {
        localStorage.setItem(this.head + key, JSON.stringify(value))
    }

    clear(prefix: string = ''): void {
        let remove = []
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i) as string // This is safe.
            if (key.startsWith(this.head + prefix)) remove.push(key)
        }
        remove.forEach(key => localStorage.removeItem(key))
    }

    prefix(prefix: string): AStorage {
        return new Storage(this.head + prefix)
    }
}
