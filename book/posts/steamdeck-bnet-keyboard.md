# Fixing the Steam Deck's on-screen keyboard in Battle.net

So, Battle.net on the Steam Deck was working fine for me for quite some time, and then I started experiencing issues with Steam's on-screen keyboard. Maybe something changed with an update, I'm not sure what caused this.

When Battle.net opens its login window the Steam on-screen keyboard began to glitch like mad - opening and closing in a super fast loop. This ended up crashing steam; but most frustrating of all meant I couldn't login to Battle.net, even with my credentials saved, the crash meant it no longer worked.

- [Fixing the Steam Deck's on-screen keyboard in Battle.net](#fixing-the-steam-decks-on-screen-keyboard-in-battlenet)
  - [The workaround](#the-workaround)
    - [1. Get terminal access](#1-get-terminal-access)
    - [2. Find Battle.net's proton wine prefix](#2-find-battlenets-proton-wine-prefix)
    - [3. Replace `steam.exe` with an immutable file](#3-replace-steamexe-with-an-immutable-file)
    - [4. Enjoy](#4-enjoy)
  - [Reverting this change](#reverting-this-change)

## The workaround

In each proton wine prefix, there's an executable file called `steam.exe`. It seems this file is responsible for detecting when the on-screen keyboard needs to appear. This file is also regenerated every time a game is run, so we can't just remove it: we need to replace it with something that can't be overwritten.

### 1. Get terminal access

Multiple options available to you here:

1. Open `Konsole` from the Steam Deck's Desktop mode
2. SSH to your Steam Deck from another machine

### 2. Find Battle.net's proton wine prefix

I usually do this by opening protontricks in Desktop Mode, scrolling the list until I see the Battle.net game in there, and remembering the numerical id.

Your prefix should be something like this:

```title="proton prefix"
/home/deck/.local/share/Steam/steamapps/compatdata/<battle net id here>
```

### 3. Replace `steam.exe` with an immutable file

We're going to delete the `steam.exe` file in that prefix, and replace it with a file that can't be overwritten (it's this file that's causing the crash).

```bash title="replace steam.exe"
# change to the proton wine prefix directory
cd /home/deck/.local/share/Steam/steamapps/compatdata/<battle net id here>/

# delete `steam.exe`
rm 'pfx/drive_c/Program Files (x86)/Steam/steam.exe'

# put an immutable file at its location
sudo chattr +i 'pfx/drive_c/Program Files (x86)/Steam/steam.exe'
```

The first command `rm` removes the existing file (don't worry about permanently deleting something, if you remove the file later, Steam will try to replace it each time the game is started, so this is completely reversible).

The second command `sudo chattr +i` creates an immutable file - basically it says "this file cannot be deleted, overwritten, renamed, linked to, etc". This is what stops Steam from replacing it each time the game starts.

### 4. Enjoy

Start Battle.net again. Now, the glitchy keyboard thing will be gone! 🎉

In case you're wondering:

* The Steam on-screen keyboard still works (opening via the <kbd>steam</kbd> + <kbd>x</kbd> shortcut)
* As far as I can tell, removing `steam.exe` doesn't change anything at all

## Reverting this change

If you want to reverse this, then change the `chattr` command to `sudo chattr -i` (with `-` instead of `+`). Once you've done that, re-run the game and Steam will replace the steam.exe with a new copy.
