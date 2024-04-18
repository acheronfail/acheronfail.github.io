# Steam Deck things

## Create a development environment

Ensure your deck is SteamOS 3.5 or later. That way `podman` and `distrobox` already come pre-installed!

Initial setup:

```bash, title="deck"
# I chose arch linux as the distribution, but choose whichever you'd like here:
# https://github.com/89luca89/distrobox/blob/main/docs/compatibility.md#containers-distros
distrobox create -n dev -i quay.io/toolbx/arch-toolbox:latest
```

Now, whenever you'd like to enter the container:

```bash, title="deck"
distrobox enter dev
```

Pro-tip: if your environment needs to create nested X sessions, make sure to run `xhost +si:localuser:$USER` on the host!

## Automatically configure Yuzu with EmuDeck

Before Yuzu was taken down by Nintendo, EmuDeck had a button in its UI to automatically configure Yuzu. This automated a few things such as:

* integrating gyro with `SteamDeckGyroDSU`
* setting <kbd>start+select</kbd> shortcuts to close Yuzu

In recent versions though, this button no longer exists. But that's okay, becuase EmuDeck [still ships the script](https://github.com/dragoonDorise/EmuDeck/blob/b834e149c5f33ef64e30d47dacab97a047398fbc/functions/EmuScripts/emuDeckYuzu.sh) that was run when clicking that button.

So, to run it ourselves:

```bash, title="deck"
# enter EmuDeck's config folder
cd ~/.config/EmuDeck/backend/
source functions/all.sh
Yuzu_resetConfig
```
