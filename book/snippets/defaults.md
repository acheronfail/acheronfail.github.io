# macOS `defaults`

There are many useful - but hidden - preferences on macOS systems.

This is a list of them so I have a place to reference if I should ever need them.

- [macOS `defaults`](#macos-defaults)
  - [Keyboard behaviour](#keyboard-behaviour)
  - [Menu Bar](#menu-bar)
  - [Window tweaks](#window-tweaks)
  - [Don't use iCloud by default](#dont-use-icloud-by-default)
  - [Application behaviour](#application-behaviour)
  - [Typing behaviour](#typing-behaviour)
  - [Screenshots](#screenshots)
  - [Finder](#finder)
  - [Spaces](#spaces)
  - [Photos](#photos)
  - [Set computer hostname](#set-computer-hostname)
- [Other links](#other-links)


## Keyboard behaviour

```bash
# Disable press-and-hold for keys in favour of key repeat
defaults write NSGlobalDomain ApplePressAndHoldEnabled -bool false

# Configure key repeat delay and rate
defaults write NSGlobalDomain KeyRepeat -int 1
defaults write NSGlobalDomain InitialKeyRepeat -int 10
```

## Menu Bar

Mainly useful for newer machines with the notch bar. [Also give this page a read](https://www.jessesquires.com/blog/2023/12/16/macbook-notch-and-menu-bar-fixes/).

```bash
defaults -currentHost write -globalDomain NSStatusItemSpacing -int 6
defaults -currentHost write -globalDomain NSStatusItemSelectionPadding -int 4
```

Revert with:

```bash
defaults -currentHost delete -globalDomain NSStatusItemSpacing
defaults -currentHost delete -globalDomain NSStatusItemSelectionPadding
```

## Window tweaks

```bash
# Expand save panel by default
defaults write NSGlobalDomain NSNavPanelExpandedStateForSaveMode -bool true
defaults write NSGlobalDomain NSNavPanelExpandedStateForSaveMode2 -bool true

# Expand print panel by default
defaults write NSGlobalDomain PMPrintingExpandedStateForPrint -bool true
defaults write NSGlobalDomain PMPrintingExpandedStateForPrint2 -bool true
```

## Don't use iCloud by default

```bash
defaults write NSGlobalDomain NSDocumentSaveNewDocumentsToCloud -bool false
```

## Application behaviour

```bash
# Disable Resume system-wide
defaults write com.apple.systempreferences NSQuitAlwaysKeepsWindows -bool false

# Disable automatic termination of inactive apps
defaults write NSGlobalDomain NSDisableAutomaticTermination -bool true
```

## Typing behaviour

```bash
# Disable automatic capitalization
defaults write NSGlobalDomain NSAutomaticCapitalizationEnabled -bool false

# Disable smart dashes
defaults write NSGlobalDomain NSAutomaticDashSubstitutionEnabled -bool false

# Disable automatic period substitution
defaults write NSGlobalDomain NSAutomaticPeriodSubstitutionEnabled -bool false

# Disable smart quotes
defaults write NSGlobalDomain NSAutomaticQuoteSubstitutionEnabled -bool false

# Disable auto-correct
defaults write NSGlobalDomain NSAutomaticSpellingCorrectionEnabled -bool false
```

## Screenshots

```bash
# Save screenshots to a particular directory
defaults write com.apple.screencapture location -string "${HOME}/Pictures"

# Save screenshots in PNG format (other options: BMP, GIF, JPG, PDF, TIFF)
defaults write com.apple.screencapture type -string "png"

# Disable shadow in screenshots
defaults write com.apple.screencapture disable-shadow -bool true
```

## Finder

```bash
# allow quitting via ⌘ + Q; doing so will also hide desktop icons
defaults write com.apple.finder QuitMenuItem -bool true

# show hidden files by default
defaults write com.apple.finder AppleShowAllFiles -bool true

# show all filename extensions
defaults write NSGlobalDomain AppleShowAllExtensions -bool true

# show status bar
defaults write com.apple.finder ShowStatusBar -bool true

# show path bar
defaults write com.apple.finder ShowPathbar -bool true

# display full POSIX path as Finder window title
defaults write com.apple.finder _FXShowPosixPathInTitle -bool true

# keep folders on top when sorting by name
defaults write com.apple.finder _FXSortFoldersFirst -bool true

# when performing a search, search the current folder by default
defaults write com.apple.finder FXDefaultSearchScope -string "SCcf"

# disable the warning when changing a file extension
defaults write com.apple.finder FXEnableExtensionChangeWarning -bool false

# avoid creating .DS_Store files on network or USB volumes
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true
defaults write com.apple.desktopservices DSDontWriteUSBStores -bool true

# use list view in all Finder windows by default
# four-letter codes for the other view modes: `icnv`, `clmv`, `glyv`
defaults write com.apple.finder FXPreferredViewStyle -string "Nlsv"
```

## Spaces

```bash
# Don’t group windows by application in Mission Control
# (i.e. use the old Exposé behavior instead)
defaults write com.apple.dock expose-group-by-app -bool false

# Disable Dashboard
defaults write com.apple.dashboard mcx-disabled -bool true

# Don’t show Dashboard as a Space
defaults write com.apple.dock dashboard-in-overlay -bool true

# Don’t automatically rearrange Spaces based on most recent use
defaults write com.apple.dock mru-spaces -bool false

# Remove the auto-hiding Dock delay
defaults write com.apple.dock autohide-delay -float 0
# Remove the animation when hiding/showing the Dock
defaults write com.apple.dock autohide-time-modifier -float 0

# Automatically hide and show the Dock
defaults write com.apple.dock autohide -bool true

# Make Dock icons of hidden applications translucent
defaults write com.apple.dock showhidden -bool true

# Don’t show recent applications in Dock
defaults write com.apple.dock show-recents -bool false
```

## Photos

```bash
# Prevent Photos from opening automatically when devices are plugged in
defaults -currentHost write com.apple.ImageCapture disableHotPlug -bool true
```

## Set computer hostname

(Yes, I know these aren't `defaults` commands, but this is as good a place as any other!)

```bash
computer_name="your_name_here"
sudo scutil --set ComputerName "${computer_name}"
sudo scutil --set HostName "${computer_name}"
sudo scutil --set LocalHostName "${computer_name}"
sudo defaults write /Library/Preferences/SystemConfiguration/com.apple.smb.server NetBIOSName -string "${computer_name}"
```

# Other links

* This is the most thorough reference of settings I've found: <https://github.com/mathiasbynens/dotfiles/blob/c886e139233320e29fd882960ba3dd388d57afd7/.macos>
* Another good one: <https://gist.github.com/brandonb927/3195465/>
* Used to be an old preference pane which could automatically search these: <https://code.google.com/archive/p/blacktree-secrets/source/default/source>