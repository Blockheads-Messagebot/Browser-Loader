# Browser-Loader
A loader for the MessageBot via bookmarklets

## Installation

Create a bookmark with the following code for the URL:
```
javascript:(function(){if (!window['@bhmb/bot'])document.head.appendChild(document.createElement('script')).src='https://blockheads-messagebot.github.io/Browser-Loader/bundle.js'}())
```

If you have Greasemonkey or Tampermonkey installed, you can [click here](https://blockheads-messagebot.github.io/Browser-Loader/userscript.user.js) to install a userscript that will add links on your world page to launch the bot.

If you are on a computer, you can drag this link to your bookmarks: <a href="javascript:(function(){if (!window['@bhmb/bot'])document.head.appendChild(document.createElement('script')).src='https://blockheads-messagebot.github.io/Browser-Loader/bundle.js'}())">MessageBot</a>

Click the bookmark when on a world page on [the portal](http://portal.theblockheads.net/worlds/).
