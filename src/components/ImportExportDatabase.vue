<script setup lang="ts">
import { ref } from 'vue'
import { useFileDialog } from '@vueuse/core'
import { exportDB, importInto } from 'dexie-export-import'
import type { ImportProgress } from 'dexie-export-import/dist/import.d'
import download from 'downloadjs'
import { db } from '@/store'

const showModal = ref(false)
const importing = ref(false)
const totalRows = ref<number>()
const completedRows = ref<number>()

const { open: openFileDialog, onChange: onFileChange } = useFileDialog({
  accept: 'application/json',
  directory: false,
  multiple: false,
})

const open = () => openFileDialog()

const updateImportProgress = ({
  totalRows: total,
  completedRows: completed,
  done,
}: ImportProgress): boolean => {
  totalRows.value = total
  completedRows.value = completed

  if (done) {
    setTimeout(() => (importing.value = false), 2000)
  }

  return done
}

onFileChange((files: FileList | null) => {
  if (!files || files.length !== 1) {
    return
  }
  importing.value = true
  importInto(db, files[0], { progressCallback: updateImportProgress })
})

const downloadDB = async () => {
  download(await exportDB(db), 'logicproblems.json', 'application/json')
}
</script>

<template>
  <BButton size="sm" variant="outline-secondary" @click="showModal = true">
    Import/Export Data
  </BButton>

  <BModal v-model="showModal" title="Import/Export Data" no-footer>
    <div class="d-flex flex-column justify-content-center">
      <BProgress
        v-if="importing"
        :value="completedRows"
        :max="totalRows"
        :variant="completedRows === totalRows ? 'success' : null" />
      <BButton v-else variant="primary" @click="open">
        <IBiUpload class="me-2" /> Import Data
      </BButton>
      <hr />
      <BButton variant="primary" @click="downloadDB">
        <IBiDownload class="me-2" /> Export Data
      </BButton>
    </div>
  </BModal>
</template>
