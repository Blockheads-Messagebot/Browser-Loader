import { Storage as AStorage } from '@bhmb/bot'

export class Storage extends AStorage {
    constructor(private head: string) {
        super()
        // For readability
        this.head += '/'
    }

    get<T>(key: string, fallback: T): T {
        // JSON.parse correctly handles null so it's fine to declare this as string.
        const item = localStorage.getItem(this.head + key) as string
        try {
            const parsed = JSON.parse(item)
            return parsed == null ? fallback : parsed
        } catch {
            return fallback
        }
    }

    set(key: string, value: any): void {
        localStorage.setItem(this.head + key, JSON.stringify(value))
    }

    clear(prefix: string = ''): void {
        this.keys(prefix)
            .forEach(key => localStorage.removeItem(this.head + key))
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
