<script setup lang="ts">
import { inject } from 'vue'
import { useColorMode } from 'bootstrap-vue-next'
import IBiSun from '~icons/bi/sun'
import IBiMoon from '~icons/bi/moon'
import IBiCircleHalf from '~icons/bi/circle-half'
import { chaptersInjectionKey } from './utils'

const chapters = inject(chaptersInjectionKey)

const modes = [
  { name: 'auto', icon: IBiCircleHalf, label: 'System default' },
  { name: 'light', icon: IBiSun, label: 'Light' },
  { name: 'dark', icon: IBiMoon, label: 'Dark' },
]
const colorMode = useColorMode({ emitAuto: true, persist: true })
const githubUrl = import.meta.env.GITHUB_URL
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
          <BNavItemDropdown style="z-index: 2000">
            <template #button-content>
              <template v-for="m in modes" :key="m.name">
                <Component :is="m.icon" v-if="colorMode === m.name" />
              </template>
            </template>
            <BDropdownItem
              v-for="m in modes"
              :key="m.name"
              @click="colorMode = m.name"
              :link-class="{
                'd-flex': true,
                'align-items-center': true,
                active: colorMode === m.name,
              }">
              <Component :is="m.icon" class="me-2" />
              <span class="flex-grow-1">{{ m.label }}</span>
            </BDropdownItem>
          </BNavItemDropdown>
        </BNavbarNav>
      </BCollapse>
    </BNavbar>
  </header>

  <BContainer tag="main" class="mt-3">
    <RouterView :key="$route.fullPath" />
  </BContainer>

  <footer class="border-top py-3 mt-auto">
    <BContainer class="d-flex flex-wrap justify-content-end align-items-center">
      <ul class="nav col-12 col-md-4 justify-content-end align-items-center list-unstyled d-flex text-body-secondary">
        <li class="ms-3">
          <a target="_new" class="text-body-secondary" :href="githubUrl"><IBiGithub /></a>
        </li>
        <li class="ms-3">
          <a target="_new" class="text-body-secondary" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
            <IFa6BrandsCreativeCommons />
            <IFa6BrandsCreativeCommonsBy />
            <IFa6BrandsCreativeCommonsNc />
            <IFa6BrandsCreativeCommonsSa />
          </a>
        </li>
      </ul>
    </BContainer>
  </footer>
</template>
