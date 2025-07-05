<script setup lang="ts">
function onSubmit(event) {
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData);
    payload.access_key = '2662d8d2-a598-4646-bd14-ba3adabbcbdb';
    payload.subject = 'Contact Form Submission from logicproblems.org';
    payload.from_name = 'Logic Problems';

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
        const container = document.getElementById('result');
        container.innerHTML = `Would have submitted the following data: ${payload}`;
    }
}
</script>

<template>
    <div id="result"></div>
    <form @submit.prevent="onSubmit" class="container">
        <div class="mb-3">
            <label for="name" class="form-label">Name</label>
            <input type="text" class="form-control" id="name" name="name" required>
        </div>
        <div class="mb-3">
            <label for="email" class="form-label">Email Address</label>
            <input type="email" class="form-control" id="email" name="email" required>
        </div>
        <div class="mb-3">
            <label for="message" class="form-label">Message</label>
            <textarea class="form-control" id="message" name="message" required></textarea>
        </div>
        <input type="checkbox" name="botcheck" class="hidden" style="display: none;">
        <button class="btn btn-primary" type="submit">Send</button>
    </form>
</template>
