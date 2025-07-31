import {
  Biconditional,
  BinaryExpression,
  Conditional,
  Conjunction,
  Disjunction,
  Expression,
  Negation,
  Operator,
} from '@/logic/ast'
import { parse } from '@/logic/parse'

export class InvalidDeductionError extends Error {}

type LineEvalFunction = {
  (exp: Expression, justifications: Line[], proof: Proof): void
}

export class Rule {
  static all: Rule[] = []

  static readonly ASSUMPTION = new Rule('A', 'Assumption', () => {}, 0)
  static readonly ARROW_OUT = new Rule('→ O', 'Arrow Out', evalArrowOut, 2)
  static readonly ARROW_IN = new Rule('→ I', 'Arrow In', evalArrowIn, 2, true)
  static readonly BICONDITIONAL_OUT = new Rule('↔ O', 'Biconditional Out', evalBiconditionalOut, 1)
  static readonly BICONDITIONAL_IN = new Rule('↔ I', 'Biconditional In', evalBiconditionalIn, 2)
  static readonly OR_OUT = new Rule('∨ O', 'Wedge Out', evalWedgeOut, 3)
  static readonly OR_IN = new Rule('∨ I', 'Wedge In', evalWedgeIn, 1)
  static readonly AND_OUT = new Rule('& O', 'Ampersand/And Out', evalAndOut, 1)
  static readonly AND_IN = new Rule('& I', 'Ampersand/And In', evalAndIn, 2)
  static readonly NEGATION_OUT = new Rule('- O', 'Dash Out', evalNegationOut, 2, true)
  static readonly NEGATION_IN = new Rule('- I', 'Dash In', evalNegationIn, 2, true)
  static readonly SUPPOSITION = new Rule('S', 'Supposition', () => {}, 0)
  static readonly MODUS_TOLLENS = new Rule('MT', 'Modus Tollens', evalModusTollens, 2)
  static readonly DISJUNCTIVE_ARGUMENT = new Rule(
    'DA',
    'Disjunctive Argument',
    evalDisjunctiveArgument,
    2,
  )
  static readonly CONJUNCTIVE_ARGUMENT = new Rule(
    'CA',
    'Conjunctive Argument',
    evalConjunctiveArgument,
    2,
  )
  static readonly CHAIN_RULE = new Rule('CH', 'Chain Rule', evalChainRule, 2)
  static readonly DOUBLE_NEGATION = new Rule('DN', 'Double Negation', evalDoubleNegation, 1)
  static readonly DEMORGANS_LAW = new Rule('DM', "Demorgan's Law", evalDemorgansLaw, 1)
  static readonly ARROW = new Rule('AR', 'Arrow', evalArrow, 1)
  static readonly CONTRAPOSITION = new Rule('CN', 'Contraposition', evalContraposition, 1)

