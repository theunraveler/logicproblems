<script setup lang="ts">
import { computed, inject, reactive, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import { Line, Proof, Rule } from '../lib/logic';

const $route = useRoute();
const problem = inject('problems')[$route.params.id];
const proof = reactive(new Proof(problem.assumptions, problem.conclusion));
const form = {
    rule: ref(''),
    justifications: ref([]),
};
const justifications = computed(() => form.justifications.value.toSorted().map((n) => n + 1).join(', '));
const error = ref('');
const formulaInput = useTemplateRef('formula-input');
const qed = ref(false);

function submitLine() {
    if (!formulaInput.value) {
        return;
    }

    formulaInput.value.validate();
    if (formulaInput.value.error) {
        return;
    }

    const line = new Line(
        formulaInput.value.formula,
        form.rule.value,
        form.justifications.value.map((n) => parseInt(n)),
    );

    try {
        proof.addDeduction(line);
    } catch (err) {
        error.value = err.message;
        return;
    }

    if (proof.qed()) {
        qed.value = true;
    } else {
        formulaInput.value.reset();
        form.rule.value = '';
        form.justifications.value = [];
        error.value = '';
    }
}
</script>

<template>
    <BRow>
        <BCol cols="12" lg="9">
            <div class="d-flex justify-content-between align-items-center border-bottom mb-4">
                <h2>{{ problem.title }}</h2>
                <h4>Conclusion: <code>{{ proof.conclusion }}</code></h4>
            </div>

            <BForm @submit.prevent="submitLine">
                <BTableSimple hover class="text-center">
                    <BThead>
                        <BTr>
                            <BTh v-if="!qed">J</BTh>
                            <BTh>L</BTh>
                            <BTh class="text-start">Formula</BTh>
                            <BTh>Lines</BTh>
                            <BTh>Rule</BTh>
                        </BTr>
                    </BThead>
                    <BTbody class="table-group-divider">
                        <BTr v-for="(line, index) in proof.lines" :key="index">
                            <BTd v-if="!qed"><BFormCheckbox v-model="form.justifications.value" :value="index" /></BTd>
                            <BTd>{{ index + 1 }}</BTd>
                            <BTd class="text-start"><code>{{ line.formula }}</code></BTd>
                            <BTd>{{ line.justifications.map((n) => n + 1).join(', ') }}</BTd>
                            <BTd><abbr :title="line.rule.label">{{ line.rule }}</abbr></BTd>
                        </BTr>
                        <BTr v-if="!qed" class="table-group-divider">
                            <BTd></BTd>
                            <BTd>{{ proof.lines.length + 1 }}</BTd>
                            <BTd class="text-start"><FormulaInput ref="formula-input" /></BTd>
                            <BTd>{{ justifications }}</BTd>
                            <BTd>
                                <BFormSelect v-model="form.rule.value" required>
                                    <BFormSelectOption value="" disabled selected hidden>Rule</BFormSelectOption>
                                    <template v-for="rule in Rule.all" :key="rule.shorthand">
                                        <BFormSelectOption v-if="rule !== Rule.ASSUMPTION" :value="rule">
                                            {{ rule }}
                                        </BFormSelectOption>
                                    </template>
                                </BFormSelect>
                            </BTd>
                        </BTr>
                        <BTr v-else class="table-group-divider">
                            <BTd colspan="5" variant="success">
                                🎉 Q.E.D.
                            </BTd>
                        </BTr>
                    </BTbody>
                </BTableSimple>

                <div v-if="!qed" class="d-grid gap-2 mt-2">
                    <BButton type="submit" variant="primary">Submit Line</BButton>
                </div>
            </BForm>
        </BCol>

        <BCol cols="12" lg="3" class="bg-light border p-4 mt-4 mt-lg-0">
            <FormulaInputHelp />
        </BCol>
    </BRow>

    <BModal :show="qed" title="Q.E.D." ok-only ok-title="Close">Congrats, you solved the problem!</BModal>
</template>
