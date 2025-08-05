<script setup lang="ts">
import { useId, useTemplateRef } from 'vue'
import { useStorage } from '@vueuse/core'
import { Operator } from '@/logic/ast'
import ProofTour from '@/components/ProofTour.vue'

const id = useId()
const collapse = useTemplateRef('collapse')
const proofTour = useTemplateRef<InstanceType<typeof ProofTour>>('tour')
const collapseState = useStorage('help-expanded', true)
</script>

<template>
  <BCard
    tag="aside"
    :header-class="['hstack', { 'border-bottom-0': !collapse?.visible }]"
    no-body
    v-bind="$attrs">
    <template #header>
      <span v-b-toggle="`${id}-collapse`" class="w-100 hstack justify-content-between">
        <span>
          <IBiQuestionCircle class="me-2" />
          Help
        </span>
        <IBiDash v-if="collapse?.visible" />
        <IBiPlus v-else />
      </span>
    </template>
    <BCollapse :id="`${id}-collapse`" ref="collapse" v-model="collapseState">
      <BCardBody>
        <aside class="mb-3">
          <BButton
            variant="outline-secondary"
            class="w-100"
            data-tour="tour"
            @click.prevent="proofTour?.prompt()">
            <IBiSignpostSplit class="me-2" /> Take a Tour
          </BButton>
        </aside>

        <hr />

        <BCardText>
          <h6>Allowed Characters/Symbols</h6>
          <p class="mb-0">The following characters can be used in formulae:</p>
          <ul>
            <li>Any alphabetical character from <code>A</code> to <code>Z</code></li>
            <li>Operators (
              <code v-for="(operator, index) in Operator.all" :key="operator.symbol">
                <span v-if="index !== 0">, </span>{{ operator.symbol }}
              </code>
            )</li>
            <li>Parentheses (<code>()</code>)</li>
            <li>Spaces</li>
          </ul>
          <p>
            Other characters, such as numbers (<code>1</code>, <code>2</code>, <code>3</code>,
            etc.), punctuation (<code>,</code>, <code>.</code>, <code>?</code>, etc.), and symbols
            (&squ;, &cir;, etc) cannot be used.
          </p>
        </BCardText>

        <hr />

        <BCardText>
          <h6>Keyboard Shortcuts</h6>
          <ul>
            <li>
              <code>Shift + &gt;</code>: Insert a
              <code>{{ Operator.CONDITIONAL.symbol }}</code> operator
            </li>
            <li>
              <code>Shift + &lt;</code>: Insert a
              <code>{{ Operator.BICONDITIONAL.symbol }}</code> operator
            </li>
            <li>
              <code>Shift + ?</code>: Insert a
              <code>{{ Operator.DISJUNCTION.symbol }}</code> operator
            </li>
            <li>Number keys (<code>1</code>-<code>9</code>): Toggle the <em>nth</em> justification line</li>
          </ul>
        </BCardText>
      </BCardBody>
    </BCollapse>
  </BCard>

  <ProofTour ref="tour" />
</template>

<style scoped lang="scss">
  :deep(.card-header) {
    cursor: pointer;
  }
</style>
