---
title: "De-Big7: My Linux Mint Journey on a ThinkPad"
description: "Switching from Windows to Linux Mint on my old Lenovo ThinkPad, and the radical upgrades that transformed my computing experience. Let's get schwifty with the aftermarket add-ons bb!"
pubDate: 2025-05-14
author: "E L Shupp"
categories: ["Linux", "OS"]
tags: ["Linux Mint", "Repurposed Hardware", "Customization", "Open Source", "Productivity", "System Optimization"]
readTime: "7 min read"
featuredImage: "linux-mint-on-ye-olde-thinkpad"
featured: true
relatedProjects: null
---

## Why I Left Windows

I was tired of being Microsoft's bitch. My old Lenovo ThinkPad was still a solid machine, but Windows felt more like a leash than an OS. In my attempt to gradually de-Big7 my products, I decided to give Linux Mint a try.

A coworker mentioned Cinnamon was working off an older visual distro from the 80s. Linux is all about souping up your computer, so hey, why not?

## First Steps: Making Mint My Own

First thing I do is look up what I can add. Here's what I did:

- **Installed preload** to increase load time for frequently used apps. This cool utility learns which applications you use most often and loads them into RAM proactively. Apps launch 2-3x faster because they're ready before you even click. It's like your computer anticipating what you need next.

- **Enabled fstrim.timer** for my SSD. SSDs need regular maintenance to keep performing at their best. Fstrim tells your SSD which blocks are free to use, preventing write amplification and extending the drive's lifespan. Regular trimming keeps everything running smoothly with minimal performance degradation over time.

- **Boosted vm.swappiness to 10** for better memory management. The default setting of 60 makes Linux swap RAM to disk too aggressively. Lowering it to 10 tells the system to keep data in RAM longer and only use swap when absolutely necessary. My ThinkPad now handles heavy workloads much more smoothly without constant disk thrashing.

- **Installed Plank** to get the Mac OS experience I never had. This sleek dock sits at the bottom of your screen with smooth animations when you interact with it. Mac users pay a premium for this kind of UI, but on Linux it's free. It stays out of the way when you're working, then pops up exactly when you need it.

- **Installed tree** and **linux-lowlatency** for better terminal navigation and performance. Tree gives you a visual representation of your directory structure right in the terminal, making file system navigation intuitive. The low-latency kernel is perfect for audio work - I no longer get dropouts or stuttering during audio production.

- For monitoring, I grabbed **glances**, **nethogs**, and **htop**. These tools give you real-time insights into what's happening on your system. Glances shows comprehensive system stats, nethogs tracks network usage by application, and htop provides an interactive process viewer that makes it easy to identify and kill problematic processes.

- Tried out **i3 window manager** for tiling. There's definitely a learning curve, but the productivity boost is worth it. Your windows automatically tile without overlapping, maximizing screen real estate, and you control everything via keyboard shortcuts. You can create separate workspaces for different activities - coding, browsing, communication - and switch between them instantly.

- Upgraded my shell: **zsh + oh-my-zsh + powerlevel10k**. This combination transforms your terminal experience. Zsh offers intelligent auto-completion and spelling correction. Oh-my-zsh adds plugins and themes to enhance functionality. Powerlevel10k provides a highly customizable prompt that shows git status, Python environments, and error codes - all color-coded for easy reading. My terminal workflow is now twice as efficient.

## Daily Driver Experience

After a month of riding this Linux wave, I've added even MORE sick upgrades:

- **Timeshift backup system** because wipeouts happen, dude! It's like having a video of your best surf moves - you can always go back to a time when everything was working perfectly. Saved my session multiple times already!

- **TLP power management** for epic battery life. This thing automatically tweaks your CPU, disk, and wireless settings based on whether you're plugged in or mobile. My ThinkPad now lasts 2 hours longer on battery - that's like having extra time when the surf is pumping!

- **Flatpak and AppImage support** for getting all the freshest apps without dependency hell. It's like having a quiver of boards - each app is self-contained with everything it needs. I grabbed GIMP, Inkscape, and VS Code this way - no installation wipeouts!

- **Conky** for desktop system monitoring. The SICKEST desktop widget that shows me real-time stats right on my wallpaper! CPU waves, memory swells, network traffic - all visualized with custom themes. My desktop is now informative AND stylin'!

## Reflections

Linux Mint made my old ThinkPad feel new again - it's like taking a yellowed old longboard and transforming it into a high-performance shortboard! The freedom to tweak, monitor, and optimize every part of my system is totally empowering, brah. No more forced updates crashing my sessions, no more bloatware slowing my ride—just my computer, my way.

If you're thinking about making the switch from Windows, don't be a barney - take it one step at a time. Start with a live USB to test the waters, then gradually paddle out to deeper customizations. The journey is TOTALLY worth it, and the Linux community is like the chillest lineup you'll ever surf with - always ready to help a fellow wave rider!

Catch you on the flip side, and remember: stay stoked, stay free! 🏄‍♂️🐧