import { MessageBot as CustomBot } from './bot'
import { MessageBot, SimpleEvent } from '@bhmb/bot'
import { Api, getWorlds } from 'blockheads-cloud-api'
import { WorldInfo } from 'blockheads-api-interface'
import { Storage } from './storage'
import '@bhmb/ui'
import '@bhmb/messages'
import '@bhmb/console'
import './settings'
import './extensions'

if ((window as any)['@bhmb/bot']) {
    throw new Error('Bot already loaded.')
}

(window as any)['@bhmb/bot'] = { MessageBot, SimpleEvent }
const worldId: string = (window as any).worldId.toString()

if (location.hostname != 'portal.theblockheads.net') {
    if (confirm('You are not on the portal, go there now?')) {
        location.assign('http://portal.theblockheads.net')
    }
}

if (!worldId) {
    alert('You must be on a world page to start the bot')
    throw new Error('Bad page')
}
// Kill the original listener
(window as any).pollChat = () => {}

MessageBot.dependencies = { Api, getWorlds, fetch }

let info: WorldInfo = {
    name: (document.querySelector('#title') as HTMLElement).textContent as string,
    id: worldId
}

async function main() {
    let bot = new CustomBot(new Storage(`/${worldId}`), info)
    bot.addExtension('ui')
    bot.addExtension('console')
    ;(document.querySelector('.nav-item') as HTMLElement).click()
    bot.addExtension('messages')
    bot.addExtension('settings')
    bot.addExtension('extensions')

    // Check to see if the bot is loaded already
    const loadChecker = (event: StorageEvent) => {
        if (event.key === 'load_indicator' + worldId && event.newValue === '1') {
            localStorage.setItem('already_loaded' + worldId, '1')
            localStorage.setItem('load_indicator' + worldId, '0')
        }
    }
    const loadWarner = (event: StorageEvent) => {
        if (event.key === 'already_loaded' + worldId && event.newValue === '1') {
            localStorage.setItem('already_loaded' + worldId, '0')
            bot.getExports('ui')!
                .alert('Warning: The bot is already loaded in another tab. If you leave this tab open, your storage may be overwritten and messages may be sent twice.')
        }
    }
    addEventListener('storage', loadChecker)
    addEventListener('storage', loadWarner)
    // Fire the event so that we will be warned if another tab is already opened
    localStorage.setItem('load_indicator' + worldId, '1')
    // Reset the load indicator so that if another tab isn't opened, we will get an event when it is opened.
    localStorage.setItem('load_indicator' + worldId, '0')

    bot.start()
    await bot.world.start()
    await bot.world.getLists(true)
}
main()

