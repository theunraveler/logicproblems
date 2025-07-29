import { Rule } from '@/logic/rules'
import { advanceWhenChecked, buttons, ensureValue, waitForElement, type Step } from '@/tours/utils'

export enum StepName {
  Intro = 'intro',
  Premises = 'premises',
  Conclusion = 'conclusion',
  Formula = 'formula',
  Operators = 'operators',
  Rule = 'rule',
  SelectJustifications = 'select_justifications',
  Justifications = 'justifications',
  Submit = 'submit',
  NewLine = 'new_line',
  Qed = 'qed',
  Solutions = 'solutions',
  Done = 'done',
}

export const steps: Record<StepName, Step> = {
  [StepName.Intro]: {
    title: 'Solving a Proof',
    text: `We're going to solve this simple proof using the <strong>${Rule.ARROW_OUT.label} (${Rule.ARROW_OUT.shorthand})</strong> rule.`,
    attachTo: '[data-tour="proof"]',
    clickable: false,
    buttons: [buttons.next],
  },
  [StepName.Premises]: {
    title: 'Premises',
    text: "These are the <strong>premises</strong> we are given to start the proof. We'll use these to make new deductions that will lead us to the conclusion.",
    attachTo: '[data-tour="line-0"]',
    highlight: ['[data-tour="line-1"]'],
    clickable: false,
    buttons: [buttons.next],
  },
  [StepName.Conclusion]: {
    title: 'Conclusion',
    text: 'The goal is to arrive at the <strong>conclusion</strong>, which is stated here.',
    attachTo: '[data-tour="conclusion"]',
    buttons: [buttons.next],
  },
  [StepName.Formula]: {
    title: 'Enter a Formula',
    text: 'The first step is to enter a new <strong>formula</strong> in the text box here. Enter <strong>B</strong> in the field now.',
    attachTo: '[data-tour="formula"]',
    advanceOn: { event: 'input', value: 'B' },
    onHide: () => { ensureValue('[data-tour="formula"]', 'B') },
  },
  [StepName.Operators]: {
    title: 'Operators',
    text: "We won't be using any <strong>operators</strong> in this proof, but you can click the operator buttons here to insert an operator into the formula field.",
    attachTo: '[data-tour="operators"]',
    clickable: false,
    buttons: [buttons.next],
  },
  [StepName.Rule]: {
    title: 'Select a Rule',
    text: `Next, we'll select the <strong>rule</strong> that we used to make our new deduction. Select the <strong>${Rule.ARROW_OUT.label} (${Rule.ARROW_OUT.shorthand})</strong> rule now.`,
    attachTo: '[data-tour="rule"]',
    advanceOn: { event: 'change', value: Rule.ARROW_OUT.shorthand },
    onHide: () => { ensureValue('[data-tour="rule"]', Rule.ARROW_OUT.shorthand) },
  },
  [StepName.SelectJustifications]: {
    title: 'Select Justifications',
    text: 'Now we need to select which of the lines we used as <strong>justifications</strong> our new deduction. Check the box next to both of the lines.',
    attachTo: '[data-tour="justification-0"]',
    highlight: ['[data-tour="justification-1"]'],
    onShow: ({ next }) => {
      advanceWhenChecked(next, '[data-tour^="justification-"] input')
    },
    onHide: () => {
      (document.querySelectorAll('[data-tour^="justification-"] input') as NodeListOf<HTMLInputElement>).forEach(
        (el: HTMLInputElement) => el.checked = true
      )
    },
  },
  [StepName.Justifications]: {
    text: 'You may have noticed that as we checked the justification checkboxes, the line numbers here changed to reflect that we are using those lines as justifications for our new deductions.',
    attachTo: '[data-tour="justifications"]',
    buttons: [buttons.next],
  },
  [StepName.Submit]: {
    text: 'Now click the submit button to add our new deduction.',
    attachTo: '[data-tour="submit"]',
    advanceOn: { selector: '[data-tour="submit"]', event: 'click' },
  },
  [StepName.NewLine]: {
    text: "We can see that our new deduction was added as a <strong>line</strong> to the proof table. Only <strong>valid deductions</strong> can be added to the proof table. If you try to enter an invalid deduction, the line won't be added and you'll see an error that tells you why the deduction is invalid.",
    attachTo: () => waitForElement('[data-tour="line-2"]'),
    buttons: [buttons.next],
  },
  [StepName.Qed]: {
    text: "We've solved the proof! When you <strong>complete a proof</strong>, you'll see this <strong>Q.E.D.</strong> row. \"Q.E.D.\" is short for <em>quod erat demonstrandum</em>, which is Latin for \"that which was to be demonstrated.\" It just means we've proven what we intended to prove. You'll normally also see a popup that shows you how long it took you to find a solution, but we've hidden it for this tour.",
    attachTo: '[data-tour="qed"]',
    buttons: [buttons.next],
  },
  [StepName.Solutions]: {
    title: 'Solutions',
    text: "Each time you solve a proof, your <strong>solution</strong> will appear in the solutions list. You can see how many times you've solved the proof and how long each solution took you. You can click on a solution in this list anytime to see how you solved the proof.",
    attachTo: '[data-tour="solutions"]',
    clickable: false,
    buttons: [buttons.next],
  },
  [StepName.Done]: {
    text: "<p>That's it for our tour! Now you're ready to test your skills on the others problems on this site. After you close this tour, you can click the <strong>Chapter Three #1</strong> button below to move to the next problem or the <strong>Chapter Three</strong> link above to go back to the list of problems. If you forget anything we covered, you can always take the tour again by clicking the highlighted button in the sidebar.</p><p>Happy solving!</p>",
    attachTo: '[data-tour="tour"]',
    clickable: false,
    buttons: [buttons.complete],
  },
}
