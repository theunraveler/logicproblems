import { describe, expect, test } from 'vitest'
import * as logic from './logic';

describe('Rule', () => {
  describe('ARROW_OUT', () => {
    describe('evaluate', () => {
      test.each([
        ['B', ['A → B', 'A'], true],
        ['C → D', ['A → (C → D)', 'A'], true],
        ['C → D', ['(A → B) → (C → D)', 'A → B'], true],
        ['C → D', ['A → B', '(A → B) → (C → D)'], true],
        ['C', ['A → B', 'A'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.ARROW_OUT.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('ARROW_IN', () => {
    describe('evaluate', () => {
      test.todo('Implement me');
    })
  })

  describe('AND_OUT', () => {
    describe('evaluate', () => {
      test.each([
        ['A', ['A & B'], true],
        ['B', ['A & B'], true],
        ['C → D', ['A & (C → D)'], true],
        ['A → B', ['(A → B) & (C → D)'], true],
        ['C → D', ['(A → B) & (C → D)'], true],
        ['C', ['A & B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.AND_OUT.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('AND_IN', () => {
    describe('evaluate', () => {
      test.each([
        ['A & B', ['A', 'B'], true],
        ['B & A', ['A', 'B'], true],
        ['(A → B) & (C → D)', ['A → B', 'C → D'], true],
        ['A & C', ['A', 'B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.AND_IN.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('BICONDITIONAL_OUT', () => {
    describe('evaluate', () => {
      test.each([
        ['A → B', ['A ↔ B'], true],
        ['B → A', ['A ↔ B'], true],
        ['(A → C) → B', ['(A → C) ↔ B'], true],
        ['B → (A → C)', ['(A → C) ↔ B'], true],
        ['B → C', ['A ↔ B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.BICONDITIONAL_OUT.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('BICONDITIONAL_IN', () => {
    describe('evaluate', () => {
      test.each([
        ['A ↔ B', ['A → B', 'B → A'], true],
        ['B ↔ A', ['A → B', 'B → A'], true],
        ['(A → B) ↔ (C → D)', ['(A → B) → (C → D)', '(C → D) → (A → B)'], true],
        ['B ↔ A', ['A → B', 'A → C'], false],
        ['B ↔ A', ['A → B', 'B & C'], false],
        ['A ↔ B', ['A → B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.BICONDITIONAL_IN.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('OR_IN', () => {
    describe('evaluate', () => {
      test.each([
        ['A ∨ B', ['B'], true],
        ['A ∨ B', ['A'], true],
        ['A ∨ B', ['C'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.OR_IN.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('OR_OUT', () => {
    describe('evaluate', () => {
      test.each([
        ['C', ['A ∨ B', 'A → C', 'B → C'], true],
        ['C', ['A → C', 'A ∨ B', 'B → C'], true],
        ['D', ['A ∨ B', 'A → C', 'B → C'], false],
        ['C', ['A ∨ B', 'A → C', 'B → D'], false],
        ['C', ['A ∨ B', 'A → C'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.OR_OUT.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('NEGATION_OUT', () => {
    describe('evaluate', () => {
      test.todo('Implement me')
    })
  })

  describe('NEGATION_IN', () => {
    describe('evaluate', () => {
      test.todo('Implement me')
    })
  })

  describe('SUPPOSITION', () => {
    describe('evaluate', () => {
      test.todo('Implement me')
    })
  })

  describe('MODUS_TOLLENS', () => {
    describe('evaluate', () => {
      test.each([
        ['-A', ['A → B', '-B'], true],
        ['-A', ['-B', 'A → B'], true],
        ['-(A & B)', ['-(C & D)', '(A & B) → (C & D)'], true],
        ['A', ['A → B', '-B'], false],
        ['-A', ['D → B', '-B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.MODUS_TOLLENS.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('DISJUNCTIVE_ARGUMENT', () => {
    describe('evaluate', () => {
      test.each([
        ['B', ['A ∨ B', '-A'], true],
        ['A', ['A ∨ B', '-B'], true],
        ['A & B', ['(A & B) ∨ (C & D)', '-(C & D)'], true],
        ['C', ['A ∨ B', '-A'], false],
        ['-B', ['A ∨ B', 'A'], false],
        ['-B', ['A ∨ B', '-A'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.DISJUNCTIVE_ARGUMENT.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('CONJUNCTIVE_ARGUMENT', () => {
    describe('evaluate', () => {
      test.each([
        ['-B', ['-(A & B)', 'A'], true],
        ['-A', ['-(A & B)', 'B'], true],
        ['B', ['-(A & B)', 'A'], false],
        ['-A', ['-(A & B)', 'C'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.CONJUNCTIVE_ARGUMENT.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('CHAIN_RULE', () => {
    describe('evaluate', () => {
      test.each([
        ['A → C', ['A → B', 'B → C'], true],
        ['A → C', ['B → C', 'A → B'], true],
        ['A → C', ['A → B', 'B → D'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.CHAIN_RULE.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('DOUBLE_NEGATION', () => {
    describe('evaluate', () => {
      test.each([
        ['--A', ['A'], true],
        ['A', ['--A'], true],
        ['A & B', ['--(A & B)'], true],
        ['--(A & B)', ['A & B'], true],
        ['-(A & B)', ['A & B'], false],
        ['---(A & B)', ['A & B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(
          logic.Rule.DOUBLE_NEGATION.evaluate(new logic.Formula(formula), justifications.map((j) => new logic.Formula(j)))
        ).toBe(shouldPass);
      })
    })
  })

  describe('DEMORGANS_LAW', () => {
    describe('evaluate', () => {
      test.todo('Implement me')
    })
  })

  describe('ARROW', () => {
    describe('evaluate', () => {
      test.todo('Implement me')
    })
  })

  describe('CONTRAPOSITION', () => {
    describe('evaluate', () => {
      test.todo('Implement me')
    })
  })
})
