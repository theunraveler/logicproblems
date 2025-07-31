<template>
  <AppHeader />

  <RouterView :key="$route.fullPath" v-slot="{ Component }">
    <Transition name="fade" mode="out-in" appear>
      <BContainer tag="main" class="my-3">
        <Component :is="Component" />
      </BContainer>
    </Transition>
  </RouterView>

  <AppFooter />

  <BModalOrchestrator />
</template>

<style scoped lang="scss">
.fade {
  &-enter-active,
  &-leave-active {
    transition: opacity 0.5s ease;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}
</style>
