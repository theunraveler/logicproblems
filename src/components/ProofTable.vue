<script setup lang="ts">
import { computed, ref, toRaw, useId, useTemplateRef, watch } from 'vue'
import { useModal } from 'bootstrap-vue-next'
import FormulaInput from '@/components/FormulaInput.vue'
import { humanizeDuration } from '@/utils'
import { Proof, Rule, InvalidDeductionError } from '@/logic'

type FormulaInputType = InstanceType<typeof FormulaInput>

const { proof } = defineProps<{ proof: Proof }>()
const emit = defineEmits(['qed', 'clear'])

const id = useId()

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
const { show: showErrorModal } = useModal(`error-modal-${id}`)
const { hide: hideQedModal, show: showQedModal } = useModal(`qed-modal-${id}`)

let startedAt: number
const solvedIn = ref<number>()

watch(
  () => proof,
  async () => {
    if (proof.deductions.length === 0) {
      startedAt = Date.now()
    }
  },
  { immediate: true },
)

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
    if (err instanceof InvalidDeductionError) {
      error.value = err.message
      showErrorModal()
    } else {
      throw error
    }
    submitting.value = false
    return
  }

  clearForm()

  if (qed.value) {
    solvedIn.value = Date.now() - startedAt
    showQedModal()
    emit('qed', proof)
  }
}

const clear = async () => {
  if (hasUnsavedChanges.value && !window.confirm('Are you sure?')) {
    return
  }

  hideQedModal()
  proof.clear()
  clearForm()
  startedAt = Date.now()
  emit('clear', proof)
}

const clearForm = () => {
  formulaInput.value?.reset()
  formulaInput.value?.input?.focus()
  form.rule.value = ''
  form.justifications.value = []
  error.value = ''
  submitting.value = false
}

defineExpose({ clear, solvedIn, hasUnsavedChanges })
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
      </BTbody>
      <BTfoot class="table-group-divider align-top">
        <BTr v-if="qed">
          <BTd :colspan="showDependencies ? 5 : 4" variant="success">
            <IBiRocketTakeoff /> Q.E.D.
          </BTd>
        </BTr>
        <BTr v-else :variant="error ? 'danger' : null">
          <BTd><IBiXCircleFill v-if="error" :title="error" class="text-danger" /></BTd>
          <BTd v-if="showDependencies"></BTd>
          <BTd>{{ proof.lines.length + 1 }}</BTd>
          <BTd class="text-start">
            <FormulaInput ref="formula-input" autofocus />
          </BTd>
          <BTd>{{ justifications }}</BTd>
          <BTd>
            <BFormSelect v-model="form.rule.value" required>
              <BFormSelectOption value="" disabled selected hidden>Rule</BFormSelectOption>
              <template v-for="rule in Rule.all" :key="rule.shorthand">
                <BFormSelectOption v-if="rule !== Rule.ASSUMPTION" :value="rule.shorthand">
                  {{ rule.shorthand }}
                </BFormSelectOption>
              </template>
            </BFormSelect>
          </BTd>
        </BTr>
      </BTfoot>
    </BTableSimple>

    <div class="d-grid gap-2 mt-2">
      <template v-if="qed">
        <BButton variant="primary" @click="clear">Solve Again</BButton>
      </template>
      <template v-else>
        <BButton variant="primary" type="submit" :disabled="submitting">
          <span v-if="submitting"><BSpinner small /> Submitting...</span>
          <span v-else>Submit Line</span>
        </BButton>
        <BButton v-if="proof.deductions.length" variant="outline-secondary" @click="clear">
          Start Over
        </BButton>
      </template>
    </div>

    <BModal :id="`error-modal-${id}`" title="Invalid Deduction" ok-only ok-title="Close">
      {{ error }}
    </BModal>

    <BModal :id="`qed-modal-${id}`" title="Q.E.D.">
      <template v-if="solvedIn">
        Congrats, you solved the problem in {{ humanizeDuration(solvedIn) }}!
      </template>
      <template #footer>
        <slot name="qed-modal-actions" :clear="clear">
          <BButton variant="primary" @click="clear">Solve Again</BButton>
        </slot>
      </template>
    </BModal>
  </BForm>
</template>
