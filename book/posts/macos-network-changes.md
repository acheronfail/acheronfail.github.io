# Network change events on macOS

I don't like polling.

I feel we live in a modern world, and there's 100% no need for any systems to need to poll another system in order to know its state. There should be some kind of event, or a push-based model, rather than having to waste resources polling.

All that said, this is a short article on how to be notified about network change events on a macOS machine.

- [Network change events on macOS](#network-change-events-on-macos)
  - [The goal](#the-goal)
  - [Let's search the web](#lets-search-the-web)
  - [Looking around Apple's documentation](#looking-around-apples-documentation)
    - [The Solution](#the-solution)
      - [Extra: line buffering with swift](#extra-line-buffering-with-swift)

## The goal

I had a simple task - run a command when one of a network interface is disconnected on a macOS machine.

On Linux, this task is trivial. There's the [netlink](https://docs.kernel.org/userspace-api/netlink/intro.html) [API](https://man7.org/linux/man-pages/man7/netlink.7.html), and if you don't want to integrate with that, there's even the [`nl-monitor`](https://github.com/thom311/libnl/blob/main/src/nl-monitor.c) command which can give you the same information. There's a myriad of tools based on netlink, too; so you're spoiled for choice.

On macOS it's a different story.

## Let's search the web

After a decent amount of time looking around, I could only find solutions to detecting network changes that included periodically parsing `ifconfig` in a loop, [watching specific directories for changes](https://gist.github.com/albertbori/1798d88a93175b9da00b) then parsing `networksetup` or silly things like "when you want to know if the network changed, just open System Preferences and look in the Network tab".

I was honestly shocked to read all these answers, and not have found something or someone that had publicly shared a solution to this.

With my short investigation not bringing much up at all, I decided to go hunting in [Apple's developer documentation](https://developer.apple.com/documentation/technologies).

## Looking around Apple's documentation

A nice surprise, is that Apple has tagged their documentation quite well. I was able to select a `Networking` tag which returned a few sections. After looking through them, there was an aptly named [`Network`](https://developer.apple.com/documentation/network/) section.

After looking through the various APIs there, I found [`NWPathMonitor`](https://developer.apple.com/documentation/network/nwpathmonitor).

### The Solution

To Apple's credit, this was an extremely simple API to consume. And they've done quite a good job on making Swift approachable. Within minutes I had this simple program:

```swift title="net-monitor.swift"
/**
 * A small program which outputs a line of interfaces (comma separated) on network
 * changes. It was the easiest way I could find to watch for network changes on
 * macOS without using a polling system.
 *
 * Compile this with: `swiftc ./net-monitor.swift`
 */

import Foundation
import Network

let monitor = NWPathMonitor()
monitor.pathUpdateHandler = { path in
  // inspect the `path` variable here for more information
  print("\(path)")
}

monitor.start(queue: DispatchQueue(label: "net-monitor"))
dispatchMain()
```

Now, compiling and running that script provides me with a line of output each time a network change is detected:

```bash
$ swift ./net-monitor.swift
$ ./net-monitor
satisfied (Path is satisfied), interface: en0[802.11], ipv4, ipv6, dns, uses wifi
satisfied (Path is satisfied), interface: en1, ipv4, ipv6, dns
# and so on...
```

This happens for WiFi adapters, ethernet adapters, VPN interfaces, etc. So it's perfect for what I wanted.

#### Extra: line buffering with swift

I also wanted the output to be line buffered, so I could easily consume network changes in a shell pipeline. All I had to do was manually write to standard out. Wasn't that hard:

```swift
FileHandle.standardOutput.write("\(path)\n".data(using: .utf8)!)
```
