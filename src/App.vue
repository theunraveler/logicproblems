<script setup lang="ts">
import { inject } from 'vue'
import { useColorMode } from 'bootstrap-vue-next'
import IBiSun from '~icons/bi/sun'
import IBiMoon from '~icons/bi/moon'
import { chaptersInjectionKey } from './utils'

const chapters = inject(chaptersInjectionKey)

const modes = [
  { name: 'light', icon: IBiSun, label: 'Light' },
  { name: 'dark', icon: IBiMoon, label: 'Dark' },
]
const colorMode = useColorMode()
</script>

<template>
  <header>
    <BNavbar
      container
      toggleable="lg"
      variant="dark"
      data-bs-theme="dark"
      class="border-bottom border-body">
      <BNavbarBrand :to="{ name: 'home' }" data-testid="link-home">Logic Problems</BNavbarBrand>
      <BNavbarToggle target="nav-collapse" />
      <BCollapse id="nav-collapse" is-nav>
        <BNavbarNav class="me-auto">
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
        <BNavbarNav>
          <BNavItem :to="{ name: 'contact' }">Contact</BNavItem>
          <BNavItem :to="{ name: 'terms' }">Terms</BNavItem>
          <BNavItemDropdown>
            <template #button-content>
              <template v-for="m in modes" :key="m.name">
                <Component :is="m.icon" v-if="colorMode === m.name" />
              </template>
            </template>
            <BDropdownItem
              v-for="m in modes"
              :key="m.name"
              @click="colorMode = m.name"
              link-class="d-flex align-items-center">
              <Component :is="m.icon" class="me-2" />
              <span class="flex-grow-1">{{ m.label }}</span>
              <IBiCheck2 v-if="colorMode === m.name" class="flex-shrink-1" />
            </BDropdownItem>
          </BNavItemDropdown>
        </BNavbarNav>
      </BCollapse>
    </BNavbar>
  </header>

  <BContainer tag="main" class="mt-3">
    <RouterView :key="$route.fullPath" />
  </BContainer>
</template>
