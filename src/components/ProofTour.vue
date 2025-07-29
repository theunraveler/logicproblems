<script setup lang="ts">
import { inject, onMounted, useId } from 'vue'
import { computed, inject, onMounted, ref, useId, useTemplateRef, watch } from 'vue'
import { useRouter, NavigationFailureType, isNavigationFailure } from 'vue-router'
import { problemsInjectionKey, type ProblemList } from '@/plugins/data'
import { steps } from '@/tours/proof'
import { initAdvanceOn, setHighlights, useTour } from '@/tours/utils'

const stepNames = Object.keys(steps)
const problem = Object.values(inject(problemsInjectionKey) as ProblemList)[0]
const id = useId()
const $router = useRouter()

const popover = useTemplateRef('popover')
const { show: prompt } = useToggle(`tour-modal-${id}`)

const { currentStepName, currentStep } = useTour('proof', steps)
const attachTo = ref<string>()
const hasVisitedTour = computed(() => ['completed', 'cancelled'].includes(currentStepName.value))

const start = async () => {
  const failure = await $router.push({ name: 'problem', params: { id: problem.id } })

  if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
    return
  }

  currentStepName.value = undefined
  next()
}

const next = async () => {
  const stepIndex = currentStepName.value
    ? stepNames.indexOf(currentStepName.value) + 1
    : 0
  currentStepName.value = stepNames[stepIndex]
}

watch(currentStep, async (newStep, oldStep) => {
  popover.value?.hide()
  if (oldStep?.onHide) {
    oldStep?.onHide({ next, complete, cancel })
  }
  if (!newStep) {
    return
  }
  attachTo.value = typeof newStep.attachTo === 'string' ? newStep.attachTo : await newStep.attachTo()
  setHighlights([attachTo.value].concat(newStep?.highlight ?? []), newStep.clickable !== false)
  initAdvanceOn(attachTo.value, newStep, next)
  popover.value?.show()
  if (newStep.onShow) {
    newStep.onShow({ next, complete, cancel })
  }
})

const complete = () => {
  currentStepName.value = 'completed'
}

const cancel = () => {
  currentStepName.value = 'cancelled'
}

onMounted(async () => {
  if (hasVisitedTour.value) {
    return
  }

  currentStepName.value = undefined
  prompt()
})

defineExpose({ prompt, start, complete, cancel, currentStep })
</script>

<template>
  <BPopover ref="popover" manual lazy :reference="attachTo" placement="auto" offset="20" class="tour--popover">
    <template v-if="currentStep?.title" #title>{{ currentStep.title }}</template>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="currentStep?.text" />
    <footer v-if="currentStep?.buttons" class="mt-3 d-flex flex-row-reverse justify-content-between align-items-center">
      <BButton v-for="([text, action], index) in currentStep.buttons" :key="index" :variant="index === 0 ? 'primary' : 'outline-secondary'" @click.prevent="action({ next, complete, cancel })">
        {{ text }}
      </BButton>
    </footer>
  </BPopover>

  <BModal
    :id="`tour-modal-${id}`"
    title="Welcome!"
    ok-title="Sure!"
    cancel-title="No, I'm good"
    @ok="start"
    @cancel="cancel">
    <template v-if="hasVisitedTour">
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
  <div v-if="currentStep" class="tour--overlay"></div>
</template>

<style lang="scss">
.popover {
  pointer-events: auto;
  user-select: auto;
}

.tour {
  &--overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #000;
    opacity: 0.75;
    z-index: 5000;
  }

  &--popover,
  &--current-step {
    &,
    td {
      z-index: 5001;
    }
  }

  &--current-step {
    pointer-events: auto;
    user-select: auto;

    &,
    td {
      position: relative;
    }

    body:has(&),
    &.no-interaction {
      pointer-events: none;
      user-select: none;
    }
  }
}
</style>
