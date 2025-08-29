import {
  Biconditional,
  Conditional,
  Conjunction,
  Disjunction,
  Expression,
  Negation,
  Operator,
} from '@/logic/ast'
import { Line, Proof } from '@/logic'

export class InvalidDeductionError extends Error {}

type EvalFunction = {
  (exp: Expression, justifications: Line[], proof: Proof): void
}

export class Rule {
  static all: Rule[] = []

  static readonly ASSUMPTION = new Rule('A', 'Assumption', () => {}, 0)
  static readonly ARROW_OUT = new Rule('→ O', 'Arrow Out', arrowOut, 2)
  static readonly ARROW_IN = new Rule('→ I', 'Arrow In', arrowIn, 2, true)
  static readonly BICONDITIONAL_OUT = new Rule('↔ O', 'Biconditional Out', biconditionalOut, 1)
  static readonly BICONDITIONAL_IN = new Rule('↔ I', 'Biconditional In', biconditionalIn, 2)
  static readonly OR_OUT = new Rule('∨ O', 'Wedge Out', orOut, 3)
  static readonly OR_IN = new Rule('∨ I', 'Wedge In', orIn, 1)
  static readonly AND_OUT = new Rule('& O', 'Ampersand/And Out', andOut, 1)
  static readonly AND_IN = new Rule('& I', 'Ampersand/And In', andIn, 2)
  static readonly NEGATION_OUT = new Rule('- O', 'Dash Out', negationOut, 2, true)
  static readonly NEGATION_IN = new Rule('- I', 'Dash In', negationIn, 2, true)
  static readonly SUPPOSITION = new Rule('S', 'Supposition', () => {}, 0)
  static readonly MODUS_TOLLENS = new Rule('MT', 'Modus Tollens', modusTollens, 2)
  static readonly DISJUNCTIVE_ARGUMENT = new Rule(
    'DA',
    'Disjunctive Argument',
    disjunctiveArgument,
    2,
  )
  static readonly CONJUNCTIVE_ARGUMENT = new Rule(
    'CA',
    'Conjunctive Argument',
    conjunctiveArgument,
    2,
  )
  static readonly CHAIN_RULE = new Rule('CH', 'Chain Rule', chainRule, 2)
  static readonly DOUBLE_NEGATION = new Rule('DN', 'Double Negation', doubleNegation, 1)
  static readonly DEMORGANS_LAW = new Rule('DM', "Demorgan's Law", demorgansLaw, 1)
  static readonly ARROW = new Rule('AR', 'Arrow', arrow, 1)
  static readonly CONTRAPOSITION = new Rule('CN', 'Contraposition', contraposition, 1)

  private constructor(
    public readonly shorthand: string,
    public readonly label: string,
    private readonly evalFunc: EvalFunction,
    private readonly requiredJustifications: number,
    public readonly resolvesSupposition: boolean = false,
  ) {
    Rule.all.push(this)
  }

  evaluate(formula: Expression, justifications: Line[], proof: Proof) {
    if (justifications.length !== this.requiredJustifications) {
      throw new InvalidDeductionError(
        `Rule requires ${this.requiredJustifications} justification${this.requiredJustifications === 1 ? '' : 's'}`,
      )
    }
    this.evalFunc(formula, justifications, proof)
  }

  valueOf(): string {
    return this.toString()
  }

  toString(): string {
    return this.shorthand
  }

  public static findByShorthand(shorthand: string): Rule {
    const trimmedShorthand = shorthand.replaceAll(' ', '')
    const found = Rule.all.find((rule) => rule.shorthand.replaceAll(' ', '') === trimmedShorthand)
    if (!found) {
      throw new Error('Rule not found')
    }
    return found
  }
}

function arrowOut(exp: Expression, justifications: Line[]) {
  const justExps = justifications.map((j) => j.formula)
  const orderedJust = [justExps, justExps.toReversed()].find(([a, b]) => {
    return a instanceof Conditional && a.left.toString() === b.toString()
  }) as [Conditional, Expression] | undefined
  if (!orderedJust) {
    throw new InvalidDeductionError(
      'Justifications must include a conditional that has the other justification as its antecedent',
    )
  }

  const [mainJust] = orderedJust

  if (mainJust.right.toString() !== exp.toString()) {
    throw new InvalidDeductionError(
      'Formula must be the consequent of the conditional justification',
    )
  }
}

