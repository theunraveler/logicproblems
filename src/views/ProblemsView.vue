<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router';
import Paginator from '../lib/paginator';
import { Formula } from '../lib/logic';
import allProblems from '../data/problems.json' with {type: 'json'};

const $route = useRoute();

const page = $route.query.page || 1;
const paginator = new Paginator(allProblems, 50);
const problems = paginator.getPage(page);
console.log(paginator.totalPages());
</script>

<template>
    <BCard v-for="(problem, index) in problems" :header="problem.title">
        <ol class="mb-0">
            <li v-for="assumption in problem.assumptions"><code>{{ new Formula(assumption) }}</code></li>
        </ol>
        <hr class="m-0" />
        <div>Conclusion: <code>{{ new Formula(problem.conclusion) }}</code></div>
        <BLink :to="{name: 'problem', params: {id: index + 1}}" class="btn btn-primary mt-3">
            Solve!
        </BLink>
    </BCard>
</template>