  constructor(
    public readonly shorthand: string,
    public readonly label: string,
    public readonly evalFunc: LineEvalFunction,
    public readonly requiredJustifications: number,
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
    return this.shorthand
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

export class Line {
  public readonly formula: Expression
  public readonly rule: Rule

  constructor(
    public readonly index: number,
    formula: Expression | string,
    rule: Rule | string,
    public readonly justifications: number[] = [],
  ) {
    this.formula = formula instanceof Expression ? formula : parse(formula)
    this.rule = rule instanceof Rule ? rule : Rule.findByShorthand(rule)
    this.justifications = justifications.toSorted()
  }

  dependencies(proof: Proof): number[] {
    if (this.justifications.length <= 0) {
      return [this.index]
    }
    const lines = proof.lines
    const deps = [
      ...new Set(this.justifications.flatMap((i) => lines[i].dependencies(proof))),
    ].toSorted()
    if (!this.rule.resolvesSupposition) {
      return deps
    }
    return deps.filter(
      (l) =>
        !this.justifications.includes(l) || lines[l].rule.valueOf() !== Rule.SUPPOSITION.valueOf(),
    )
  }

  hasUnresolvedDependencies(proof: Proof): boolean {
    const lines = proof.lines
    const deps = this.dependencies(proof).map((i) => lines[i])
    return deps.some((l) => l.rule.valueOf() === Rule.SUPPOSITION.valueOf())
  }

  toString(): string {
    return `${this.formula} [${this.justifications}][${this.rule}]`
  }
}

export class Proof {
  public readonly premises: Line[]
  public readonly conclusion: Expression
  public readonly deductions: Line[] = []

  constructor(premises: Expression[] | Line[] | string[], conclusion: Expression | string) {
    this.premises = premises.map((premise, index) => {
      return premise instanceof Line ? premise : new Line(index, premise, Rule.ASSUMPTION)
    })
    this.conclusion = conclusion instanceof Expression ? conclusion : parse(conclusion)
  }

  /**
   * Return all lines of the proof, including premises.
   */
  get lines() {
    return this.premises.concat(this.deductions)
  }

  addDeductions(deductions: [Expression | string, Rule | string, number[] | undefined][]): Line[] {
    return deductions.map((deduction) => this.addDeduction(...deduction))
  }

  addDeduction(
    formula: Expression | string,
    rule: Rule | string,
    justifications: number[] = [],
  ): Line {
    const lines = this.lines
    const deduction = new Line(lines.length, formula, rule, justifications)
    deduction.rule.evaluate(
      deduction.formula,
      deduction.justifications.map((index) => lines[index]),
      this,
    )
    this.deductions.push(deduction)
    return deduction
  }

  clear() {
    this.deductions.length = 0
  }

  qed(): boolean {
    if (this.deductions.length <= 0) {
      return false
    }

    const lastLine = this.deductions[this.deductions.length - 1]
    return (
      this.conclusion.valueOf() === lastLine.formula.valueOf() &&
      !lastLine.hasUnresolvedDependencies(this)
    )
  }
}

/***************************
 * Rule evaluation functions
 ***************************/

function evalArrowOut(exp: Expression, justifications: Line[]) {
  const justExps = justifications.map((j) => j.formula)
  const orderedJust = [justExps, justExps.toReversed()].find(([a, b]) => {
    return a instanceof Conditional && a.antecedent.toString() === b.toString()
  })
  if (!orderedJust) {
    throw new InvalidDeductionError(
      'Justifications must include a conditional that has the other justification as its antecedent',
    )
  }

  const [mainJust] = orderedJust as [Conditional]

  if (mainJust.consequent.toString() !== exp.toString()) {
    throw new InvalidDeductionError(
      'Formula must be the consequent of the conditional justification',
    )
  }
}

function evalArrowIn(exp: Expression, justifications: Line[], proof: Proof) {
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
  const consequent = justifications[suppositionIndex ? 0 : 1]
  const dependencies = consequent.dependencies(proof)

  if (!dependencies.includes(supposition.index)) {
    throw new InvalidDeductionError(
      'Second justification must have the supposition justification as a dependency',
    )
  }

  if (exp.antecedent.toString() !== supposition.formula.toString()) {
    throw new InvalidDeductionError(
      'The antecedent of the formula must be the supposition justification',
    )
  }
  if (exp.consequent.toString() !== consequent.formula.toString()) {
    throw new InvalidDeductionError(
      'The consequent of the formula must be the second justification',
    )
  }
}

function evalBiconditionalOut(exp: Expression, [justification]: Line[]) {
  const just = justification.formula

  if (!(just instanceof Biconditional)) {
    throw new InvalidDeductionError('Justification must contain a double arrow operator')
  }
  if (!(exp instanceof Conditional)) {
    throw new InvalidDeductionError('Formula must contain an arrow operator')
  }

  const expLeft = exp.antecedent.toString()
  const expRight = exp.consequent.toString()
  const justLeft = just.antecedent.toString()
  const justRight = just.consequent.toString()
  if (
    !(expLeft === justLeft && expRight === justRight) &&
    !(expLeft === justRight && expRight === justLeft)
  ) {
    throw new InvalidDeductionError(
      'Formula must have have the same antecedent and consequent as the justification',
    )
  }
}

function evalBiconditionalIn(exp: Expression, justifications: Line[]) {
  if (!(exp instanceof Biconditional)) {
    throw new InvalidDeductionError('Formula must contain a double arrow operator')
  }

  const justExps = justifications.map((j) => j.formula)
  if (!justExps.every((e) => e instanceof Conditional)) {
    throw new InvalidDeductionError('Justifications must both contain arrow operators')
  }

  const justExpsStr = justExps.map((e) => e.toString())
  const leftRight = new Conditional(exp.antecedent, exp.consequent).toString()
  const rightLeft = new Conditional(exp.consequent, exp.antecedent).toString()

  if (!justExpsStr.includes(leftRight)) {
    throw new InvalidDeductionError(
      'Antecedent and consequent must be the antecedent and consequent of one justification',
    )
  }
  if (!justExpsStr.includes(rightLeft)) {
    throw new InvalidDeductionError(
      'Antecedent and consequent must be the consequent and antecedent of one justification',
    )
  }
}

function evalWedgeOut(exp: Expression, justifications: Line[]) {
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

  if (!justExps.every((e) => e.consequent.toString() === expStr)) {
    throw new InvalidDeductionError(
      'Both conditional justifications must contain the formula as their consequent',
    )
  }

  const orJustParts = [orJust.antecedent, orJust.consequent].map((p) => p.toString()).sort()
  const justExpLefts = justExps.map((e) => e.antecedent.toString()).sort()
  if (!orJustParts.every((val, index) => val === justExpLefts[index])) {
    throw new InvalidDeductionError(
      'Both the antecedent and the consequent of the wedge justification must be the antecedent of the conditional justifications',
    )
  }
}

function evalWedgeIn(exp: Expression, [justification]: Line[]) {
  if (!(exp instanceof Disjunction)) {
    throw new InvalidDeductionError('Formula must contain a wedge operator')
  }

  const justExp = justification.formula.toString()
  if (exp.antecedent.toString() !== justExp && exp.consequent.toString() !== justExp) {
    throw new InvalidDeductionError(
      'Formula must contain the justification as either its antecedent or consequent',
    )
  }
}

function evalAndOut(exp: Expression, [justification]: Line[]) {
  const just = justification.formula

  if (!(just instanceof Conjunction)) {
    throw new InvalidDeductionError('Justification must contain an ampersand operator')
  }

  const expStr = exp.toString()
  if (just.antecedent.toString() !== expStr && just.consequent.toString() !== expStr) {
    throw new InvalidDeductionError(
      'Formula must be either the antecedent or consequent of the justification',
    )
  }
}

function evalAndIn(exp: Expression, justifications: Line[]) {
  if (!(exp instanceof Conjunction)) {
    throw new InvalidDeductionError('Formula must contain an ampersand operator')
  }

  const expLeft = exp.antecedent.toString()
  const expRight = exp.consequent.toString()
  const justExps = justifications.map((j) => j.formula.toString())

  if (!justExps.includes(expLeft)) {
    throw new InvalidDeductionError('Formula antecedent must be one of the justifications')
  }
  if (!justExps.includes(expRight)) {
    throw new InvalidDeductionError('Formula consequent must be one of the justifications')
  }
}

function evalNegationOut(exp: Expression, justifications: Line[], proof: Proof) {
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
  if (suppositionExp.expression.toString() !== exp.toString()) {
    throw new InvalidDeductionError('Formula must be the negation of the supposition justification')
  }

  const contradictionDeps = contradiction.dependencies(proof)
  if (!contradictionDeps.includes(supposition.index)) {
    throw new InvalidDeductionError('Contradiction must contain the supposition as a dependency')
  }
}

function evalNegationIn(exp: Expression, justifications: Line[], proof: Proof) {
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
  if (exp.expression.toString() !== suppositionExp.toString()) {
    throw new InvalidDeductionError('Formula must be the negation of the supposition justification')
  }

  const contradictionDeps = contradiction.dependencies(proof)
  if (!contradictionDeps.includes(supposition.index)) {
    throw new InvalidDeductionError('Contradiction must contain the supposition as a dependency')
  }
}

function evalModusTollens(exp: Expression, justifications: Line[]) {
  if (!(exp instanceof Negation)) {
    throw new InvalidDeductionError('Formula must contain a dash operator')
  }

  const justExps = justifications.map((j) => j.formula)
  const orderedJusts = [justExps, justExps.toReversed()].find(([a, b]) => {
    return a instanceof Negation && b instanceof Conditional
  })
  if (!orderedJusts) {
    throw new InvalidDeductionError(
      'Justifications must consist of a negation formula and a conditional formula',
    )
  }

  const expInner = exp.expression.toString()
  const [negationJust, conditionalJust] = orderedJusts as [Negation, Conditional]

  if (conditionalJust.antecedent.toString() !== expInner) {
    throw new InvalidDeductionError(
      'Conditional justification must contain the negated formula as its antecedent',
    )
  }
  if (conditionalJust.consequent.toString() !== negationJust.expression.toString()) {
    throw new InvalidDeductionError(
      'Conditional justification must contain the negated negation justification as its consequent',
    )
  }
}

function evalDisjunctiveArgument(exp: Expression, justifications: Line[]) {
  const justExps = justifications.map((j) => j.formula)
  const orderedJusts = [justExps, justExps.toReversed()].find(([a, b]) => {
    if (!(b instanceof Negation)) {
      return false
    }
    const bExp = b.expression.toString()
    return (
      a instanceof Disjunction &&
      (a.antecedent.toString() === bExp || a.consequent.toString() === bExp)
    )
  })
  if (!orderedJusts) {
    throw new InvalidDeductionError(
      'Justifications must include a disjunction and a negation, and the disjunction must contain the negated negation as either its antecedent or consequent',
    )
  }

  const disjunctionJust = orderedJusts[0] as Disjunction
  const expStr = exp.toString()
  if (
    disjunctionJust.antecedent.toString() !== expStr &&
    disjunctionJust.consequent.toString() !== expStr
  ) {
    throw new InvalidDeductionError(
      'Formula must be either the antecedent or consequent of the disjunction justification',
    )
  }
}

function evalConjunctiveArgument(exp: Expression, justifications: Line[]) {
  if (!(exp instanceof Negation)) {
    throw new InvalidDeductionError('Formula must contain a dash operator')
  }

  const justExps = justifications.map((j) => j.formula)
  const orderedJusts = [justExps, justExps.toReversed()].find(([a, b]) => {
    const bStr = b.toString()
    return (
      a instanceof Negation &&
      a.expression instanceof Conjunction &&
      (a.expression.antecedent.toString() === bStr || a.expression.consequent.toString() === bStr)
    )
  })
  if (!orderedJusts) {
    throw new InvalidDeductionError(
      'Justifications must include a negated conjunction that contains the second justification as either its antecedent or consequent',
    )
  }

  const conjunctionJust = (orderedJusts[0] as Negation).expression as Conjunction
  const innerStr = exp.expression.toString()
  if (
    conjunctionJust.antecedent.toString() !== innerStr &&
    conjunctionJust.consequent.toString() !== innerStr
  ) {
    throw new InvalidDeductionError(
      'Negated formula must be either the antecedent or the consequent of the conjunction justification',
    )
  }
}

function evalChainRule(exp: Expression, justifications: Line[]) {
  if (!(exp instanceof Conditional)) {
    throw new InvalidDeductionError('Formula must contain an arrow operator')
  }

  const justExps = justifications.map((j) => j.formula)
  if (!justExps.every((e) => e instanceof Conditional)) {
    throw new InvalidDeductionError('Justifications must all contain an arrow operator')
  }

  const expLeft = exp.antecedent.toString()
  const firstJustIndex = justExps.findIndex((e) => e.antecedent.toString() === expLeft)
  if (firstJustIndex === -1) {
    throw new InvalidDeductionError('Formula must be the antecedent of one of the justifications')
  }
  const firstJust = justExps[firstJustIndex]
  const secondJust = justExps[firstJustIndex ? 0 : 1]

  if (firstJust.consequent.toString() !== secondJust.antecedent.toString()) {
    throw new InvalidDeductionError(
      'Consequent of the first justification must be the antecedent of the second justification',
    )
  }

  if (secondJust.consequent.toString() !== exp.consequent.toString()) {
    throw new InvalidDeductionError(
      'Consequent of the formula must be the consequent of the second justification',
    )
  }
}

function evalDoubleNegation(exp: Expression, [justification]: Line[]) {
  const expStr = exp.toString(true)
  const justExp = justification.formula.toString(true)
  const doubleNegation = Operator.NEGATION.symbol.repeat(2)

  if (expStr !== `${doubleNegation}${justExp}` && `${doubleNegation}${expStr}` !== justExp) {
    throw new InvalidDeductionError('Formula or justification must contain 2 dash operators')
  }
}

function evalDemorgansLaw(
  exp: Expression,
  [justification]: Line[],
  proof: Proof,
  tryReciprocal: boolean = true,
) {
  const justExp = justification.formula as Negation

  // If this rule doesn't pass, try it's reciprocal, since the rule works both
  // ways.
  const throwOrRecip = (message: string) => {
    if (tryReciprocal) {
      evalDemorgansLaw(justExp, [new Line(0, exp.toString(), Rule.ASSUMPTION)], proof, false)
    } else {
      throw new InvalidDeductionError(message)
    }
  }

  if (!(justExp instanceof Negation)) {
    throwOrRecip('Justification must contain a dash operator')
    return
  }
  const justExpInner = justExp.expression as Conjunction | Disjunction

  if (
    !(
      (exp instanceof Conjunction && justExpInner instanceof Disjunction) ||
      (exp instanceof Disjunction && justExpInner instanceof Conjunction)
    )
  ) {
    throwOrRecip(
      'Formula and justification must be a conjunction and a disjunction (or vice versa)',
    )
    return
  }

  const expT = exp as BinaryExpression

  if (
    justExpInner.antecedent instanceof Negation &&
    justExpInner.consequent instanceof Negation &&
    !(expT.antecedent instanceof Negation) &&
    !(expT.consequent instanceof Negation) &&
    justExpInner.antecedent.expression.toString() === expT.antecedent.toString() &&
    justExpInner.consequent.expression.toString() === expT.consequent.toString()
  ) {
    return
  }

  if (
    !(justExpInner.antecedent instanceof Negation) &&
    !(justExpInner.consequent instanceof Negation) &&
    expT.antecedent instanceof Negation &&
    expT.consequent instanceof Negation &&
    justExpInner.antecedent.toString() === expT.antecedent.expression.toString() &&
    justExpInner.consequent.toString() === expT.consequent.expression.toString()
  ) {
    return
  }

  return throwOrRecip('Invalid deduction')
}

function evalArrow(
  exp: Expression,
  [justification]: Line[],
  proof: Proof,
  tryReciprocal: boolean = true,
) {
  const justExp = justification.formula
  // If this rule doesn't pass, try it's reciprocal, since the rule works both
  // ways.
  const throwOrRecip = (message: string) => {
    if (tryReciprocal) {
      evalArrow(justExp, [new Line(0, exp.toString(), Rule.ASSUMPTION)], proof, false)
    } else {
      throw new InvalidDeductionError(message)
    }
  }

  const conditionalJust = (
    justExp instanceof Negation ? justExp.expression : justExp
  ) as Conditional
  if (!(conditionalJust instanceof Conditional)) {
    throwOrRecip('Justification must contain an arrow operator')
  }

  // -A ∨ B from A → B
  if (
    !(justExp instanceof Negation) &&
    !(conditionalJust.antecedent instanceof Negation) &&
    !(conditionalJust.consequent instanceof Negation) &&
    exp instanceof Disjunction &&
    exp.antecedent instanceof Negation &&
    !(exp.consequent instanceof Negation) &&
    conditionalJust.antecedent.toString() === exp.antecedent.expression.toString() &&
    conditionalJust.consequent.toString() === exp.consequent.toString()
  ) {
    return
  }

  // A ∨ B from -A → B
  if (
    !(justExp instanceof Negation) &&
    conditionalJust.antecedent instanceof Negation &&
    !(conditionalJust.consequent instanceof Negation) &&
    exp instanceof Disjunction &&
    !(exp.antecedent instanceof Negation) &&
    !(exp.consequent instanceof Negation) &&
    conditionalJust.antecedent.expression.toString() === exp.antecedent.toString() &&
    conditionalJust.consequent.toString() === exp.consequent.toString()
  ) {
    return
  }

  // -(A & -B) from A → B
  if (
    !(justExp instanceof Negation) &&
    exp instanceof Negation &&
    !(conditionalJust.antecedent instanceof Negation) &&
    !(conditionalJust.consequent instanceof Negation) &&
    exp.expression instanceof Conjunction &&
    !(exp.expression.antecedent instanceof Negation) &&
    exp.expression.consequent instanceof Negation &&
    conditionalJust.antecedent.toString() === exp.expression.antecedent.toString() &&
    conditionalJust.consequent.toString() === exp.expression.consequent.expression.toString()
  ) {
    return
  }

  // A & -B from -(A → B)
  if (
    justExp instanceof Negation &&
    !(conditionalJust.antecedent instanceof Negation) &&
    !(conditionalJust.consequent instanceof Negation) &&
    exp instanceof Conjunction &&
    !(exp.antecedent instanceof Negation) &&
    exp.consequent instanceof Negation &&
    conditionalJust.antecedent.toString() === exp.antecedent.toString() &&
    conditionalJust.consequent.toString() === exp.consequent.expression.toString()
  ) {
    return
  }

  return throwOrRecip('InvalidDeduction')
}

function evalContraposition(exp: Expression, [justification]: Line[]) {
  const justExp = justification.formula

  if (!(justExp instanceof Conditional) || !(exp instanceof Conditional)) {
    throw new InvalidDeductionError(
      'Both the formula and the justification must contain an arrow operator',
    )
  }

  // -B → -A from A → B
  if (
    !(justExp.antecedent instanceof Negation) &&
    !(justExp.consequent instanceof Negation) &&
    exp.antecedent instanceof Negation &&
    exp.consequent instanceof Negation &&
    exp.antecedent.expression.toString() === justExp.consequent.toString() &&
    exp.consequent.expression.toString() === justExp.antecedent.toString()
  ) {
    return
  }

  // B → A from -A → -B
  if (
    justExp.antecedent instanceof Negation &&
    justExp.consequent instanceof Negation &&
    !(exp.antecedent instanceof Negation) &&
    !(exp.consequent instanceof Negation) &&
    justExp.antecedent.expression.toString() === exp.consequent.toString() &&
    justExp.consequent.expression.toString() === exp.antecedent.toString()
  ) {
    return
  }

  // -B → A from -A → B
  if (
    justExp.antecedent instanceof Negation &&
    !(justExp.consequent instanceof Negation) &&
    exp.antecedent instanceof Negation &&
    !(exp.consequent instanceof Negation) &&
    justExp.antecedent.expression.toString() === exp.consequent.toString() &&
    justExp.consequent.toString() === exp.antecedent.expression.toString()
  ) {
    return
  }

  // B → -A from A → -B
  if (
    !(justExp.antecedent instanceof Negation) &&
    justExp.consequent instanceof Negation &&
    !(exp.antecedent instanceof Negation) &&
    exp.consequent instanceof Negation &&
    justExp.antecedent.toString() === exp.consequent.expression.toString() &&
    justExp.consequent.expression.toString() === exp.antecedent.toString()
  ) {
    return
  }

  throw new InvalidDeductionError('Invalid deduction')
}
