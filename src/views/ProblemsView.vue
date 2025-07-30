<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import {
  problemsInjectionKey,
  chaptersInjectionKey,
  type ProblemList,
  type ChapterList,
} from '@/utils'

const router = useRouter()

const props = defineProps({
  page: { type: Number, default: 1 },
  chapter: { type: Number },
})
const problems = ref(Object.entries(inject(problemsInjectionKey) as ProblemList))
const chapters = inject(chaptersInjectionKey) as ChapterList

if (props.chapter) {
  problems.value = problems.value.filter(([, problem]) => problem.chapter === props.chapter)
}

const title = computed(() => (props.chapter ? chapters[props.chapter] : 'Problems'))
useHead({ title })

const perPage = 30
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
      <ProblemCard
        v-for="[id, problem] in pageProblems"
        :key="id"
        :id="id"
        :problem="problem"
        class="mb-4" />

      <BPagination
        @update:model-value="updatePage"
        :model-value="props.page"
        :total-rows="problems.length"
        :per-page="perPage"
        align="center"
        data-testid="problem-paginator" />
    </BCol>

    <BCol lg="3" class="d-none d-lg-block">
      <div class="sticky-top" style="top: 2em">
        <ProblemsCompletionBar :problems="Object.fromEntries(problems)" class="mb-3" />
        <JumpToNextUnsolved :problems="Object.fromEntries(problems)" class="mb-3" />
        <ChapterList :current="props.chapter" />
      </div>
    </BCol>
  </BRow>
</template>
