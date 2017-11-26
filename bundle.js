(function (crypto) {
'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */





function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
}







function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class MessageBotExtension {
    /**
     * Creates a new extension.
     * @param id the extension id
     * @param bot the bot that this extension is loaded from
     */
    constructor(id, bot) {
        this.bot = bot;
        /**
         * Any exports that other extensions may call.
         */
        this.exports = {};
        this.storage = bot.storage.prefix(id);
        this.world = bot.world;
    }
    /**
     * Removes the extension, listeners and ui should be removed here. Stored settings should not be removed.
     */
    remove() { }
    /**
     * Removes the extension. All listeners should be removed here.
     */
    uninstall() {
        this.remove();
        this.storage.clear();
    }
}

function equalCaseInsensitive(a, b) {
    return a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;
}
function arrayContainsAny(haystack, ...needles) {
    return haystack.some(item => needles.some(needle => equalCaseInsensitive(item, needle)));
}
/**
 * Player class which is returned by the [[World.getPlayer]] method. Should not be created by any other method.
 */
class Player {
    /**
     * Creates a new instance of the Player class.
     *
     * @param name The name of the player.
     * @param info The player info stored between bot launches.
     */
    constructor(name, info, lists) {
        this._name = name;
        this._info = info;
        this._lists = lists;
    }
    /**
     * Gets the player's name.
     */
    get name() {
        return this._name;
    }
    /**
     * Gets the most recently used IP of the player.
     */
    get ip() {
        return this._info.ip;
    }
    /**
     * Gets the all IPs used by the player on the world.
     */
    get ips() {
        return [...this._info.ips];
    }
    /**
     * Gets the number of times the player has joined the server.
     */
    get joins() {
        return this._info.joins;
    }
    /**
     * Checks if the player has joined the server.
     */
    get hasJoined() {
        return this.joins > 0;
    }
    /**
     * Returns true if the player is the owner of the server or is the server.
     */
    get isOwner() {
        return !!this._info.owner || this._name == 'SERVER';
    }
    /**
     * Checks if the player is an admin or the owner.
     */
    get isAdmin() {
        // A player is admin if their name or their latest IP is listed on the adminlist, or they are the owner.
        return this.isOwner || arrayContainsAny(this._lists.adminlist, this._name, this._info.ip);
    }
    /**
     * Checks if the player is a mod without admin permissions.
     */
    get isMod() {
        // A player is mod if their name or their latest IP is on the modlist
        return !this.isAdmin && arrayContainsAny(this._lists.modlist, this._name, this._info.ip);
    }
    /**
     * Checks if the player is an admin or a mod.
     */
    get isStaff() {
        return this.isAdmin || this.isMod;
    }
    /**
     * Checks if the player is whitelisted. Is true if the player can join the server while it is whitelisted.
     */
    get isWhitelisted() {
        // A player is whitelisted if they are staff or if their name or latest ip is on the whitelist.
        return this.isStaff || arrayContainsAny(this._lists.whitelist, this._name, this._info.ip);
    }
    /**
     * Checks if the player is banned.
     */
    get isBanned() {
        return !this.isStaff && this._lists.blacklist
            .some(entry => {
            // We don't know the current player's device ID so can't check for that on the blacklist
            // If the player's name is on the blacklist, they are banned.
            // If an IP the player has used is banned, they are *probably* banned, so guess that they are.
            // Remove device ID from blacklist entry, if there is one
            if (entry.includes(' \\'))
                entry = entry.substr(0, entry.indexOf(' \\'));
            if (equalCaseInsensitive(this._name, entry))
                return true;
            if (this._info.ips.includes(entry))
                return true;
            return false;
        });
    }
}

/**
 * An event which can be subscribed to and dispatched
 */
class SimpleEvent {
    constructor() {
        this.subscribers = [];
    }
    /**
     * Subscribe to the event.
     * @param listener The listener which will be called when the event is dispatched.
     */
    sub(listener) {
        this.subscribers.push({ listener, once: false });
    }
    /**
     * Unsubscribe from the event.
     * @param listener The listener to remove.
     */
    unsub(listener) {
        let index = this.subscribers.findIndex(sub => listener == sub.listener);
        if (index != -1) {
            this.subscribers.splice(index, 1);
        }
    }
    /**
     * Subscribes to the event only once.
     * @param listener The listener which will be called when the event is dispatched.
     */
    one(listener) {
        this.subscribers.push({ listener, once: true });
    }
    /**
     * Dispatches an event, calling all listeners.
     * @param arg the argument to call listeners with.
     */
    dispatch(arg) {
        this.subscribers.forEach(({ listener, once }) => {
            if (once)
                this.unsub(listener);
            listener(arg);
        });
    }
    /**
     * A helper to avoid exposing undesirable events.
     */
    asEvent() {
        let that = this;
        return {
            sub(listener) {
                return that.sub(listener);
            },
            one(listener) {
                return that.one(listener);
            },
            unsub(listener) {
                return that.unsub(listener);
            },
        };
    }
}

var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Internal class used by the [[World]] class to watch chat.
 * @hidden
 */
class ChatWatcher {
    /**
     * Creates a new ChatWatcher
     * @param api the api to be used to communicate with chat
     * @param online a shared array with the host world class that this class keeps up to date.
     */
    constructor(api, online) {
        this.api = api;
        this.online = online;
        this._onMessage = new SimpleEvent();
        this._onJoin = new SimpleEvent();
        this._onLeave = new SimpleEvent();
        this._onOther = new SimpleEvent();
        this.timeoutId = null;
        /**
         * Parses a chat message, firing the appropriate events if required.
         */
        this.parse = (message) => {
            let parseError = () => {
                this._onOther.dispatch(message);
            };
            if (/^[^a-z]+ - Player Connected /.test(message)) {
                try {
                    let [, name, ip] = message.match(/Connected ([^a-z]{3,}) \| ([\d.]+) \| .{32}$/);
                    if (!this.online.includes(name)) {
                        this.online.includes(name) || this.online.push(name);
                        this._onJoin.dispatch({ name, ip });
                        return;
                    }
                }
                catch (_) { }
                return parseError();
            }
            if (/^[^a-z]+ - Player Disconnected /.test(message)) {
                try {
                    let [, name] = message.match(/Disconnected ([^a-z]{3,})$/);
                    if (this.online.includes(name)) {
                        this.online.splice(this.online.indexOf(name), 1);
                        this._onLeave.dispatch(name);
                        return;
                    }
                }
                catch (_) { }
                return parseError();
            }
            if (message.slice(0, 18).includes(': ')) {
                let name = this.getUser(message);
                if (name) {
                    message = message.substr(name.length + 2);
                    if (name == 'SERVER' && message.startsWith('/')) {
                        return parseError();
                    }
                    this._onMessage.dispatch({ name, message });
                    return;
                }
            }
            return parseError();
        };
        /**
         * Continually checks chat for new messages
         * @param lastId the ID to pass to the API to get only most recent messages.
         */
        this.checkChat = (lastId) => __awaiter$2(this, void 0, void 0, function* () {
            try {
                let { log, nextId } = yield this.api.getMessages(lastId);
                if (this.timeoutId == null)
                    return;
                log.forEach(this.parse);
                this.timeoutId = setTimeout(this.checkChat, 5000, nextId);
            }
            catch (_) {
                // Network error, wait 30 seconds before retrying
                this.timeoutId = setTimeout(this.checkChat, 30000, 0);
                return;
            }
        });
    }
    /**
     * Event which fires when a player joins the server.
     */
    get onJoin() {
        return this._onJoin.asEvent();
    }
    /**
     * Event which fires when a player leaves the server.
     */
    get onLeave() {
        return this._onLeave.asEvent();
    }
    /**
     * Event which fires when a player sends a message in chat.
     */
    get onMessage() {
        return this._onMessage.asEvent();
    }
    /**
     * Event which fires when a chat message cannot be parsed as a message, join, or leave.
     */
    get onOther() {
        return this._onOther.asEvent();
    }
    /**
     * True if the watcher is currently running, otherwise false.
     */
    get running() {
        return this.timeoutId != null;
    }
    /**
     * Starts the listener. Calling multiple times will not result in multiple listeners being started.
     */
    start() {
        if (this.timeoutId)
            this.stop();
        this.timeoutId = setTimeout(this.checkChat, 0, 0);
    }
    /**
     * Stops the listener if it is running. If not running, does nothing.
     */
    stop() {
        if (this.timeoutId)
            clearTimeout(this.timeoutId);
        this.timeoutId = null;
    }
    /**
     * Parses a message to extract a player name.
     * @param message the message to extract a name from.
     */
    getUser(message) {
        for (let i = 18; i > 4; i--) {
            let possibleName = message.substring(0, message.lastIndexOf(': ', i));
            if (this.online.includes(possibleName) || possibleName == 'SERVER') {
                return possibleName;
            }
        }
        // Player is most likely offline
        if (/[^a-z]{3,16}: /.test(message))
            return message.substring(0, message.lastIndexOf(': ', 18));
        // Invalid name
        return '';
    }
}

var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const cloneDate = (d) => new Date(d.getTime());
const PLAYERS_KEY = 'mb_players';
class World {
    constructor(api, storage) {
        this._cache = {};
        this._events = {
            onJoin: new SimpleEvent(),
            onLeave: new SimpleEvent(),
            onMessage: new SimpleEvent(),
        };
        this._online = [];
        this._lists = { adminlist: [], modlist: [], whitelist: [], blacklist: [] };
        this._commands = new Map();
        /**
         * Gets an overview of the server info
         */
        this.getOverview = (refresh = false) => __awaiter$1(this, void 0, void 0, function* () {
            if (!this._cache.overview || refresh) {
                let overview = yield (this._cache.overview = this._api.getOverview());
                // Add online players to the online list if they aren't already online
                overview.online.forEach(name => this._online.includes(name) || this._online.push(name));
                // Make sure the owner has the owner flag set to true
                this._storage.with(PLAYERS_KEY, {}, players => {
                    players[overview.owner] = players[overview.owner] || { ip: '', ips: [], joins: 0 };
                    players[overview.owner].owner = true;
                });
            }
            let overview = yield this._cache.overview;
            return Object.assign({}, overview, { created: cloneDate(overview.created), last_activity: cloneDate(overview.last_activity), credit_until: cloneDate(overview.credit_until), online: this.online });
        });
        /**
         * Returns the current world status, will always make a request to the server.
         */
        this.getStatus = () => this._api.getStatus();
        /**
         * Gets the server's lists
         */
        this.getLists = (refresh = false) => {
            if (!this._cache.lists || refresh) {
                this._cache.lists = this._api.getLists().then(lists => this._lists = lists);
            }
            return this._cache.lists
                .then(lists => ({
                adminlist: [...lists.adminlist],
                modlist: [...lists.modlist],
                whitelist: [...lists.whitelist],
                blacklist: [...lists.blacklist]
            }));
        };
        /**
         * Sets the server's lists and reloads the world lists if required.
         *
         * @param lists WorldLists one or more list to update. If a list is not provided it will not be changed.
         * @return a promise which will resolve when the lists have been updated, or throw if an error occurred.
         */
        this.setLists = (lists) => __awaiter$1(this, void 0, void 0, function* () {
            let currentLists = yield this.getLists();
            yield this._api.setLists(Object.assign({}, currentLists, lists));
            yield this.getLists(true);
        });
        /**
         * Gets the server logs
         *
         * @param refresh if true, will get the latest logs, otherwise will returned the cached version.
         */
        this.getLogs = (refresh = false) => __awaiter$1(this, void 0, void 0, function* () {
            if (!this._cache.logs || refresh)
                this._cache.logs = this._api.getLogs();
            let lines = yield this._cache.logs;
            return lines.slice().map(line => (Object.assign({}, line, { timestamp: cloneDate(line.timestamp) })));
        });
        /**
         * Sends the specified message, returns a promise that will reject if the send fails and resolve otherwise.
         *
         * @param message the message to send
         */
        this.send = (message) => {
            if (message.startsWith('/'))
                this._events.onMessage.dispatch({ player: this.getPlayer('SERVER'), message });
            return this._api.send(message);
        };
        /**
         * Gets a specific player by name
         */
        this.getPlayer = (name) => {
            name = name.toLocaleUpperCase();
            let players = this._storage.get(PLAYERS_KEY, {});
            return new Player(name, players[name] || { ip: '', ips: [], joins: 0 }, this._lists);
        };
        /**
         * Adds a listener for a single command, can be used when a command can be statically matched.
         *
         * @param command the command that the listener should be called for, case insensitive
         * @param listener the function which should be called whenever the command is used
         * @example
         * world.addCommand('marco', () => { ex.bot.send('Polo!'); });
         */
        this.addCommand = (command, listener) => {
            command = command.toLocaleUpperCase();
            if (this._commands.has(command)) {
                throw new Error(`The command "${command}" has already been added.`);
            }
            this._commands.set(command, listener);
        };
        /**
         * Removes a listener for a command, if it exists.
         *
         * @param command the command for which the listener should be removed.
         */
        this.removeCommand = (command) => {
            this._commands.delete(command.toLocaleUpperCase());
        };
        /**
         * Starts the world, if it is not already started. Will not reject.
         */
        this.start = () => this._api.start();
        /**
         * Stops the world if it is running. Will not throw.
         */
        this.stop = () => this._api.stop();
        /**
         * Sends a restart request, if the world is offline no actions will be taken.
         */
        this.restart = () => this._api.restart();
        this._api = api;
        this._storage = storage;
        this._createWatcher();
        this.getOverview(); // Sets the owner, gets initial online players
        this.getLists(); // Loads the current server lists
    }
    /**
     * Fires whenever a player joins the server
     */
    get onJoin() {
        return this._events.onJoin.asEvent();
    }
    /**
     * Fires whenever a player leaves the server.
     */
    get onLeave() {
        return this._events.onLeave.asEvent();
    }
    /**
     * Fires whenever a player or the server sends a message in chat.
     * Includes messages starting with /
     */
    get onMessage() {
        return this._events.onMessage.asEvent();
    }
    /**
     * Fires whenever a message that cannot be parsed is encountered.
     */
    get onOther() {
        // This class doesn't do anything with the onOther events, so just pass it through.
        return this._chatWatcher.onOther;
    }
    /**
     * Gets the currently online players
     */
    get online() {
        return [...this._online];
    }
    /**
     * Gets all players who have joined the server
     */
    get players() {
        let players = this._storage.get(PLAYERS_KEY, {});
        return Object.keys(players).map(this.getPlayer);
    }
    /**
     * Internal init function
     */
    _createWatcher() {
        let watcher = this._chatWatcher = new ChatWatcher(this._api, this._online);
        watcher.onJoin.sub(({ name, ip }) => {
            name = name.toLocaleUpperCase();
            this._storage.with(PLAYERS_KEY, {}, players => {
                let player = players[name] = players[name] || { ip, ips: [ip], joins: 0 };
                player.joins++;
                player.ip = ip;
                if (!player.ips.includes(ip))
                    player.ips.push(ip);
            });
            this._events.onJoin.dispatch(this.getPlayer(name));
        });
        watcher.onLeave.sub(name => this._events.onLeave.dispatch(this.getPlayer(name)));
        watcher.onMessage.sub(({ name, message }) => {
            this._events.onMessage.dispatch({ player: this.getPlayer(name), message });
        });
        this.onMessage.sub(({ player, message }) => {
            if (/^\/[^ ]/.test(message)) {
                let [, command, args] = message.match(/^\/([^ ]+) ?(.*)$/);
                let handler = this._commands.get(command.toLocaleUpperCase());
                if (handler)
                    handler(player, args);
            }
        });
        watcher.start();
    }
}

/**
 * The storage class used by the [[MessageBot]] class and all [[MessageBotExtension]] instances.
 */
class Storage {
    /**
     * Utility method to use and automatically save a key
     * @param key the key use when getting and setting the value
     * @param fallback the fallback if the key doesn't exist
     * @param callback the function to be called with the data, if the callback returns null or undefined, it is assumed that the value has been mutated and will be saved.
     */
    with(key, fallback, callback) {
        let value = this.get(key, fallback);
        let result = callback(value);
        this.set(key, result == null ? value : result);
    }
}

var __rest$1 = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
let registeredExtensions = new Map();
let extensionRegistered = new SimpleEvent();
let extensionDeregistered = new SimpleEvent();
class MessageBot$1 {
    /**
     *
     * @param storage The storage instance to be used by the bot.
     * @param info The world info that is used to create the API to interact with the world.
     */
    constructor(storage, info) {
        this.storage = storage;
        /**
         * All loaded extension instances for this bot.
         */
        this._extensions = new Map();
        if (!MessageBot$1.dependencies)
            throw new Error('Dependencies must be set before creating this class.');
        this.world = new World(new MessageBot$1.dependencies.Api(info), storage);
    }
    /**
     * Registers an extension that can be loaded by instances of the bot.
     * Note: If an extension has already been loaded from a previously registered initializer, it will not be overwritten.
     * @param id the extension ID, will be normalized to lower case.
     * @param initializer the function to be called to set up the extension.
     */
    static registerExtension(id, initializer) {
        id = id.toLocaleLowerCase();
        registeredExtensions.set(id, initializer);
        extensionRegistered.dispatch(id);
    }
    /**
     * Removes an extension initializer from the registry, can be used to prevent an extension from being loaded in multiple bots at once (generally a bad idea).
     * @param id the id of the extension to deregister
     */
    static deregisterExtension(id) {
        id = id.toLocaleLowerCase();
        if (registeredExtensions.delete(id)) {
            extensionDeregistered.dispatch(id);
        }
    }
    /**
     * An array of all registered extensions.
     */
    static get extensions() {
        return [...registeredExtensions.keys()];
    }
    /**
     * An array of currently loaded extension ids
     */
    get extensions() {
        return [...this._extensions.keys()];
    }
    /**
     * Shortcut for `MessageBot.dependencies.fetch`
     */
    get fetch() {
        return MessageBot$1.dependencies.fetch;
    }
    /**
     * Gets the exports of an extension, returns undefined if the extension is not loaded.
     * @param id the extension id to get exports from
     */
    getExports(id) {
        let ex = this._extensions.get(id.toLocaleLowerCase());
        if (ex)
            return ex.exports;
    }
    /**
     * Adds an extension to this bot. Calls the init function supplied when registering the extension.
     * @param id the id of the registered extension to add.
     */
    addExtension(id) {
        id = id.toLocaleLowerCase();
        if (this._extensions.has(id))
            throw new Error(`The ${id} extension has already been added.`);
        let creator = registeredExtensions.get(id);
        if (!creator)
            throw new Error(`The ${id} extension has not been registered.`);
        let ex = new MessageBotExtension(id, this);
        this._extensions.set(id, ex);
        creator.call(ex, ex, this.world);
    }
    /**
     * Removes a currently loaded extension. Should not be used by published extensions unless
     * the extension is an extension manager.
     * @param id the id of the extension to remove
     * @param uninstall whether or not the extension should be completely removed, or just unloaded.
     */
    removeExtension(id, uninstall) {
        id = id.toLocaleLowerCase();
        let ex = this._extensions.get(id);
        if (!ex)
            throw new Error(`The ${id} extension is not registered.`);
        try {
            if (uninstall) {
                ex.uninstall();
            }
            else {
                ex.remove();
            }
        }
        finally {
            this._extensions.delete(id);
        }
    }
    /**
     * Sends a message to the world for this bot, should usually be used in place of world.send.
     *
     * @param message the message to send
     * @param params any variables to inject into the message. If `name` is provided, it will be available through {{NAME}}, {{Name}} and {{name}}
     */
    send(message, _a = {}) {
        var params = __rest$1(_a, []);
        // Common enough to be done here, set the name of the player up right.
        if (params.name && params.name.length) {
            let name = params.name.toLocaleLowerCase();
            params = Object.assign({}, params, { name, Name: name[0].toLocaleUpperCase() + name.substr(1), NAME: name.toLocaleUpperCase() });
        }
        let safeKeyRegex = Object.keys(params)
            .map(key => key.replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1'))
            .join('}}|{{');
        // Don't bother replacing if nothing to search for
        if (safeKeyRegex.length) {
            message = message.replace(new RegExp(`{{${safeKeyRegex}}}`, 'g'), (key) => {
                return params[key.substring(2, key.length - 2)];
            });
        }
        this.world.send(message).catch(() => { });
    }
}
/**
 * An event that fires whenever an extension is registered or re-registered.
 */
MessageBot$1.extensionRegistered = extensionRegistered.asEvent();
/**
 * An event that fires when an extension is deregistered, if it has been registered. Will not fire when an extension is re-registered.
 */
MessageBot$1.extensionDeregistered = extensionDeregistered.asEvent();

// Custom bot class to support splitting messages
class MessageBot$$1 extends MessageBot$1 {
    send(message, _a = {}) {
        var params = __rest(_a, []);
        let messages;
        // Split the message if splitting is enabled.
        if (this.storage.get('splitMessages', false)) {
            messages = message.split(this.storage.get('splitToken', '<split>'));
        }
        else {
            messages = [message];
        }
        for (let msg of messages) {
            super.send(msg, params);
        }
    }
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */













function __awaiter$3(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

/**
 * This module should not be used by consumers of this library.
 * @private
 */
/**
 * Parses logs from the portal into a standard format. If you are consuming this library, you don't need to know anything about it.
 * @private
 */
class LogParser {
    /**
     * Creates a new instance of the LogParser class.
     */
    constructor() {
        /**
         * Parses the logs into a standard format.
         *
         * @param lines the raw log lines.
         */
        this.parse = (lines) => {
            // Copy the lines array
            lines = lines.slice(0);
            // Assume first line is valid, if it isn't it will be dropped.
            for (let i = lines.length - 1; i > 0; i--) {
                const line = lines[i];
                if (!this.isValidLine(line)) {
                    lines[i - 1] += '\n' + lines.splice(i, 1);
                    continue;
                }
                this.addLine(line);
            }
            if (this.isValidLine(lines[0])) {
                this.addLine(lines[0]);
            }
            const entries = this.entries.reverse();
            this.entries = [];
            return entries;
        };
        this.isValidLine = (line) => {
            return /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3} blockheads_server/.test(line);
        };
        this.addLine = (line) => {
            const ts = line.substr(0, 24)
                .replace(' ', 'T')
                .replace(' ', 'Z');
            this.entries.push({
                raw: line,
                timestamp: new Date(ts),
                message: line.substr(line.indexOf(']') + 2)
            });
        };
        this.entries = [];
    }
}

const root = 'http://portal.theblockheads.net';
let request;
try {
    request = fetch;
}
catch (_) { }
function unescapeHTML(html) {
    const map = {
        'lt': '<',
        'gt': '>',
        'amp': '&',
        '#39': '\'',
        'quot': '"',
    };
    return html.replace(/&(lt|gt|amp|#39|quot);/g, (_, first) => map[first]);
}
function makeRequest(url, options = {}) {
    const headers = { 'X-Requested-With': 'XMLHttpRequest' };
    if (options.method == 'POST') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    return request(`${root}${url}`, Object.assign({ mode: 'same-origin', credentials: 'same-origin', redirect: 'follow', 
        // Typescript incorrectly throws an error due to types here
        headers: headers }, options));
}
function requestJSON(url, options) {
    return makeRequest(url, options).then(r => r.json());
}
function requestPage(url, options) {
    return makeRequest(url, options).then(r => r.text());
}
/**
* Gets all worlds owned by the logged in user.
*/
function getWorlds() {
    return __awaiter$3(this, void 0, void 0, function* () {
        const page = yield requestPage('/worlds');
        const lines = page.split('\n');
        const worlds = [];
        lines.forEach(line => {
            if (/\t\tupdateWorld/.test(line)) {
                const name = line.match(/name: '([^']+?)'/);
                const id = line.match(/id: (\d+)/);
                worlds.push({
                    name: unescapeHTML(name[1]),
                    id: id[1]
                });
            }
        });
        return worlds;
    });
}
/** @inheritdoc */
class Api {
    constructor(info) {
        this.info = info;
        this.parser = new LogParser();
        /** @inheritdoc */
        this.getLists = () => __awaiter$3(this, void 0, void 0, function* () {
            const page = yield requestPage(`/worlds/lists/${this.info.id}`);
            const getList = (name) => {
                let names = [];
                const list = page.match(new RegExp(`<textarea name="${name}">([\\s\\S]*?)</textarea>`));
                if (list) {
                    names = unescapeHTML(list[1])
                        .split(/\r?\n/);
                }
                // Remove duplicates / blank lines
                return Array.from(new Set(names)).filter(Boolean);
            };
            return {
                adminlist: getList('admins'),
                modlist: getList('modlist'),
                whitelist: getList('whitelist'),
                blacklist: getList('blacklist'),
            };
        });
        /** @inheritdoc */
        this.setLists = (lists) => __awaiter$3(this, void 0, void 0, function* () {
            const makeSafe = (list) => encodeURIComponent(list.join('\n'));
            let body = `admins=${makeSafe(lists.adminlist)}`;
            body += `&modlist=${makeSafe(lists.modlist)}`;
            body += `&whitelist=${makeSafe(lists.whitelist)}`;
            body += `&blacklist=${makeSafe(lists.blacklist)}`;
            yield requestJSON(`/worlds/lists/${this.info.id}`, {
                method: 'POST',
                body
            });
        });
        /** @inheritdoc */
        this.getOverview = () => __awaiter$3(this, void 0, void 0, function* () {
            const page = yield requestPage(`/worlds/${this.info.id}`);
            const firstMatch = (r, fallback = '') => {
                const m = page.match(r);
                return m ? m[1] : fallback;
            };
            const privacy = firstMatch(/^\$\('#privacy'\).val\('(.*?)'\)/m, 'public');
            let online = [];
            const match = page.match(/^\t<tr><td class="left">(.*?)(?=<\/td>)/gm);
            if (match) {
                online = online.concat(match.map(s => s.substr(22)));
            }
            // This is very messy, refactoring welcome.
            return {
                name: firstMatch(/^\t<title>(.*?) Manager \| Portal<\/title>$/m),
                owner: firstMatch(/^\t\t<td class="right">Owner:<\/td>\r?\n\t\t<td>(.*?)<\/td>$/m),
                created: new Date(firstMatch(/^\t\t<td>Created:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                last_activity: new Date(firstMatch(/^\t\t<td>Last Activity:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                credit_until: new Date(firstMatch(/^\t\t<td>Credit Until:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                link: firstMatch(/^\t<tr><td>Link:<\/td><td><a href="(.*?)">\1<\/a>/m),
                pvp: !!firstMatch(/^\$\('#pvp'\)\./m),
                privacy,
                password: firstMatch(/^\t\t<td>Password:<\/td><td>(Yes|No)<\/td><\/tr>$/m) == 'Yes',
                size: firstMatch(/^\t\t<td>Size:<\/td><td>(.*?)<\/td>$/m),
                whitelist: firstMatch(/<td>Whitelist:<\/td><td>(Yes|No)<\/td>/m) == 'Yes',
                online,
                status: firstMatch(/^updateWorld\({id: \d+, worldStatus: '(.*?)'/m)
            };
        });
        /** @inheritdoc */
        this.getLogs = () => {
            return requestPage(`/worlds/logs/${this.info.id}`)
                .then(log => log.split('\n'))
                .then(lines => this.parser.parse(lines));
        };
        /** @inheritdoc */
        this.getMessages = (lastId = 0) => {
            return requestJSON('/api', {
                method: 'POST',
                body: `command=getchat&worldId=${this.info.id}&firstId=${lastId}`
            })
                .then(({ status, log, nextId }) => {
                if (status != 'ok')
                    return { log: [], nextId: 0 }; // Reset, world likely offline.
                return { nextId, log };
            }, () => ({ log: [], nextId: lastId })); //Network error, don't reset nextId
        };
        /** @inheritdoc */
        this.getStatus = () => {
            return requestJSON('/api', {
                method: 'POST',
                body: `command=status&worldId=${this.info.id}`
            }).then(response => response.worldStatus);
        };
        /** @inheritdoc */
        this.send = (message) => {
            return requestJSON('/api', {
                method: 'POST',
                body: `command=send&worldId=${this.info.id}&message=${encodeURIComponent(message)}`
            }).then(result => {
                if (result.status == 'ok')
                    return;
                throw new Error(`Unable to send ${message}`);
            });
        };
        /** @inheritdoc */
        this.start = () => {
            return requestJSON('/api', {
                method: 'POST',
                body: `command=start&worldId=${this.info.id}`
            })
                .then(() => undefined, console.error);
        };
        /** @inheritdoc */
        this.stop = () => {
            return requestJSON('/api', {
                method: 'POST',
                body: `command=stop&worldId=${this.info.id}`
            })
                .then(() => undefined, console.error);
        };
        /** @inheritdoc */
        this.restart = () => {
            return requestJSON('/api', {
                method: 'POST',
                body: `command=reboot&worldId=${this.info.id}`
            })
                .then(() => undefined, console.error);
        };
    }
    /** @inheritdoc */
    get name() {
        return this.info.name;
    }
    /** @inheritdoc */
    get id() {
        return this.info.id;
    }
}

class Storage$1 extends Storage {
    constructor(head) {
        super();
        this.head = head;
        // For readability
        this.head += '/';
    }
    get(key, fallback) {
        // JSON.parse correctly handles null so it's fine to declare this as string.
        let item = localStorage.getItem(this.head + key);
        try {
            let parsed = JSON.parse(item);
            return parsed == null ? fallback : parsed;
        }
        catch (_a) {
            return fallback;
        }
    }
    set(key, value) {
        localStorage.setItem(this.head + key, JSON.stringify(value));
    }
    clear(prefix = '') {
        this.keys(prefix)
            .forEach(key => localStorage.removeItem(this.head + key));
    }
    keys(prefix = '') {
        return Object.keys(localStorage)
            .filter(key => key.startsWith(this.head + prefix))
            .map(key => key.substr(this.head.length));
    }
    prefix(prefix) {
        return new Storage$1(this.head + prefix);
    }
}

var page = "<header class=\"header is-fixed-top\">\r\n    <nav class=\"navbar is-primary\" role=\"navigation\" aria-label=\"main navigation\">\r\n        <div class=\"navbar-brand\">\r\n            <div class=\"navbar-item nav-slider-toggle\">\r\n                <img src=\"https://gitcdn.xyz/cdn/Blockheads-Messagebot/UI/master/logo.png\">\r\n            </div>\r\n            <a class=\"navbar-item nav-slider-toggle\">Menu</a>\r\n        </div>\r\n    </nav>\r\n</header>\r\n\r\n<div class=\"nav-slider-container\">\r\n    <nav class=\"nav-slider\"></nav>\r\n    <div class=\"is-overlay nav-slider-toggle\"></div>\r\n</div>\r\n\r\n<div id=\"container\" class=\"has-fixed-nav\"></div>\r\n\r\n\r\n<div id=\"modal\" class=\"modal\">\r\n    <div class=\"modal-background\"></div>\r\n    <div class=\"modal-card\">\r\n        <header class=\"modal-card-head\"></header>\r\n        <section class=\"modal-card-body\"></section>\r\n        <footer class=\"modal-card-foot\"></footer>\r\n    </div>\r\n</div>\r\n";

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */



















function __values$1(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

function __read$1(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread$1() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read$1(arguments[i]));
    return ar;
}

var api = function () {
    var menuSlider = document.querySelector('.nav-slider-container .nav-slider');
    var toggleMenu = function () { return menuSlider.classList.toggle('is-active'); };
    try {
        for (var _a = __values$1(document.querySelectorAll('.nav-slider-toggle')), _b = _a.next(); !_b.done; _b = _a.next()) {
            var el = _b.value;
            el.addEventListener('click', toggleMenu);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var tabs = new Map();
    var groups = new Map();
    var container = document.getElementById('container');
    var menuContainer = document.querySelector('.nav-slider');
    menuContainer.addEventListener('click', function (event) {
        var nav = event.target;
        var tab = tabs.get(nav);
        if (tab) {
            // Containers
            Array.from(container.children).forEach(function (child) { return child.classList.remove('visible'); });
            tab.classList.add('visible');
            // Nav items
            Array.from(menuContainer.querySelectorAll('span.nav-item')).forEach(function (span) { return span.classList.remove('is-active'); });
            nav.classList.add('is-active');
        }
    });
    var addTab = function (text, groupName) {
        var div = container.appendChild(document.createElement('div'));
        var parent = menuContainer;
        if (groupName)
            parent = groups.get(groupName);
        var nav = parent.appendChild(document.createElement('span'));
        nav.textContent = text;
        nav.classList.add('nav-item');
        tabs.set(nav, div);
        return div;
    };
    var removeTab = function (content) {
        try {
            for (var _a = __values$1(tabs.entries()), _b = _a.next(); !_b.done; _b = _a.next()) {
                var _c = __read$1(_b.value, 2), nav = _c[0], div = _c[1];
                if (div == content) {
                    div.remove();
                    nav.remove();
                    tabs.delete(nav);
                    return;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var e_2, _d;
    };
    var addTabGroup = function (text, groupName, parent) {
        var details = groups.get(groupName);
        if (details) {
            details.children[0].textContent = text;
            return;
        }
        var parentElement = menuContainer;
        if (parent)
            parentElement = groups.get(parent);
        details = parentElement.appendChild(document.createElement('details'));
        details.classList.add('nav-item');
        var summary = details.appendChild(document.createElement('summary'));
        summary.textContent = text;
        groups.set(groupName, details);
    };
    var removeTabGroup = function (groupName) {
        var group = groups.get(groupName);
        if (!group)
            return;
        try {
            for (var _a = __values$1(group.querySelectorAll('span')), _b = _a.next(); !_b.done; _b = _a.next()) {
                var child = _b.value;
                // Unless someone has been purposely messing with the page, this is a safe assertion
                removeTab(tabs.get(child));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_3) throw e_3.error; }
        }
        groups.delete(groupName);
        group.remove();
        var e_3, _c;
    };
    var handleRule = function (rule, element) {
        if (typeof rule.text == 'string') {
            element.textContent = rule.text;
        }
        else if (typeof rule.html == 'string') {
            element.innerHTML = rule.html;
        }
        var blacklist = ['text', 'html', 'selector'];
        if (element instanceof HTMLTextAreaElement && 'value' in rule) {
            element.textContent = rule.value;
            blacklist.push('value');
        }
        //See https://github.com/Blockheads-Messagebot/MessageBot/issues/52
        if (element instanceof HTMLSelectElement && 'value' in rule) {
            var child = element.querySelector("[value=\"" + rule.value + "\"]");
            if (child)
                child.selected = true;
        }
        Object.keys(rule)
            .filter(function (key) { return !blacklist.includes(key); })
            .forEach(function (key) { return element.setAttribute(key, rule[key]); });
    };
    var buildTemplate = function (template, target, rules) {
        if (typeof template == 'string')
            template = document.querySelector(template);
        if (typeof target == 'string')
            target = document.querySelector(target);
        var parent = document.importNode(template.content, true);
        try {
            for (var rules_1 = __values$1(rules), rules_1_1 = rules_1.next(); !rules_1_1.done; rules_1_1 = rules_1.next()) {
                var rule = rules_1_1.value;
                var element = parent.querySelector(rule.selector);
                if (!element) {
                    console.warn("Could not find " + rule.selector, rule);
                    continue;
                }
                handleRule(rule, element);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (rules_1_1 && !rules_1_1.done && (_a = rules_1.return)) _a.call(rules_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        target.appendChild(parent);
        var e_4, _a;
    };
    var notify = function (text, displayTime) {
        if (displayTime === void 0) { displayTime = 3; }
        var el = document.body.appendChild(document.createElement('div'));
        el.classList.add('bot-notification', 'is-active');
        el.textContent = text;
        var timeouts = [
            setTimeout(function () { return el.classList.remove('is-active'); }, displayTime * 1000),
            setTimeout(function () { return el.remove(); }, (displayTime + 1) * 1000)
        ];
        el.addEventListener('click', function () {
            timeouts.forEach(clearTimeout);
            el.remove();
        });
    };
    var alertInstance = {
        active: false,
        queue: []
    };
    var modal = document.getElementById('modal');
    var modalBody = modal.querySelector('.modal-card-body');
    var modalFooter = modal.querySelector('.modal-card-foot');
    var addButton = function (button) {
        var el = modalFooter.appendChild(document.createElement('a'));
        var styles = ['button'];
        if (typeof button == 'object') {
            if (button.style)
                styles.push(button.style);
            el.textContent = button.text;
        }
        else {
            el.textContent = button;
        }
        (_a = el.classList).add.apply(_a, __spread$1(styles));
        var _a;
    };
    var showAlert = function () {
        alertInstance.active = true;
        var _a = alertInstance.queue.shift(), html = _a.html, buttons = _a.buttons, callback = _a.callback;
        modalBody.innerHTML = html;
        Array.isArray(buttons) ? buttons.forEach(addButton) : addButton('OK');
        modal.classList.add('is-active');
        modalFooter.addEventListener('click', function buttonHandler(event) {
            var target = event.target;
            if (target.tagName != 'A')
                return;
            modal.classList.remove('is-active');
            try {
                if (callback)
                    callback.call(null, target.textContent);
            }
            catch (err) {
                console.error('Error calling alert callback', err);
            }
            modalFooter.innerHTML = '';
            modalFooter.removeEventListener('click', buttonHandler);
            alertInstance.active = false;
            if (alertInstance.queue.length)
                showAlert();
        });
    };
    var alert = function (html, buttons, callback) {
        alertInstance.queue.push({ html: html, buttons: buttons, callback: callback });
        if (!alertInstance.active)
            showAlert();
    };
    var prompt = function (text, callback) {
        var p = document.createElement('p');
        p.textContent = text;
        alert(p.outerHTML + "<textarea class=\"textarea\"></textarea>", ['OK', 'Cancel'], function () {
            var el = modalBody.querySelector('textarea');
            if (callback)
                callback(el.value || '');
        });
    };
    return {
        toggleMenu: toggleMenu,
        addTab: addTab,
        removeTab: removeTab,
        addTabGroup: addTabGroup,
        removeTabGroup: removeTabGroup,
        buildTemplate: buildTemplate,
        notify: notify,
        alert: alert,
        prompt: prompt
    };
    var e_1, _c;
};

function polyfill() {
    if (!('open' in document.createElement('details'))) {
        var style = document.createElement('style');
        style.textContent += "details:not([open]) > :not(summary) { display: none !important } details > summary:before { content: \"\u25B6\" display: inline-block font-size: .8em width: 1.5em font-family:\"Courier New\" } details[open] > summary:before { transform: rotate(90deg) }";
        document.head.appendChild(style);
        window.addEventListener('click', function (event) {
            var target = event.target;
            if (target.tagName == 'SUMMARY') {
                var details = target.parentNode;
                if (!details) {
                    return;
                }
                if (details.getAttribute('open')) {
                    details.open = false;
                    details.removeAttribute('open');
                }
                else {
                    details.open = true;
                    details.setAttribute('open', 'open');
                }
            }
        });
    }
}

MessageBot$1.registerExtension('ui', function (ex) {
    if (typeof document == 'undefined') {
        throw new Error('This extension cannot be loaded outside of a browser environment.');
    }
    ex.uninstall = function () {
        throw new Error('The UI extension cannot be removed once loaded');
    };
    // Page creation
    document.body.innerHTML = page;
    document.head.querySelectorAll('link').forEach(function (el) { return el.remove(); });
    var style = document.head.appendChild(document.createElement('link'));
    style.rel = 'stylesheet';
    style.href = 'https://gitcdn.xyz/cdn/Blockheads-Messagebot/UI/master/index.css';
    polyfill();
    // Expose api
    ex.exports = api();
});

function checkJoins(player, message) {
    return player.joins >= message.joins_low && player.joins <= message.joins_high;
}
function checkGroups(player, message) {
    return isInGroup(player, message.group) && !isInGroup(player, message.not_group);
}
function isInGroup(player, group) {
    switch (group) {
        case 'all':
            return true;
        case 'staff':
            return player.isStaff;
        case 'mod':
            return player.isMod;
        case 'admin':
            return player.isAdmin;
        case 'owner':
            return player.isOwner;
        default:
            return false;
    }
}

class RemovableMessageHelper {
    constructor(id, ex) {
        this.id = id;
        this.ex = ex;
    }
    get messages() {
        return this.ex.storage.get(this.id, []);
    }
}
class JoinListener extends RemovableMessageHelper {
    constructor(ex) {
        super('joinArr', ex);
        this.listener = (player) => {
            for (let msg of this.messages) {
                if (checkJoins(player, msg) && checkGroups(player, msg)) {
                    this.ex.bot.send(msg.message, { name: player.name });
                }
            }
        };
        this.ex.world.onJoin.sub(this.listener);
    }
    remove() {
        this.ex.world.onJoin.unsub(this.listener);
    }
}
class LeaveListener extends RemovableMessageHelper {
    constructor(ex) {
        super('leaveArr', ex);
        this.listener = (player) => {
            for (let msg of this.messages) {
                if (checkJoins(player, msg) && checkGroups(player, msg)) {
                    this.ex.bot.send(msg.message, { name: player.name });
                }
            }
        };
        this.ex.world.onLeave.sub(this.listener);
    }
    remove() {
        this.ex.world.onLeave.unsub(this.listener);
    }
}
class TriggerListener extends RemovableMessageHelper {
    constructor(ex) {
        super('triggerArr', ex);
        this.listener = ({ player, message }) => {
            if (player.name == 'SERVER')
                return;
            let responses = 0;
            for (let msg of this.messages) {
                let checks = [
                    checkJoins(player, msg),
                    checkGroups(player, msg),
                    this.triggerMatches(message, msg.trigger)
                ];
                if (checks.every(Boolean) && ++responses <= this.ex.storage.get('maxResponses', 3)) {
                    this.ex.bot.send(msg.message, { name: player.name });
                }
            }
        };
        this.ex.world.onMessage.sub(this.listener);
    }
    remove() {
        this.ex.world.onMessage.unsub(this.listener);
    }
    triggerMatches(message, trigger) {
        if (!this.ex.storage.get('disableWhitespaceTrimming', false)) {
            trigger = trigger.trim();
        }
        if (this.ex.storage.get('regexTriggers', false)) {
            try {
                return new RegExp(trigger, 'i').test(message);
            }
            catch (_a) {
                return false;
            }
        }
        trigger = trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*");
        return new RegExp(trigger, 'i').test(message);
    }
}
class AnnouncementListener extends RemovableMessageHelper {
    constructor(ex) {
        super('announcementArr', ex);
        this.index = 0;
        this.run = () => {
            if (this.index >= this.messages.length)
                this.index = 0;
            if (this.messages[this.index])
                this.ex.bot.send(this.messages[this.index++].message);
            this.timeoutId = setTimeout(this.run, this.delay);
        };
        this.timeoutId = setTimeout(this.run, this.delay);
    }
    get delay() {
        return this.ex.storage.get('announcementDelay', 10) * 60000;
    }
    remove() {
        clearTimeout(this.timeoutId);
    }
}

var joinHtml = "<template>\r\n    <div class=\"column is-4-desktop is-6-tablet\">\r\n        <div class=\"box\">\r\n            <label> Message: <textarea data-target=\"message\" class=\"textarea is-fluid m\"></textarea></label>\r\n            <details>\r\n                <summary>More options <small class=\"summary\"></small></summary>\r\n                <label>Player is: <select data-target=\"group\">\r\n                    <option value=\"all\">anyone</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <label>Player is not: <select data-target=\"not_group\">\r\n                    <option value=\"nobody\">nobody</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3 class=\"title is-4\">These are checked when a player joins the server.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    </section>\r\n    <div class=\"columns is-multiline messages-container\" style=\"border-top: 1px solid #000\"></div>\r\n</div>";

var leaveHtml = "<template>\r\n    <div class=\"column is-4-desktop is-6-tablet\">\r\n        <div class=\"box\">\r\n            <label>Message\r\n                <textarea class=\"textarea is-fluid\" data-target=\"message\"></textarea>\r\n            </label>\r\n            <details>\r\n                <summary>More options\r\n                    <small class=\"summary\"></small>\r\n                </summary>\r\n                <label>Player is:\r\n                    <select data-target=\"group\">\r\n                        <option value=\"all\">anyone</option>\r\n                        <option value=\"staff\">a staff member</option>\r\n                        <option value=\"mod\">a mod</option>\r\n                        <option value=\"admin\">an admin</option>\r\n                        <option value=\"owner\">the owner</option>\r\n                    </select>\r\n                </label>\r\n                <br>\r\n                <label>Player is not:\r\n                    <select data-target=\"not_group\">\r\n                        <option value=\"nobody\">nobody</option>\r\n                        <option value=\"staff\">a staff member</option>\r\n                        <option value=\"mod\">a mod</option>\r\n                        <option value=\"admin\">an admin</option>\r\n                        <option value=\"owner\">the owner</option>\r\n                    </select>\r\n                </label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3 class=\"title is-4\">These are checked when a player leaves the server.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    </section>\r\n    <div class=\"columns is-multiline messages-container\" style=\"border-top: 1px solid #000\"></div>\r\n</div>";

var triggerHtml = "<template>\r\n    <div class=\"column is-4-desktop is-6-tablet\">\r\n        <div class=\"box\">\r\n            <label>Trigger:\r\n                <input class=\"input\" data-target=\"trigger\">\r\n            </label>\r\n            <label>Message:\r\n                <textarea class=\"textarea is-fluid\" data-target=\"message\"></textarea>\r\n            </label>\r\n            <details>\r\n                <summary>More options\r\n                    <small class=\"summary\"></small>\r\n                </summary>\r\n                <label>Player is:\r\n                    <select data-target=\"group\">\r\n                        <option value=\"all\">anyone</option>\r\n                        <option value=\"staff\">a staff member</option>\r\n                        <option value=\"mod\">a mod</option>\r\n                        <option value=\"admin\">an admin</option>\r\n                        <option value=\"owner\">the owner</option>\r\n                    </select>\r\n                </label>\r\n                <br>\r\n                <label>Player is not:\r\n                    <select data-target=\"not_group\">\r\n                        <option value=\"nobody\">nobody</option>\r\n                        <option value=\"staff\">a staff member</option>\r\n                        <option value=\"mod\">a mod</option>\r\n                        <option value=\"admin\">an admin</option>\r\n                        <option value=\"owner\">the owner</option>\r\n                    </select>\r\n                </label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3 class=\"title is-4\">These are checked whenever someone says something.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger,\r\n            it will be treated as a wildcard. (Trigger \"te*st\" will match \"tea stuff\" and \"test\")</span>\r\n    </section>\r\n    <div class=\"columns is-multiline messages-container\" style=\"border-top: 1px solid #000\"></div>\r\n</div>";

var annHtml = "<template>\r\n    <div class=\"column is-full\">\r\n        <div class=\"box\">\r\n            <label>Send:</label>\r\n            <textarea class=\"textarea is-fluid\" data-target=\"message\"></textarea>\r\n            <a>Delete</a>\r\n        </div>\r\n        <div>\r\n            Wait X minutes...\r\n        </div>\r\n    </div>\r\n</template>\r\n<div class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3 class=\"title is-4\">These are sent according to a regular schedule.</h3>\r\n        <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span>\r\n    </section>\r\n    <div class=\"columns is-multiline messages-container\" style=\"border-top: 1px solid #000\"></div>\r\n</div>";

class MessagesTab extends RemovableMessageHelper {
    constructor({ name, ex, id }) {
        super(id, ex);
        this.setup = () => {
            this.insertHTML();
            this.template = this.tab.querySelector('template');
            this.root = this.tab.querySelector('.messages-container');
            // Auto save messages
            this.tab.addEventListener('input', () => this.save());
            // Create a new message
            let button = this.tab.querySelector('.button.is-primary');
            button.addEventListener('click', () => {
                this.addMessage();
            });
            // Deleting messages
            this.tab.addEventListener('click', event => {
                let target = event.target;
                if (target.tagName == 'A' && target.textContent == 'Delete') {
                    event.preventDefault();
                    this.ui.alert('Really delete this message?', [{ text: 'Delete', style: 'is-danger' }, { text: 'Cancel' }], result => {
                        if (result != 'Delete')
                            return;
                        let parent = target;
                        while (!parent.classList.contains('column')) {
                            parent = parent.parentElement;
                        }
                        parent.remove();
                        this.save();
                    });
                }
            });
            this.ex.storage.get(this.id, []).forEach(message => {
                this.addMessage(message);
            });
        };
        this.getMessages = () => {
            let messages = [];
            Array.from(this.root.children).forEach(element => {
                let data = {};
                Array.from(element.querySelectorAll('[data-target]')).forEach((input) => {
                    let name = input.dataset['target'];
                    if (!name)
                        return;
                    switch (input.getAttribute('type')) {
                        case 'number':
                            data[name] = +input.value;
                            break;
                        default:
                            data[name] = input.value;
                    }
                });
                messages.push(data);
            });
            return messages;
        };
        this.ui = ex.bot.getExports('ui');
        this.ex = ex;
        this.tab = this.ui.addTab(name, 'messages');
    }
    remove() {
        this.ui.removeTab(this.tab);
    }
    save() {
        this.ex.storage.set(this.id, this.getMessages());
    }
}
class JoinTab extends MessagesTab {
    constructor(ex) {
        super({ name: 'Join', id: 'joinArr', ex });
        this.insertHTML = () => {
            this.tab.innerHTML = joinHtml;
        };
        this.addMessage = (msg = {}) => {
            this.ui.buildTemplate(this.template, this.root, [
                { selector: '[data-target=message]', text: msg.message || '' },
                { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
                { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
                { selector: '[data-target=group]', value: msg.group || 'all' },
                { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' },
            ]);
        };
    }
}
class LeaveTab extends MessagesTab {
    constructor(ex) {
        super({ name: 'Leave', id: 'leaveArr', ex });
        this.insertHTML = () => {
            this.tab.innerHTML = leaveHtml;
        };
        this.addMessage = (msg = {}) => {
            this.ui.buildTemplate(this.template, this.root, [
                { selector: '[data-target=message]', text: msg.message || '' },
                { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
                { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
                { selector: '[data-target=group]', value: msg.group || 'all' },
                { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }
            ]);
        };
    }
}
class TriggerTab extends MessagesTab {
    constructor(ex) {
        super({ name: 'Trigger', id: 'triggerArr', ex });
        this.insertHTML = () => {
            this.tab.innerHTML = triggerHtml;
        };
        this.addMessage = (msg = {}) => {
            this.ui.buildTemplate(this.template, this.root, [
                { selector: '[data-target=message]', text: msg.message || '' },
                { selector: '[data-target=trigger]', value: msg.trigger || '' },
                { selector: '[data-target=joins_low]', value: msg.joins_low || 0 },
                { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 },
                { selector: '[data-target=group]', value: msg.group || 'all' },
                { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }
            ]);
        };
    }
}
class AnnouncementTab extends MessagesTab {
    constructor(ex) {
        super({ name: 'Announcements', id: 'announcementArr', ex });
        this.insertHTML = () => {
            this.tab.innerHTML = annHtml;
        };
        this.addMessage = (msg = {}) => {
            this.ui.buildTemplate(this.template, this.root, [
                { selector: '[data-target=message]', text: msg.message || '' },
            ]);
        };
    }
}

var css = ".messages-container input[type=number] {\r\n    width: 5em;\r\n}\r\n\r\n.messages-container small {\r\n    color: #777;\r\n}\r\n";

MessageBot$1.registerExtension('messages', function (ex, world) {
    let listeners = [];
    ex.remove = () => listeners.forEach(l => l.remove());
    let hasLoaded = false;
    let delayLoad = () => {
        if (hasLoaded)
            return;
        hasLoaded = true;
        let timeout = setTimeout(() => {
            listeners = [
                new JoinListener(ex),
                new LeaveListener(ex),
                new TriggerListener(ex),
                new AnnouncementListener(ex),
            ];
        }, 500);
        listeners = [{
                remove: () => clearTimeout(timeout)
            }];
    };
    world.onJoin.one(delayLoad);
    world.onLeave.one(delayLoad);
    world.onMessage.one(delayLoad);
    // Loaded in a browser?
    if (ex.bot.getExports('ui')) {
        let style = document.head.appendChild(document.createElement('style'));
        style.innerHTML = css;
        let ui = ex.bot.getExports('ui');
        ui.addTabGroup('Messages', 'messages');
        let tabs = [
            new JoinTab(ex),
            new LeaveTab(ex),
            new TriggerTab(ex),
            new AnnouncementTab(ex),
        ];
        tabs.forEach(tab => tab.setup());
        listeners = listeners.concat(...tabs, { remove: () => style.remove() }, { remove: () => ui.removeTabGroup('messages') });
    }
});

function history(input) {
    let history = [];
    let current = 0;
    function addToHistory(message) {
        history.push(message);
        while (history.length > 100) {
            history.shift();
        }
        current = history.length;
    }
    function addIfNew(message) {
        if (message != history.slice(-1).pop()) {
            addToHistory(message);
        }
        else {
            current = history.length;
        }
    }
    input.addEventListener('keydown', event => {
        if (event.key == 'ArrowUp') {
            if (input.value.length && current == history.length) {
                addToHistory(input.value);
                current--;
            }
            if (history.length && current) {
                input.value = history[--current];
            }
        }
        else if (event.key == 'ArrowDown') {
            if (history.length > current + 1) {
                input.value = history[++current];
            }
            else if (history.length == current + 1) {
                input.value = '';
                current = history.length;
            }
        }
        else if (event.key == 'Enter') {
            addIfNew(input.value);
        }
    });
}

var html = "<template>\r\n    <li>\r\n        <span>NAME</span>\r\n        <span>: Message</span>\r\n    </li>\r\n</template>\r\n<div id=\"console\">\r\n    <div class=\"chat\">\r\n        <ul></ul>\r\n    </div>\r\n    <div class=\"chat-control\">\r\n        <div class=\"field has-addons\">\r\n            <p class=\"control is-expanded\">\r\n                <input type=\"text\" class=\"input\" />\r\n            </p>\r\n            <p class=\"control\">\r\n                <button class=\"input button is-primary\">SEND</button>\r\n            </p>\r\n        </div>\r\n    </div>\r\n</div>";

var css$1 = "#console .mod > span:first-child {\r\n    color: #05f529;\r\n}\r\n\r\n#console .admin > span:first-child {\r\n    color: #2b26bd;\r\n}\r\n\r\n#console .chat {\r\n    margin: 0 1em;\r\n    height: calc(100vh - 52px - 4.25em);\r\n    overflow-y: auto;\r\n}\r\n\r\n#console .chat-control {\r\n    position: fixed;\r\n    bottom: 0;\r\n    width: 100vw;\r\n    background: #fff;\r\n}\r\n\r\n#console .field {\r\n    margin: 1em;\r\n}\r\n";

MessageBot$1.registerExtension('console', function (ex, world) {
    if (!ex.bot.getExports('ui')) {
        throw new Error('This extension should only be loaded in a browser, and must be loaded after the UI is loaded.');
    }
    const ui = ex.bot.getExports('ui');
    // Create the tab.
    let style = document.head.appendChild(document.createElement('style'));
    style.textContent = css$1;
    let tab = ui.addTab('Console');
    tab.innerHTML = html;
    let chatUl = tab.querySelector('ul');
    let chatContainer = chatUl.parentElement;
    let template = tab.querySelector('template');
    // Handle sending
    let input = tab.querySelector('input');
    function userSend() {
        ex.bot.send(input.value);
        input.value = '';
    }
    input.addEventListener('keyup', event => {
        if (event.key == 'Enter') {
            userSend();
        }
    });
    // History module, used to be a separate extension
    history(input);
    tab.querySelector('button').addEventListener('click', userSend);
    // Auto scroll when new chat is added to the page, unless we are scrolled up.
    new MutationObserver(function (events) {
        let total = chatUl.children.length;
        // Determine how many messages have been added
        let addedHeight = 0;
        for (let i = total - events.length; i < total; i++) {
            addedHeight += chatUl.children[i].clientHeight;
        }
        // If we were scrolled down already, stay scrolled down
        if (chatContainer.scrollHeight - chatContainer.clientHeight - chatContainer.scrollTop == addedHeight) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        // Remove old messages if necessary
        while (chatUl.children.length > 500) {
            chatUl.children[0].remove();
        }
    }).observe(chatUl, { childList: true, subtree: true });
    // Add a message to the page
    function addPlayerMessage(player, message) {
        if (!message.length)
            return;
        let messageClass = 'player';
        if (player.isAdmin)
            messageClass = 'admin';
        if (player.isMod)
            messageClass = 'mod';
        ui.buildTemplate(template, chatUl, [
            { selector: 'li', 'class': messageClass },
            { selector: 'span:first-child', text: player.name },
            { selector: 'span:last-child', text: ': ' + message }
        ]);
    }
    function addGenericMessage(message) {
        if (!message.length)
            return;
        let li = document.createElement('li');
        li.textContent = message;
        chatUl.appendChild(li);
    }
    // Export required functions
    let consoleExports = {
        log: (message) => addPlayerMessage(world.getPlayer('SERVER'), message)
    };
    ex.exports = consoleExports;
    function logJoins(player) {
        if (ex.storage.get('logJoinIps', true)) {
            consoleExports.log(`${player.name} (${player.ip}) joined.`);
        }
        else {
            consoleExports.log(`${player.name} joined.`);
        }
    }
    world.onJoin.sub(logJoins);
    function logLeaves(player) {
        consoleExports.log(player.name + ' left');
    }
    world.onLeave.sub(logLeaves);
    function logMessages({ player, message }) {
        addPlayerMessage(player, message);
    }
    world.onMessage.sub(logMessages);
    function logOther(message) {
        if (ex.storage.get('logUnparsedMessages', true)) {
            addGenericMessage(message);
        }
    }
    world.onOther.sub(logOther);
    ex.remove = function () {
        ui.removeTab(tab);
        style.remove();
        world.onJoin.unsub(logJoins);
        world.onLeave.unsub(logLeaves);
        world.onMessage.unsub(logMessages);
        world.onOther.unsub(logOther);
    };
});

var html$1 = "<div class=\"container\">\r\n    <h3 class=\"title\">General Settings</h3>\r\n    <p class=\"control\">\r\n        <label>Minutes between announcements</label>\r\n        <input class=\"input\" type=\"number\" data-target=\"messages/announcementDelay\">\r\n        <br>\r\n    </p>\r\n    <p class=\"control\">\r\n        <label>Maximum trigger responses to a message</label>\r\n        <input class=\"input\" type=\"number\" data-target=\"messages/maxResponses\">\r\n    </p>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input type=\"checkbox\" data-target=\"console/logJoinIps\"> Show joining IPs in console\r\n        </label>\r\n    </p>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input data-target=\"console/logUnparsedMessages\" type=\"checkbox\"> Log unparsed messages\r\n        </label>\r\n    </p>\r\n\r\n    <hr>\r\n\r\n    <h3 class=\"title\">Advanced Settings</h3>\r\n    <div class=\"message is-warning\">\r\n        <div class=\"message-header\">\r\n            <p>Warning</p>\r\n        </div>\r\n        <div class=\"message-body\">\r\n            <p>Changing these options can result in unexpected behavior.\r\n                <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/1.-Advanced-Options/\"\r\n                    target=\"_blank\">Read this first</a>\r\n            </p>\r\n        </div>\r\n    </div>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input type=\"checkbox\" data-target=\"messages/regexTriggers\"> Parse triggers as RegEx\r\n        </label>\r\n    </p>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input type=\"checkbox\" data-target=\"messages/disableWhitespaceTrimming\"> Disable whitespace trimming\r\n        </label>\r\n    </p>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input type=\"checkbox\" data-target=\"splitMessages\"> Split messages\r\n        </label>\r\n    </p>\r\n    <label class=\"label\">Split token:</label>\r\n    <p class=\"control\">\r\n        <input class=\"input\" type=\"text\" data-target=\"splitToken\">\r\n    </p>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input type=\"checkbox\" data-target=\"extensions/devMode\"> Developer mode\r\n        </label>\r\n    </p>\r\n    <label class=\"label\">Extension Repsitory URLs (one per line, reload required to apply):</label>\r\n    <p class=\"control\">\r\n        <textarea class=\"textarea is-fluid\" type=\"text\" data-target=\"extensions/repos\"></textarea>\r\n    </p>\r\n\r\n    <hr>\r\n\r\n    <nav class=\"panel\">\r\n        <p class=\"panel-heading\">Backup / Restore</p>\r\n\r\n        <a class=\"panel-block\" data-do=\"show_backup\">Show Backup</a>\r\n        <a class=\"panel-block\" data-do=\"download_backup\">Download Backup</a>\r\n        <a class=\"panel-block\" data-do=\"import_backup\">Import Backup</a>\r\n        <a class=\"panel-block\" data-do=\"upload_backup\">Upload Backup</a>\r\n    </nav>\r\n\r\n    <br>\r\n</div>";

var html$2 = "<template>\r\n    <tr>\r\n        <td data-for=\"title\"></td>\r\n        <td data-for=\"actions\"><a class=\"button is-small\">Install</a></td>\r\n        <td data-for=\"description\"></td>\r\n        <td data-for=\"author\" class=\"is-hidden-mobile\"></td>\r\n    </tr>\r\n</template>\r\n<div class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <h3 class=\"title is-4\">Extensions can increase the functionality of the bot.</h3>\r\n        <span>Interested in creating one?\r\n            <a href=\"https://github.com/Blockheads-MessageBot/MessageBot/wiki/2.-Development:-Start-Here\" target=\"_blank\">Start here.</a>\r\n        </span>\r\n    </section>\r\n    <table class=\"table is-striped is-fullwidth is-hoverable\">\r\n        <thead>\r\n            <tr>\r\n                <th>Name</th>\r\n                <th>Actions</th>\r\n                <th>Description</th>\r\n                <th class=\"is-hidden-mobile\">Author</th>\r\n            </tr>\r\n        </thead>\r\n        <tfoot>\r\n            <tr>\r\n                <th>Name</th>\r\n                <th>Actions</th>\r\n                <th>Description</th>\r\n                <th class=\"is-hidden-mobile\">Author</th>\r\n            </tr>\r\n        </tfoot>\r\n        <tbody></tbody>\r\n    </table>\r\n</div>";

const flatten = (arr) => arr.reduce((carry, item) => carry.concat(item), []);
// const pluck = <T, K extends keyof T>(arr: T[], key: K) => arr.map(item => item[key])
const defaultRepo = `https://gitcdn.xyz/cdn/Blockheads-Messagebot/Extensions/master/extensions.json`;
function supported(info) {
    let env = info.env.toLocaleLowerCase();
    return [
        env.includes('all'),
        env.includes('browser'),
        (env.includes('mac') && env.includes('cloud')),
    ].some(Boolean) && /\.(m?js|es)/.test(info.package);
}
MessageBot$1.registerExtension('extensions', ex => {
    let ui = ex.bot.getExports('ui');
    let tab = ui.addTab('Extensions');
    tab.innerHTML = html$2;
    tab.addEventListener('click', event => {
        let target = event.target;
        if (target.tagName != 'A')
            return;
        let id = target.getAttribute('ext_id');
        if (!id)
            return;
        if (target.textContent == 'Install') {
            load(id);
        }
        else {
            removeExtension(id);
        }
    });
    ex.remove = () => {
        throw new Error('This extension cannot be removed.');
    };
    function addExtension(id) {
        try {
            ex.bot.addExtension(id);
            ex.storage.with('autoload', [], ids => {
                if (!ids.includes(id))
                    ids.push(id);
            });
            let button = tab.querySelector(`a[ext_id="${id}"]`);
            if (button)
                button.textContent = 'Remove';
        }
        catch (error) {
            ui.notify('Error adding extension: ' + error);
            try {
                ex.bot.removeExtension(id, false);
            }
            catch (_a) { }
        }
    }
    function removeExtension(id) {
        try {
            ex.bot.removeExtension(id, true);
            ex.storage.with('autoload', [], ids => {
                if (ids.includes(id))
                    ids.splice(ids.indexOf(id), 1);
            });
            let button = tab.querySelector(`a[ext_id="${id}"]`);
            if (button)
                button.textContent = 'Install';
        }
        catch (error) {
            ui.notify('Error removing extension: ' + error);
        }
    }
    // Load listener
    let shouldLoad = new Set();
    MessageBot$1.extensionRegistered.sub(id => {
        // If in developer mode, autoload unconditionally
        if (ex.storage.get('devMode', false)) {
            if (ex.bot.getExports(id))
                ex.bot.removeExtension(id, false);
            addExtension(id);
        }
        else if (shouldLoad.has(id)) {
            shouldLoad.delete(id);
            addExtension(id);
        }
    });
    let extensionMap = new Map();
    function load(id) {
        let info = extensionMap.get(id);
        if (!info) {
            console.warn('Could not load unknown ID:', id);
            return;
        }
        if (MessageBot$1.extensions.includes(id)) {
            addExtension(id);
        }
        else {
            shouldLoad.add(id);
            let script = document.head.appendChild(document.createElement('script'));
            script.src = info.package;
        }
    }
    // Load any extension repos
    // Repos listed first should have priority for duplicate ids
    let repos = ex.storage.get('repos', defaultRepo).split(/\r?\n/).reverse();
    let repoRequests = repos.map(repo => fetch(repo).then(r => r.json()));
    Promise.all(repoRequests)
        .then((responses) => {
        flatten(responses).filter(supported).forEach(extension => {
            extensionMap.set(extension.id, extension);
        });
    })
        .then(() => {
        // Load those extensions which should be autoloaded
        ex.storage.get('autoload', []).forEach(load);
        createPage();
    });
    function createPage() {
        for (let extension of extensionMap.values()) {
            ui.buildTemplate(tab.querySelector('template'), tab.querySelector('tbody'), [
                { selector: '[data-for=title]', text: extension.title },
                { selector: '[data-for=description]', text: extension.description },
                { selector: '[data-for=author]', text: extension.user },
                { selector: 'a', ext_id: extension.id },
            ]);
        }
    }
});

const settingDefaults = [
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
];
MessageBot$1.registerExtension('settings', function (ex) {
    let settingsRoot = ex.bot.storage;
    let ui = ex.bot.getExports('ui');
    let tab = ui.addTab('Settings');
    tab.innerHTML = html$1;
    for (let [key, def] of settingDefaults) {
        let el = tab.querySelector(`[data-target="${key}"]`);
        if (typeof def == 'boolean') {
            el.checked = settingsRoot.get(key, def);
        }
        else {
            el.value = String(settingsRoot.get(key, def));
        }
    }
    tab.addEventListener('change', () => {
        for (let [key, def] of settingDefaults) {
            let el = tab.querySelector(`[data-target="${key}"]`);
            if (typeof def == 'boolean') {
                settingsRoot.set(key, el.checked);
            }
            else if (typeof def == 'number') {
                settingsRoot.set(key, +el.value);
            }
            else {
                settingsRoot.set(key, el.value);
            }
        }
    });
    function importBackup(backup) {
        let parsed;
        try {
            parsed = JSON.parse(backup);
            if (parsed === null) {
                throw new Error('Invalid backup');
            }
        }
        catch (e) {
            ui.notify('Invalid backup code. No action taken.');
            return;
        }
        localStorage.clear();
        Object.keys(parsed).forEach((key) => {
            localStorage.setItem(key, parsed[key]);
        });
        location.reload();
    }
    tab.querySelector('[data-do=show_backup]').addEventListener('click', () => {
        // Must be loaded in a browser, so safe to use localStorage
        let backup = JSON.stringify(localStorage).replace(/</g, '&lt;');
        ui.alert(`<p>Copy this to a safe place.</p><textarea class="textarea">${backup}</textarea>`);
    });
    tab.querySelector('[data-do=import_backup]').addEventListener('click', () => {
        ui.prompt('Enter your backup code, this will reload the page:', result => {
            if (result) {
                importBackup(result);
            }
        });
    });
    tab.querySelector('[data-do=download_backup]').addEventListener('click', () => {
        let backup = JSON.stringify(localStorage, undefined, 4);
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(backup));
        element.setAttribute('download', 'bot_backup.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });
    tab.querySelector('[data-do=upload_backup]').addEventListener('click', () => {
        if (!File || !FileReader || !FileList || !Blob) {
            ui.notify(`It looks like your browser doesn't support this.`);
            return;
        }
        let input = document.createElement('input');
        input.type = 'file';
        input.addEventListener('change', () => {
            if (!input.files || input.files[0].type != 'text/plain') {
                ui.notify('Upload a text file.');
                return;
            }
            let reader = new FileReader();
            reader.addEventListener('load', () => {
                importBackup(reader.result);
            });
            reader.readAsText(input.files[0]);
        });
        input.click();
    });
    ex.remove = function () {
        ui.removeTab(tab);
    };
});

window['@bhmb/bot'] = { MessageBot: MessageBot$1 };
const worldId = window.worldId;
if (location.hostname != 'portal.theblockheads.net') {
    if (confirm('You are not on the portal, go there now?')) {
        location.assign('http://portal.theblockheads.net');
    }
}
if (!worldId) {
    alert('You must be on a world page to start the bot');
    throw new Error('Bad page');
}
MessageBot$1.dependencies = { Api, getWorlds, fetch };
let info = {
    name: document.querySelector('#title').textContent,
    id: worldId + ''
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let bot = new MessageBot$$1(new Storage$1(''), info);
        bot.addExtension('ui');
        bot.addExtension('console');
        document.querySelector('.nav-item').click();
        bot.addExtension('messages');
        bot.addExtension('settings');
        bot.addExtension('extensions');
        yield bot.world.start();
        yield bot.world.getLists(true);
    });
}
main();

}(crypto));
