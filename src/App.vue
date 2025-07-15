<script setup lang="ts">
import { inject } from 'vue'
import { useColorMode } from 'bootstrap-vue-next'
import IBiSun from '~icons/bi/sun'
import IBiMoon from '~icons/bi/moon'
import IBiCircleHalf from '~icons/bi/circle-half'
import { chaptersInjectionKey } from './utils'

const chapters = inject(chaptersInjectionKey)

const modes = [
  ['auto', IBiCircleHalf, 'Auto'],
  ['light', IBiSun, 'Light'],
  ['dark', IBiMoon, 'Dark'],
]
const mode = useColorMode({emitAuto: true})
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
              <template v-for="[ name, icon ] in modes" :key="name">
                <Component :is="icon" v-if="mode === name" />
              </template>
            </template>
            <BDropdownItem v-for="[ name, icon, label ] in modes" :key="name" @click="mode = name" link-class="d-flex align-items-center">
              <Component :is="icon" class="me-2" />
              <span class="flex-grow-1">{{ label }}</span>
              <IBiCheck2 v-if="mode === name" class="flex-shrink-1" />
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
