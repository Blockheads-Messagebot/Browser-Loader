import { MessageBot } from '@bhmb/bot'
import { UIExtensionExports } from '@bhmb/ui'

import html from './settings.html'

import { defaultRepo } from './extensions'

const settingDefaults: [string, string | number | boolean][] = [
    // General
    ['messages/announcementDelay', 10],
    ['messages/maxResponses', 3],
    ['console/logJoinIps', true],
    ['console/logUnparsedMessages', true],
    // Advanced
    ['messages/regexTriggers', false],
    ['messages/disableWhitespaceTrimming', false],
    ['splitMessages', false],
    ['splitToken', '<split>'],
    ['extensions/devMode', false],
    ['extensions/repos', defaultRepo],
]

MessageBot.registerExtension('settings', function (ex) {
    let settingsRoot = ex.bot.storage
    let ui = ex.bot.getExports('ui') as UIExtensionExports

    let tab = ui.addTab('Settings')
    tab.innerHTML = html

    for (let [key, def] of settingDefaults) {
        let el = tab.querySelector(`[data-target="${key}"]`) as HTMLInputElement

        if (typeof def == 'boolean') {
            el.checked = settingsRoot.get(key, def)
        } else {
            el.value = String(settingsRoot.get(key, def))
        }
    }

    tab.addEventListener('change', () => {
        for (let [key, def] of settingDefaults) {
            let el = tab.querySelector(`[data-target="${key}"]`) as HTMLInputElement

            if (typeof def == 'boolean') {
                settingsRoot.set(key, el.checked)
            } else if (typeof def == 'number') {
                settingsRoot.set(key, +el.value)
            } else {
                settingsRoot.set(key, el.value)
            }
        }
    })

    function importBackup(backup: string) {
        let parsed: { [k: string]: string }
        try {
            parsed = JSON.parse(backup)
            if (parsed === null) {
                throw new Error('Invalid backup')
            }
        } catch (e) {
            ui.notify('Invalid backup code. No action taken.')
            return
        }

        localStorage.clear()

        Object.keys(parsed).forEach((key) => {
            localStorage.setItem(key, parsed[key])
        })

        location.reload()
    }

    (tab.querySelector('[data-do=show_backup]') as HTMLElement).addEventListener('click', () => {
        // Must be loaded in a browser, so safe to use localStorage
        let backup = JSON.stringify(localStorage).replace(/</g, '&lt;')
        ui.alert(`<p>Copy this to a safe place.</p><textarea class="textarea">${backup}</textarea>`)
    })

    ;(tab.querySelector('[data-do=import_backup]') as HTMLElement).addEventListener('click', () => {
        ui.prompt('Enter your backup code, this will reload the page:', result => {
            if (result) {
                importBackup(result)
            }
        })
    })

    ;(tab.querySelector('[data-do=download_backup]') as HTMLElement).addEventListener('click', () => {
        let backup = JSON.stringify(localStorage, undefined, 4)

        let element = document.createElement('a')
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(backup))
        element.setAttribute('download', 'bot_backup.txt')

        element.style.display = 'none'
        document.body.appendChild(element)

        element.click()

        document.body.removeChild(element)
    })

    ;(tab.querySelector('[data-do=upload_backup]') as HTMLElement).addEventListener('click', () => {
        if (!File || !FileReader || !FileList || !Blob) {
            ui.notify(`It looks like your browser doesn't support this.`)
            return
        }

        let input = document.createElement('input')
        input.type = 'file'
        input.addEventListener('change', () => {
            if (!input.files || input.files[0].type != 'text/plain') {
                ui.notify('Upload a text file.')
                return
            }

            let reader = new FileReader()
            reader.addEventListener('load', () => {
                importBackup(reader.result as string)
            })

            reader.readAsText(input.files[0])
        })

        input.click()
    })

    ex.remove = function () {
        ui.removeTab(tab)
    }
})