function arrowIn(exp: Expression, justifications: Line[], proof: Proof) {
  if (!(exp instanceof Conditional)) {
    throw new InvalidDeductionError('Formula must contain an arrow operator')
  }

  const suppositionIndex = justifications.findIndex(
    (j) => j.rule.valueOf() === Rule.SUPPOSITION.valueOf(),
  )
  if (suppositionIndex === -1) {
    throw new InvalidDeductionError('One of the justifications must be a supposition')
  }

  const supposition = justifications[suppositionIndex]
  const right = justifications[suppositionIndex ? 0 : 1]
  const dependencies = right.dependencies(proof)

  if (!dependencies.includes(supposition.index)) {
    throw new InvalidDeductionError(
      'Second justification must have the supposition justification as a dependency',
    )
  }

  if (exp.left.toString() !== supposition.formula.toString()) {
    throw new InvalidDeductionError(
      'The antecedent of the formula must be the supposition justification',
    )
  }
  if (exp.right.toString() !== right.formula.toString()) {
    throw new InvalidDeductionError(
      'The consequent of the formula must be the second justification',
    )
  }
}

function biconditionalOut(exp: Expression, [{ formula: just }]: Line[]) {
  if (!(just instanceof Biconditional)) {
    throw new InvalidDeductionError('Justification must contain a double arrow operator')
  }
  if (!(exp instanceof Conditional)) {
    throw new InvalidDeductionError('Formula must contain an arrow operator')
  }

  const expLeft = exp.left.toString()
  const expRight = exp.right.toString()
  const justLeft = just.left.toString()
  const justRight = just.right.toString()
  if (
    !(expLeft === justLeft && expRight === justRight) &&
    !(expLeft === justRight && expRight === justLeft)
  ) {
    throw new InvalidDeductionError(
      'Formula must have have the same components as the justification',
    )
  }
}

function biconditionalIn(exp: Expression, justifications: Line[]) {
  if (!(exp instanceof Biconditional)) {
    throw new InvalidDeductionError('Formula must contain a double arrow operator')
  }

  const justExps = justifications.map((j) => j.formula)
  if (!justExps.every((e) => e instanceof Conditional)) {
    throw new InvalidDeductionError('Justifications must both contain arrow operators')
  }

  const justExpsStr = justExps.map((e) => e.toString())
  const leftRight = new Conditional(exp.left, exp.right).toString()
  const rightLeft = new Conditional(exp.right, exp.left).toString()

  if (!justExpsStr.includes(leftRight)) {
    throw new InvalidDeductionError(
      'Left and right components of the biconditional must be the antecedent and consequent of one justification',
    )
  }
  if (!justExpsStr.includes(rightLeft)) {
    throw new InvalidDeductionError(
      'Left and right components of the biconditional must be the consequent and antecedent of one justification',
    )
  }
}

function orOut(exp: Expression, justifications: Line[]) {
  const justExps = justifications.map((j) => j.formula)
  const orJustIndex = justExps.findIndex((e) => e instanceof Disjunction)
  if (orJustIndex === -1) {
    throw new InvalidDeductionError('One justification must contain a wedge operator')
  }
  const [orJust] = justExps.splice(orJustIndex, 1)
  if (!(orJust instanceof Disjunction)) {
    throw new InvalidDeductionError('One justification must contain a wedge operator')
  }

  if (!justExps.every((e) => e instanceof Conditional)) {
    throw new InvalidDeductionError('Other two justifications must contain arrow operators')
  }

  const expStr = exp.toString()

  if (!justExps.every((e) => e.right.toString() === expStr)) {
    throw new InvalidDeductionError(
      'Both conditional justifications must contain the formula as their consequent',
    )
  }

  const orJustParts = [orJust.left, orJust.right].map((p) => p.toString()).sort()
  const justExpLefts = justExps.map((e) => e.left.toString()).sort()
  if (!orJustParts.every((val, index) => val === justExpLefts[index])) {
    throw new InvalidDeductionError(
      'Both the left and right components of the wedge justification must be the antecedents of the conditional justifications',
    )
  }
}

function orIn(exp: Expression, [justification]: Line[]) {
  if (!(exp instanceof Disjunction)) {
    throw new InvalidDeductionError('Formula must contain a wedge operator')
  }

  const justExp = justification.formula.toString()
  if (exp.left.toString() !== justExp && exp.right.toString() !== justExp) {
    throw new InvalidDeductionError(
      'Formula must contain the justification as either its left or right component',
    )
  }
}

