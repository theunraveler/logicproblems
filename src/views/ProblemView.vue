<script setup type="ts">
import { reactive, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import problems from '../data/problems.json' with {type: 'json'};
import { Line, Proof, Rule } from '../lib/logic';
import FormulaInput from '../components/FormulaInput.vue';
import FormulaInputHelp from '../components/FormulaInputHelp.vue';

const $route = useRoute();
const problem = problems[$route.params.id - 1];
const proof = reactive(new Proof(problem.assumptions, problem.conclusion));
const form = {
    rule: ref(''),
    justifications: ref([]),
};
const error = ref('');
const formulaInput = useTemplateRef('formula-input');

function submitLine() {
    if (!formulaInput.value) {
        return;
    }

    formulaInput.value.validate();
    if (formulaInput.value.error) {
        return;
    }

    const line = new Line(
        formulaInput.value.formula,
        form.rule.value,
        form.justifications.value.map((n) => parseInt(n)),
    );

    try {
        proof.addDeduction(line);
    } catch (err) {
        error.value = err.message;
    }

    if (proof.qed()) {
        const modal = bootstrap.Modal.getOrCreateInstance('#qed-modal');
        modal.show();
        // TODO: Remove form.
    } else {
        formulaInput.value.reset();
        form.rule.value = '';
        form.justifications.value = [];
        error.value = '';
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col-12 col-lg-9">
                <div class="d-flex justify-content-between align-items-center border-bottom mb-4">
                    <h2>{{ problem.title }}</h2>
                    <h4>Conclusion: <code>{{ proof.conclusion }}</code></h4>
                </div>

                <form @submit.prevent="submitLine">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>J</th>
                                <th>L</th>
                                <th>Formula</th>
                                <th>Lines</th>
                                <th>Rule</th>
                            </tr>
                        </thead>
                        <tbody class="table-group-divider">
                            <tr v-for="(line, index) in proof.lines">
                                <td><input type="checkbox" v-model="form.justifications.value" :value="index"></td>
                                <td>{{ index + 1 }}</td>
                                <td><code>{{ line.formula }}</code></td>
                                <td>{{ line.justifications.map((n) => n + 1).join(', ') }}</td>
                                <td><abbr :title="line.rule.label">{{ line.rule }}</abbr></td>
                            </tr>
                            <tr id="new-line-row" class="table-group-divider">
                                <td></td>
                                <td>{{ proof.lines.length + 1 }}</td>
                                <td><FormulaInput ref="formula-input" /></td>
                                <td>{{ form.justifications.value.toSorted().map((n) => n + 1).join(', ') }}</td>
                                <td>
                                    <select class="form-select" v-model="form.rule.value" required>
                                        <option value="" disabled selected hidden>Rule</option>
                                        <template v-for="rule in Rule.all">
                                            <option v-if="rule !== Rule.ASSUMPTION" :value="rule">{{ rule }}</option>
                                        </template>
                                    </select>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <button type="submit" class="btn btn-block w-100 btn-primary">Submit Line</button>
                </form>
            </div>

            <div class="col-12 col-lg-3 bg-light border p-4 mt-4 mt-lg-0">
                <FormulaInputHelp />
            </div>
        </div>
    </div>

    <div id="qed-modal" class="modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Q.E.D.</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>You've completed this problem! Well done!</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                </div>
            </div>
        </div>
    </div>
</template>
