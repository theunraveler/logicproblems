<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef } from 'vue';
import FormulaInput from '../components/FormulaInput.vue'
import { Formula, Line, Proof, Rule } from '../lib/logic';

type FormulaInputType = InstanceType<typeof FormulaInput>;

interface Props {
  assumptions?: Formula[] | Line[] | string[],
  conclusion: Formula | string,
}

const { assumptions = [], conclusion } = defineProps<Props>()

const proof = reactive(new Proof(assumptions, conclusion));
const qed = computed(() => proof.qed())
const form = {
    rule: ref(''),
    justifications: ref([]),
};
const justifications = computed(() => form.justifications.value.toSorted().map((n) => n + 1).join(', '));
const formulaInput = useTemplateRef<FormulaInputType>('formula-input');
const error = ref('');
const hasUnsavedChanges = computed(() => {
    return !qed.value && (
        proof.deductions.length > 0 ||
        (formulaInput.value?.text && formulaInput.value.text.length > 0) ||
        form.rule.value ||
        form.justifications.value.length > 0
    );
})

const submitLine = () => {
    if (!formulaInput.value) {
        return;
    }

    formulaInput.value.validate();
    if (formulaInput.value.error || !formulaInput.value.formula) {
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
        if (typeof err === 'string') {
            error.value = err;
        } else if (err instanceof Error) {
            error.value = err.message;
        }
        return;
    }

    if (!qed.value) {
        formulaInput.value.reset();
        form.rule.value = '';
        form.justifications.value = [];
        error.value = '';
    }
}

defineExpose({ proof, hasUnsavedChanges })
</script>

<template>
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
                    <BTd v-if="!qed">
                        <BFormCheckbox
                            v-model="form.justifications.value"
                            :value="index"
                            :data-testid="`justification-${index}`"
                            />
                    </BTd>
                    <BTd>{{ index + 1 }}</BTd>
                    <BTd class="text-start"><code>{{ line.formula }}</code></BTd>
                    <BTd>{{ line.justifications.map((n) => n + 1).join(', ') }}</BTd>
                    <BTd><abbr :title="line.rule.label">{{ line.rule }}</abbr></BTd>
                </BTr>
                <BTr v-if="qed" class="table-group-divider">
                    <BTd colspan="5" variant="success">
                        🎉 Q.E.D.
                    </BTd>
                </BTr>
                <BTr v-else class="table-group-divider" :variant="error ? 'danger' : null">
                    <BTd><span v-if="error" :title="error">❌</span></BTd>
                    <BTd>{{ proof.lines.length + 1 }}</BTd>
                    <BTd class="text-start">
                        <FormulaInput ref="formula-input" />
                    </BTd>
                    <BTd>{{ justifications }}</BTd>
                    <BTd>
                        <BFormSelect v-model="form.rule.value" required>
                            <BFormSelectOption value="" disabled selected hidden>Rule</BFormSelectOption>
                            <template v-for="rule in Rule.all" :key="rule.shorthand">
                                <BFormSelectOption v-if="rule !== Rule.ASSUMPTION" :value="rule">
                                    {{ rule.shorthand }}
                                </BFormSelectOption>
                            </template>
                        </BFormSelect>
                    </BTd>
                </BTr>
            </BTbody>
        </BTableSimple>

        <div v-if="!qed" class="d-grid gap-2 mt-2">
            <BButton type="submit" variant="primary">Submit Line</BButton>
        </div>
    </BForm>
</template>
