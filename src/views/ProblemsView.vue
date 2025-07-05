<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router';
import Paginator from '../lib/paginator';
import allProblems from '../data/problems.json' with {type: 'json'};

const $route = useRoute();

const page = $route.query.page || 1;
const paginator = new Paginator(allProblems, 50);
const problems = paginator.getPage(page);
console.log(paginator.totalPages());
</script>

<template>
    <div class="card mb-3" v-for="(problem, index) in problems">
        <div class="card-header">
            {{ problem.title }}
        </div>
        <div class="card-body">
            <ol class="mb-0">
                <li v-for="assumption in problem.assumptions">{{ assumption }}</li>
            </ol>
            <hr class="m-0" />
            <div>Conclusion: {{ problem.conclusion }}</div>
            <RouterLink :to="{name: 'problem', params: {id: index + 1}}" class="btn btn-primary mt-3">
                Solve!
            </RouterLink>
        </div>
    </div>
</template>
