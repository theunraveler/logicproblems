<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

import FormulaGraph from '../components/FormulaGraph.vue';
import FormulaInput from '../components/FormulaInput.vue';
import FormulaInputHelp from '../components/FormulaInputHelp.vue';

const formulaInput = useTemplateRef('formula-input');

const expression = ref(null);

function onSubmit() {
    expression.value = null;

    if (!formulaInput.value) {
        return;
    }

    formulaInput.value.validate();
    if (formulaInput.value.error) {
        return;
    }

    expression.value = formulaInput.value.formula.ast;
}
</script>

<template>
    <div class="container">
        <form @submit.prevent="onSubmit" class="mb-3">
            <FormulaInput ref="formula-input" />
            <button class="btn btn-block w-100 btn-primary mt-2">Test and Graph</button>
        </form>

        <div v-if="expression">
            <hr class="mb-4" />
            <FormulaGraph :expression="expression" />
        </div>
        <div class="text-bg-light border p-4" v-else>
            <FormulaInputHelp />
        </div>
    </div>
</template>
