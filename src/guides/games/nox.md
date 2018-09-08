# Running Nox on Windows 10

If you haven't played [Nox](https://en.wikipedia.org/wiki/Nox_(video_game)), then you're missing out on a seriously underrated game.

I found it by pure accident a while back, and even with its excellent storytelling and enjoyable world, it had me at its opening cinematic.

Not too long ago I took that nostalgic trip down memory lane, and wished to get it running on a more modern computer, here's how I did it.

## How to get Nox (the base game) working

First, you need to obtain the game. You can [get it on GOG](https://www.gog.com/game/nox), and this guide assumes you're using that same version.

1. Install the game from GOG as per normal
2. Set `Nox.exe` and `Game.exe` in its installation directory to use compatibility mode `Windows 98/ME`
3. Enjoy!

<div class="warning">
This worked well for me the first time, but for another computer I had to change the screen resolution.

Try tweaking those settings until it works.
</div>

## How to get Nox Quest (expansion pack) working

This one wasn't as straightforward as the base game! You need to have the base game installed and working before trying to install the expansion pack.

1. Open the Registry Editor (try `Windows + R` and then type `regedit`)
2. Navigate to `HKEY_LOCAL_MACHINE\Software\Wow6432Node\`
3. If the key `Westwood` doesn't exist then right-click the key (`Wow6432Node`) from above, add a new Key and name it `Westwood`
4. Right-click `Westwood` and add a new Key and name it `Nox`
5. Right-click `Nox` and add a new `DWORD`, name it `SKU`, and give it a hexadecimal value of `2500`.
6. Save your changes (click "OK")

The expansion should now run (it's an extra menu item in the game's menu).

Now hop to it! Tina made bacon! 🥓
