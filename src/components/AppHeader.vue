<script setup lang="ts">
import { computed, inject, useTemplateRef } from 'vue'
import { useColorMode, useCssVar } from '@vueuse/core'
import { useHead } from '@unhead/vue'
import IBiSun from '~icons/bi/sun'
import IBiMoon from '~icons/bi/moon'
import IBiCircleHalf from '~icons/bi/circle-half'
import { chaptersInjectionKey } from '@/utils'

const chapters = inject(chaptersInjectionKey)

const modes = {
  auto: { icon: IBiCircleHalf, label: 'System default' },
  light: { icon: IBiSun, label: 'Light' },
  dark: { icon: IBiMoon, label: 'Dark' },
}
const { system: systemColorMode, store: storedColorMode } = useColorMode({
  selector: 'body',
  attribute: 'data-bs-theme',
  storageKey: 'color-theme',
})
const currentColorMode = computed(() => (
  storedColorMode.value === 'auto' ? systemColorMode.value : storedColorMode.value
))

const navbar = useTemplateRef('navbar')
const themeColor = computed(() => {
  const varName = `--bs-${currentColorMode.value}-rgb`
  return `rgb(${useCssVar(varName, navbar).value})`
})

useHead({
  meta: [
    { name: 'theme-color', content: themeColor },
  ],
})
</script>

<template>
  <header>
    <BNavbar container ref="navbar" :variant="currentColorMode" toggleable="lg" class="border-bottom border-body">
      <BNavbarBrand :to="{ name: 'home' }" data-testid="link-home">Logic Problems</BNavbarBrand>
      <BNavbarToggle target="nav-collapse" />
      <BCollapse id="nav-collapse" is-nav>
        <BNavbarNav class="d-lg-flex align-items-lg-center me-auto">
          <BNavItemDropdown text="Problems">
            <BDropdownItem :to="{ name: 'problems' }">View All</BDropdownItem>
            <li><hr class="dropdown-divider" /></li>
            <BDropdownItem
              v-for="(name, id) in chapters"
              :key="id"
              :to="{ name: 'problems', query: { chapter: id } }">
              {{ name }}
            </BDropdownItem>
          </BNavItemDropdown>
          <BNavItem :to="{ name: 'formulae' }">Formulae</BNavItem>
        </BNavbarNav>
        <BNavbarNav class="d-lg-flex align-items-lg-center">
          <BNavItem :to="{ name: 'contact' }">Contact</BNavItem>
          <BNavItem :to="{ name: 'about' }">About</BNavItem>
          <BNavItemDropdown>
            <template #button-content>
              <Component :is="modes[storedColorMode].icon" />
            </template>
            <BDropdownItem
              v-for="(m, name) in modes"
              :key="name"
              @click="storedColorMode = name"
              :link-class="['hstack', { active: storedColorMode === name }]">
              <Component :is="m.icon" class="me-2" />
              <span class="flex-grow-1">{{ m.label }}</span>
            </BDropdownItem>
          </BNavItemDropdown>
        </BNavbarNav>
      </BCollapse>
    </BNavbar>
  </header>
</template>
