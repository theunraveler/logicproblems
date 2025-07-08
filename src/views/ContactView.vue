<script setup lang="ts">
import { ref } from 'vue'

const result = ref('');
const form = {
    name: ref(''),
    email: ref(''),
    message: ref(''),
};

function onSubmit() {
    const payload = {
        name: form.name.value,
        email: form.email.value,
        message: form.message.value,
        access_key: '2662d8d2-a598-4646-bd14-ba3adabbcbdb',
        subject: 'Contact Form Submission from logicproblems.org',
        from_name: 'Logic Problems',
    };

    if (import.meta.env.PROD) {
        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
        })
            .then(async (response) => {
                const json = await response.json();
                console.log(response);
                console.log(json)
            })
            .catch(error => {
                console.log(error);
            })
            .then(function() {
                event.target.reset();
            });
    } else {
        result.value = `Would have submitted the following data: ${JSON.stringify(payload)}`;
    }
}
</script>

<template>
    <BContainer>
        <h1>Contact Us</h1>

        <BAlert :model-value="result.value" variant="success">
            {{ result.value }}
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
            <input type="checkbox" name="botcheck" class="hidden" style="display: none;">
            <BButton variant="primary" type="submit">Send</BButton>
        </BForm>
    </BContainer>
</template>
