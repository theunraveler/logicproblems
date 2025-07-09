<script setup lang="ts">
import { ref } from 'vue'

const data = {
    name: ref(''),
    email: ref(''),
    message: ref(''),
    botcheck: ref(false),
};
const result = ref('');

function onSubmit() {
    const payload = {
        name: data.name.value,
        email: data.email.value,
        message: data.message.value,
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
                reset();
            });
    } else {
        result.value = `Would have submitted the following data: ${JSON.stringify(payload)}`;
        reset();
    }
}

function reset() {
    data.name.value = '';
    data.email.value = '';
    data.message.value = '';
    data.botcheck.value = false;
}
</script>

<template>
    <h1>Contact Us</h1>

    <BAlert :model-value="result.length !== 0" variant="success">
        {{ result }}
    </BAlert>

    <BForm @submit.prevent="onSubmit">
        <BFormGroup label="Name" label-for="name" class="mb-3">
            <BFormInput id="name" v-model="data.name.value" required />
        </BFormGroup>
        <BFormGroup label="Email Address" label-for="email" class="mb-3">
            <BFormInput type="email" id="email" v-model="data.email.value" required />
        </BFormGroup>
        <BFormGroup label="Message" label-for="message" class="mb-3">
            <BFormTextarea id="message" v-model="data.message.value" required />
        </BFormGroup>
        <BFormCheckbox v-model="data.botcheck.value" class="d-none">
            Leave this checkbox unchecked
        </BFormCheckbox>
        <BButton variant="primary" type="submit">Send</BButton>
    </BForm>
</template>
