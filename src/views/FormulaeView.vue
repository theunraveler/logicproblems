<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

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
    <BForm @submit.prevent="onSubmit" class="mb-3">
        <FormulaInput ref="formula-input" />
        <div class="d-grid gap-2 mt-2">
            <BButton type="submit" variant="primary">Test and Graph</BButton>
        </div>
    </BForm>

    <div v-if="expression">
        <hr class="mb-4" />
        <FormulaGraph :expression="expression" />
    </div>
    <div v-else class="text-bg-light border p-4">
        <FormulaInputHelp />
    </div>
</template>
