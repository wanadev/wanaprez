# Wanaprez! - Simply turns Markdown into presentation

[![Lint](https://github.com/wanadev/wanaprez/actions/workflows/lint.yml/badge.svg)](https://github.com/wanadev/wanaprez/actions/workflows/lint.yml)
![GitHub package.json version](https://img.shields.io/github/package-json/v/wanadev/wanaprez)
[![License](https://img.shields.io/badge/License-BSD%203%20Clause-freen)](https://github.com/wanadev/wanaprez/blob/master/LICENSE)

Wanaprez is just a simple presentation tools written in JavaScript.

**Quick and easy:**

* Just take 5 min to write some **Markdown**,
* give it to Wanaprez,
* and you're done!

**Try it out!**

* https://prez.wanadev.org/


## How does it work?

Just write Markdown... It is as simple as that!

```markdown
# My Prez

## Some Title

### Slide 1

**Lorem ipsum** dolor _sit amet_, consectetur ~~adipiscing elit~~.

### Slide 2

* Foo
* Bar
* Baz

---

Slide 3
```

* Press <kbd>Up</kbd> / <kbd>Down</kbd> or scroll to navigate,
* press <kbd>F</kbd> to toggle fullscreen.

## Demo

Look at the demo prez here:

* https://prez.wanadev.org/#url=prez.md&slide=0


## Hacking

You can build the `wanaprez.dist.js` file with the following command:

    npm run build

You can check coding style with the following command:

    npm run lint


## Changelog

* **[NEXT]** (changes on ``master`` that have not been released yet):

  * Nothing yet ;)

* **v1.3.0:**

  * feat(home): added form validation (@Zusoy, #7)
  * fix(wanaprez): prevent error with empty prez (@Zusoy, #7)

* **v1.2.0:**

  * feat: Allow to use an horizontal rule to create slides without titles (@MickGe, #4)
  * feat: Toggle fullscreen with `F` key (@MickGe, #5)
  * fix: Limit picture size to slides width (@MickGe, #6)
  * misc: Add code linting (ESLint)

* **v1.1.0:**

  * feat: Rescales the prensentation when the screen is too small or too big
  * feat: Supports mobiles devices

* **v1.0.1:**

  * fix: Some CSS fixes

* **v1.0.0:**

  * First public release
