<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import {
  problemsInjectionKey,
  chaptersInjectionKey,
  type ProblemList,
  type ChapterList,
} from '@/plugins/data'

const router = useRouter()

const props = defineProps({
  page: { type: Number, default: 1 },
  chapter: { type: Number, default: undefined },
})

const allProblems = Object.values(inject(problemsInjectionKey) as ProblemList)
const chapters = inject(chaptersInjectionKey) as ChapterList

const title = computed(() => (props.chapter ? chapters[props.chapter] : 'Problems'))
useHead({ title })

const perPage = 30
const problems = computed(() => {
  return props.chapter
    ? allProblems.filter((problem) => problem.chapter === props.chapter)
    : allProblems
})
const pageProblems = computed(() => {
  return problems.value.slice((props.page - 1) * perPage, props.page * perPage)
})

const updatePage = (page: string | number) => {
  router.push({
    query: {
      ...router.currentRoute.value.query,
      page: page,
    },
  })
}
</script>

<template>
  <BBreadcrumb>
    <BBreadcrumbItem :to="{ name: 'home' }">Home</BBreadcrumbItem>
    <BBreadcrumbItem :to="{ name: 'problems' }" :active="!props.chapter">Problems</BBreadcrumbItem>
    <BBreadcrumbItem v-if="props.chapter" active>{{ chapters[props.chapter] }}</BBreadcrumbItem>
  </BBreadcrumb>

  <h1 class="mb-4">{{ title }}</h1>

  <BRow>
    <BCol cols="12" lg="9" data-testid="problems">
      <TransitionGroup name="slide-fade" appear>
        <ProblemCard
          v-for="(problem, index) in pageProblems"
          :key="problem.id"
          :problem="problem"
          :style="`--n: ${index}`"
          class="mb-4" />
      </TransitionGroup>

      <BPagination
        :model-value="props.page"
        :total-rows="allProblems.length"
        :per-page="perPage"
        align="center"
        data-testid="problem-paginator"
        @update:model-value="updatePage" />
    </BCol>

    <BCol lg="3" class="d-none d-lg-block">
      <div class="sticky-top" style="top: 2em">
        <ProblemsCompletionBar :problems="problems" class="mb-3" />
        <Transition name="fade">
          <JumpToNextUnsolved :problems="problems" class="mb-3" />
        </Transition>
        <ChapterNav :current="props.chapter" />
      </div>
    </BCol>
  </BRow>
</template>

<style scoped lang="scss">
.slide-fade {
  &-enter-active {
    transition: all 0.8s ease-in;
    transition-delay: calc(var(--n) * 0.1s);
  }

  &-leave-active {
    transition: all 0.4s ease-out;
  }

  &-enter-from,
  &-leave-to {
    transform: translateY(30px);
    opacity: 0;
  }
}
</style>
