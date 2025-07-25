<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { parse } from '@/logic/parse'
import { db } from '@/store'
import {
  problemsInjectionKey,
  chaptersInjectionKey,
  type ProblemList,
  type ChapterList,
} from '@/utils'

const $router = useRouter()

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
const perPage = ref(30)
const pageProblems = computed(() => {
  return problems.value.slice((props.page - 1) * perPage.value, props.page * perPage.value)
})

const updatePage = (page: string | number) => {
  $router.push({
    query: {
      ...$router.currentRoute.value.query,
      page: page,
    },
  })
}

const solvedProblems = ref<string[]>([])
const loadSolvedProblems = async () => {
  solvedProblems.value = (await db.solutions.orderBy('problemId').uniqueKeys()) as string[]
}

onMounted(loadSolvedProblems)
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
      <BCard v-for="[id, problem] in pageProblems" :key="id" class="mb-4" no-body>
        <BCardHeader class="d-flex justify-content-between align-items-center">
          <span>{{ problem.title }}</span>
          <span
            v-if="solvedProblems.includes(id)"
            class="badge rounded-pill text-bg-success d-flex align-items-center">
            <IBiCheckCircleFill class="me-1" /> Solved
          </span>
        </BCardHeader>
        <BListGroup flush numbered>
          <BListGroupItem v-for="(assumption, index) in problem.assumptions" :key="index">
            <span class="ms-3">{{ parse(assumption) }}</span>
          </BListGroupItem>
        </BListGroup>
        <BListGroup flush class="border-top-0">
          <BListGroupItem>
            <span>Conclusion: {{ parse(problem.conclusion) }}</span>
          </BListGroupItem>
        </BListGroup>
        <BCardBody>
          <BLink
            :to="{ name: 'problem', params: { id: id } }"
            class="btn btn-primary stretched-link">
            Solve!
          </BLink>
        </BCardBody>
      </BCard>
      <BPagination
        @update:model-value="updatePage"
        :model-value="props.page"
        :total-rows="problems.length"
        :per-page="perPage"
        align="center"
        data-testid="problem-paginator" />
    </BCol>

    <BCol lg="3" class="d-none d-lg-block">
      <BCard header="Browse by Chapter" no-body class="sticky-top" style="top: 2em">
        <BListGroup flush>
          <BListGroupItem :to="{ name: 'problems' }" :class="{ active: !props.chapter }">
            View All
          </BListGroupItem>
          <BListGroupItem
            v-for="(name, key) in chapters"
            :key="key"
            :to="{ name: 'problems', query: { chapter: key } }"
            :class="{ active: props.chapter == key }">
            {{ name }}
          </BListGroupItem>
        </BListGroup>
      </BCard>
    </BCol>
  </BRow>
</template>
