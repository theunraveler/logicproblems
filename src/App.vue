<template>
  <AppHeader />

  <RouterView v-slot="{ Component }">
    <Transition name="fade" mode="out-in" appear>
      <BContainer tag="main" class="my-3">
        <Component :is="Component" />
      </BContainer>
    </Transition>
  </RouterView>

  <AppFooter />

  <BModalOrchestrator />
</template>
