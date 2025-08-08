<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClipboard, useShare } from '@vueuse/core'
import { compressToEncodedURIComponent } from 'lz-string'
import type { Problem } from '@/plugins/data'
import { Proof } from '@/logic'
import { compressProofLines } from '@/utils'

const props = defineProps<{ problem: Problem; proof: Proof }>()

const $router = useRouter()

const permalink = computed(() => {
  const query = {} as { [key: string]: string }
  if (props.proof.deductions.length > 0) {
    query['l'] = compressToEncodedURIComponent(JSON.stringify(compressProofLines(props.proof)))
  }
  const route = $router.resolve({
    name: 'problem',
    params: { id: props.problem.id },
    query: query,
  })
  return new URL(route.href, window.location.origin).href
})
const { copy, copied, isSupported: clipboardIsSupported } = useClipboard({ source: permalink })
const { share, isSupported: shareIsSupported } = useShare()

const doShare = async () => {
  try {
    await share({
      title: `${props.problem.title} | Logic Problems`,
      text: `Check out my proof for ${props.problem.title} on Logic Problems`,
      url: permalink.value,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    throw error
  }
}
</script>

<template>
  <BTooltip v-if="shareIsSupported || clipboardIsSupported">
    <template #target>
      <aside v-bind="$attrs">
        <BButton
          :variant="copied ? 'success' : 'outline-secondary'"
          :disabled="props.proof.deductions.length === 0"
          class="w-100"
          @click.prevent="shareIsSupported ? doShare() : copy()">
          <template v-if="copied">
            <IBiClipboardCheck class="me-2" /> Copied to Clipboard
          </template>
          <template v-else> <IBiShare class="me-2" /> Share This Proof </template>
        </BButton>
      </aside>
    </template>
    Sharing this proof will include all of the lines you currently see in the proof. It's a great
    way to share a solution you're proud of or get help with a proof you're stuck on!
  </BTooltip>
</template>
