<script setup lang="ts">
import { ref, useId, useTemplateRef } from 'vue'
import { useHead } from '@unhead/vue'
import { useColorMode } from '@vueuse/core'
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'
import { COLOR_MODE_STORAGE_KEY } from '@/utils'

useHead({ title: 'Contact' })

const id = useId()
const form = {
  name: ref(''),
  email: ref(''),
  message: ref(''),
}
const submitting = ref(false)
const hasError = ref(false)
const alertText = ref('')
const colorMode = useColorMode({ storageKey: COLOR_MODE_STORAGE_KEY })

const hcaptchaSiteKey = import.meta.env.PROD
  ? '0118bbb2-12b6-4906-b8ee-76a22bda1102'
  : '10000000-ffff-ffff-ffff-000000000001'
const hcaptcha = useTemplateRef('hcaptcha')
const hcaptchaToken = ref<string>()

const submit = async () => {
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
      subject: 'Contact Form Submission from logicproblems.org',
      'h-captcha-response': hcaptchaToken.value,
    },
  )

  if (import.meta.env.PROD) {
    await submitToFormspree(payload)
  } else {
    showAlert(payload)
  }

  submitting.value = false
  if (!hasError.value) {
    reset()
  }
}

const submitToFormspree = (payload: { [key: string]: string }) => {
  return fetch('https://formspree.io/f/movlwowd', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      if (response.ok) {
        alertText.value = "Thanks for contacting us. We'll get back to you shortly."
      } else {
        const json = await response.json()
        if (Object.hasOwn(json, 'errors')) {
          alertText.value = json.errors.map((error: Error) => error.message).join(', ')
        } else {
          alertText.value = 'Oops! There was a problem submitting your form.'
        }
        hasError.value = true
      }
    })
    .catch((error) => {
      alertText.value = `Error: ${error instanceof Error ? error.message : error}`
      hasError.value = true
    })
}

const showAlert = (payload: { [key: string]: string }) => {
  alertText.value = `Would have submitted the following data: <pre class="my-2">${JSON.stringify(payload, undefined, 2)}</pre>`
}

const reset = () => {
  form.name.value = ''
  form.email.value = ''
  form.message.value = ''
  submitting.value = false
  hcaptcha.value?.reset()
}
</script>

<template>
  <h1 class="mb-4">Contact Us</h1>

  <BAlert :model-value="!!alertText" :variant="hasError ? 'danger' : 'success'">
    <template #default>
      <div v-html="alertText" />
    </template>
  </BAlert>

  <BForm @submit.prevent="submit">
    <BRow class="mb-3">
      <BFormGroup label="Name" :label-for="`${id}-name`" class="col col-lg-6" floating>
        <BFormInput
          :id="`${id}-name`"
          v-model="form.name.value"
          placeholder="Enter your name"
          required />
      </BFormGroup>
      <BFormGroup label="Email Address" :label-for="`${id}-email`" class="col col-lg-6" floating>
        <BFormInput
          type="email"
          :id="`${id}-email`"
          v-model="form.email.value"
          placeholder="Enter your email address"
          required />
      </BFormGroup>
    </BRow>
    <BFormGroup
      label="Message"
      :label-form="`${id}-message`"
      :label-visually-hidden="true"
      class="mb-3">
      <BFormTextarea
        :id="`${id}-message`"
        v-model="form.message.value"
        placeholder="Enter your message"
        rows="3"
        required />
    </BFormGroup>
    <div class="d-flex justify-content-between align-items-center">
      <VueHcaptcha
        ref="hcaptcha"
        :sitekey="hcaptchaSiteKey"
        :theme="colorMode"
        data-testid="hcaptcha"
        @verify="(token: string) => (hcaptchaToken = token)" />
      <BButton
        variant="primary"
        type="submit"
        :disabled="!hcaptchaToken || submitting"
        class="ms-3">
        <span v-if="submitting"><BSpinner small /> Sending...</span>
        <span v-else>Send</span>
      </BButton>
    </div>
  </BForm>
</template>
