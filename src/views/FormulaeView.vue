<script setup lang="ts">
import FormulaInput from '../components/FormulaInput.vue';
import FormulaInputHelp from '../components/FormulaInputHelp.vue';

function onSubmit(event) {
    console.log(event);
}
</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col-12 col-lg-9">
                <form @submit.prevent="onSubmit">
                    <FormulaInput />
                    <button class="btn btn-primary">Test and Graph</button>
                </form>
            </div>

            <div class="col-12 col-lg-3 bg-light border p-4 mt-4 mt-lg-0">
                <FormulaInputHelp />
            </div>
        </div>
    </div>
</template>
