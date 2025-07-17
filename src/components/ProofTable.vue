<script setup lang="ts">
import { computed, ref, toRaw, useTemplateRef } from 'vue'
import FormulaInput from '../components/FormulaInput.vue'
import { Proof, Rule } from '../lib/logic'

type FormulaInputType = InstanceType<typeof FormulaInput>

const { proof } = defineProps<{ proof: Proof }>()
const emit = defineEmits(['qed'])

const showDependencies = computed(() => {
  return proof.lines.some((line) => toRaw(line.rule) === Rule.SUPPOSITION)
})
const qed = computed(() => proof.qed())
const form = {
  rule: ref(''),
  justifications: ref<string[]>([]),
}
const justifications = computed(() =>
  form.justifications.value
    .toSorted()
    .map((n) => n + 1)
    .join(', '),
)
const submitting = ref(false)
const formulaInput = useTemplateRef<FormulaInputType>('formula-input')
const error = ref('')

const hasUnsavedChanges = computed(() => {
  return (
    !qed.value &&
    (proof.deductions.length > 0 ||
      (formulaInput.value?.text && formulaInput.value.text.length > 0) ||
      form.rule.value ||
      form.justifications.value.length > 0)
  )
})

const submitLine = () => {
  submitting.value = true

  if (!formulaInput.value || !form.rule.value) {
    submitting.value = false
    return
  }

  formulaInput.value.validate()
  if (formulaInput.value.error || !formulaInput.value.formula) {
    submitting.value = false
    return
  }

  try {
    proof.addDeduction(
      formulaInput.value.formula,
      form.rule.value,
      form.justifications.value.map((n) => parseInt(n)),
    )
  } catch (err) {
    if (typeof err === 'string') {
      error.value = err
    } else if (err instanceof Error) {
      error.value = err.message
    }
    submitting.value = false
    return
  }

  formulaInput.value.reset()
  form.rule.value = ''
  form.justifications.value = []
  error.value = ''
  submitting.value = false

  if (qed.value) {
    emit('qed', proof)
  }
}

defineExpose({ hasUnsavedChanges })
</script>

<template>
  <BForm @submit.prevent="submitLine">
    <BTableSimple class="text-center">
      <BThead>
        <BTr>
          <BTh v-if="!qed"><abbr title="Select justification lines">J</abbr></BTh>
          <BTh v-if="showDependencies"><abbr title="Depenency lines">D</abbr></BTh>
          <BTh><abbr title="Line number">L</abbr></BTh>
          <BTh class="text-start">Formula</BTh>
          <BTh>Lines</BTh>
          <BTh>Rule</BTh>
        </BTr>
      </BThead>
      <BTbody class="table-group-divider">
        <BTr
          v-for="(line, index) in proof.lines"
          :key="index"
          :class="{ 'table-active': form.justifications.value.includes(index.toString()) }">
          <BTd v-if="!qed">
            <BFormCheckbox
              v-model="form.justifications.value"
              :value="index"
              :data-testid="`justification-${index}`" />
          </BTd>
          <BTd v-if="showDependencies">
            {{
              line
                .dependencies(proof)
                .map((n) => n + 1)
                .join(', ')
            }}
          </BTd>
          <BTd>{{ line.index + 1 }}</BTd>
          <BTd class="text-start">{{ line.formula }}</BTd>
          <BTd>{{ line.justifications.map((n) => n + 1).join(', ') }}</BTd>
          <BTd>
            <abbr :title="line.rule.label">{{ line.rule }}</abbr>
          </BTd>
        </BTr>
        <BTr v-if="qed" class="table-group-divider">
          <BTd :colspan="showDependencies ? 5 : 4" variant="success">
            <IBiRocketTakeoff /> Q.E.D.
          </BTd>
        </BTr>
        <BTr v-else class="table-group-divider" :variant="error ? 'danger' : null">
          <BTd><IBiXOctagonFill v-if="error" :title="error" class="text-danger" /></BTd>
          <BTd v-if="showDependencies"></BTd>
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
      <BButton variant="primary" type="submit" :disabled="submitting">
        <span v-if="submitting"><BSpinner small /> Submitting...</span>
        <span v-else>Submit Line</span>
      </BButton>
    </div>
  </BForm>
</template>
