<script setup lang="ts">
import { ref } from 'vue'
import { useFileDialog } from '@vueuse/core'
import download from 'downloadjs'
import { db } from '@/store'

const showModal = ref(false)
const importing = ref(false)
const totalRows = ref<number>()
const importError = ref<string>()

const { open: openFileDialog, onChange: onFileChange, reset: resetFileDialog } = useFileDialog({
  accept: 'application/json',
  directory: false,
  multiple: false,
})

onFileChange(async (files: FileList | null) => {
  if (!files || files.length !== 1) {
    return
  }

  importError.value = undefined
  importing.value = true

  try {
    const data = JSON.parse(await files[0].text())
    totalRows.value = data.length
    await db.delete({disableAutoOpen: false})
    await db.solutions.bulkAdd(data)
  } catch (error) {
    importing.value = false
    importError.value = typeof error === 'string' ? error : error.message
  } finally {
    setTimeout(() => {
      importing.value = false
      importError.value = undefined
    }, 5000)
    resetFileDialog()
  }
})

const downloadDB = async () => {
  const solutions = (await db.solutions.toArray()).map(({id: _, ...data}) => data)
  download(JSON.stringify(solutions), 'solutions.json', 'application/json')
}
</script>

<template>
  <BButton size="sm" variant="outline-secondary" @click="showModal = true" v-bind="$attrs">
    Import/Export Data
  </BButton>

  <BModal v-model="showModal" title="Import/Export Data" no-footer>
    All solution data is currently stored only in your internet browser's local storage. This means that you won't see any of your solutions if you use this site from another device, a different browser on your computer, etc. You can move your data between devices or browsers by exporting it here, then importing the file on your other device or browser.

    <div class="alert alert-danger mt-3">
      Note that when you import data, your current solutions will be deleted and replaced with the ones in the file. Please use this feature carefully.
    </div>

    <hr />

    <div class="d-flex flex-column justify-content-center">
      <BButton variant="primary" @click="downloadDB" class="mb-2">
        <IBiDownload class="me-2" /> Export Data
      </BButton>
      <div v-if="importError" class="text-danger m-auto hstack">
        Error: {{ importError }}
      </div>
      <div v-else-if="importing" class="text-success m-auto hstack">
        <IBiCheckCircleFill class="me-2" />
        {{ totalRows }} item{{ totalRows === 1 ? '' : 's' }} successfully imported
      </div>
      <BButton v-else variant="primary" @click="openFileDialog()">
        <IBiUpload class="me-2" /> Import Data
      </BButton>
    </div>
  </BModal>
</template>
