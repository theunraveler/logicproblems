import { describe, expect, test } from 'vitest'
import { Formula, Line, Proof, Rule } from '../logic'

describe('Rule', () => {
  describe('#evaluate', () => {
    describe('ARROW_OUT', () => {
      test.each([
        ['B', ['A → B', 'A'], true],
        ['C → D', ['A → (C → D)', 'A'], true],
        ['C → D', ['(A → B) → (C → D)', 'A → B'], true],
        ['C → D', ['A → B', '(A → B) → (C → D)'], true],
        ['C', ['A → B', 'A'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.ARROW_OUT, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('ARROW_IN', () => {
      test('evaluates with a supposition and a deduction that derives from the supposition', () => {
        const proof = new Proof(['A → B', 'B → C'], 'A → C')
        proof.addDeduction('A', Rule.SUPPOSITION)
        proof.addDeduction('B', Rule.ARROW_OUT, [0, 2])
        proof.addDeduction('C', Rule.ARROW_OUT, [1, 3])
        proof.addDeduction('A → C', Rule.ARROW_IN, [2, 4])
        expect(true).toBe(true) // We only get here if the previous line didn't error.
      })

      test('fails without exactly 2 justifications', () => {
        expect(evaluateSimple(Rule.ARROW_IN, 'C', ['A'])).toBe(false)
      })

      test('fails if none of the justifications is a supposition', () => {
        expect(evaluateSimple(Rule.ARROW_IN, 'C', ['A', 'B'])).toBe(false)
      })

      test('fails if the deduction is not derived from the supposition', () => {
        const proof = new Proof(['A', 'A → B', 'B → C'], 'A → C')
        proof.addDeduction('B', Rule.SUPPOSITION)
        expect(() => proof.addDeduction('A → C', Rule.ARROW_IN, [1, 2])).toThrowError(
          /^Invalid deduction/,
        )
      })
    })

    describe('AND_OUT', () => {
      test.each([
        ['A', ['A & B'], true],
        ['B', ['A & B'], true],
        ['C → D', ['A & (C → D)'], true],
        ['A → B', ['(A → B) & (C → D)'], true],
        ['C → D', ['(A → B) & (C → D)'], true],
        ['C', ['A & B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.AND_OUT, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('AND_IN', () => {
      test.each([
        ['A & B', ['A', 'B'], true],
        ['B & A', ['A', 'B'], true],
        ['(A → B) & (C → D)', ['A → B', 'C → D'], true],
        ['A & C', ['A', 'B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.AND_IN, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('BICONDITIONAL_OUT', () => {
      test.each([
        ['A → B', ['A ↔ B'], true],
        ['B → A', ['A ↔ B'], true],
        ['(A → C) → B', ['(A → C) ↔ B'], true],
        ['B → (A → C)', ['(A → C) ↔ B'], true],
        ['B → C', ['A ↔ B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.BICONDITIONAL_OUT, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('BICONDITIONAL_IN', () => {
      test.each([
        ['A ↔ B', ['A → B', 'B → A'], true],
        ['B ↔ A', ['A → B', 'B → A'], true],
        ['(A → B) ↔ (C → D)', ['(A → B) → (C → D)', '(C → D) → (A → B)'], true],
        ['B ↔ A', ['A → B', 'A → C'], false],
        ['B ↔ A', ['A → B', 'B & C'], false],
        ['A ↔ B', ['A → B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.BICONDITIONAL_IN, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('OR_IN', () => {
      test.each([
        ['A ∨ B', ['B'], true],
        ['A ∨ B', ['A'], true],
        ['A ∨ B', ['C'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.OR_IN, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('OR_OUT', () => {
      test.each([
        ['C', ['A ∨ B', 'A → C', 'B → C'], true],
        ['C', ['A → C', 'A ∨ B', 'B → C'], true],
        ['D', ['A ∨ B', 'A → C', 'B → C'], false],
        ['C', ['A ∨ B', 'A → C', 'B → D'], false],
        ['C', ['A ∨ B', 'A → C'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.OR_OUT, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('NEGATION_OUT', () => {
      test('evaluates with a supposition and a contradiction that derives from it', () => {
        const proof = new Proof(['-A → B', '-B'], 'A')
        proof.addDeduction('-A', Rule.SUPPOSITION)
        proof.addDeduction('B', Rule.ARROW_OUT, [0, 2])
        proof.addDeduction('B & -B', Rule.AND_IN, [1, 3])
        proof.addDeduction('A', Rule.NEGATION_OUT, [2, 4])
        expect(true).toBe(true) // We only get here if the previous line didn't error.
      })

      test('fails when the derived line is not the negation of the supposition', () => {
        const proof = new Proof(['-A → B', '-B'], 'A')
        proof.addDeduction('-A', Rule.SUPPOSITION)
        proof.addDeduction('B', Rule.ARROW_OUT, [0, 2])
        proof.addDeduction('B & -B', Rule.AND_IN, [1, 3])
        expect(() => proof.addDeduction('C', Rule.NEGATION_OUT, [1, 2])).toThrowError(
          /^Invalid deduction/,
        )
      })

      test('fails without exactly 2 justifications', () => {
        expect(evaluateSimple(Rule.NEGATION_OUT, 'C', ['A'])).toBe(false)
      })

      test('fails if none of the justifications is a supposition', () => {
        expect(evaluateSimple(Rule.NEGATION_OUT, 'C', ['A', 'B'])).toBe(false)
      })

      test('fails if the contradiction is not derived from the supposition', () => {
        const proof = new Proof(['A', '-A'], 'B')
        proof.addDeduction('-B', Rule.SUPPOSITION)
        proof.addDeduction('A & -A', Rule.AND_IN, [0, 1])
        expect(() => proof.addDeduction('B', Rule.NEGATION_OUT, [1, 2])).toThrowError(
          /^Invalid deduction/,
        )
      })
    })

    describe('NEGATION_IN', () => {
      test('evaluates with a supposition and a contradiction that derives from it', () => {
        const proof = new Proof(['A → -B', 'B'], '-A')
        proof.addDeduction('A', Rule.SUPPOSITION)
        proof.addDeduction('-B', Rule.ARROW_OUT, [0, 2])
        proof.addDeduction('B & -B', Rule.AND_IN, [1, 3])
        proof.addDeduction('-A', Rule.NEGATION_IN, [2, 4])
        expect(true).toBe(true) // We only get here if the previous line didn't error.
      })

      test('fails when the derived line is not the negation of the supposition', () => {
        const proof = new Proof(['A → -B', 'B'], '-A')
        proof.addDeduction('A', Rule.SUPPOSITION)
        proof.addDeduction('-B', Rule.ARROW_OUT, [0, 2])
        proof.addDeduction('B & -B', Rule.AND_IN, [1, 3])
        expect(() => proof.addDeduction('-C', Rule.NEGATION_IN, [2, 4])).toThrowError(
          /^Invalid deduction/,
        )
      })

      test('fails without exactly 2 justifications', () => {
        expect(evaluateSimple(Rule.NEGATION_IN, 'C', ['A'])).toBe(false)
      })

      test('fails if none of the justifications is a supposition', () => {
        expect(evaluateSimple(Rule.NEGATION_IN, 'C', ['A', 'B'])).toBe(false)
      })

      test('fails if the contradiction is not derived from the supposition', () => {
        const proof = new Proof(['A', '-A'], '-B')
        proof.addDeduction('B', Rule.SUPPOSITION)
        proof.addDeduction('A & -A', Rule.AND_IN, [0, 1])
        expect(() => proof.addDeduction('-B', Rule.NEGATION_IN, [1, 2])).toThrowError(
          /^Invalid deduction/,
        )
      })
    })

    describe('SUPPOSITION', () => {
      test('allows any formula', () => {
        expect(evaluateSimple(Rule.SUPPOSITION, 'A')).toBe(true)
      })

      test('fails when there are justification lines', () => {
        expect(evaluateSimple(Rule.SUPPOSITION, 'A', ['B'])).toBe(false)
      })
    })

    describe('MODUS_TOLLENS', () => {
      test.each([
        ['-A', ['A → B', '-B'], true],
        ['-A', ['-B', 'A → B'], true],
        ['-(A & B)', ['-(C & D)', '(A & B) → (C & D)'], true],
        ['A', ['A → B', '-B'], false],
        ['-A', ['D → B', '-B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.MODUS_TOLLENS, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('DISJUNCTIVE_ARGUMENT', () => {
      test.each([
        ['B', ['A ∨ B', '-A'], true],
        ['A', ['A ∨ B', '-B'], true],
        ['A & B', ['(A & B) ∨ (C & D)', '-(C & D)'], true],
        ['C', ['A ∨ B', '-A'], false],
        ['-B', ['A ∨ B', 'A'], false],
        ['-B', ['A ∨ B', '-A'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.DISJUNCTIVE_ARGUMENT, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('CONJUNCTIVE_ARGUMENT', () => {
      test.each([
        ['-B', ['-(A & B)', 'A'], true],
        ['-A', ['-(A & B)', 'B'], true],
        ['B', ['-(A & B)', 'A'], false],
        ['-A', ['-(A & B)', 'C'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.CONJUNCTIVE_ARGUMENT, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('CHAIN_RULE', () => {
      test.each([
        ['A → C', ['A → B', 'B → C'], true],
        ['A → C', ['B → C', 'A → B'], true],
        ['A → C', ['A → B', 'B → D'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.CHAIN_RULE, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('DOUBLE_NEGATION', () => {
      test.each([
        ['--A', ['A'], true],
        ['A', ['--A'], true],
        ['A & B', ['--(A & B)'], true],
        ['--(A & B)', ['A & B'], true],
        ['-(A & B)', ['A & B'], false],
        ['---(A & B)', ['A & B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.DOUBLE_NEGATION, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('DEMORGANS_LAW', () => {
      test.each([
        ['-A ∨ -B', ['-(A & B)'], true],
        ['-(A & B)', ['-A ∨ -B'], true],
        ['-A & -B', ['-(A ∨ B)'], true],
        ['-(A ∨ B)', ['-A & -B'], true],
        ['A ∨ B', ['-(-A & -B)'], true],
        ['-(-A & -B)', ['A ∨ B'], true],
        ['A & B', ['-(-A ∨ -B)'], true],
        ['-(-A ∨ -B)', ['A & B'], true],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.DEMORGANS_LAW, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('ARROW', () => {
      test.each([
        ['-A ∨ B', ['A → B'], true],
        ['A → B', ['-A ∨ B'], true],
        ['A ∨ B', ['-A → B'], true],
        ['-A → B', ['A ∨ B'], true],
        ['-(A & -B)', ['A → B'], true],
        ['A → B', ['-(A & -B)'], true],
        ['A & -B', ['-(A → B)'], true],
        ['-(A → B)', ['A & -B'], true],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.ARROW, formula, justifications)).toBe(shouldPass)
      })
    })

    describe('CONTRAPOSITION', () => {
      test.each([
        ['-B → -A', ['A → B'], true],
        ['B → A', ['-A → -B'], true],
        ['-B → A', ['-A → B'], true],
        ['B → -A', ['A → -B'], true],
        ['B → -A', ['-A → B'], false],
        ['-B → A', ['A → -B'], false],
        ['-B → -A', ['-A → -B'], false],
      ])('%s from %s: %s', (formula: string, justifications: string[], shouldPass: boolean) => {
        expect(evaluateSimple(Rule.CONTRAPOSITION, formula, justifications)).toBe(shouldPass)
      })
    })
  })

  const evaluateSimple = (rule: Rule, formula: string, justifications: string[] = []): boolean => {
    const assumptions = justifications.map((j, i) => new Line(i, j, 'A'))
    const proof = new Proof(assumptions, 'Z')
    return rule.evaluate(new Formula(formula), assumptions, proof)
  }

  describe('.findByShorthand', () => {
    test('returns the matched Rule', () => {
      expect(Rule.findByShorthand('& O')).toBe(Rule.AND_OUT)
    })

    test('throws an error when the Rule is not found', () => {
      expect(() => Rule.findByShorthand('NONE')).toThrowError(/^Rule not found$/)
    })
  })
})

describe('Line', () => {
  describe('#dependencies', () => {
    test('lines with no justifications are their own dependencies', () => {
      const proof = new Proof(['A', 'B'], 'C')
      expect(proof.lines[0].dependencies(proof)).toEqual([0])
      expect(proof.lines[1].dependencies(proof)).toEqual([1])
    })

    test('includes dependencies of justifications', () => {
      const proof = new Proof(['A & B', 'B → C'], 'C')
      expect(proof.addDeduction('B', Rule.AND_OUT, [0]).dependencies(proof)).toEqual([0])
      expect(proof.addDeduction('C', Rule.ARROW_OUT, [1, 2]).dependencies(proof)).toEqual([0, 1])
    })

    test('resolves supposition dependencies', () => {
      const proof = new Proof(['C → F', 'F → B', 'B → A'], 'C → A')
      expect(proof.addDeduction('C', Rule.SUPPOSITION).dependencies(proof)).toEqual([3])
      expect(proof.addDeduction('F', Rule.ARROW_OUT, [0, 3]).dependencies(proof)).toEqual([0, 3])
      expect(proof.addDeduction('B', Rule.ARROW_OUT, [1, 4]).dependencies(proof)).toEqual([0, 1, 3])
      expect(proof.addDeduction('A', Rule.ARROW_OUT, [2, 5]).dependencies(proof)).toEqual([
        0, 1, 2, 3,
      ])
      expect(proof.addDeduction('C → A', Rule.ARROW_IN, [3, 6]).dependencies(proof)).toEqual([
        0, 1, 2,
      ])
      expect(proof.qed()).toBe(true)
    })

    test('resolves supposition dependencies (multiple)', () => {
      const proof = new Proof(['(B & A) → C'], 'A → (B → C)')
      expect(proof.addDeduction('A', Rule.SUPPOSITION).dependencies(proof)).toEqual([1])
      expect(proof.addDeduction('B', Rule.SUPPOSITION).dependencies(proof)).toEqual([2])
      expect(proof.addDeduction('B & A', Rule.AND_IN, [1, 2]).dependencies(proof)).toEqual([1, 2])
      expect(proof.addDeduction('C', Rule.ARROW_OUT, [0, 3]).dependencies(proof)).toEqual([0, 1, 2])
      expect(proof.addDeduction('B → C', Rule.ARROW_IN, [2, 4]).dependencies(proof)).toEqual([0, 1])
      expect(proof.addDeduction('A → (B → C)', Rule.ARROW_IN, [1, 5]).dependencies(proof)).toEqual([
        0,
      ])
      expect(proof.qed()).toBe(true)
    })
  })
})

describe('Proof', () => {
  describe('#addDeduction', () => {
    test('adds the line to the proof', () => {
      const proof = new Proof(['A → B', 'A'], 'B')
      proof.addDeduction('B', Rule.ARROW_OUT, [0, 1])
      expect(proof.lines[2].formula.text).toEqual('B')
      expect(proof.lines[2].rule).toBe(Rule.ARROW_OUT)
      expect(proof.lines[2].justifications).toEqual([0, 1])
    })

    test('throw for invalid lines', () => {
      const proof = new Proof(['A → B', 'A'], 'B')
      expect(() => proof.addDeduction('C', Rule.ARROW_OUT, [0, 1])).toThrowError(
        /^Invalid deduction/,
      )
    })
  })

  describe('#qed', () => {
    describe('with suppositions', () => {
      test('returns true when suppositions have been cleared', () => {
        const proof = new Proof(['A → B', 'B → C'], 'A → C')
        proof.addDeduction('A', Rule.SUPPOSITION)
        proof.addDeduction('B', Rule.ARROW_OUT, [0, 2])
        proof.addDeduction('C', Rule.ARROW_OUT, [1, 3])
        proof.addDeduction('A → C', Rule.ARROW_IN, [2, 4])
        expect(proof.qed()).toBe(true)
      })

      test('returns false when suppositions have not been cleared', () => {
        const proof = new Proof(['A → B'], 'B')
        proof.addDeduction('A', Rule.SUPPOSITION)
        proof.addDeduction('B', Rule.ARROW_OUT, [0, 1])
        expect(proof.qed()).toBe(false)
      })
    })

    describe('without suppositions', () => {
      test('returns true when the proof is complete', () => {
        const proof = new Proof(['A → B', 'A'], 'B')
        proof.addDeduction('B', Rule.ARROW_OUT, [0, 1])
        expect(proof.qed()).toBe(true)
      })

      test('returns false when the proof is incomplete', () => {
        const proof = new Proof(['A → B', 'B → C', 'A'], 'C')
        proof.addDeduction('B', Rule.ARROW_OUT, [0, 2])
        expect(proof.qed()).toBe(false)
      })
    })
  })
})
