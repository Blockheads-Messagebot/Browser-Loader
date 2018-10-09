import { MessageBot } from '@bhmb/bot'
import { UIExtensionExports } from '@bhmb/ui'

import html from './extensions.html'

interface ExtensionInfo {
    user: string
    id: string
    package: string
    title: string
    description: string
    env: string
}

const flatten = <T>(arr: T[][]): T[] => arr.reduce((carry, item) => carry.concat(item), [])
// const pluck = <T, K extends keyof T>(arr: T[], key: K) => arr.map(item => item[key])

export const defaultRepo = `https://gitcdn.xyz/cdn/Blockheads-Messagebot/Extensions/master/extensions.json`

function supported(info: ExtensionInfo): boolean {
    let env = info.env.toLocaleLowerCase()
    return [
        env.includes('all'),
        env.includes('browser'),
        (env.includes('mac') && env.includes('cloud')),
    ].some(Boolean) && /\.(m?js|es)/.test(info.package)
}

MessageBot.registerExtension('extensions', ex => {
    let ui = ex.bot.getExports('ui') as UIExtensionExports
    let tab = ui.addTab('Extensions')
    tab.innerHTML = html

    tab.addEventListener('click', event => {
        let target = event.target as HTMLElement
        if (target.tagName != 'A') return
        let id = target.getAttribute('ext_id')
        if (!id) return

        if (target.textContent == 'Install') {
            load(id)
        } else {
            removeExtension(id)
        }
    })

    ex.remove = () => {
        throw new Error('This extension cannot be removed.')
    }

    function addExtension(id: string) {
        try {
            ex.bot.addExtension(id)
            ex.storage.with<string[]>('autoload', [], ids => {
                if (!ids.includes(id)) ids.push(id)
            })
            let button = tab.querySelector(`a[ext_id="${id}"]`) as HTMLElement | null
            if (button) button.textContent = 'Remove'
        } catch (error) {
            ui.notify('Error adding extension: ' + error)
            try {
                ex.bot.removeExtension(id, false)
            } catch {}
        }
    }

    function removeExtension(id: string) {
        try {
            ex.bot.removeExtension(id, true)
            ex.storage.with<string[]>('autoload', [], ids => {
                if (ids.includes(id)) ids.splice(ids.indexOf(id), 1)
            })
            let button = tab.querySelector(`a[ext_id="${id}"]`) as HTMLElement | null
            if (button) button.textContent = 'Install'
        } catch (error) {
            ui.notify('Error removing extension: ' + error)
        }
    }

    function reloadExtension(id : string) {
        ex.bot.removeExtension(id, false)
        ex.bot.addExtension(id)
    }
    ex.exports.reloadExtension = reloadExtension

    // Load listener
    let shouldLoad = new Set<string>()
    MessageBot.extensionRegistered.sub(id => {
        // If in developer mode, autoload unconditionally
        if (ex.storage.get('devMode', false)) {
            if (ex.bot.getExports(id)) ex.bot.removeExtension(id, false)
            addExtension(id)
        } else if (shouldLoad.has(id)) {
            shouldLoad.delete(id)
            addExtension(id)
        }
    })

    let extensionMap = new Map<string, ExtensionInfo>()
    function load(id: string) {
        let info = extensionMap.get(id)
        if (!info) {
            console.warn('Could not load unknown ID:', id)
            return
        }
        if (MessageBot.extensions.includes(id)) {
            addExtension(id)
        } else {
            shouldLoad.add(id)
            let script = document.head.appendChild(document.createElement('script'))
            script.src = info.package
        }
    }

    // Load any extension repos
    // Repos listed first should have priority for duplicate ids
    let repos = ex.storage.get('repos', defaultRepo).split(/\r?\n/).reverse()
    let repoRequests = repos.map(repo => fetch(repo).then(r => r.json()))
    Promise.all(repoRequests)
        .then((responses: ExtensionInfo[][]) => {
            flatten(responses).filter(supported).forEach(extension => {
                extensionMap.set(extension.id, extension)
            })
        })
        .then(() => {
            // Load those extensions which should be autoloaded
            ex.storage.get<string[]>('autoload', []).forEach(load)
            createPage()
        })

    function createPage() {
        for (let extension of extensionMap.values()) {
            ui.buildTemplate(
                tab.querySelector('template') as HTMLTemplateElement,
                tab.querySelector('tbody') as HTMLElement,
                [
                    { selector: '[data-for=title]', text: extension.title },
                    { selector: '[data-for=description]', text: extension.description },
                    { selector: '[data-for=author]', text: extension.user },
                    { selector: 'a', ext_id: extension.id },
                ]
            )
        }
    }
})