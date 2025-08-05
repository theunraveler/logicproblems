import { describe, expect, test } from 'vitest'
import { Line, Proof, Rule } from '@/logic'
import { parse } from '@/logic/parse'

describe('Rule', () => {
  describe('#evaluate', () => {
    testCasesFor(Rule.ARROW_OUT, [
      ['B', ['A → B', 'A']],
      ['C → D', ['A → (C → D)', 'A']],
      ['C → D', ['(A → B) → (C → D)', 'A → B']],
      ['C → D', ['A → B', '(A → B) → (C → D)']],
      ['C', ['A → B', 'A'], /must be the consequent of the conditional justification/],
    ])

    // eslint-disable-next-line vitest/valid-title
    describe(Rule.ARROW_IN.label, () => {
      test('evaluates with a supposition and a deduction that derives from the supposition', () => {
        const proof = new Proof(['A → B', 'B → C'], 'A → C')
        proof.addDeduction('A', Rule.SUPPOSITION)
        proof.addDeduction('B', Rule.ARROW_OUT, [0, 2])
        proof.addDeduction('C', Rule.ARROW_OUT, [1, 3])
        proof.addDeduction('A → C', Rule.ARROW_IN, [2, 4])
        expect(true).toBe(true) // We only get here if the previous line didn't error.
      })

      test('fails without exactly 2 justifications', () => {
        expect(() => evaluateSimple(Rule.ARROW_IN, 'C', ['A'])).toThrowError(
          /requires 2 justifications/,
        )
      })

      test('fails if none of the justifications is a supposition', () => {
        expect(() => evaluateSimple(Rule.ARROW_IN, 'C', ['A', 'B'])).toThrowError(
          /must contain an arrow operator/,
        )
      })

      test('fails if the deduction is not derived from the supposition', () => {
        const proof = new Proof(['A', 'A → B', 'B → C'], 'A → C')
        proof.addDeduction('B', Rule.SUPPOSITION)
        expect(() => proof.addDeduction('A → C', Rule.ARROW_IN, [1, 2])).toThrowError(
          /one of the justifications must be a supposition/i,
        )
      })
    })

    testCasesFor(Rule.AND_OUT, [
      ['A', ['A & B']],
      ['B', ['A & B']],
      ['C → D', ['A & (C → D)']],
      ['A → B', ['(A → B) & (C → D)']],
      ['C → D', ['(A → B) & (C → D)']],
      ['C', ['A & B'], /must be either the left or right component of the justification/],
    ])

    testCasesFor(Rule.AND_IN, [
      ['A & B', ['A', 'B']],
      ['B & A', ['A', 'B']],
      ['(A → B) & (C → D)', ['A → B', 'C → D']],
      ['B & C', ['A', 'C'], /left component of the formula must be one of the justifications/],
      ['A & C', ['A', 'B'], /right component of the formula must be one of the justifications/],
    ])

    testCasesFor(Rule.BICONDITIONAL_OUT, [
      ['A → B', ['A ↔ B']],
      ['B → A', ['A ↔ B']],
      ['(A → C) → B', ['(A → C) ↔ B']],
      ['B → (A → C)', ['(A → C) ↔ B']],
      ['B → C', ['A ↔ B'], /formula must have have the same components as the justification/i],
    ])

    testCasesFor(Rule.BICONDITIONAL_IN, [
      ['A ↔ B', ['A → B', 'B → A']],
      ['B ↔ A', ['A → B', 'B → A']],
      ['(A → B) ↔ (C → D)', ['(A → B) → (C → D)', '(C → D) → (A → B)']],
      [
        'B ↔ A',
        ['A → B', 'A → C'],
        /left and right components of the biconditional must be the antecedent and consequent of one justification/i,
      ],
      [
        'B ↔ A',
        ['B → A', 'A → C'],
        /left and right components of the biconditional must be the consequent and antecedent of one justification/i,
      ],
      ['B ↔ A', ['A → B', 'B & C'], /justifications must both contain arrow operators/i],
      ['A ↔ B', ['A → B'], /requires 2 justifications/],
    ])

    testCasesFor(Rule.OR_IN, [
      ['A ∨ B', ['B']],
      ['A ∨ B', ['A']],
      [
        'A ∨ B',
        ['C'],
        /formula must contain the justification as either its left or right component/i,
      ],
    ])

    testCasesFor(Rule.OR_OUT, [
      ['C', ['A ∨ B', 'A → C', 'B → C']],
      ['C', ['A → C', 'A ∨ B', 'B → C']],
      [
        'D',
        ['A ∨ B', 'A → C', 'B → C'],
        /both conditional justifications must contain the formula as their consequent/i,
      ],
      [
        'C',
        ['A ∨ B', 'A → C', 'B → D'],
        /both conditional justifications must contain the formula as their consequent/i,
      ],
      ['C', ['A ∨ B', 'A → C'], /requires 3 justifications/],
    ])

    // eslint-disable-next-line vitest/valid-title
    describe(Rule.NEGATION_OUT.label, () => {
      test('evaluates with a supposition and a contradiction that derives from it', () => {
        const proof = new Proof(['-A → B', '-B'], 'A')
        proof.addDeduction('-A', Rule.SUPPOSITION)
        proof.addDeduction('B', Rule.ARROW_OUT, [0, 2])
        proof.addDeduction('B & -B', Rule.AND_IN, [1, 3])
        expect(() => proof.addDeduction('A', Rule.NEGATION_OUT, [2, 4])).not.toThrowError()
      })

      test('fails when the derived line is not the negation of the supposition', () => {
        const proof = new Proof(['-A → B', '-B'], 'A')
        proof.addDeduction('-A', Rule.SUPPOSITION)
        proof.addDeduction('B', Rule.ARROW_OUT, [0, 2])
        proof.addDeduction('B & -B', Rule.AND_IN, [1, 3])
        expect(() => proof.addDeduction('C', Rule.NEGATION_OUT, [2, 4])).toThrowError(
          /formula must be the negation of the supposition justification/i,
        )
      })

      test('fails without exactly 2 justifications', () => {
        expect(() => evaluateSimple(Rule.NEGATION_OUT, 'C', ['A'])).toThrowError(
          /requires 2 justifications/,
        )
      })

      test('fails if none of the justifications is a supposition', () => {
        expect(() => evaluateSimple(Rule.NEGATION_OUT, 'C', ['A', 'B'])).toThrowError(
          /justifications must include a supposition and a contradiction/i,
        )
      })

      test('fails if the contradiction is not derived from the supposition', () => {
        const proof = new Proof(['A', '-A'], 'B')
        proof.addDeduction('-B', Rule.SUPPOSITION)
        proof.addDeduction('A & -A', Rule.AND_IN, [0, 1])
        expect(() => proof.addDeduction('B', Rule.NEGATION_OUT, [2, 3])).toThrowError(
          /contradiction must contain the supposition as a dependency/i,
        )
      })
    })

    // eslint-disable-next-line vitest/valid-title
    describe(Rule.NEGATION_IN.label, () => {
      test('evaluates with a supposition and a contradiction that derives from it', () => {
        const proof = new Proof(['A → -B', 'B'], '-A')
        proof.addDeduction('A', Rule.SUPPOSITION)
        proof.addDeduction('-B', Rule.ARROW_OUT, [0, 2])
        proof.addDeduction('B & -B', Rule.AND_IN, [1, 3])
        expect(() => proof.addDeduction('-A', Rule.NEGATION_IN, [2, 4])).not.toThrowError()
      })

      test('fails when the derived line is not the negation of the supposition', () => {
        const proof = new Proof(['A → -B', 'B'], '-A')
        proof.addDeduction('A', Rule.SUPPOSITION)
        proof.addDeduction('-B', Rule.ARROW_OUT, [0, 2])
        proof.addDeduction('B & -B', Rule.AND_IN, [1, 3])
        expect(() => proof.addDeduction('-C', Rule.NEGATION_IN, [2, 4])).toThrowError(
          /formula must be the negation of the supposition/i,
        )
      })

      test('fails without exactly 2 justifications', () => {
        expect(() => evaluateSimple(Rule.NEGATION_IN, 'C', ['A'])).toThrowError(
          /requires 2 justifications/,
        )
      })

      test('fails if none of the justifications is a supposition', () => {
        expect(() => evaluateSimple(Rule.NEGATION_IN, '-C', ['A', 'B'])).toThrowError(
          /justifications must include a supposition and a contradiction/i,
        )
      })

      test('fails if the contradiction is not derived from the supposition', () => {
        const proof = new Proof(['A', '-A'], '-B')
        proof.addDeduction('B', Rule.SUPPOSITION)
        proof.addDeduction('A & -A', Rule.AND_IN, [0, 1])
        expect(() => proof.addDeduction('-B', Rule.NEGATION_IN, [2, 3])).toThrowError(
          /contradiction must contain the supposition as a dependency/i,
        )
      })
    })

    // eslint-disable-next-line vitest/valid-title
    describe(Rule.SUPPOSITION.label, () => {
      test('allows any formula', () => {
        expect(() => evaluateSimple(Rule.SUPPOSITION, 'A')).not.toThrowError()
      })

      test('fails when there are justification lines', () => {
        expect(() => evaluateSimple(Rule.SUPPOSITION, 'A', ['B'])).toThrowError(
          /rule requires 0 justifications/i,
        )
      })
    })

    testCasesFor(Rule.MODUS_TOLLENS, [
      ['-A', ['A → B', '-B']],
      ['-A', ['-B', 'A → B']],
      ['-(A & B)', ['-(C & D)', '(A & B) → (C & D)']],
      ['A', ['A → B', '-B'], /formula must contain a dash operator/i],
      [
        '-A',
        ['D → B', '-B'],
        /conditional justification must contain the negated formula as its antecedent/i,
      ],
    ])

    testCasesFor(Rule.DISJUNCTIVE_ARGUMENT, [
      ['B', ['A ∨ B', '-A']],
      ['A', ['A ∨ B', '-B']],
      ['A & B', ['(A & B) ∨ (C & D)', '-(C & D)']],
      [
        'C',
        ['A ∨ B', '-A'],
        /formula must be either the left or right component of the disjunction justification/i,
      ],
      [
        '-B',
        ['A ∨ B', 'A'],
        /disjunction must contain the negated negation as either its left or right component/i,
      ],
      [
        '-B',
        ['A ∨ B', '-A'],
        /formula must be either the left or right component of the disjunction justification/i,
      ],
    ])

    testCasesFor(Rule.CONJUNCTIVE_ARGUMENT, [
      ['-B', ['-(A & B)', 'A']],
      ['-A', ['-(A & B)', 'B']],
      ['B', ['-(A & B)', 'A'], /formula must contain a dash operator/i],
      [
        '-A',
        ['-(A & B)', 'C'],
        /contains the second justification as either its left or right component/i,
      ],
    ])

    testCasesFor(Rule.CHAIN_RULE, [
      ['A → C', ['A → B', 'B → C']],
      ['A → C', ['B → C', 'A → B']],
      [
        'A → C',
        ['A → B', 'B → D'],
        /consequent of the formula must be the consequent of the second justification/i,
      ],
      ['N → C', ['A → B', 'B → C'], /formula must be the antecedent of one of the justifications/i],
    ])

    testCasesFor(Rule.DOUBLE_NEGATION, [
      ['--A', ['A']],
      ['A', ['--A']],
      ['A & B', ['--(A & B)']],
      ['--(A & B)', ['A & B']],
      ['-(A & B)', ['A & B'], /formula or justification must contain 2 dash operators/i],
      ['---(A & B)', ['A & B'], /formula or justification must contain 2 dash operators/i],
    ])

    testCasesFor(Rule.DEMORGANS_LAW, [
      ['-A ∨ -B', ['-(A & B)']],
      ['-(A & B)', ['-A ∨ -B']],
      ['-A & -B', ['-(A ∨ B)']],
      ['-(A ∨ B)', ['-A & -B']],
      ['A ∨ B', ['-(-A & -B)']],
      ['-(-A & -B)', ['A ∨ B']],
      ['A & B', ['-(-A ∨ -B)']],
      ['-(-A ∨ -B)', ['A & B']],
      ['--A & -B', ['-(-A ∨ B)']],
      ['A & -B', ['-(-A ∨ B)'], /invalid deduction/i],
    ])

    testCasesFor(Rule.ARROW, [
      ['-A ∨ B', ['A → B']],
      ['A → B', ['-A ∨ B']],
      ['A ∨ B', ['-A → B']],
      ['-A → B', ['A ∨ B']],
      ['-(A & -B)', ['A → B']],
      ['A → B', ['-(A & -B)']],
      ['A & -B', ['-(A → B)']],
      ['-(A → B)', ['A & -B']],
    ])

    testCasesFor(Rule.CONTRAPOSITION, [
      ['-B → -A', ['A → B']],
      ['B → A', ['-A → -B']],
      ['-B → A', ['-A → B']],
      ['B → -A', ['A → -B']],
      ['B → -A', ['-A → B'], /invalid deduction/i],
      ['-B → A', ['A → -B'], /invalid deduction/i],
      ['-B → -A', ['-A → -B'], /invalid deduction/i],
    ])
  })

  const testCasesFor = (
    rule: Rule,
    cases: ([string, string[]] | [string, string[], string | RegExp])[],
    only: boolean = false,
  ) => {
    // eslint-disable-next-line vitest/valid-title
    describe(rule.label, () => {
      const testMethod = only ? test.only : test
      testMethod.each(cases)(
        '%s from %s: %s',
        (formula: string, justifications: string[], error: string | RegExp | null = null) => {
          const caller = () => evaluateSimple(rule, formula, justifications)
          if (error) {
            expect(caller).toThrowError(error)
          } else {
            expect(caller()).toBeUndefined()
          }
        },
      )
    })
  }

  const evaluateSimple = (rule: Rule, formula: string, justifications: string[] = []) => {
    const premises = justifications.map((j, i) => new Line(i, j, 'A'))
    const proof = new Proof(premises, 'Z')
    rule.evaluate(parse(formula), premises, proof)
  }

  describe('.findByShorthand', () => {
    test('returns the matched Rule', () => {
      expect(Rule.findByShorthand('& O')).toBe(Rule.AND_OUT)
    })

    test('disregards spaces', () => {
      expect(Rule.findByShorthand('&O')).toBe(Rule.AND_OUT)
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
      expect(proof.lines[2].formula.toString()).toEqual('B')
      expect(proof.lines[2].rule).toBe(Rule.ARROW_OUT)
      expect(proof.lines[2].justifications).toEqual([0, 1])
    })

    test('returns the new line', () => {
      const proof = new Proof(['A → B', 'A'], 'B')
      const line = proof.addDeduction('B', Rule.ARROW_OUT, [0, 1])
      expect(line).toBeInstanceOf(Line)
    })

    test('throw for invalid lines', () => {
      const proof = new Proof(['A → B', 'A'], 'B')
      expect(() => proof.addDeduction('C', Rule.ARROW_OUT, [0, 1])).toThrowError()
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
        proof.deductions.push(new Line(1, 'A', Rule.SUPPOSITION))
        proof.deductions.push(new Line(2, 'B', Rule.ARROW_OUT, [0, 1]))
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
