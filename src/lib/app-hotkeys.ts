import { defineAppHotkeys } from '@tanstack/react-hotkeys'

/**
 * Canonical Drive shortcuts — cheat sheet + settings read the same list.
 * Ids are stable; saved custom bindings key off them.
 */
export const appHotkeys = defineAppHotkeys({
  'search.open': {
    hotkey: 'Mod+K',
    meta: {
      name: 'Hľadať',
      description: 'Otvorí vyhľadávanie súborov a priečinkov',
      group: 'Drive',
    },
  },
  'files.upload': {
    hotkey: 'Mod+U',
    meta: {
      name: 'Nahrať súbory',
      description: 'Otvorí upload panel v Drive',
      group: 'Drive',
    },
  },
  'files.new-folder': {
    hotkey: 'Mod+Shift+N',
    meta: {
      name: 'Nový priečinok',
      description: 'Vytvorí priečinok v aktuálnej lokácii',
      group: 'Drive',
    },
  },
  'nav.files': {
    hotkey: ['G', 'F'],
    meta: {
      name: 'Prejsť na súbory',
      description: 'G potom F',
      group: 'Navigácia',
    },
    options: { timeout: 800 },
  },
  'nav.recent': {
    hotkey: ['G', 'R'],
    meta: {
      name: 'Prejsť na nedávne',
      description: 'G potom R',
      group: 'Navigácia',
    },
    options: { timeout: 800 },
  },
  'nav.shares': {
    hotkey: ['G', 'S'],
    meta: {
      name: 'Prejsť na zdieľania',
      description: 'G potom S',
      group: 'Navigácia',
    },
    options: { timeout: 800 },
  },
  'nav.trash': {
    hotkey: ['G', 'T'],
    meta: {
      name: 'Prejsť do koša',
      description: 'G potom T',
      group: 'Navigácia',
    },
    options: { timeout: 800 },
  },
  'nav.settings': {
    hotkey: 'Mod+,',
    meta: {
      name: 'Nastavenia',
      description: 'Otvorí stránku nastavení',
      group: 'Navigácia',
    },
  },
  'ui.scroll-top': {
    hotkey: ['G', 'G'],
    meta: {
      name: 'Hore na stránke',
      description: 'G potom G — scroll na začiatok',
      group: 'Rozhranie',
    },
    options: { timeout: 800 },
  },
})

declare module '@tanstack/hotkeys' {
  interface Register {
    appHotkeys: typeof appHotkeys
  }
}

declare module '@tanstack/react-hotkeys' {
  interface Register {
    appHotkeys: typeof appHotkeys
  }
}
