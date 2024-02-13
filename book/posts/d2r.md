+++
tags = ['linux', 'games']
+++

# Running Diablo II Resurrected on Linux

Ahh... Fresh meat!

<!-- more -->

I had to do this twice and it bothered me to have to look a few things up again, so here it is for next time (if there is a next time, I reckon this will be fixed fairly soon in wine/proton/etc).

~~~md info title="Please note"
The following instructions are for [Arch Linux](https://archlinux.org/), but they'll be very similar for any other distribution.
~~~

## Battle.net

Installing Battle.net on Linux is straightforward, I usually do it via Lutris:

```bash,title="Shell"
$ pacman -S lutris
```

Once you've installed Lutris, install Battle.net as per its instructions.

~~~md tip title="Trouble logging in?"
I found that I also had to install `lib32-gnutls` in order for the Battle.net login window to work properly.
This package lives in the `multilib` repository, so make sure you've [enabled that](https://wiki.archlinux.org/title/official_repositories#Enabling_multilib) if you haven't already.
~~~

## Installing Diablo II Resurrected

Go ahead and install it the normal way from within Battle.net, by choosing the game and selecting "Install".

If launching the game now crashes, ends up in a black screen or is otherwise terrible, then the fix for the issues I faced probably hasn't been merged yet. If that's the case, continue reading.

There's a [Pull Request here](https://github.com/HansKristian-Work/vkd3d-proton/pull/767) which details a fix for the initial crashes and rendering issues. To save you some time reading between the lines, here's what you have to do.

### Install a patched `vkd3d-proton`

Sometimes showing is easier than telling:

```bash,title="Shell"
# Clone the fork that contains the fix
$ git clone git@github.com:K0bin/vkd3d-proton.git
$ cd vkd3d-proton
# Checkout the branch with the fix
$ git checkout disable-raster

# Build the package
$ ./package-release.sh master /tmp --no-package

# And, now install it into Lutris
$ cp /tmp/vkd3d-proton-master/x64/d3d12.dll ~/.local/share/lutris/runtime/dxvk/v1.9.1L/x64/
$ cp /tmp/vkd3d-proton-master/x86/d3d12.dll ~/.local/share/lutris/runtime/dxvk/v1.9.1L/x32/
```

### Add `RADV_DEBUG=nohiz` to the environment

1. In Lutris, click the arrow next to the "Play" button, and then click "Configure"
2. Select the "System Options" tab
3. Add `RADV_DEBUG` and `nohiz` into the "Environment Variables" section

After making the above changes, make sure to restart Battle.net if you had it running.
Launch Battle.net again, and launch Diablo II Resurrected normally via Battle.net and it should work as expected.

Now go rescue Deckard Cain before you lose your mind identifying items!
