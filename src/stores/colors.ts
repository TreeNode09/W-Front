import { defineStore } from 'pinia'
import { computed, readonly, ref } from 'vue'

export type ColorVars = Record<string, string>

export const COLOR_PALETTES: readonly ColorVars[] = [
  {
    '--white': '#F3F6F6',
    '--light': '#AED6F1',
    '--pale': '#85C1E9',
    '--main': '#2796DF',
    '--dark': '#1C71A9',
    '--black': '#13222D',
    '--shadowLight': 'rgba(160, 217, 255, 0.25)',
    '--shadowDark': 'rgba(0, 100, 167, 0.25)'
  },
  {
    '--white': '#EAF6DD',
    '--light': '#B2DE81',
    '--pale': '#82C954',
    '--main': '#5CB508',
    '--dark': '#428205',
    '--black': '#153500',
    '--shadowLight': 'rgba(79, 206, 0, 0.25)',
    '--shadowDark': 'rgba(24, 64, 0, 0.25)'
  }
] as const

export const useColors = defineStore('colors', () => {
  const paletteIndex = ref(0)

  const currentPalette = computed(
    () => COLOR_PALETTES[paletteIndex.value] ?? COLOR_PALETTES[0]!
  )

  const updateRoot = () => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    for (const [key, value] of Object.entries(currentPalette.value)) {
      root.style.setProperty(key, value)
    }
  }

  const setPaletteIndex = (index: number) => {
    if (index < 0 || index >= COLOR_PALETTES.length) return

    paletteIndex.value = index
    updateRoot()
  }

  return {
    paletteIndex: readonly(paletteIndex),
    currentPalette,
    updateRoot,
    setPaletteIndex,
  }
})
