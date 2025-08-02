<script setup lang="ts">
import { inject } from 'vue'
import { chaptersInjectionKey, type ChapterList } from '@/plugins/data'

const props = defineProps(['current'])
const chapters = inject(chaptersInjectionKey) as ChapterList
</script>

<template>
  <BCard tag="aside" header="Browse by Chapter" no-body>
    <BListGroup flush>
      <BListGroupItem :to="{ name: 'problems' }" :class="{ active: !props.current }">
        View All
      </BListGroupItem>
      <BListGroupItem
        v-for="(name, key) in chapters"
        :key="key"
        :to="{ name: 'problems', query: { chapter: key } }"
        :class="{ active: props.current == key }">
        {{ name }}
      </BListGroupItem>
    </BListGroup>
  </BCard>
</template>
