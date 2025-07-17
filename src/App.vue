<script setup lang="ts">
import { inject } from 'vue'
import { useColorMode } from '@vueuse/core'
import IBiSun from '~icons/bi/sun'
import IBiMoon from '~icons/bi/moon'
import IBiCircleHalf from '~icons/bi/circle-half'
import { chaptersInjectionKey } from './utils'

const chapters = inject(chaptersInjectionKey)

const modes = {
  auto: { icon: IBiCircleHalf, label: 'System default' },
  light: { icon: IBiSun, label: 'Light' },
  dark: { icon: IBiMoon, label: 'Dark' },
}
const { store: colorMode } = useColorMode({
  selector: 'body',
  attribute: 'data-bs-theme',
  storageKey: 'color-theme',
})

const githubUrl = import.meta.env.GITHUB_URL
const commitSha = import.meta.env.GIT_COMMIT_SHA
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
              <Component :is="modes[colorMode].icon" />
            </template>
            <BDropdownItem
              v-for="(m, name) in modes"
              :key="name"
              @click="colorMode = name"
              :link-class="{
                'd-flex': true,
                'align-items-center': true,
                active: colorMode === name,
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
      <ul class="nav list-unstyled text-body-secondary">
        <li class="me-3">
          <a
            target="_new"
            class="text-body-secondary"
            href="https://creativecommons.org/licenses/by-sa/4.0/">
            <IFa6BrandsCreativeCommons />
            <IFa6BrandsCreativeCommonsBy />
            <IFa6BrandsCreativeCommonsSa />
          </a>
          by Maran Wolston
        </li>
        <li>
          <a target="_new" class="text-body-secondary me-1" :href="githubUrl"><IBiGithub /></a>
          <a target="_new" class="text-body-secondary text-decoration-none" :href="`${githubUrl}/commit/${commitSha}`">{{ commitSha }}</a>
        </li>
      </ul>
    </BContainer>
  </footer>
</template>