function andOut(exp: Expression, [{ formula: just }]: Line[]) {
  if (!(just instanceof Conjunction)) {
    throw new InvalidDeductionError('Justification must contain an ampersand operator')
  }

  const expStr = exp.toString()
  if (just.left.toString() !== expStr && just.right.toString() !== expStr) {
    throw new InvalidDeductionError(
      'Formula must be either the left or right component of the justification',
    )
  }
}

function andIn(exp: Expression, justifications: Line[]) {
  if (!(exp instanceof Conjunction)) {
    throw new InvalidDeductionError('Formula must contain an ampersand operator')
  }

  const expLeft = exp.left.toString()
  const expRight = exp.right.toString()
  const justExps = justifications.map((j) => j.formula.toString())

  if (!justExps.includes(expLeft)) {
    throw new InvalidDeductionError(
      'The left component of the formula must be one of the justifications',
    )
  }
  if (!justExps.includes(expRight)) {
    throw new InvalidDeductionError(
      'The right component of the formula must be one of the justifications',
    )
  }
}

function negationOut(exp: Expression, justifications: Line[], proof: Proof) {
  const orderedJusts = [justifications, justifications.toReversed()].find(([a, b]) => {
    return (
      a.rule.valueOf() === Rule.SUPPOSITION.valueOf() &&
      b.formula instanceof Conjunction &&
      b.formula.isContradiction()
    )
  })
  if (!orderedJusts) {
    throw new InvalidDeductionError('Justifications must include a supposition and a contradiction')
  }

  const [supposition, contradiction] = orderedJusts

  const suppositionExp = supposition.formula
  if (!(suppositionExp instanceof Negation)) {
    throw new InvalidDeductionError('The supposition justification must contain a dash operator')
  }
  if (suppositionExp.inner.toString() !== exp.toString()) {
    throw new InvalidDeductionError('Formula must be the negation of the supposition justification')
  }

  const contradictionDeps = contradiction.dependencies(proof)
  if (!contradictionDeps.includes(supposition.index)) {
    throw new InvalidDeductionError('Contradiction must contain the supposition as a dependency')
  }
}

function negationIn(exp: Expression, justifications: Line[], proof: Proof) {
  if (!(exp instanceof Negation)) {
    throw new InvalidDeductionError('Formula must contain a dash operator')
  }

  const orderedJusts = [justifications, justifications.toReversed()].find(([a, b]) => {
    return (
      a.rule.valueOf() === Rule.SUPPOSITION.valueOf() &&
      b.formula instanceof Conjunction &&
      b.formula.isContradiction()
    )
  })
  if (!orderedJusts) {
    throw new InvalidDeductionError('Justifications must include a supposition and a contradiction')
  }

  const [supposition, contradiction] = orderedJusts

  const suppositionExp = supposition.formula
  if (exp.inner.toString() !== suppositionExp.toString()) {
    throw new InvalidDeductionError('Formula must be the negation of the supposition justification')
  }

  const contradictionDeps = contradiction.dependencies(proof)
  if (!contradictionDeps.includes(supposition.index)) {
    throw new InvalidDeductionError('Contradiction must contain the supposition as a dependency')
  }
}

function modusTollens(exp: Expression, justifications: Line[]) {
  if (!(exp instanceof Negation)) {
    throw new InvalidDeductionError('Formula must contain a dash operator')
  }

  const justExps = justifications.map((j) => j.formula)
  const orderedJusts = [justExps, justExps.toReversed()].find(([a, b]) => {
    return a instanceof Negation && b instanceof Conditional
  }) as [Negation, Conditional]
  if (!orderedJusts) {
    throw new InvalidDeductionError(
      'Justifications must consist of a negation formula and a conditional formula',
    )
  }

  const expInner = exp.inner.toString()
  const [negationJust, conditionalJust] = orderedJusts

  if (conditionalJust.left.toString() !== expInner) {
    throw new InvalidDeductionError(
      'Conditional justification must contain the negated formula as its antecedent',
    )
  }
  if (conditionalJust.right.toString() !== negationJust.inner.toString()) {
    throw new InvalidDeductionError(
      'Conditional justification must contain the negated negation justification as its consequent',
    )
  }
}

