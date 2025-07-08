<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <header>
    <BNavbar toggleable="lg" variant="dark" data-bs-theme="dark" class="border-bottom border-body">
      <BNavbarBrand :to="{name: 'home'}">Logic Problems</BNavbarBrand>
      <BNavbarToggle target="nav-collapse" />
      <BCollapse id="nav-collapse" is-nav>
        <BNavbarNav class="me-auto">
          <BNavItemDropdown text="Problems">
            <BDropdownItem :to="{name: 'problems'}">View All</BDropdownItem>
            <li><hr class="dropdown-divider"></li>
            <BDropdownItem href="#">Test Item</BDropdownItem>
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

  <main class="container-fluid mt-3">
    <RouterView />
  </main>
</template>
