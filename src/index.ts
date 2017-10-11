import { MessageBot } from '@bhmb/bot'
import { Api, getWorlds } from 'blockheads-api/cloud'
import { WorldInfo } from 'blockheads-api/api'
import { Storage } from './storage'
import '@bhmb/ui'
import '@bhmb/messages'

(window as any)['@bhmb/bot'] = { MessageBot }
const worldId: string = (window as any).worldId

if (location.hostname != 'portal.theblockheads.net') {
    if (confirm('You are not on the portal, go there now?')) {
        location.assign('http://portal.theblockheads.net')
    }
}

if (!worldId) {
    alert('You must be on a world page to start the bot')
    throw new Error('Bad page')
}

MessageBot.dependencies = { Api, getWorlds }

let info: WorldInfo = {
    name: (document.querySelector('#title') as HTMLElement).textContent as string,
    id: worldId + ''
}

let bot = new MessageBot(new Storage(''), info)
bot.addExtension('ui')
bot.addExtension('messages')
;(document.querySelector('.nav-item') as HTMLElement).click()
