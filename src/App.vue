<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <header>
    <nav class="navbar navbar-expand-lg bg-dark border-bottom border-body" data-bs-theme="dark">
      <div class="container-fluid">
        <RouterLink class="navbar-brand" :to="{name: 'home'}">Logic Problems</RouterLink>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Problems
              </a>
              <ul class="dropdown-menu">
                <li><RouterLink :to="{name: 'problems'}" class="dropdown-item">View All</RouterLink></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#">Test Item</a></li>
              </ul>
            </li>
            <li class="nav-item"><RouterLink :to="{name: 'formulae'}" class="nav-link">Formulae</RouterLink></li>
          </ul>
          <ul class="navbar-nav mb-2 mb-lg-0">
            <li class="nav-item"><RouterLink :to="{name: 'contact'}" class="nav-link">Contact</RouterLink></li>
            <li class="nav-item"><RouterLink :to="{name: 'terms'}" class="nav-link">Terms</RouterLink></li>
          </ul>
        </div>
      </div>
    </nav>
  </header>

  <main class="container-fluid mt-3">
    <RouterView />
  </main>
</template>
