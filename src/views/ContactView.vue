<script setup lang="ts">
import { ref } from 'vue'

const form = {
  name: ref(''),
  email: ref(''),
  message: ref(''),
  botcheck: ref(false),
}
const submitting = ref(false)
const hasError = ref(false)
const alertText = ref('')

const onSubmit = async () => {
  alertText.value = ''
  hasError.value = false
  submitting.value = true

  const payload = Object.assign(
    {},
    Object.fromEntries(
      Object.entries(form).map(([key, value]) => {
        return [key, value.value]
      }),
    ),
    {
      access_key: '2662d8d2-a598-4646-bd14-ba3adabbcbdb',
      subject: 'Contact Form Submission from logicproblems.org',
      from_name: 'Logic Problems',
    },
  )

  if (import.meta.env.DEV) {
    alertText.value = `Would have submitted the following data: ${JSON.stringify(payload)}`
    reset()
    return
  }

  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      const json = await response.json()
      if (response.ok && json.success) {
        alertText.value = "Thanks for contacting us. We'll get back to you shortly."
      }
      reset()
    })
    .catch(async (error) => {
      alertText.value = `Error: ${error instanceof Error ? error.message : error}`
      hasError.value = true
      submitting.value = false
    })
}

function reset() {
  form.name.value = ''
  form.email.value = ''
  form.message.value = ''
  form.botcheck.value = false
  submitting.value = false
}
</script>

<template>
  <h1 class="mb-4">Contact Us</h1>

  <BAlert :model-value="!!alertText" :variant="hasError ? 'danger' : 'success'">
    {{ alertText }}
  </BAlert>

  <BForm @submit.prevent="onSubmit">
    <BFormGroup label="Name" label-for="name" class="mb-3">
      <BFormInput id="name" v-model="form.name.value" required />
    </BFormGroup>
    <BFormGroup label="Email Address" label-for="email" class="mb-3">
      <BFormInput type="email" id="email" v-model="form.email.value" required />
    </BFormGroup>
    <BFormGroup label="Message" label-for="message" class="mb-3">
      <BFormTextarea id="message" v-model="form.message.value" required />
    </BFormGroup>
    <BFormCheckbox v-model="form.botcheck.value" class="d-none">
      Leave this checkbox unchecked
    </BFormCheckbox>
    <BButton variant="primary" type="submit" :disabled="submitting">
      <span v-if="submitting"><BSpinner small /> Sending...</span>
      <span v-else>Send</span>
    </BButton>
  </BForm>
</template>
