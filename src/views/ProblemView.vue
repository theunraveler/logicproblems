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
const formulaInput = useTemplateRef('formula-input');

function submitLine(event) {
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
    proof.addDeduction(line);

    if (proof.qed()) {
        // TODO: Show alert.
        // TODO: Remove form.
    } else {
        formulaInput.value.reset();
        form.rule.value = '';
        form.justifications.value = [];
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
                            <tr class="table-group-divider">
                                <td></td>
                                <td>{{ proof.lines.length + 1 }}</td>
                                <td><FormulaInput ref="formula-input" /></td>
                                <td></td>
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
</template>
