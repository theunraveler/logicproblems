<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import { Formula } from '../lib/logic';

const $router = useRouter();
const $route = useRoute();

const problems = ref(Object.entries(inject('problems')));
const chapters = inject('chapters');

const chapter = parseInt($route.query.chapter) || null;
if (chapter) {
    problems.value = problems.value.filter(([ , problem ]) => problem.chapter === chapter);
}

const title = computed(() => chapter ? chapters[chapter] : 'All Problems');
const rows = computed(() => problems.value.length);
const perPage = ref(30);
const currentPage = ref($route.query.page || 1);
const pageProblems = computed(() => {
    return problems.value.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value);
});

function updatePage(page) {
    $router.replace({
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
