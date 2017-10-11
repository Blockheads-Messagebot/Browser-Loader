(function () {
'use strict';

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
  remove() {}
  /**
   * Removes the extension. All listeners should be removed here.
   */
  uninstall() {
    this.remove();
    this.storage.clear();
  }
}

function arrayContainsAny(haystack, ...needles) {
    return haystack.some(item => needles.includes(item));
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
     *
     * @return The name of the player.
     */
    get name() {
        return this._name;
    }
    /**
     * Gets the most recently used IP of the player.
     *
     * @return the player's IP
     */
    get ip() {
        return this._info.ip;
    }
    /**
     * Gets the all IPs used by the player on the world.
     *
     * @return an array of IPs
     */
    get ips() {
        return [...this._info.ips];
    }
    /**
     * Gets the number of times the player has joined the server.
     *
     * @return how many times the player has joined.
     */
    get joins() {
        return this._info.joins;
    }
    /**
     * Checks if the player has joined the server.
     *
     * @return true if the player has joined before, otherwise false.
     */
    get hasJoined() {
        return this.joins > 0;
    }
    /**
     * Returns true if the player is the owner of the server or is the server.
     *
     * @return true if the player is the owner.
     */
    get isOwner() {
        return !!this._info.owner || this._name == 'SERVER';
    }
    /**
     * Checks if the player is an admin or the owner.
     *
     * @return true if the player is an admin.
     */
    get isAdmin() {
        // A player is admin if their name or their latest IP is listed on the adminlist, or they are the owner.
        return this.isOwner || arrayContainsAny(this._lists.adminlist, this._name, this._info.ip);
    }
    /**
     * Checks if the player is a mod without admin permissions.
     *
     * @return true if the player is an admin and not a mod.
     */
    get isMod() {
        // A player is mod if their name or their latest IP is on the modlist
        return !this.isAdmin && arrayContainsAny(this._lists.modlist, this._name, this._info.ip);
    }
    /**
     * Checks if the player is an admin or a mod.
     *
     * @return true if the player is an admin or a mod.
     */
    get isStaff() {
        return this.isAdmin || this.isMod;
    }
    /**
     * Checks if the player is whitelisted.
     *
     * @return true if the player can join the server when it is whitelisted.
     */
    get isWhitelisted() {
        // A player is whitelisted if they are staff or if their name or latest ip is on the whitelist.
        return this.isStaff || arrayContainsAny(this._lists.whitelist, this._name, this._info.ip);
    }
    /**
     * Checks if the player is banned.
     *
     * @return true if the player is on the blacklist.
     */
    get isBanned() {
        return !this.isStaff && this._lists.blacklist.some(entry => {
            // We don't know the current player's device ID so can't check for that on the blacklist
            // If the player's name is on the blacklist, they are banned.
            // If an IP the player has used is banned, they are *probably* banned, so guess that they are.
            // Remove device ID from blacklist entry, if there is one
            if (entry.includes(' \\')) entry = entry.substr(0, entry.indexOf(' \\'));
            if (entry == this._name) return true;
            if (this._info.ips.includes(entry)) return true;
            return false;
        });
    }
}

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var stronglyTypedEvents = createCommonjsModule(function (module, exports) {
    /*!
     * Strongly Typed Events for TypeScript - 1.0.1
     * https://github.com/KeesCBakker/StronlyTypedEvents/
     * http://keestalkstech.com
     *
     * Copyright Kees C. Bakker / KeesTalksTech
     * Released under the MIT license
     */
    "use strict";

    var __extends = commonjsGlobal && commonjsGlobal.__extends || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    "use strict";
    /**
     * Stores a handler. Manages execution meta data.
     * @class Subscription
     * @template TEventHandler
     */
    var Subscription = function () {
        /**
         * Creates an instance of Subscription.
         *
         * @param {TEventHandler} handler The handler for the subscription.
         * @param {boolean} isOnce Indicates if the handler should only be executed` once.
         */
        function Subscription(handler, isOnce) {
            this.handler = handler;
            this.isOnce = isOnce;
            /**
             * Indicates if the subscription has been executed before.
             */
            this.isExecuted = false;
        }
        /**
         * Executes the handler.
         *
         * @param {boolean} executeAsync True if the even should be executed async.
         * @param {*} The scope the scope of the event.
         * @param {IArguments} args The arguments for the event.
         */
        Subscription.prototype.execute = function (executeAsync, scope, args) {
            if (!this.isOnce || !this.isExecuted) {
                this.isExecuted = true;
                var fn = this.handler;
                if (executeAsync) {
                    setTimeout(function () {
                        fn.apply(scope, args);
                    }, 1);
                } else {
                    fn.apply(scope, args);
                }
            }
        };
        return Subscription;
    }();
    exports.Subscription = Subscription;
    /**
     * Base class for implementation of the dispatcher. It facilitates the subscribe
     * and unsubscribe methods based on generic handlers. The TEventType specifies
     * the type of event that should be exposed. Use the asEvent to expose the
     * dispatcher as event.
     */
    var DispatcherBase = function () {
        function DispatcherBase() {
            this._wrap = new DispatcherWrapper(this);
            this._subscriptions = new Array();
        }
        /**
         * Subscribe to the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         */
        DispatcherBase.prototype.subscribe = function (fn) {
            if (fn) {
                this._subscriptions.push(new Subscription(fn, false));
            }
        };
        /**
         * Subscribe to the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         */
        DispatcherBase.prototype.sub = function (fn) {
            this.subscribe(fn);
        };
        /**
         * Subscribe once to the event with the specified name.
         * @param fn The event handler that is called when the event is dispatched.
         */
        DispatcherBase.prototype.one = function (fn) {
            if (fn) {
                this._subscriptions.push(new Subscription(fn, true));
            }
        };
        /**
         * Checks it the event has a subscription for the specified handler.
         * @param fn The event handler.
         */
        DispatcherBase.prototype.has = function (fn) {
            if (fn) {
                for (var _i = 0, _a = this._subscriptions; _i < _a.length; _i++) {
                    var sub = _a[_i];
                    if (sub.handler == fn) {
                        return true;
                    }
                }
            }
            return false;
        };
        /**
         * Unsubscribes the handler from the dispatcher.
         * @param fn The event handler.
         */
        DispatcherBase.prototype.unsubscribe = function (fn) {
            if (fn) {
                for (var i = 0; i < this._subscriptions.length; i++) {
                    var sub = this._subscriptions[i];
                    if (sub.handler == fn) {
                        this._subscriptions.splice(i, 1);
                        break;
                    }
                }
            }
        };
        /**
         * Unsubscribes the handler from the dispatcher.
         * @param fn The event handler.
         */
        DispatcherBase.prototype.unsub = function (fn) {
            this.unsubscribe(fn);
        };
        /**
         * Generic dispatch will dispatch the handlers with the given arguments.
         *
         * @protected
         * @param {boolean} executeAsync True if the even should be executed async.
         * @param {*} The scope the scope of the event.
         * @param {IArguments} args The arguments for the event.
         */
        DispatcherBase.prototype._dispatch = function (executeAsync, scope, args) {
            for (var i = 0; i < this._subscriptions.length; i++) {
                var sub = this._subscriptions[i];
                if (sub.isOnce) {
                    if (sub.isExecuted === true) {
                        continue;
                    }
                    this._subscriptions.splice(i, 1);
                    i--;
                }
                sub.execute(executeAsync, scope, args);
            }
        };
        /**
         * Creates an event from the dispatcher. Will return the dispatcher
         * in a wrapper. This will prevent exposure of any dispatcher methods.
         */
        DispatcherBase.prototype.asEvent = function () {
            return this._wrap;
        };
        /**
         * Clears all the subscriptions.
         */
        DispatcherBase.prototype.clear = function () {
            this._subscriptions.splice(0, this._subscriptions.length);
        };
        return DispatcherBase;
    }();
    exports.DispatcherBase = DispatcherBase;
    /**
     * Dispatcher implementation for events. Can be used to subscribe, unsubscribe
     * or dispatch events. Use the ToEvent() method to expose the event.
     */
    var EventDispatcher = function (_super) {
        __extends(EventDispatcher, _super);
        /**
         * Creates a new EventDispatcher instance.
         */
        function EventDispatcher() {
            return _super.call(this) || this;
        }
        /**
         * Dispatches the event.
         * @param sender The sender.
         * @param args The arguments object.
         */
        EventDispatcher.prototype.dispatch = function (sender, args) {
            this._dispatch(false, this, arguments);
        };
        /**
         * Dispatches the events thread.
         * @param sender The sender.
         * @param args The arguments object.
         */
        EventDispatcher.prototype.dispatchAsync = function (sender, args) {
            this._dispatch(true, this, arguments);
        };
        /**
         * Creates an event from the dispatcher. Will return the dispatcher
         * in a wrapper. This will prevent exposure of any dispatcher methods.
         */
        EventDispatcher.prototype.asEvent = function () {
            return _super.prototype.asEvent.call(this);
        };
        return EventDispatcher;
    }(DispatcherBase);
    exports.EventDispatcher = EventDispatcher;
    /**
     * The dispatcher handles the storage of subsciptions and facilitates
     * subscription, unsubscription and dispatching of a simple event
     */
    var SimpleEventDispatcher = function (_super) {
        __extends(SimpleEventDispatcher, _super);
        /**
         * Creates a new SimpleEventDispatcher instance.
         */
        function SimpleEventDispatcher() {
            return _super.call(this) || this;
        }
        /**
         * Dispatches the event.
         * @param args The arguments object.
         */
        SimpleEventDispatcher.prototype.dispatch = function (args) {
            this._dispatch(false, this, arguments);
        };
        /**
         * Dispatches the events thread.
         * @param args The arguments object.
         */
        SimpleEventDispatcher.prototype.dispatchAsync = function (args) {
            this._dispatch(true, this, arguments);
        };
        /**
         * Creates an event from the dispatcher. Will return the dispatcher
         * in a wrapper. This will prevent exposure of any dispatcher methods.
         */
        SimpleEventDispatcher.prototype.asEvent = function () {
            return _super.prototype.asEvent.call(this);
        };
        return SimpleEventDispatcher;
    }(DispatcherBase);
    exports.SimpleEventDispatcher = SimpleEventDispatcher;
    /**
     * The dispatcher handles the storage of subsciptions and facilitates
     * subscription, unsubscription and dispatching of a signal event.
     */
    var SignalDispatcher = function (_super) {
        __extends(SignalDispatcher, _super);
        /**
         * Creates a new SignalDispatcher instance.
         */
        function SignalDispatcher() {
            return _super.call(this) || this;
        }
        /**
         * Dispatches the signal.
         */
        SignalDispatcher.prototype.dispatch = function () {
            this._dispatch(false, this, arguments);
        };
        /**
         * Dispatches the signal threaded.
         */
        SignalDispatcher.prototype.dispatchAsync = function () {
            this._dispatch(true, this, arguments);
        };
        /**
         * Creates an event from the dispatcher. Will return the dispatcher
         * in a wrapper. This will prevent exposure of any dispatcher methods.
         */
        SignalDispatcher.prototype.asEvent = function () {
            return _super.prototype.asEvent.call(this);
        };
        return SignalDispatcher;
    }(DispatcherBase);
    exports.SignalDispatcher = SignalDispatcher;
    /**
     * Hides the implementation of the event dispatcher. Will expose methods that
     * are relevent to the event.
     */
    var DispatcherWrapper = function () {
        /**
         * Creates a new EventDispatcherWrapper instance.
         * @param dispatcher The dispatcher.
         */
        function DispatcherWrapper(dispatcher) {
            this._subscribe = function (fn) {
                return dispatcher.subscribe(fn);
            };
            this._unsubscribe = function (fn) {
                return dispatcher.unsubscribe(fn);
            };
            this._one = function (fn) {
                return dispatcher.one(fn);
            };
            this._has = function (fn) {
                return dispatcher.has(fn);
            };
            this._clear = function () {
                return dispatcher.clear();
            };
        }
        /**
         * Subscribe to the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         */
        DispatcherWrapper.prototype.subscribe = function (fn) {
            this._subscribe(fn);
        };
        /**
         * Subscribe to the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         */
        DispatcherWrapper.prototype.sub = function (fn) {
            this.subscribe(fn);
        };
        /**
         * Unsubscribe from the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         */
        DispatcherWrapper.prototype.unsubscribe = function (fn) {
            this._unsubscribe(fn);
        };
        /**
         * Unsubscribe from the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         */
        DispatcherWrapper.prototype.unsub = function (fn) {
            this.unsubscribe(fn);
        };
        /**
         * Subscribe once to the event with the specified name.
         * @param fn The event handler that is called when the event is dispatched.
         */
        DispatcherWrapper.prototype.one = function (fn) {
            this._one(fn);
        };
        /**
         * Checks it the event has a subscription for the specified handler.
         * @param fn The event handler.
         */
        DispatcherWrapper.prototype.has = function (fn) {
            return this._has(fn);
        };
        /**
         * Clears all the subscriptions.
         */
        DispatcherWrapper.prototype.clear = function () {
            this._clear();
        };
        return DispatcherWrapper;
    }();
    exports.DispatcherWrapper = DispatcherWrapper;
    /**
     * Base class for event lists classes. Implements the get and remove.
     */
    var EventListBase = function () {
        function EventListBase() {
            this._events = {};
        }
        /**
         * Gets the dispatcher associated with the name.
         * @param name The name of the event.
         */
        EventListBase.prototype.get = function (name) {
            var event = this._events[name];
            if (event) {
                return event;
            }
            event = this.createDispatcher();
            this._events[name] = event;
            return event;
        };
        /**
         * Removes the dispatcher associated with the name.
         * @param name The name of the event.
         */
        EventListBase.prototype.remove = function (name) {
            this._events[name] = null;
        };
        return EventListBase;
    }();
    exports.EventListBase = EventListBase;
    /**
     * Storage class for multiple events that are accessible by name.
     * Events dispatchers are automatically created.
     */
    var EventList = function (_super) {
        __extends(EventList, _super);
        /**
         * Creates a new EventList instance.
         */
        function EventList() {
            return _super.call(this) || this;
        }
        /**
         * Creates a new dispatcher instance.
         */
        EventList.prototype.createDispatcher = function () {
            return new EventDispatcher();
        };
        return EventList;
    }(EventListBase);
    exports.EventList = EventList;
    /**
     * Storage class for multiple simple events that are accessible by name.
     * Events dispatchers are automatically created.
     */
    var SimpleEventList = function (_super) {
        __extends(SimpleEventList, _super);
        /**
         * Creates a new SimpleEventList instance.
         */
        function SimpleEventList() {
            return _super.call(this) || this;
        }
        /**
         * Creates a new dispatcher instance.
         */
        SimpleEventList.prototype.createDispatcher = function () {
            return new SimpleEventDispatcher();
        };
        return SimpleEventList;
    }(EventListBase);
    exports.SimpleEventList = SimpleEventList;
    /**
     * Storage class for multiple signal events that are accessible by name.
     * Events dispatchers are automatically created.
     */
    var SignalList = function (_super) {
        __extends(SignalList, _super);
        /**
         * Creates a new SignalList instance.
         */
        function SignalList() {
            return _super.call(this) || this;
        }
        /**
         * Creates a new dispatcher instance.
         */
        SignalList.prototype.createDispatcher = function () {
            return new SignalDispatcher();
        };
        return SignalList;
    }(EventListBase);
    exports.SignalList = SignalList;
    /**
     * Extends objects with event handling capabilities.
     */
    var EventHandlingBase = function () {
        function EventHandlingBase() {
            this._events = new EventList();
        }
        Object.defineProperty(EventHandlingBase.prototype, "events", {
            /**
             * Gets the list with all the event dispatchers.
             */
            get: function () {
                return this._events;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Subscribes to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        EventHandlingBase.prototype.subscribe = function (name, fn) {
            this._events.get(name).subscribe(fn);
        };
        /**
         * Subscribes to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        EventHandlingBase.prototype.sub = function (name, fn) {
            this.subscribe(name, fn);
        };
        /**
         * Unsubscribes from the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        EventHandlingBase.prototype.unsubscribe = function (name, fn) {
            this._events.get(name).unsubscribe(fn);
        };
        /**
         * Unsubscribes from the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        EventHandlingBase.prototype.unsub = function (name, fn) {
            this.unsubscribe(name, fn);
        };
        /**
         * Subscribes to once the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        EventHandlingBase.prototype.one = function (name, fn) {
            this._events.get(name).one(fn);
        };
        /**
         * Subscribes to once the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        EventHandlingBase.prototype.has = function (name, fn) {
            return this._events.get(name).has(fn);
        };
        return EventHandlingBase;
    }();
    exports.EventHandlingBase = EventHandlingBase;
    /**
     * Extends objects with simple event handling capabilities.
     */
    var SimpleEventHandlingBase = function () {
        function SimpleEventHandlingBase() {
            this._events = new SimpleEventList();
        }
        Object.defineProperty(SimpleEventHandlingBase.prototype, "events", {
            get: function () {
                return this._events;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Subscribes to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SimpleEventHandlingBase.prototype.subscribe = function (name, fn) {
            this._events.get(name).subscribe(fn);
        };
        /**
         * Subscribes to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SimpleEventHandlingBase.prototype.sub = function (name, fn) {
            this.subscribe(name, fn);
        };
        /**
         * Subscribes once to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SimpleEventHandlingBase.prototype.one = function (name, fn) {
            this._events.get(name).one(fn);
        };
        /**
         * Checks it the event has a subscription for the specified handler.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SimpleEventHandlingBase.prototype.has = function (name, fn) {
            return this._events.get(name).has(fn);
        };
        /**
         * Unsubscribes from the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SimpleEventHandlingBase.prototype.unsubscribe = function (name, fn) {
            this._events.get(name).unsubscribe(fn);
        };
        /**
         * Unsubscribes from the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SimpleEventHandlingBase.prototype.unsub = function (name, fn) {
            this.unsubscribe(name, fn);
        };
        return SimpleEventHandlingBase;
    }();
    exports.SimpleEventHandlingBase = SimpleEventHandlingBase;
    /**
     * Extends objects with signal event handling capabilities.
     */
    var SignalHandlingBase = function () {
        function SignalHandlingBase() {
            this._events = new SignalList();
        }
        Object.defineProperty(SignalHandlingBase.prototype, "events", {
            get: function () {
                return this._events;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Subscribes once to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SignalHandlingBase.prototype.one = function (name, fn) {
            this._events.get(name).one(fn);
        };
        /**
         * Checks it the event has a subscription for the specified handler.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SignalHandlingBase.prototype.has = function (name, fn) {
            return this._events.get(name).has(fn);
        };
        /**
         * Subscribes to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SignalHandlingBase.prototype.subscribe = function (name, fn) {
            this._events.get(name).subscribe(fn);
        };
        /**
         * Subscribes to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SignalHandlingBase.prototype.sub = function (name, fn) {
            this.subscribe(name, fn);
        };
        /**
         * Unsubscribes from the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SignalHandlingBase.prototype.unsubscribe = function (name, fn) {
            this._events.get(name).unsubscribe(fn);
        };
        /**
         * Unsubscribes from the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        SignalHandlingBase.prototype.unsub = function (name, fn) {
            this.unsubscribe(name, fn);
        };
        return SignalHandlingBase;
    }();
    exports.SignalHandlingBase = SignalHandlingBase;
    function createEventDispatcher() {
        return new EventDispatcher();
    }
    exports.createEventDispatcher = createEventDispatcher;
    
    function createEventList() {
        return new EventList();
    }
    exports.createEventList = createEventList;
    function createSimpleEventDispatcher() {
        return new SimpleEventDispatcher();
    }
    exports.createSimpleEventDispatcher = createSimpleEventDispatcher;
    
    function createSimpleEventList() {
        return new SimpleEventList();
    }
    exports.createSimpleEventList = createSimpleEventList;
    function createSignalDispatcher() {
        return new SignalDispatcher();
    }
    exports.createSignalDispatcher = createSignalDispatcher;
    
    function createSignalList() {
        return new SignalList();
    }
    exports.createSignalList = createSignalList;
    
    var StronglyTypedEventsStatic = {
        EventList: EventList,
        SimpleEventList: SimpleEventList,
        SignalList: SignalList,
        createEventList: createEventList,
        createSimpleEventList: createSimpleEventList,
        createSignalList: createSignalList,
        EventDispatcher: EventDispatcher,
        SimpleEventDispatcher: SimpleEventDispatcher,
        SignalDispatcher: SignalDispatcher,
        EventHandlingBase: EventHandlingBase,
        SimpleEventHandlingBase: SimpleEventHandlingBase,
        SignalHandlingBase: SignalHandlingBase,
        createEventDispatcher: createEventDispatcher,
        createSimpleEventDispatcher: createSimpleEventDispatcher,
        createSignalDispatcher: createSignalDispatcher,
        EventListBase: EventListBase,
        DispatcherBase: DispatcherBase,
        DispatcherWrapper: DispatcherWrapper
    };
    exports.IStronglyTypedEvents = StronglyTypedEventsStatic;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = StronglyTypedEventsStatic;
});

var stronglyTypedEvents_16 = stronglyTypedEvents.createSimpleEventDispatcher;

var __awaiter$1 = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
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
        this._onMessage = stronglyTypedEvents_16();
        this._onJoin = stronglyTypedEvents_16();
        this._onLeave = stronglyTypedEvents_16();
        this._onOther = stronglyTypedEvents_16();
        this.timeoutId = null;
        /**
         * Parses a chat message, firing the appropriate events if required.
         */
        this.parse = message => {
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
                } catch (_a) {}
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
                } catch (_b) {}
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
        this.checkChat = lastId => __awaiter$1(this, void 0, void 0, function* () {
            try {
                let { log, nextId } = yield this.api.getMessages(lastId);
                if (this.timeoutId == null) return;
                log.forEach(this.parse);
                this.timeoutId = setTimeout(this.checkChat, 5000, nextId);
            } catch (_a) {
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
        if (this.timeoutId) this.stop();
        this.timeoutId = setTimeout(this.checkChat, 0, 0);
    }
    /**
     * Stops the listener if it is running. If not running, does nothing.
     */
    stop() {
        if (this.timeoutId) clearTimeout(this.timeoutId);
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
        if (/[^a-z]{3,16}: /.test(message)) return message.substring(0, message.lastIndexOf(': ', 18));
        // Invalid name
        return '';
    }
}

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const cloneDate = d => new Date(d.getTime());
const PLAYERS_KEY = 'mb_players';
class World {
    constructor(api, storage) {
        this._cache = {};
        this._events = {
            onJoin: stronglyTypedEvents_16(),
            onLeave: stronglyTypedEvents_16(),
            onMessage: stronglyTypedEvents_16()
        };
        this._online = [];
        this._lists = { adminlist: [], modlist: [], whitelist: [], blacklist: [] };
        this._commands = new Map();
        /**
         * Gets an overview of the server info
         */
        this.getOverview = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (!this._cache.overview || refresh) {
                let overview = yield this._cache.overview = this._api.getOverview();
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
         * Gets the server's lists
         */
        this.getLists = (refresh = false) => {
            if (!this._cache.lists || refresh) {
                this._cache.lists = this._api.getLists().then(lists => this._lists = lists);
            }
            return this._cache.lists.then(lists => ({
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
        this.setLists = lists => __awaiter(this, void 0, void 0, function* () {
            let currentLists = yield this.getLists();
            yield this._api.setLists(Object.assign({}, currentLists, lists));
            yield this.getLists(true);
        });
        /**
         * Gets the server logs
         *
         * @param refresh if true, will get the latest logs, otherwise will returned the cached version.
         */
        this.getLogs = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (!this._cache.logs || refresh) this._cache.logs = this._api.getLogs();
            let lines = yield this._cache.logs;
            return lines.slice().map(line => Object.assign({}, line, { timestamp: cloneDate(line.timestamp) }));
        });
        /**
         * Sends the specified message, returns a promise that will reject if the send fails and resolve otherwise.
         *
         * @param message the message to send
         */
        this.send = message => this._api.send(message);
        /**
         * Gets a specific player by name
         */
        this.getPlayer = name => {
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
        this.removeCommand = command => {
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
                if (!player.ips.includes(ip)) player.ips.push(ip);
            });
            this._events.onJoin.dispatch(this.getPlayer(name));
        });
        watcher.onLeave.sub(name => this._events.onLeave.dispatch(this.getPlayer(name)));
        watcher.onMessage.sub(({ name, message }) => {
            this._events.onMessage.dispatch({ player: this.getPlayer(name), message });
            if (/^\/[^ ]/.test(message)) {
                let [, command, args] = message.match(/^\/([^ ]+) ?(.*)$/);
                let handler = this._commands.get(command.toLocaleUpperCase());
                if (handler) handler(this.getPlayer(name), args);
            }
        });
        watcher.start();
    }
}

/**
 * The storage class used by the [[MessageBot]] class and all [[MessageBotExtension]] instances.
 * It is expected that the
 */
class Storage {
  /**
   * Utility method to use and automatically save a key
   * @param key the key use when getting and setting the value
   * @param fallback the fallback if the key doesn't exist
   * @param callback the function to be called with the data, must return the value to be saved
   */
  with(key, fallback, callback) {
    let value = this.get(key, fallback);
    let result = callback(value);
    this.set(key, result == null ? value : result);
  }
}

var __rest = undefined && undefined.__rest || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0) t[p[i]] = s[p[i]];
    return t;
};
let registeredExtensions = new Map();
let extensionRegistered = stronglyTypedEvents_16();
let extensionDeregistered = stronglyTypedEvents_16();
class MessageBot {
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
        if (!MessageBot.dependencies) throw new Error('Dependencies must be set before creating this class.');
        this.world = new World(new MessageBot.dependencies.Api(info), storage);
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
    static get extensions() {
        return [...registeredExtensions.keys()];
    }
    /**
     * Gets the exports of an extension, returns undefined if the extension is not loaded.
     * @param id the extension id to get exports from
     */
    getExports(id) {
        let ex = this._extensions.get(id.toLocaleLowerCase());
        if (ex) return ex.exports;
    }
    /**
     * Adds an extension to this bot. Calls the init function supplied when registering the extension.
     * @param id the id of the registered extension to add.
     */
    addExtension(id) {
        id = id.toLocaleLowerCase();
        if (this._extensions.has(id)) throw new Error(`The ${id} extension has already been added.`);
        let creator = registeredExtensions.get(id);
        if (!creator) throw new Error(`The ${id} extension has not been registered.`);
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
        if (!ex) throw new Error(`The ${id} extension is not registered.`);
        try {
            if (uninstall) {
                ex.uninstall();
            } else {
                ex.remove();
            }
        } finally {
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
        var params = __rest(_a, []);
        // Common enough to be done here, set the name of the player up right.
        if (params.name && params.name.length) {
            let name = params.name.toLocaleLowerCase();
            params = Object.assign({}, params, { name, Name: name[0].toLocaleUpperCase() + name.substr(1), NAME: name.toLocaleUpperCase() });
        }
        let safeKeyRegex = Object.keys(params).map(key => key.replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1')).join('}}|{{');
        // Don't bother replacing if nothing to search for
        if (safeKeyRegex.length) {
            message = message.replace(new RegExp(`{{${safeKeyRegex}}}`, 'g'), key => {
                return params[key.substring(2, key.length - 2)];
            });
        }
        this.world.send(message);
    }
}
/**
 * An event that fires whenever an extension is registered or re-registered.
 */
MessageBot.extensionRegistered = extensionRegistered.asEvent();
/**
 * An event that fires when an extension is deregistered, if it has been registered. Will not fire when an extension is re-registered.
 */
MessageBot.extensionDeregistered = extensionDeregistered.asEvent();

/**
 * Parses logs from the portal into a standard format. This is only used by the [[PortalApi]] class. If you are consuming this library, you don't need to know anything about it.
 */
class PortalLogParser {
    /**
     * Creates a new instance of the PortalLogParser class.
     */
    constructor() {
        /**
         * Parses the logs into a standard format.
         *
         * @param lines the raw log lines.
         */
        this.parse = lines => {
            // Copy the lines array
            lines = lines.slice(0);
            // Assume first line is valid, if it isn't it will be dropped.
            for (let i = lines.length - 1; i > 0; i--) {
                let line = lines[i];
                if (!this.isValidLine(line)) {
                    lines[i - 1] += '\n' + lines.splice(i, 1);
                    continue;
                }
                this.addLine(line);
            }
            if (this.isValidLine(lines[0])) {
                this.addLine(lines[0]);
            }
            let entries = this.entries.reverse();
            this.entries = [];
            return entries;
        };
        this.isValidLine = line => {
            return (/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3} blockheads_server/.test(line)
            );
        };
        this.addLine = line => {
            let ts = line.substr(0, 24).replace(' ', 'T').replace(' ', 'Z');
            this.entries.push({
                raw: line,
                timestamp: new Date(ts),
                message: line.substr(line.indexOf(']') + 2)
            });
        };
        this.entries = [];
    }
}

// Functions defined in 4.1.1
/**
 * Computes the sha1 hash of the string as described by http://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf
 * See http://www.movable-type.co.uk/scripts/sha1.html for explanation of some of the bitwise magic.
 *
 * You probably don't want to touch this code.
 *
 * @param message the string to compute the SHA1 hash of
 */

var __awaiter$2 = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const root = 'http://portal.theblockheads.net';
let request;
try {
    request = fetch;
} catch (_a) {}
// Makes it possible to set the fetch function which the module uses. Necessary for terminal usage.

function unescapeHTML(html) {
    let map = {
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
        '&#39;': '\'',
        '&quot;': '"'
    };
    return html.replace(/(&.*?;)/g, (_, first) => map[first]);
}
function makeRequest(url, options = {}) {
    let headers = { 'X-Requested-With': 'XMLHttpRequest' };
    if (options.method == 'POST') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    return request(`${root}${url}`, Object.assign({ mode: 'same-origin', credentials: 'same-origin', redirect: 'follow', headers }, options));
}
function requestJSON(url, options) {
    return makeRequest(url, options).then(r => r.json());
}
function requestPage(url, options) {
    return makeRequest(url, options).then(r => r.text());
}
/**
 * Function to try to log in, if the log in fails, the returned promise will reject, otherwise it will resolve.
 *
 * @param username the username to try to log in with
 * @param password the password to try to log in with
 */

/**
 * Gets all worlds owned by the logged in user.
 */
function getWorlds() {
    return __awaiter$2(this, void 0, void 0, function* () {
        let page = yield requestPage('/worlds');
        let lines = page.split('\n');
        let worlds = [];
        lines.forEach(line => {
            if (/\t\tupdateWorld/.test(line)) {
                let name = line.match(/name: '([^']+?)'/);
                let id = line.match(/id: (\d+)/);
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
        this.parser = new PortalLogParser();
        /** @inheritdoc */
        this.getLists = () => __awaiter$2(this, void 0, void 0, function* () {
            let page = yield requestPage(`/worlds/lists/${this.info.id}`);
            let getList = name => {
                let names = [];
                let list = page.match(new RegExp(`<textarea name="${name}">([\\s\\S]*?)</textarea>`));
                if (list) {
                    names = unescapeHTML(list[1]).split(/\r?\n/);
                }
                // Remove duplicates / blank lines
                return Array.from(new Set(names)).filter(Boolean);
            };
            return {
                adminlist: getList('admins'),
                modlist: getList('modlist'),
                whitelist: getList('whitelist'),
                blacklist: getList('blacklist')
            };
        });
        /** @inheritdoc */
        this.setLists = lists => __awaiter$2(this, void 0, void 0, function* () {
            let makeSafe = list => encodeURIComponent(list.join('\n'));
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
        this.getOverview = () => __awaiter$2(this, void 0, void 0, function* () {
            let page = yield requestPage(`/worlds/${this.info.id}`);
            let firstMatch = (r, fallback = '') => {
                let m = page.match(r);
                return m ? m[1] : fallback;
            };
            let privacy = firstMatch(/^\$\('#privacy'\).val\('(.*?)'\)/m, 'public');
            let online = [];
            let match = page.match(/^\t<tr><td class="left">(.*?)(?=<\/td>)/gm);
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
                link: firstMatch(/^\t<tr><td>Link:<\/td><td><a href="(.*)">\1<\/a>/m),
                pvp: !!firstMatch(/^\$\('#pvp'\)\./m),
                privacy,
                password: firstMatch(/^\t\t<td>Password:<\/td><td>(Yes|No)<\/td><\/tr>$/m) == 'Yes',
                size: firstMatch(/^\t\t<td>Size:<\/td><td>(.*?)<\/td>$/m),
                whitelist: firstMatch(/<td>Whitelist:<\/td><td>(Yes|No)<\/td>/m) == 'Yes',
                online
            };
        });
        /** @inheritdoc */
        this.getLogs = () => {
            return requestPage(`/worlds/logs/${this.info.id}`).then(log => log.split('\n')).then(lines => this.parser.parse(lines));
        };
        /** @inheritdoc */
        this.getMessages = (lastId = 0) => {
            return requestJSON('/api', {
                method: 'POST',
                body: `command=getchat&worldId=${this.info.id}&firstId=${lastId}`
            }).then(({ status, log, nextId }) => {
                if (status != 'ok') return { log: [], nextId: 0 }; // Reset, world likely offline.
                return { nextId, log };
            }, () => ({ log: [], nextId: lastId })); //Network error, don't reset nextId
        };
        /** @inheritdoc */
        this.send = message => {
            return requestJSON('/api', {
                method: 'POST',
                body: `command=send&worldId=${this.info.id}&message=${encodeURIComponent(message)}`
            }).then(result => {
                if (result.status == 'ok') return;
                throw new Error(`Unable to send ${message}`);
            });
        };
        /** @inheritdoc */
        this.start = () => {
            return requestJSON('/api', {
                method: 'POST',
                body: `command=start&worldId=${this.info.id}`
            }).then(() => undefined, console.error);
        };
        /** @inheritdoc */
        this.stop = () => {
            return requestJSON('/api', {
                method: 'POST',
                body: `command=stop&worldId=${this.info.id}`
            }).then(() => undefined, console.error);
        };
        /** @inheritdoc */
        this.restart = () => {
            return requestJSON('/api', {
                method: 'POST',
                body: `command=reboot&worldId=${this.info.id}`
            }).then(() => undefined, console.error);
        };
    }
}

class Storage$1 extends Storage {
    constructor(head) {
        super();
        this.head = head;
    }
    get(key, fallback) {
        // JSON.parse correctly handles null so it's fine to declare this as string.
        let item = localStorage.getItem(this.head + key);
        try {
            let parsed = JSON.parse(item);
            return parsed == null ? fallback : parsed;
        } catch (_a) {
            return fallback;
        }
    }
    set(key, value) {
        localStorage.setItem(this.head + key, JSON.stringify(value));
    }
    clear(prefix = '') {
        let remove = [];
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i); // This is safe.
            if (key.startsWith(this.head + prefix)) remove.push(key);
        }
        remove.forEach(key => localStorage.removeItem(key));
    }
    prefix(prefix) {
        return new Storage$1(this.head + prefix);
    }
}

var page = "<header class=\"header is-fixed-top\">\r\n    <nav class=\"nav-inverse nav has-shadow\">\r\n        <div class=\"nav-left\">\r\n            <div class=\"nav-item nav-slider-toggle\">\r\n                <img src=\"https://i.imgsafe.org/80a1129a36.png\">\r\n            </div>\r\n            <a class=\"nav-item is-tab nav-slider-toggle\">Menu</a>\r\n        </div>\r\n    </nav>\r\n</header>\r\n\r\n<div class=\"nav-slider-container\">\r\n    <nav class=\"nav-slider\"></nav>\r\n    <div class=\"is-overlay nav-slider-toggle\"></div>\r\n</div>\r\n\r\n<div id=\"container\" class=\"has-fixed-nav\"></div>\r\n\r\n\r\n<div id=\"modal\" class=\"modal\">\r\n    <div class=\"modal-background\"></div>\r\n    <div class=\"modal-card\">\r\n        <header class=\"modal-card-head\"></header>\r\n        <section class=\"modal-card-body\"></section>\r\n        <footer class=\"modal-card-foot\"></footer>\r\n    </div>\r\n</div>\r\n";

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

function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator],
        i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
        r,
        ar = [],
        e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
        e = { error: error };
    } finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
            if (e) throw e.error;
        }
    }
    return ar;
}

var api = function () {
    var menuSlider = document.querySelector('.nav-slider-container .nav-slider');
    var toggleMenu = function () {
        return menuSlider.classList.toggle('is-active');
    };
    try {
        for (var _a = __values(document.querySelectorAll('.nav-slider-toggle')), _b = _a.next(); !_b.done; _b = _a.next()) {
            var el = _b.value;
            el.addEventListener('click', toggleMenu);
        }
    } catch (e_1_1) {
        e_1 = { error: e_1_1 };
    } finally {
        try {
            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
        } finally {
            if (e_1) throw e_1.error;
        }
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
            Array.from(container.children).forEach(function (child) {
                return child.classList.remove('visible');
            });
            tab.classList.add('visible');
            // Nav items
            Array.from(menuContainer.querySelectorAll('span.nav-item')).forEach(function (span) {
                return span.classList.remove('is-active');
            });
            nav.classList.add('is-active');
        }
    });
    var addTab = function (text, groupName) {
        var div = container.appendChild(document.createElement('div'));
        var parent = menuContainer;
        if (groupName) parent = groups.get(groupName);
        var nav = parent.appendChild(document.createElement('span'));
        nav.textContent = text;
        nav.classList.add('nav-item');
        tabs.set(nav, div);
        return div;
    };
    var removeTab = function (content) {
        try {
            for (var _a = __values(tabs.entries()), _b = _a.next(); !_b.done; _b = _a.next()) {
                var _c = __read(_b.value, 2),
                    nav = _c[0],
                    div = _c[1];
                if (div == content) {
                    div.remove();
                    nav.remove();
                    return;
                }
            }
        } catch (e_2_1) {
            e_2 = { error: e_2_1 };
        } finally {
            try {
                if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
            } finally {
                if (e_2) throw e_2.error;
            }
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
        if (parent) parentElement = groups.get(parent);
        details = parentElement.appendChild(document.createElement('details'));
        details.classList.add('nav-item');
        var summary = details.appendChild(document.createElement('summary'));
        summary.textContent = text;
        groups.set(groupName, details);
    };
    var removeTabGroup = function (groupName) {
        var group = groups.get(groupName);
        if (!group) return;
        try {
            for (var _a = __values(group.querySelectorAll('span')), _b = _a.next(); !_b.done; _b = _a.next()) {
                var child = _b.value;
                // Unless someone has been purposely messing with the page, this is a safe assertion
                removeTab(tabs.get(child));
            }
        } catch (e_3_1) {
            e_3 = { error: e_3_1 };
        } finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            } finally {
                if (e_3) throw e_3.error;
            }
        }
        var e_3, _c;
    };
    var handleRule = function (rule, element) {
        if (typeof rule.text == 'string') {
            element.textContent = rule.text;
        } else if (typeof rule.html == 'string') {
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
            if (child) child.selected = true;
        }
        Object.keys(rule).filter(function (key) {
            return !blacklist.includes(key);
        }).forEach(function (key) {
            return element.setAttribute(key, rule[key]);
        });
    };
    var buildTemplate = function (template, target, rules) {
        if (typeof template == 'string') template = document.querySelector(template);
        if (typeof target == 'string') target = document.querySelector(target);
        var parent = document.importNode(template.content, true);
        try {
            for (var rules_1 = __values(rules), rules_1_1 = rules_1.next(); !rules_1_1.done; rules_1_1 = rules_1.next()) {
                var rule = rules_1_1.value;
                var element = parent.querySelector(rule.selector);
                if (!element) {
                    console.warn("Could not find " + rule.selector, rule);
                    continue;
                }
                handleRule(rule, element);
            }
        } catch (e_4_1) {
            e_4 = { error: e_4_1 };
        } finally {
            try {
                if (rules_1_1 && !rules_1_1.done && (_a = rules_1.return)) _a.call(rules_1);
            } finally {
                if (e_4) throw e_4.error;
            }
        }
        target.appendChild(parent);
        var e_4, _a;
    };
    var notify = function (text, displayTime) {
        if (displayTime === void 0) {
            displayTime = 3;
        }
        var el = document.body.appendChild(document.createElement('div'));
        el.classList.add('bot-notification', 'is-active');
        el.textContent = text;
        var timeouts = [setTimeout(function () {
            return el.classList.remove('is-active');
        }, displayTime * 1000), setTimeout(function () {
            return el.remove();
        }, (displayTime + 1) * 1000)];
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
            styles.push(button.style || '');
            el.textContent = button.text;
        } else {
            el.textContent = button;
        }
    };
    var showAlert = function () {
        alertInstance.active = true;
        var _a = alertInstance.queue.shift(),
            html = _a.html,
            buttons = _a.buttons,
            callback = _a.callback;
        modalBody.innerHTML = html;
        Array.isArray(buttons) ? buttons.forEach(addButton) : addButton('OK');
        modal.classList.add('is-active');
        modalFooter.addEventListener('click', function buttonHandler(event) {
            var target = event.target;
            if (target.tagName != 'A') return;
            modal.classList.remove('is-active');
            try {
                if (callback) callback.call(null, target.textContent);
            } catch (err) {
                console.error('Error calling alert callback', err);
            }
            modalFooter.innerHTML = '';
            modalFooter.removeEventListener('click', buttonHandler);
            alertInstance.active = false;
            if (alertInstance.queue.length) showAlert();
        });
    };
    var alert = function (html, buttons, callback) {
        alertInstance.queue.push({ html: html, buttons: buttons, callback: callback });
        if (!alertInstance.active) showAlert();
    };
    var prompt = function (text, callback) {
        var p = document.createElement('p');
        p.textContent = text;
        alert(p.outerHTML + "<textarea class=\"textarea\"></textarea>", ['OK', 'Cancel'], function () {
            var el = modalBody.querySelector('textarea');
            if (callback) callback(el.textContent || '');
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
                } else {
                    details.open = true;
                    details.setAttribute('open', 'open');
                }
            }
        });
    }
}

MessageBot.registerExtension('ui', function (ex) {
    if (typeof document == 'undefined') {
        throw new Error('This extension cannot be loaded outside of a browser environment.');
    }
    ex.uninstall = function () {
        throw new Error('The UI extension cannot be removed once loaded');
    };
    // Page creation
    document.body.innerHTML = page;
    document.head.querySelectorAll('link').forEach(function (el) {
        return el.remove();
    });
    var style = document.head.appendChild(document.createElement('link'));
    style.rel = 'stylesheet';
    style.href = 'https://gitcdn.xyz/repo/Blockheads-Messagebot/UI/master/index.css';
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
        this.listener = player => {
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
        this.listener = player => {
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
            if (player.name == 'SERVER') return;
            let responses = 0;
            for (let msg of this.messages) {
                let checks = [checkJoins(player, msg), checkGroups(player, msg), this.triggerMatches(message, msg.trigger)];
                if (checks.every(Boolean) && responses++ <= this.ex.storage.get('maxResponses', 3)) {
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
            } catch (_a) {
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
            if (this.index >= this.messages.length) this.index = 0;
            if (this.messages[this.index]) this.ex.bot.send(this.messages[this.index++].message);
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
                        if (result != 'Delete') return;
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
                Array.from(element.querySelectorAll('[data-target]')).forEach(input => {
                    let name = input.dataset['target'];
                    if (!name) return;
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
            this.ui.buildTemplate(this.template, this.root, [{ selector: '[data-target=message]', text: msg.message || '' }, { selector: '[data-target=joins_low]', value: msg.joins_low || 0 }, { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 }, { selector: '[data-target=group]', value: msg.group || 'all' }, { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }]);
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
            this.ui.buildTemplate(this.template, this.root, [{ selector: '[data-target=message]', text: msg.message || '' }, { selector: '[data-target=joins_low]', value: msg.joins_low || 0 }, { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 }, { selector: '[data-target=group]', value: msg.group || 'all' }, { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }]);
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
            this.ui.buildTemplate(this.template, this.root, [{ selector: '[data-target=message]', text: msg.message || '' }, { selector: '[data-target=trigger]', value: msg.trigger || '' }, { selector: '[data-target=joins_low]', value: msg.joins_low || 0 }, { selector: '[data-target=joins_high]', value: msg.joins_high || 9999 }, { selector: '[data-target=group]', value: msg.group || 'all' }, { selector: '[data-target=not_group]', value: msg.not_group || 'nobody' }]);
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
            this.ui.buildTemplate(this.template, this.root, [{ selector: '[data-target=message]', text: msg.message || '' }]);
        };
    }
}

var css = ".messages-container input[type=number] {\r\n    width: 5em;\r\n}\r\n\r\n.messages-container small {\r\n    color: #777;\r\n}\r\n";

MessageBot.registerExtension('messages', function (ex, world) {
    let listeners = [];
    ex.remove = () => listeners.forEach(l => l.remove());
    let hasLoaded = false;
    let delayLoad = () => {
        if (hasLoaded) return;
        hasLoaded = true;
        let timeout = setTimeout(() => {
            listeners = [new JoinListener(ex), new LeaveListener(ex), new TriggerListener(ex), new AnnouncementListener(ex)];
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
        let tabs = [new JoinTab(ex), new LeaveTab(ex), new TriggerTab(ex), new AnnouncementTab(ex)];
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
        } else {
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
        } else if (event.key == 'ArrowDown') {
            if (history.length > current + 1) {
                input.value = history[++current];
            } else if (history.length == current + 1) {
                input.value = '';
                current = history.length;
            }
        } else if (event.key == 'Enter') {
            addIfNew(input.value);
        }
    });
}

var html = "<template>\r\n    <li>\r\n        <span>NAME</span>\r\n        <span>: Message</span>\r\n    </li>\r\n</template>\r\n<div id=\"console\">\r\n    <div class=\"chat\">\r\n        <ul></ul>\r\n    </div>\r\n    <div class=\"chat-control\">\r\n        <div class=\"field has-addons\">\r\n            <p class=\"control is-expanded\">\r\n                <input type=\"text\" class=\"input\" />\r\n            </p>\r\n            <p class=\"control\">\r\n                <button class=\"input button is-primary\">SEND</button>\r\n            </p>\r\n        </div>\r\n    </div>\r\n</div>";

var css$1 = "#console .mod > span:first-child {\r\n    color: #05f529;\r\n}\r\n\r\n#console .admin > span:first-child {\r\n    color: #2b26bd;\r\n}\r\n\r\n#console .chat {\r\n    margin: 0 1em;\r\n    height: calc(100vh - 52px - 4.25em);\r\n    overflow-y: auto;\r\n}\r\n\r\n#console .chat-control {\r\n    position: fixed;\r\n    bottom: 0;\r\n    width: 100vw;\r\n    background: #fff;\r\n}\r\n\r\n#console .field {\r\n    margin: 1em;\r\n}\r\n";

MessageBot.registerExtension('console', function (ex, world) {
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
        if (input.value.startsWith('/')) {
            consoleExports.log(input.value);
        }
        world.send(input.value);
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
        if (!message.length) return;
        let messageClass = 'player';
        if (player.isAdmin) messageClass = 'admin';
        if (player.isMod) messageClass = 'mod';
        ui.buildTemplate(template, chatUl, [{ selector: 'li', 'class': messageClass }, { selector: 'span:first-child', text: player.name }, { selector: 'span:last-child', text: ': ' + message }]);
    }
    function addGenericMessage(message) {
        if (!message.length) return;
        let li = document.createElement('li');
        li.textContent = message;
        chatUl.appendChild(li);
    }
    // Export required functions
    let consoleExports = {
        log: message => addPlayerMessage(world.getPlayer('SERVER'), message)
    };
    ex.exports = consoleExports;
    function logJoins(player) {
        if (ex.storage.get('logJoinIps', true)) {
            consoleExports.log(`${player.name} (${player.ip}) joined.`);
        } else {
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

window['@bhmb/bot'] = { MessageBot };
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
MessageBot.dependencies = { Api, getWorlds };
let info = {
    name: document.querySelector('#title').textContent,
    id: worldId + ''
};
let bot = new MessageBot(new Storage$1(''), info);
bot.addExtension('ui');
bot.addExtension('console');
document.querySelector('.nav-item').click();
bot.addExtension('messages');

}());
