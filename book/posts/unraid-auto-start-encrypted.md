+++
tags = ["unraid", "linux"]
+++

# Auto-start an encrypted unraid server

This was using unraid `6.12.9`, if your version is earlier or later things may be slightly different.

This guide also assumes you have an already encrypted array, and that you unlock it with a keyfile. If you use a passphrase the process should be similar.

## Setting up unraid to auto-start

In the unraid web ui, navigate to `Settings -> Disk Settings` and set `Enable auto start` to `Yes`.

Hit `Apply`.

## Setting up unraid to fetch the keyfile

We can leverage some events from unraid to automatically fetch the keyfile from a secure location (such as another server), and then delete it after the array has started.

### Create a script to fetch the keyfile

I've chosen `/boot/custom/bin/fetch_key` as the location for this script. You can choose any location you like, as long as it's on the `/boot` drive!

```bash,title="/boot/custom/bin/fetch_key"
#!/bin/bash

# securely copy the keyfile from another server, in this example we simply
# cat the file over an SSH connection - but your needs could be different
ssh my_secure_sever cat /path/to/unraid/keyfile > /root/keyfile
```

As long as your keyfile ends up in `/root/keyfile` you should be good to go.

### Create a script to delete the keyfile

Now, we'll create a script that runs and automatically deletes `/root/keyfile` after it's been used. We don't need that hanging around in RAM.

```bash,title="/boot/custom/bin/delete_key"
#!/bin/bash

rm -f /root/keyfile
```

### Update unraid to run the scripts

If you didn't know, when your unraid server starts it executes the file `/boot/config/go`. This is a good place to setup our scripts.

Add the following to `/boot/config/go`:

```bash,title="/boot/config/go"
#!/bin/bash

# Prepare events for auto-starting the array
# NOTE: this must be done before starting `emhttp`!
install -D /boot/custom/bin/fetch_key  /usr/local/emhttp/webGui/event/starting/fetch_key
install -D /boot/custom/bin/delete_key /usr/local/emhttp/webGui/event/started/delete_key
install -D /boot/custom/bin/fetch_key  /usr/local/emhttp/webGui/event/stopped/fetch_key
chmod a+x /usr/local/emhttp/webGui/event/starting/fetch_key
chmod a+x /usr/local/emhttp/webGui/event/started/delete_key
chmod a+x /usr/local/emhttp/webGui/event/stopped/fetch_key

# Start the Management Utility
/usr/local/sbin/emhttp &
```

With this setup, your boot process looks like this:

1. Server boots up
2. Unraid runs `/boot/config/go`
3. `/boot/config/go` copies over scripts to the right places
4. When Unraid starts the array, `fetch_key` runs and copies the keyfile to `/root/keyfile`
5. After Unraid has started the array, `delete_key` runs and removes `/root/keyfile`

## Final thoughts

As always, your security is only as good as your weakest point. If you're copying your `keyfile` from somewhere that's not secure, or if the connection you're using to copy it isn't secure, then there are holes in your security.

Think carefully about how you want to secure things, and also the value you get in your encrypted setup, etc.
