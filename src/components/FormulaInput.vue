<script setup lang="ts">
import { ref, useTemplateRef, defineExpose } from 'vue';
import insertTextAtCursor from 'insert-text-at-cursor';
import { Formula, Operator } from '../lib/logic';

const formulaText = ref('');
const input = useTemplateRef('input');
const error = ref('');
const formula = ref(null);

function addOperator(operator) {
    input.value.focus();
    let toAdd = ` ${operator.toString()}`;
    if (operator.isBinary) {
        toAdd += ' ';
    }
    insertTextAtCursor(input.value, toAdd);
}

function validate() {
    error.value = '';
    const f = new Formula(formulaText.value);

    try {
        f.checkWellFormed();
        formula.value = f;
    } catch (err) {
        error.value = err.message;
    }
}

function reset() {
    formulaText.value = '';
    error.value = '';
    formula.value = null;
}

defineExpose({input, formula, error, validate, reset})
</script>

<template>
    <div class="formula-input">
        <input type="text" :class="{'is-invalid': error.length > 0, 'form-control': true}" placeholder="Formula" v-model="formulaText" ref="input" required>
        <div class="btn-group mt-1" role="group" aria-label="Operators">
            <button class="btn btn-sm btn-outline-secondary" v-for="operator in Operator.all" :key="operator.symbol" @click.stop.prevent="addOperator(operator)" :title="`Insert ${operator.label} operator (${operator})`">
                {{ operator }}
            </button>
        </div>
        <div v-if="error.length > 0" class="invalid-feedback">{{ error }}</div>
    </div>
</template>
