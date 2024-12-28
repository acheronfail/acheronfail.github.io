+++
tags = ["unraid", "linux"]
+++

# Change encryption key on an already encrypted unraid server

I recently wanted to change the encryption keys for the disks in an unraid server. This was for unraid version `6.12.9`, so if you're on an earlier or later version, things might be different.

## Choose passphrase or keyfile

Things will differ depending on if you want to use a `keyfile` or a `passphrase`. A `passphrase` is using a password - you'd type this in when you start the unraid server; whereas a `keyfile` is a file you would use instead of a password, usually by choosing it in a file picker in the unraid web ui.

The process we'll go through is **adding** a new key to use to unlock the disks, testing that it works, and then **removing** the old key.

At no point will we change the key in-place - that's too risky: if you get it wrong, your data is gone.

## Adding a new key

You'll need to do this for each of the disks in your array. **You must use the `/dev/mdXp1` file, and not the `/dev/sdX` file for the disks in the array**.

The parity disk is not an encrypted disk, so nothing needs to be done for that.

For example, if you have 4 disks in your array, and you want to add a new `passphrase` key:

```bash,title="add new encryption: passphrase"
cryptsetup luksAddKey /dev/md1p1
cryptsetup luksAddKey /dev/md2p1
cryptsetup luksAddKey /dev/md3p1
cryptsetup luksAddKey /dev/md4p1

# if you have encrypted cache disks, use their `/dev/sdX1` paths:
cryptsetup luksAddKey /dev/sdX1
```

Or, if you want use a `keyfile` instead:

```bash,title="add new encryption: passphrase"
cryptsetup luksAddKey /dev/md1p1 path/to/new/keyfile
cryptsetup luksAddKey /dev/md2p1 path/to/new/keyfile
cryptsetup luksAddKey /dev/md3p1 path/to/new/keyfile
cryptsetup luksAddKey /dev/md4p1 path/to/new/keyfile

# if you have encrypted cache disks, use their `/dev/sdX1` paths:
cryptsetup luksAddKey /dev/sdX1 path/to/new/keyfile
```

~~~md warning title="Be careful when using a keyfile"
If you're using a `keyfile`, make sure you have a backup of it somewhere safe. If you lose it, you won't be able to unlock your disks.

Also, think about how you're storing it - if you just store it directly on the unraid USB stick, you're effectively not using encryption at all.
~~~

## Testing the new key

Now's the time to reboot your array.

When it starts back up, try using your new `passphrase` or `keyfile` to unlock it.

~~~md warning title="Do not skip this step"
If the new key you're adding doesn't work, and you proceed onwards and remove your old key, you'll have lost access to all your data.

Ensure using the new key works and unlocks _all_ your encrypted disks before proceeding to remove the old key.
~~~

If it worked, let's move on to removing the old key.

## Removing the old key

This is similar to adding a new key. When you remove it `cryptsetup` will prompt you on which key to remove. It should go without saying: remove the old one.

```bash,title="remove old encryption"
cryptsetup luksRemoveKey /dev/md1p1
cryptsetup luksRemoveKey /dev/md2p1
cryptsetup luksRemoveKey /dev/md3p1
cryptsetup luksRemoveKey /dev/md4p1

# if you have encrypted cache disks, use their `/dev/sdX1` paths:
cryptsetup luksRemoveKey /dev/sdX1
```

Reboot again, and you're done.
