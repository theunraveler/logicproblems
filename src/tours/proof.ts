import Shepherd from 'shepherd.js'
import { offset } from '@floating-ui/dom'
import { Rule } from '@/logic'
import { advanceOnValue, advanceWhenChecked, waitForElement } from '@/tours/utils'

export const tour = new Shepherd.Tour({
  confirmCancel: false,
  exitOnEsc: false,
  keyboardNavigation: false,
  useModalOverlay: true,
  defaultStepOptions: {
    modalOverlayOpeningPadding: 5,
    floatingUIOptions: {
      middleware: [offset(20)],
    },
  },
})

tour.addSteps([
  {
    id: 'intro',
    title: 'Solving a Proof',
    text: `We're going to solve this simple proof using the <strong>${Rule.ARROW_OUT.label} (${Rule.ARROW_OUT.shorthand})</strong> rule.`,
    buttons: [{ text: 'Next', action: tour.next }],
  },
  {
    id: 'premises',
    title: 'Premises',
    text: "These are the <strong>premises</strong> we are given to start the proof. We'll use these to make new deductions that will lead us to the conclusion.",
    modalOverlayOpeningPadding: 0,
    attachTo: { element: '[data-tour="line-0"]', on: 'auto' },
    extraHighlights: ['[data-tour="line-1"]'],
    buttons: [{ text: 'Next', action: tour.next }],
  },
  {
    id: 'conclusion',
    title: 'Conclusion',
    text: 'The goal is to arrive at the <strong>conclusion</strong>, which is stated here.',
    attachTo: { element: '[data-tour="conclusion"]', on: 'auto' },
    buttons: [{ text: 'Next', action: tour.next }],
  },
  {
    id: 'formula',
    title: 'Enter a Formula',
    text: 'The first step is to enter a new <strong>formula</strong> in the text box here. Enter <strong>B</strong> in the field now.',
    attachTo: { element: '[data-tour="formula"]', on: 'auto' },
    when: {
      show: () => {
        advanceOnValue(tour, '[data-tour="formula"]', 'input', 'B')
      },
      hide: () => {
        ;(document.querySelector('[data-tour="formula"]') as HTMLInputElement).value = 'B'
      },
    },
  },
  {
    id: 'operators',
    title: 'Operators',
    text: "We won't be using any <strong>operators</strong> in this proof, but you can click the operator buttons here to insert an operator into the formula field.",
    attachTo: { element: `[data-tour="operators"]`, on: 'auto' },
    canClickTarget: false,
    buttons: [{ text: 'Next', action: tour.next }],
  },
  {
    id: 'rule',
    title: 'Select a Rule',
    text: `Next, we'll select the <strong>rule</strong> that we used to make our new deduction. Select the <strong>${Rule.ARROW_OUT.label} (${Rule.ARROW_OUT.shorthand})</strong> rule now.`,
    attachTo: { element: '[data-tour="rule"]', on: 'auto' },
    when: {
      show: () => {
        advanceOnValue(tour, '[data-tour="rule"]', 'change', Rule.ARROW_OUT.shorthand)
      },
      hide: () => {
        ;(document.querySelector('[data-tour="rule"]') as HTMLSelectElement).value =
          Rule.ARROW_OUT.shorthand
      },
    },
  },
  {
    id: 'select-justifications',
    title: 'Select Justifications',
    text: 'Now we need to select which of the lines we used as <strong>justifications</strong> our new deduction. Check the box next to both of the lines.',
    attachTo: { element: '[data-tour="justification-0"]', on: 'auto' },
    extraHighlights: ['[data-tour="justification-1"]'],
    modalOverlayOpeningPadding: 0,
    when: {
      show: () => {
        advanceWhenChecked(tour, '[data-tour^="justification-"] input')
      },
    },
  },
  {
    id: 'justifications',
    text: 'You may have noticed that as we checked the justification checkboxes, the line numbers here changed to reflect that we are using those lines as justifications for our new deductions.',
    attachTo: { element: '[data-tour="justifications"]', on: 'auto' },
    buttons: [{ text: 'Next', action: tour.next }],
  },
  {
    id: 'submit',
    text: 'Now click the submit button to add our new deduction.',
    attachTo: { element: '[data-tour="submit"]', on: 'auto' },
    advanceOn: { selector: '[data-tour="submit"]', event: 'click' },
  },
  {
    id: 'new-line',
    text: "We can see that our new deduction was added as a <strong>line</strong> to the proof table. Only <strong>valid deductions</strong> can be added to the proof table. If you try to enter an invalid deduction, the line won't be added and you'll see an error that tells you why the deduction is invalid.",
    attachTo: { element: () => '[data-tour="line-2"]', on: 'auto' },
    beforeShowPromise: () => {
      return waitForElement('[data-tour="line-2"]')
    },
    buttons: [{ text: 'Next', action: tour.next }],
  },
  {
    id: 'qed',
    text: "We've solved the proof! When you <strong>complete a proof</strong>, you'll see this <strong>Q.E.D.</strong> row. \"Q.E.D.\" is short for <em>quod erat demonstrandum</em>, which is Latin for \"that which was to be demonstrated.\" It just means we've proven what we intended to prove. You'll normally also see a popup that shows you how long it took you to find a solution, but we've hidden it for this tour.",
    attachTo: { element: '[data-tour="qed"]', on: 'auto' },
    buttons: [{ text: 'Next', action: tour.next }],
  },
  {
    id: 'solutions',
    title: 'Solutions',
    text: "Each time you solve a proof, your <strong>solution</strong> will appear in the solutions list. You can see how many times you've solved the proof and how long each solution took you. You can click on a solution in this list anytime to see how you solved the proof.",
    attachTo: { element: '[data-tour="solutions"]', on: 'auto' },
    canClickTarget: false,
    buttons: [{ text: 'Next', action: tour.next }],
  },
  {
    id: 'done',
    text: "<p>That's it for our tour! Now you're ready to test your skills on the others problems on this site. After you close this tour, you can click the <strong>Chapter Three #1</strong> button below to move to the next problem or the <strong>Chapter Three</strong> link above to go back to the list of problems. If you forget anything we covered, you can always take the tour again by clicking the highlighted button in the sidebar.</p><p>Happy solving!</p>",
    attachTo: { element: '[data-tour="tour"]' },
    canClickTarget: false,
    buttons: [{ text: 'Close', action: tour.complete }],
  },
])
