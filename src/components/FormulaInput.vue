<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import insertTextAtCursor from 'insert-text-at-cursor';
import { Formula, Operator } from '../lib/logic';

const formulaText = ref('');
const input = useTemplateRef('input');
const error = ref('');
const validationState = ref(undefined);
const formula = ref(null);

function addOperator(operator: Operator) {
    input.value.focus();
    let toAdd = ` ${operator.toString()}`;
    if (operator.isBinary) {
        toAdd += ' ';
    }
    insertTextAtCursor(input.value, toAdd);
}

function validate() {
    validationState.value = undefined;
    error.value = '';
    try {
        formula.value = new Formula(formulaText.value);
        formulaText.value = formula.value.text;
        validationState.value = true;
    } catch (err) {
        error.value = err.message;
        validationState.value = false;
    }
}

function reset() {
    formulaText.value = '';
    validationState.value = undefined;
    error.value = '';
    formula.value = null;
}

defineExpose({input, formula, error, validate, reset})
</script>

<template>
    <BFormInput v-model="formulaText" ref="input" placeholder="Formula" :state="validationState" required />
    <BButtonGroup class="mt-1" aria-label="Operators">
        <BButton size="sm" variant="outline-secondary" v-for="operator in Operator.all" :key="operator.symbol" @click.stop.prevent="addOperator(operator)" :title="`Insert ${operator.label} operator (${operator})`">
            {{ operator }}
        </BButton>
    </BButtonGroup>
    <BFormInvalidFeedback :state="validationState">{{ error }}</BFormInvalidFeedback>
</template>
