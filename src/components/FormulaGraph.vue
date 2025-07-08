<script setup lang="ts">
import { defineProps } from 'vue';
import { toString as formulaToString } from 'propositional/lib/transform/toString'
import * as AST from 'propositional/lib/syntax/ast'
import { Formula, Operator } from '../lib/logic';

const props = defineProps(['expression']);

function expressionToString(expression: AST.Expression): string {
    return Formula.normalize(formulaToString(expression, true), true);
}

function operatorText(symbol: string) {
    const operator = Operator.findBySymbol(Formula.normalize(symbol));
    return `${operator.label} (<code>${operator.symbol}</code>)`;
}
</script>

<template>
    <div class="row">
        <div class="col">
            <div class="card text-bg-light text-center" v-if="props.expression">
                <div class="card-body">
                    <div>
                        <span class="fw-bold">Formula: </span>
                        <code>{{ expressionToString(props.expression) }}</code>
                    </div>
                    <div v-if="props.expression?.operator" class="text-capitalize">
                        <span class="fw-bold">Operator: </span>
                        <span v-html="operatorText(props.expression.operator.lexeme)"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row mt-3">
        <div class="col" v-if="props.expression?.left">
            <div class="arrow left mb-3 text-end me-5 fs-3">⇙</div>
            <FormulaGraph :expression="props.expression.left" />
        </div>
        <div class="col" v-if="props.expression?.right">
            <div class="arrow right mb-3 text-start ms-5 fs-3">⇘</div>
            <FormulaGraph :expression="props.expression.right" />
        </div>
        <div class="col" v-if="props.expression?.inner">
            <div class="arrow mb-3 text-center fs-3">⇓</div>
            <FormulaGraph :expression="props.expression.inner" />
        </div>
    </div>
</template>

<style>
.arrow {
}
.left {
}
</style>
