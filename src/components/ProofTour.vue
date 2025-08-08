<script setup lang="ts">
import { inject, onMounted, useId } from 'vue'
import { StorageSerializers, useStorage } from '@vueuse/core'
import { useModal } from 'bootstrap-vue-next'
import { useRouter, NavigationFailureType, isNavigationFailure } from 'vue-router'
import { tour } from '@/tours/proof'
import { problemsInjectionKey, type ProblemList } from '@/plugins/data'

const problem = Object.values(inject(problemsInjectionKey) as ProblemList)[0]
const id = useId()
const $router = useRouter()

const { show: prompt } = useModal(`tour-modal-${id}`)

const currentStep = useStorage('proof-tour', null, undefined, {
  serializer: StorageSerializers.string,
})

const start = async () => {
  const failure = await $router.push({ name: 'problem', params: { id: problem.id } })

  if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
    return
  }

  tour.start()
}

const dismiss = () => {
  currentStep.value = 'dismissed'
}

tour.on('show', ({ step }) => {
  currentStep.value = step.id
})
tour.on('complete', () => {
  currentStep.value = 'completed'
})
tour.on('cancel', dismiss)

onMounted(async () => {
  if (currentStep.value) {
    return
  }

  prompt()
})

defineExpose({ prompt, start, dismiss })
</script>

<template>
  <BModal
    :id="`tour-modal-${id}`"
    title="Welcome!"
    ok-title="Sure!"
    cancel-title="No, I'm good"
    @ok="start"
    @cancel="dismiss">
    <template v-if="currentStep">
      Would you like to solve a proof together so that I can show you how to use the features of
      this app?
    </template>
    <template v-else>
      <p>
        It looks like it's your first time solving a proof. Would you like to solve one together so
        that I can show you how to use the features of this app?
      </p>
      <div class="alert alert-info hstack">
        <IBiSignTurnLeftFill class="me-2" /> You can always do this later by clicking the button in
        the sidebar.
      </div>
    </template>
  </BModal>
</template>
