---
title: "De-Big7: My Linux Mint Journey on a ThinkPad"
description: "Switching from Windows to Linux Mint on my old Lenovo ThinkPad, and the radical upgrades that transformed my computing experience."
pubDate: 2024-06-07
author: "Your Name"
categories: ["Linux", "Personal Journey"]
tags: ["Linux Mint", "ThinkPad", "Customization", "Open Source", "Productivity", "System Optimization"]
readTime: "9 min read"
featuredImage: "linux-mint-thinkpad"
featured: true
relatedProjects: ["portfolio-website"]
---

## Why I Left Windows

I was tired of being Microsoft's bitch. My old Lenovo ThinkPad was still a solid machine, but Windows felt more like a leash than an OS. In my attempt to gradually de-Big7 my products, I decided to give Linux Mint a try.

A coworker mentioned Cinnamon was working off an older visual distro from the 80s. Linux is all about souping up your computer, so hey, why not?

## First Steps: Making Mint My Own

First thing I do is look up what I can add. Here's what I did:

- **Installed preload** to increase load time for frequently used apps. Duuude, this thing is EPIC! It's like having your favorite surf break permanently scouted - preload learns which apps you use the most and loads them into RAM before you even click. Your system becomes totally PSYCHIC, brah! Apps launching 2-3x faster is like catching that perfect barrel wave without waiting.

- **Enabled fstrim.timer** for my SSD. Brooo, SSDs are like the shortboards of storage - fast and responsive, but they need proper maintenance! Fstrim tells your SSD which blocks are free to use, preventing write amplification that would totally wipe you out performance-wise. It's like waxing your board regularly - keeps everything smooth and fast!

- **Boosted vm.swappiness to 10** for better memory management. So check it out, dude - the default setting is like 60, which means your system gets all sketchy and starts swapping RAM to disk way too early. Cranking it down to 10 tells Linux "Hey brah, only swap when absolutely necessary!" It's like telling your buddy not to paddle for every wave - only go for the epic ones! My ThinkPad now shreds through heavy workloads without bogging down.

- **Installed Plank** to get the Mac OS experience I never had. Gnarly dock, man! It sits at the bottom of your screen with bouncy animations when you click stuff. Mac users pay big $$$ for this experience, but I'm getting it for FREE! Added bonus: it stays out of the way when you're catching big computational waves, then pops right back when you need it.

- **Installed tree** and **linux-lowlatency** for better terminal navigation and performance. Tree is like having a bird's eye view of your file system, brah - it shows directories as branching trees! And that low-latency kernel? INSANE for audio work - it's like going from a soft learner board to a pro performance thruster. No more audio dropouts during my GarageBand sessions!

- For monitoring, I grabbed **glances**, **nethogs**, and **htop**. These tools are like having a weather report, tide chart, and surf cam all in one for your computer! Glances shows CPU, RAM, network, disk, sensors - everything! Nethogs tells you which apps are hogging your bandwidth (total kooks!). And htop? Interactive process viewer that lets you sort and kill processes that are being total barneys. Righteous!

- Tried out **i3 window manager** for tiling. Dude, this is like going from longboarding to shortboarding - steep learning curve but TOTALLY worth it! Your windows automatically tile without overlapping, and you control everything with keyboard shortcuts. No more mouse wipeouts! You can even set up workspaces for different activities - coding, browsing, chat - and flip between them like changing beaches on a surf trip.

- Upgraded my shell: **zsh + oh-my-zsh + powerlevel10k** style. This combo is the ULTIMATE terminal pipeline, brah! Zsh gives you auto-completion that reads your MIND. Oh-my-zsh adds theme support and plugins galore. And powerlevel10k? The most customizable prompt in the universe, dude! It shows git status, Python environments, error codes - all color-coded so you know exactly what's happening. My terminal went from kook to Kelly Slater in like 20 minutes!

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