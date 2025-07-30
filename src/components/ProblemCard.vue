<script setup lang="ts">
import { ref, watch } from 'vue'
import { parse } from '@/logic/parse'
import { db } from '@/store'

const props = defineProps(['id', 'problem'])
const isSolved = ref(false)

watch(
  props,
  async () => {
    isSolved.value = !!(await db.solutions.get({ problemId: props.id }))
  },
  { immediate: true },
)
</script>

<template>
  <BCard no-body>
    <BCardHeader class="d-flex justify-content-between align-items-center">
      <span>{{ props.problem.title }}</span>
      <span v-if="isSolved" class="badge rounded-pill text-bg-success">
        <IBiCheckCircleFill class="me-1" /> Solved
      </span>
    </BCardHeader>
    <BListGroup flush numbered>
      <BListGroupItem v-for="(assumption, index) in props.problem.assumptions" :key="index">
        <span class="ms-3">{{ parse(assumption) }}</span>
      </BListGroupItem>
    </BListGroup>
    <BListGroup flush class="border-top-0">
      <BListGroupItem>
        <span>Conclusion: {{ parse(props.problem.conclusion) }}</span>
      </BListGroupItem>
    </BListGroup>
    <BCardBody>
      <BLink
        :to="{ name: 'problem', params: { id: props.id } }"
        class="btn btn-primary stretched-link">
        Solve!
      </BLink>
    </BCardBody>
  </BCard>
</template>
