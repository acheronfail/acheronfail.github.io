# Building a macOS Colour Picker

Links

* Digital Colour Meter
* <https://colorsnapper.com/>
* <https://github.com/acheronfail/pixel-picker>
* [hiding cursor](https://github.com/acheronfail/pixel-picker/blob/master/Pixel%20Picker/ShowAndHideCursor.swift)
  * [original methods](https://github.com/acheronfail/pixel-picker/commit/b445e0517fcb076236bec86519f3f65bd50efa2c)
* [`nsmenu` carbon](https://github.com/acheronfail/pixel-picker/blob/master/Pixel%20Picker/PPMenuShortcutView.m)
* [coordinate systems](https://github.com/acheronfail/pixel-picker/blob/master/Pixel%20Picker/Util.swift#L28)

Story

* what I wanted (open source version of built in one, colorsnapper, etc)
* wasn't heavy
* worked over all apps
* didn't support copying it into the template I wanted
* implementation
  * stackoverflow questions: how to find active screen, etc
  * building it all into the menu: carbon private APIs
  * hiding the cursor over all apps: private APIs
* a bit of fun: obfuscating the APIs
  * would work for the app store
  * not worth it anyway, etc

---
TODO