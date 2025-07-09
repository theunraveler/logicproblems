<script setup lang="ts">
import { inject } from 'vue';

const chapters = inject('chapters');
</script>

<template>
  <header>
    <BNavbar container toggleable="lg" variant="dark" data-bs-theme="dark" class="border-bottom border-body">
      <BNavbarBrand :to="{name: 'home'}">Logic Problems</BNavbarBrand>
      <BNavbarToggle target="nav-collapse" />
      <BCollapse id="nav-collapse" is-nav>
        <BNavbarNav class="me-auto">
          <BNavItemDropdown text="Problems">
            <BDropdownItem :to="{name: 'problems'}">View All</BDropdownItem>
            <li><hr class="dropdown-divider"></li>
            <BDropdownItem v-for="(name, id) in chapters" :key="id" :to="{name: 'problems', query: {chapter: id}}">
              {{ name }}
            </BDropdownItem>
          </BNavItemDropdown>
          <BNavItem :to="{name: 'formulae'}">Formulae</BNavItem>
        </BNavbarNav>
        <BNavbarNav>
          <BNavItem :to="{name: 'contact'}">Contact</BNavItem>
          <BNavItem :to="{name: 'terms'}">Terms</BNavItem>
        </BNavbarNav>
      </BCollapse>
    </BNavbar>
  </header>

  <BContainer tag="main" class="mt-3">
    <RouterView :key="$route.fullPath" />
  </BContainer>
</template>