function disjunctiveArgument(exp: Expression, justifications: Line[]) {
  const justExps = justifications.map((j) => j.formula)
  const orderedJusts = [justExps, justExps.toReversed()].find(([a, b]) => {
    if (!(b instanceof Negation)) {
      return false
    }
    const bExp = b.inner.toString()
    return a instanceof Disjunction && (a.left.toString() === bExp || a.right.toString() === bExp)
  }) as [Disjunction, Negation] | undefined
  if (!orderedJusts) {
    throw new InvalidDeductionError(
      'Justifications must include a disjunction and a negation, and the disjunction must contain the negated negation as either its left or right component',
    )
  }

  const [disjunctionJust] = orderedJusts
  const expStr = exp.toString()
  if (disjunctionJust.left.toString() !== expStr && disjunctionJust.right.toString() !== expStr) {
    throw new InvalidDeductionError(
      'Formula must be either the left or right component of the disjunction justification',
    )
  }
}

function conjunctiveArgument(exp: Expression, justifications: Line[]) {
  if (!(exp instanceof Negation)) {
    throw new InvalidDeductionError('Formula must contain a dash operator')
  }

  const justExps = justifications.map((j) => j.formula)
  const orderedJusts = [justExps, justExps.toReversed()].find(([a, b]) => {
    const bStr = b.toString()
    return (
      a instanceof Negation &&
      a.inner instanceof Conjunction &&
      (a.inner.left.toString() === bStr || a.inner.right.toString() === bStr)
    )
  })
  if (!orderedJusts) {
    throw new InvalidDeductionError(
      'Justifications must include a negated conjunction that contains the second justification as either its left or right component',
    )
  }

  const conjunctionJust = (orderedJusts[0] as Negation).inner as Conjunction
  const innerStr = exp.inner.toString()
  if (
    conjunctionJust.left.toString() !== innerStr &&
    conjunctionJust.right.toString() !== innerStr
  ) {
    throw new InvalidDeductionError(
      'Negated formula must be either the left or right component of the conjunction justification',
    )
  }
}

function chainRule(exp: Expression, justifications: Line[]) {
  if (!(exp instanceof Conditional)) {
    throw new InvalidDeductionError('Formula must contain an arrow operator')
  }

  const justExps = justifications.map((j) => j.formula)
  if (!justExps.every((e) => e instanceof Conditional)) {
    throw new InvalidDeductionError('Justifications must all contain an arrow operator')
  }

  const expLeft = exp.left.toString()
  const firstJustIndex = justExps.findIndex((e) => e.left.toString() === expLeft)
  if (firstJustIndex === -1) {
    throw new InvalidDeductionError(
      'The antecedent of the formula must be the antecedent of one of the justifications',
    )
  }
  const firstJust = justExps[firstJustIndex]
  const secondJust = justExps[firstJustIndex ? 0 : 1]

  if (firstJust.right.toString() !== secondJust.left.toString()) {
    throw new InvalidDeductionError(
      'Consequent of the first justification must be the antecedent of the second justification',
    )
  }

  if (secondJust.right.toString() !== exp.right.toString()) {
    throw new InvalidDeductionError(
      'Consequent of the formula must be the consequent of the second justification',
    )
  }
}

function doubleNegation(exp: Expression, [justification]: Line[]) {
  const expStr = exp.toString(true)
  const justExp = justification.formula.toString(true)
  const doubleNegation = Operator.NEGATION.symbol.repeat(2)

  if (expStr !== `${doubleNegation}${justExp}` && `${doubleNegation}${expStr}` !== justExp) {
    throw new InvalidDeductionError('Formula or justification must contain 2 dash operators')
  }
}

