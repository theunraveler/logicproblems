<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import { Formula } from '../lib/logic';
import { problemsInjectionKey, chaptersInjectionKey } from '../utils';
import type { ProblemList, ChapterList } from '../utils'

const $router = useRouter();
const $route = useRoute();

const problems = ref(Object.entries(inject(problemsInjectionKey) as ProblemList));
const chapters = inject(chaptersInjectionKey) as ChapterList;

const chapter: Ref<number | null> = ref(null);
if (typeof $route.query.chapter === 'string') {
    chapter.value = parseInt($route.query.chapter);
    problems.value = problems.value.filter(([ , problem ]) => problem.chapter === chapter.value);
}

const title = computed(() => chapter.value ? chapters[chapter.value] : 'All Problems');
const rows = computed(() => problems.value.length);
const perPage = ref(30);
const currentPage: Ref<number> = ref(1);
if (typeof $route.query.page === 'string') {
    currentPage.value = parseInt($route.query.page);
}
const pageProblems = computed(() => {
    return problems.value.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value);
});

function updatePage(page: string | number) {
    $router.push({
        query: {
            ...$router.currentRoute.value.query,
            page: page
        }
    });
}
</script>

<template>
    <h1 class="mb-4">{{ title }}</h1>

    <BRow>
        <BCol cols="12" lg="9">
            <BCard v-for="([ id, problem ]) in pageProblems" :key="id" :header="problem.title" class="mb-3">
                <ol class="mb-0">
                    <li v-for="(assumption, index) in problem.assumptions" :key="index"><code>{{ new Formula(assumption) }}</code></li>
                </ol>
                <hr class="m-0" />
                <div>Conclusion: <code>{{ new Formula(problem.conclusion) }}</code></div>
                <BLink :to="{name: 'problem', params: {id: id}}" class="btn btn-primary mt-3">
                    Solve!
                </BLink>
            </BCard>
            <BPagination @update:model-value="updatePage" v-model="currentPage" :total-rows="rows" :per-page="perPage" align="center" />
        </BCol>

        <BCol lg="3" class="d-none d-lg-block">
            <BCard header="Browse by Chapter" no-body class="sticky-top" style="top: 2em">
                <BListGroup flush>
                    <BListGroupItem :to="{name: 'problems'}">View All</BListGroupItem>
                    <BListGroupItem v-for="(name, key) in chapters" :key="key" :to="{name: 'problems', query: {chapter: key}}">
                        {{ name }}
                    </BListGroupItem>
                </BListGroup>
            </BCard>
        </Bcol>
    </Brow>
</template>