function demorgansLaw(
  exp: Expression,
  [{ formula: justExp }]: Line[],
  proof: Proof,
  tryReciprocal: boolean = true,
) {
  // If this rule doesn't pass, try it's reciprocal, since the rule works both
  // ways.
  const throwOrRecip = (message: string) => {
    if (tryReciprocal) {
      demorgansLaw(justExp, [new Line(0, exp.toString(), Rule.ASSUMPTION)], proof, false)
    } else {
      throw new InvalidDeductionError(message)
    }
  }

  if (!(justExp instanceof Negation)) {
    return throwOrRecip('Invalid deduction')
  }
  const justExpInner = justExp.inner

  if (
    !(
      (exp instanceof Conjunction && justExpInner instanceof Disjunction) ||
      (exp instanceof Disjunction && justExpInner instanceof Conjunction)
    )
  ) {
    return throwOrRecip('Invalid deduction')
  }

  // -A ∨ -B from -(A & B)
  // -A & -B from -(A ∨ B)
  if (
    exp.left instanceof Negation &&
    justExpInner.left.toString() === exp.left.inner.toString() &&
    exp.right instanceof Negation &&
    justExpInner.right.toString() === exp.right.inner.toString()
  ) {
    return
  }

  // A ∨ B from -(-A & -B)
  // A & B from -(-A ∨ -B)
  if (
    justExpInner.left instanceof Negation &&
    justExpInner.left.inner.toString() === exp.left.toString() &&
    justExpInner.right instanceof Negation &&
    justExpInner.right.inner.toString() === exp.right.toString()
  ) {
    return
  }

  return throwOrRecip('Invalid deduction')
}

function arrow(
  exp: Expression,
  [{ formula: justExp }]: Line[],
  proof: Proof,
  tryReciprocal: boolean = true,
) {
  // If this rule doesn't pass, try it's reciprocal, since the rule works both
  // ways.
  const throwOrRecip = (message: string) => {
    if (tryReciprocal) {
      arrow(justExp, [new Line(0, exp.toString(), Rule.ASSUMPTION)], proof, false)
    } else {
      throw new InvalidDeductionError(message)
    }
  }

  const conditionalJust = justExp instanceof Negation ? justExp.inner : justExp
  if (!(conditionalJust instanceof Conditional)) {
    return throwOrRecip('Justification must contain an arrow operator')
  }

  // -A ∨ B from A → B
  if (
    !(justExp instanceof Negation) &&
    exp instanceof Disjunction &&
    exp.left instanceof Negation &&
    conditionalJust.left.toString() === exp.left.inner.toString() &&
    conditionalJust.right.toString() === exp.right.toString()
  ) {
    return
  }

  // A ∨ B from -A → B
  if (
    !(justExp instanceof Negation) &&
    conditionalJust.left instanceof Negation &&
    exp instanceof Disjunction &&
    conditionalJust.left.inner.toString() === exp.left.toString() &&
    conditionalJust.right.toString() === exp.right.toString()
  ) {
    return
  }

  // -(A & -B) from A → B
  if (
    !(justExp instanceof Negation) &&
    exp instanceof Negation &&
    exp.inner instanceof Conjunction &&
    exp.inner.right instanceof Negation &&
    conditionalJust.left.toString() === exp.inner.left.toString() &&
    conditionalJust.right.toString() === exp.inner.right.inner.toString()
  ) {
    return
  }

  // A & -B from -(A → B)
  if (
    justExp instanceof Negation &&
    exp instanceof Conjunction &&
    exp.right instanceof Negation &&
    conditionalJust.left.toString() === exp.left.toString() &&
    conditionalJust.right.toString() === exp.right.inner.toString()
  ) {
    return
  }

  return throwOrRecip('InvalidDeduction')
}

function contraposition(exp: Expression, [{ formula: justExp }]: Line[]) {
  if (!(justExp instanceof Conditional) || !(exp instanceof Conditional)) {
    throw new InvalidDeductionError(
      'Both the formula and the justification must contain an arrow operator',
    )
  }

  // -B → -A from A → B
  if (
    exp.left instanceof Negation &&
    exp.right instanceof Negation &&
    exp.left.inner.toString() === justExp.right.toString() &&
    exp.right.inner.toString() === justExp.left.toString()
  ) {
    return
  }

  // B → A from -A → -B
  if (
    justExp.left instanceof Negation &&
    justExp.right instanceof Negation &&
    justExp.left.inner.toString() === exp.right.toString() &&
    justExp.right.inner.toString() === exp.left.toString()
  ) {
    return
  }

  // -B → A from -A → B
  if (
    justExp.left instanceof Negation &&
    exp.left instanceof Negation &&
    justExp.left.inner.toString() === exp.right.toString() &&
    justExp.right.toString() === exp.left.inner.toString()
  ) {
    return
  }

  // B → -A from A → -B
  if (
    justExp.right instanceof Negation &&
    exp.right instanceof Negation &&
    justExp.left.toString() === exp.right.inner.toString() &&
    justExp.right.inner.toString() === exp.left.toString()
  ) {
    return
  }

  throw new InvalidDeductionError('Invalid deduction')
}
