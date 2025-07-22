import { Formula as LibFormula } from 'propositional'
import { Expression, BinaryExpression, UnaryExpression } from 'propositional/lib/syntax/ast'
import { toString as formulaToString } from 'propositional/lib/transform/toString'

export class InvalidDeductionError extends Error {}

export class Operator {
  static all: Operator[] = []

  static readonly CONDITIONAL = new Operator('→', 'arrow', '=>', '⇒')
  static readonly BICONDITIONAL = new Operator('↔', 'double arrow', '<=>', '⇔')
  static readonly DISJUNCTION = new Operator('∨', 'wedge', '|')
  static readonly CONJUNCTION = new Operator('&', 'ampersand', null, '∧')
  static readonly NEGATION = new Operator('-', 'dash', '!', '¬', false)

  constructor(
    public readonly symbol: string,
    public readonly label: string,
    private readonly _libChar: string | null = null,
    private readonly _prettyLibChar: string | null = null,
    public readonly isBinary: boolean = true,
  ) {
    Operator.all.push(this)
  }

  private get libChar(): string {
    return this._libChar || this.symbol
  }

  private get prettyLibChar(): string {
    return this._prettyLibChar || this.symbol
  }

  toString(): string {
    return this.symbol
  }

  public static findBySymbol(symbol: string): Operator {
    const found = Operator.all.find(
      (operator) =>
        operator.symbol === symbol || (operator['libChar'] && operator['libChar'] === symbol),
    )
    if (!found) {
      throw new Error('Operator not found')
    }
    return found
  }
}

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
    public readonly clearsSupposition: boolean = false,
  ) {
    Rule.all.push(this)
  }

  evaluate(formula: Formula, justifications: Line[], proof: Proof) {
    if (justifications.length !== this.requiredJustifications) {
      throw new InvalidDeductionError(
        `Rule requires ${this.requiredJustifications} justification${this.requiredJustifications === 1 ? '' : 's'}`,
      )
    }
    this.evalFunc(formula.ast, justifications, proof)
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

export class Formula {
  public readonly ast: Expression
  _text: string | null = null

  constructor(text: string) {
    try {
      this.ast = new LibFormula(Formula.normalizeForParsing(text)).ast
    } catch (error) {
      const message = error instanceof Error ? error.message : (error as string).toString()
      throw new Error(Formula.normalize(message))
    }
  }

  get text() {
    if (!this._text) {
      this._text = Formula.normalize(formulaToString(this.ast, true), true)
    }
    return this._text
  }

  toString(): string {
    return this.text
  }

  valueOf(): string {
    return this.text
  }

  static normalize(text: string, fromPretty: boolean = false): string {
    let str = Operator.all
      .toReversed()
      .filter((o: Operator) => o['libChar'])
      .reduce((t: string, operator: Operator) => {
        return t.replaceAll(operator[fromPretty ? 'prettyLibChar' : 'libChar'], operator.symbol)
      }, text)
    if (str.charAt(0) === '(' && str.slice(-1) === ')') {
      str = str.substring(1, str.length - 1)
    }
    return str.trim()
  }

  private static normalizeForParsing(text: string): string {
    return Operator.all
      .toReversed()
      .filter((o: Operator) => o['libChar'])
      .reduce(
        (t: string, operator: Operator) => t.replaceAll(operator.symbol, operator['libChar']),
        text,
      )
  }
}

export class Line {
  public readonly formula: Formula
  public readonly rule: Rule

  constructor(
    public readonly index: number,
    formula: Formula | string,
    rule: Rule | string,
    public readonly justifications: number[] = [],
  ) {
    this.formula = formula instanceof Formula ? formula : new Formula(formula)
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
    return this.rule.clearsSupposition
      ? deps.filter(
          (l) =>
            !this.justifications.includes(l) ||
            lines[l].rule.valueOf() !== Rule.SUPPOSITION.valueOf(),
        )
      : deps
  }

  toString(): string {
    return `${this.formula} [${this.justifications}][${this.rule}]`
  }
}

export class Proof {
  public readonly assumptions: Line[]
  public readonly conclusion: Formula
  public readonly deductions: Line[] = []

  constructor(assumptions: Formula[] | Line[] | string[], conclusion: Formula | string) {
    this.assumptions = assumptions.map((assumption, index) => {
      return assumption instanceof Line ? assumption : new Line(index, assumption, Rule.ASSUMPTION)
    })
    this.conclusion = conclusion instanceof Formula ? conclusion : new Formula(conclusion)
  }

  /**
   * Return all lines of the proof, including assumptions.
   */
  get lines() {
    return this.assumptions.concat(this.deductions)
  }

  addDeduction(
    formula: string | Formula,
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
    if (this.conclusion.valueOf() !== lastLine.formula.valueOf()) {
      return false
    }

    const lines = this.lines
    const lastLineDependencies = lastLine.dependencies(this).map((i) => lines[i])
    return lastLineDependencies.every((l) => l.rule.valueOf() === Rule.ASSUMPTION.valueOf())
  }
}

/***************************
 * Rule evaluation functions
 ***************************/

function evalArrowOut(exp: Expression, justifications: Line[]) {
  const justExps = justifications.map((j) => j.formula.ast)
  const orderedJust = [justExps, justExps.toReversed()].find(([a, b]) => {
    return a instanceof BinaryExpression && formulaToString(a.left) === formulaToString(b)
  })
  if (!orderedJust) {
    throw new InvalidDeductionError('First justification must include the second as its antecedent')
  }

  const [mainJust] = orderedJust

  if (!isConditional(mainJust)) {
    throw new InvalidDeductionError('First justification must contain an arrow operator')
  }

  if (formulaToString(mainJust.right) !== formulaToString(exp)) {
    throw new InvalidDeductionError(
      'Formula must be the consequent of the conditional justification',
    )
  }
}

function evalArrowIn(exp: Expression, justifications: Line[], proof: Proof) {
  if (!isConditional(exp)) {
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

  if (formulaToString(exp.left) !== formulaToString(supposition.formula.ast)) {
    throw new InvalidDeductionError(
      'The antecedent of the formula must be the supposition justification',
    )
  }
  if (formulaToString(exp.right) !== formulaToString(consequent.formula.ast)) {
    throw new InvalidDeductionError(
      'The consequent of the formula must be the second justification',
    )
  }
}

function evalBiconditionalOut(exp: Expression, [justification]: Line[]) {
  const just = justification.formula.ast

  if (!isBiconditional(just)) {
    throw new InvalidDeductionError('Justification must contain a double arrow operator')
  }
  if (!isConditional(exp)) {
    throw new InvalidDeductionError('Formula must contain an arrow operator')
  }

  const expLeft = formulaToString(exp.left)
  const expRight = formulaToString(exp.right)
  const justLeft = formulaToString(just.left)
  const justRight = formulaToString(just.right)
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
  if (!isBiconditional(exp)) {
    throw new InvalidDeductionError('Formula must contain a double arrow operator')
  }

  const justExps = justifications.map((j) => j.formula.ast)
  if (!justExps.every((e) => isConditional(e))) {
    throw new InvalidDeductionError('Justifications must both contain arrow operators')
  }

  const justExpsStr = justExps.map((e) => formulaToString(e))
  const expLeft = formulaToString(exp.left)
  const expRight = formulaToString(exp.right)

  if (!justExpsStr.includes(`(${expLeft}${Operator.CONDITIONAL['libChar']}${expRight})`)) {
    throw new InvalidDeductionError(
      'Antecedent and consequent must be the antecedent and consequent of one justification',
    )
  }
  if (!justExpsStr.includes(`(${expRight}${Operator.CONDITIONAL['libChar']}${expLeft})`)) {
    throw new InvalidDeductionError(
      'Antecedent and consequent must be the consequent and antecedent of one justification',
    )
  }
}

function evalWedgeOut(exp: Expression, justifications: Line[]) {
  const justExps = justifications.map((j) => j.formula.ast)
  const orJustIndex = justExps.findIndex((e) => isDisjunction(e))
  if (orJustIndex === -1) {
    throw new InvalidDeductionError('One justification must contain a wedge operator')
  }
  const [orJust] = justExps.splice(orJustIndex, 1)
  if (!isDisjunction(orJust)) {
    throw new InvalidDeductionError('One justification must contain a wedge operator')
  }

  if (!justExps.every((e) => isConditional(e))) {
    throw new InvalidDeductionError('Other two justifications must contain arrow operators')
  }

  const expStr = formulaToString(exp)

  if (!justExps.every((e) => formulaToString(e.right) === expStr)) {
    throw new InvalidDeductionError(
      'Both conditional justifications must contain the formula as their consequent',
    )
  }

  const orJustParts = [orJust.left, orJust.right].map((p) => formulaToString(p)).sort()
  const justExpLefts = justExps.map((e) => formulaToString(e.left)).sort()
  if (!orJustParts.every((val, index) => val === justExpLefts[index])) {
    throw new InvalidDeductionError(
      'Both the antecedent and the consequent of the wedge justification must be the antecedent of the conditional justifications',
    )
  }
}

function evalWedgeIn(exp: Expression, [justification]: Line[]) {
  if (!isDisjunction(exp)) {
    throw new InvalidDeductionError('Formula must contain a wedge operator')
  }

  const justExp = formulaToString(justification.formula.ast)
  if (formulaToString(exp.left) !== justExp && formulaToString(exp.right) !== justExp) {
    throw new InvalidDeductionError(
      'Formula must contain the justification as either its antecedent or consequent',
    )
  }
}

function evalAndOut(exp: Expression, [justification]: Line[]) {
  const just = justification.formula.ast

  if (!isConjunction(just)) {
    throw new InvalidDeductionError('Justification must contain an ampersand operator')
  }

  const expStr = formulaToString(exp)
  if (formulaToString(just.left) !== expStr && formulaToString(just.right) !== expStr) {
    throw new InvalidDeductionError(
      'Formula must be either the antecedent or consequent of the justification',
    )
  }
}

function evalAndIn(exp: Expression, justifications: Line[]) {
  if (!isConjunction(exp)) {
    throw new InvalidDeductionError('Formula must contain an ampersand operator')
  }

  const expLeft = formulaToString(exp.left)
  const expRight = formulaToString(exp.right)
  const justExps = justifications.map((j) => formulaToString(j.formula.ast))

  if (!justExps.includes(expLeft)) {
    throw new InvalidDeductionError('Formula antecedent must be one of the justifications')
  }
  if (!justExps.includes(expRight)) {
    throw new InvalidDeductionError('Formula consequent must be one of the justifications')
  }
}

function evalNegationOut(exp: Expression, justifications: Line[], proof: Proof) {
  const orderedJusts = [justifications, justifications.toReversed()].find(([a, b]) => {
    return a.rule.valueOf() === Rule.SUPPOSITION.valueOf() && isContradiction(b.formula.ast)
  })
  if (!orderedJusts) {
    throw new InvalidDeductionError('Justifications must include a supposition and a contradiction')
  }

  const [supposition, contradiction] = orderedJusts

  const suppositionExp = supposition.formula.ast
  if (!isNegation(suppositionExp)) {
    throw new InvalidDeductionError('The supposition justification must contain a dash operator')
  }
  if (formulaToString(suppositionExp.inner) !== formulaToString(exp)) {
    throw new InvalidDeductionError('Formula must be the negation of the supposition justification')
  }

  const contradictionDeps = contradiction.dependencies(proof)
  if (!contradictionDeps.includes(supposition.index)) {
    throw new InvalidDeductionError('Contradiction must contain the supposition as a dependency')
  }
}

function evalNegationIn(exp: Expression, justifications: Line[], proof: Proof) {
  if (!isNegation(exp)) {
    throw new InvalidDeductionError('Formula must contain a dash operator')
  }

  const orderedJusts = [justifications, justifications.toReversed()].find(([a, b]) => {
    return a.rule.valueOf() === Rule.SUPPOSITION.valueOf() && isContradiction(b.formula.ast)
  })
  if (!orderedJusts) {
    throw new InvalidDeductionError('Justifications must include a supposition and a contradiction')
  }

  const [supposition, contradiction] = orderedJusts

  const suppositionExp = supposition.formula.ast
  if (formulaToString(exp.inner) !== formulaToString(suppositionExp)) {
    throw new InvalidDeductionError('Formula must be the negation of the supposition justification')
  }

  const contradictionDeps = contradiction.dependencies(proof)
  if (!contradictionDeps.includes(supposition.index)) {
    throw new InvalidDeductionError('Contradiction must contain the supposition as a dependency')
  }
}

function evalModusTollens(exp: Expression, justifications: Line[]) {
  if (!isNegation(exp)) {
    throw new InvalidDeductionError('Formula must contain a dash operator')
  }

  const justExps = justifications.map((j) => j.formula.ast)
  const orderedJusts = [justExps, justExps.toReversed()].find(([a, b]) => {
    return isNegation(a) && isConditional(b)
  })
  if (!orderedJusts) {
    throw new InvalidDeductionError(
      'Justifications must consist of a negation formula and a conditional formula',
    )
  }

  const expInner = formulaToString(exp.inner)
  const [negationJust, conditionalJust] = orderedJusts as [UnaryExpression, BinaryExpression]

  if (formulaToString(conditionalJust.left) !== expInner) {
    throw new InvalidDeductionError(
      'Conditional justification must contain the negated formula as its antecedent',
    )
  }
  if (formulaToString(conditionalJust.right) !== formulaToString(negationJust.inner)) {
    throw new InvalidDeductionError(
      'Conditional justification must contain the negated negation justification as its consequent',
    )
  }
}

function evalDisjunctiveArgument(exp: Expression, justifications: Line[]) {
  const justExps = justifications.map((j) => j.formula.ast)
  const orderedJusts = [justExps, justExps.toReversed()].find(([a, b]) => {
    if (!isNegation(b)) {
      return false
    }
    const bExp = formulaToString(b.inner)
    return (
      isDisjunction(a) && (formulaToString(a.left) === bExp || formulaToString(a.right) === bExp)
    )
  })
  if (!orderedJusts) {
    throw new InvalidDeductionError(
      'Justifications must include a disjunction and a negation, and the disjunction must contain the negated negation as either its antecedent or consequent',
    )
  }

  const disjunctionJust = orderedJusts[0] as BinaryExpression
  const expStr = formulaToString(exp)
  if (
    formulaToString(disjunctionJust.left) !== expStr &&
    formulaToString(disjunctionJust.right) !== expStr
  ) {
    throw new InvalidDeductionError(
      'Formula must be either the antecedent or consequent of the disjunction justification',
    )
  }
}

function evalConjunctiveArgument(exp: Expression, justifications: Line[]) {
  if (!isNegation(exp)) {
    throw new InvalidDeductionError('Formula must contain a dash operator')
  }

  const justExps = justifications.map((j) => j.formula.ast)
  const orderedJusts = [justExps, justExps.toReversed()].find(([a, b]) => {
    const bStr = formulaToString(b)
    return (
      isNegation(a) &&
      isConjunction(a.inner) &&
      (formulaToString(a.inner.left) === bStr || formulaToString(a.inner.right) === bStr)
    )
  })
  if (!orderedJusts) {
    throw new InvalidDeductionError(
      'Justifications must include a negated conjunction that contains the second justification as either its antecedent or consequent',
    )
  }

  const conjunctionJust = (orderedJusts[0] as UnaryExpression).inner as BinaryExpression
  const innerStr = formulaToString(exp.inner)
  if (
    formulaToString(conjunctionJust.left) !== innerStr &&
    formulaToString(conjunctionJust.right) !== innerStr
  ) {
    throw new InvalidDeductionError(
      'Negated formula must be either the antecedent or the consequent of the conjunction justification',
    )
  }
}

function evalChainRule(exp: Expression, justifications: Line[]) {
  if (!isConditional(exp)) {
    throw new InvalidDeductionError('Formula must contain an arrow operator')
  }

  const justExps = justifications.map((j) => j.formula.ast)
  if (!justExps.every((e) => isConditional(e))) {
    throw new InvalidDeductionError('Justifications must all contain an arrow operator')
  }

  const expLeft = formulaToString(exp.left)
  const firstJustIndex = justExps.findIndex((e) => formulaToString(e.left) === expLeft)
  if (firstJustIndex === -1) {
    throw new InvalidDeductionError('Formula must be the antecedent of one of the justifications')
  }
  const firstJust = justExps[firstJustIndex]
  const secondJust = justExps[firstJustIndex ? 0 : 1]

  if (formulaToString(firstJust.right) !== formulaToString(secondJust.left)) {
    throw new InvalidDeductionError(
      'Consequent of the first justification must be the antecedent of the second justification',
    )
  }

  if (formulaToString(secondJust.right) !== formulaToString(exp.right)) {
    throw new InvalidDeductionError(
      'Consequent of the formula must be the consequent of the second justification',
    )
  }
}

function evalDoubleNegation(exp: Expression, [justification]: Line[]) {
  const expStr = formulaToString(exp)
  const justExp = formulaToString(justification.formula.ast)
  const doubleNegation = Operator.NEGATION['libChar'].repeat(2)

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
  const justExp = justification.formula.ast as UnaryExpression

  // If this rule doesn't pass, try it's reciprocal, since the rule works both
  // ways.
  const throwOrRecip = (message: string) => {
    if (tryReciprocal) {
      evalDemorgansLaw(justExp, [new Line(0, formulaToString(exp), Rule.ASSUMPTION)], proof, false)
    } else {
      throw new InvalidDeductionError(message)
    }
  }

  if (!isNegation(justExp)) {
    throwOrRecip('Justification must contain a dash operator')
    return
  }
  const justExpInner = justExp.inner as BinaryExpression

  if (
    !(
      (isConjunction(exp) && isDisjunction(justExpInner)) ||
      (isDisjunction(exp) && isConjunction(justExpInner))
    )
  ) {
    throwOrRecip(
      'Formula and justification must be a conjunction and a disjunction (or vice versa)',
    )
    return
  }

  const expT = exp as BinaryExpression

  if (
    isNegation(justExpInner.left) &&
    isNegation(justExpInner.right) &&
    !isNegation(expT.left) &&
    !isNegation(expT.right) &&
    formulaToString(justExpInner.left.inner) === formulaToString(expT.left) &&
    formulaToString(justExpInner.right.inner) === formulaToString(expT.right)
  ) {
    return
  }

  if (
    !isNegation(justExpInner.left) &&
    !isNegation(justExpInner.right) &&
    isNegation(expT.left) &&
    isNegation(expT.right) &&
    formulaToString(justExpInner.left) === formulaToString(expT.left.inner) &&
    formulaToString(justExpInner.right) === formulaToString(expT.right.inner)
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
  const justExp = justification.formula.ast
  // If this rule doesn't pass, try it's reciprocal, since the rule works both
  // ways.
  const throwOrRecip = (message: string) => {
    if (tryReciprocal) {
      evalArrow(justExp, [new Line(0, formulaToString(exp), Rule.ASSUMPTION)], proof, false)
    } else {
      throw new InvalidDeductionError(message)
    }
  }

  const conditionalJust = (isNegation(justExp) ? justExp.inner : justExp) as BinaryExpression
  if (!isConditional(conditionalJust)) {
    throwOrRecip('Justification must contain an arrow operator')
  }

  // -A ∨ B from A → B
  if (
    !isNegation(justExp) &&
    !isNegation(conditionalJust.left) &&
    !isNegation(conditionalJust.right) &&
    isDisjunction(exp) &&
    isNegation(exp.left) &&
    !isNegation(exp.right) &&
    formulaToString(conditionalJust.left) === formulaToString(exp.left.inner) &&
    formulaToString(conditionalJust.right) === formulaToString(exp.right)
  ) {
    return
  }

  // A ∨ B from -A → B
  if (
    !isNegation(justExp) &&
    isNegation(conditionalJust.left) &&
    !isNegation(conditionalJust.right) &&
    isDisjunction(exp) &&
    !isNegation(exp.left) &&
    !isNegation(exp.right) &&
    formulaToString(conditionalJust.left.inner) === formulaToString(exp.left) &&
    formulaToString(conditionalJust.right) === formulaToString(exp.right)
  ) {
    return
  }

  // -(A & -B) from A → B
  if (
    !isNegation(justExp) &&
    isNegation(exp) &&
    !isNegation(conditionalJust.left) &&
    !isNegation(conditionalJust.right) &&
    isConjunction(exp.inner) &&
    !isNegation(exp.inner.left) &&
    isNegation(exp.inner.right) &&
    formulaToString(conditionalJust.left) === formulaToString(exp.inner.left) &&
    formulaToString(conditionalJust.right) === formulaToString(exp.inner.right.inner)
  ) {
    return
  }

  // A & -B from -(A → B)
  if (
    isNegation(justExp) &&
    !isNegation(conditionalJust.left) &&
    !isNegation(conditionalJust.right) &&
    isConjunction(exp) &&
    !isNegation(exp.left) &&
    isNegation(exp.right) &&
    formulaToString(conditionalJust.left) === formulaToString(exp.left) &&
    formulaToString(conditionalJust.right) === formulaToString(exp.right.inner)
  ) {
    return
  }

  return throwOrRecip('InvalidDeduction')
}

function evalContraposition(exp: Expression, [justification]: Line[]) {
  const justExp = justification.formula.ast

  if (!isConditional(justExp) || !isConditional(exp)) {
    throw new InvalidDeductionError(
      'Both the formula and the justification must contain an arrow operator',
    )
  }

  // -B → -A from A → B
  if (
    !isNegation(justExp.left) &&
    !isNegation(justExp.right) &&
    isNegation(exp.left) &&
    isNegation(exp.right) &&
    formulaToString(exp.left.inner) === formulaToString(justExp.right) &&
    formulaToString(exp.right.inner) === formulaToString(justExp.left)
  ) {
    return
  }

  // B → A from -A → -B
  if (
    isNegation(justExp.left) &&
    isNegation(justExp.right) &&
    !isNegation(exp.left) &&
    !isNegation(exp.right) &&
    formulaToString(justExp.left.inner) === formulaToString(exp.right) &&
    formulaToString(justExp.right.inner) === formulaToString(exp.left)
  ) {
    return
  }

  // -B → A from -A → B
  if (
    isNegation(justExp.left) &&
    !isNegation(justExp.right) &&
    isNegation(exp.left) &&
    !isNegation(exp.right) &&
    formulaToString(justExp.left.inner) === formulaToString(exp.right) &&
    formulaToString(justExp.right) === formulaToString(exp.left.inner)
  ) {
    return
  }

  // B → -A from A → -B
  if (
    !isNegation(justExp.left) &&
    isNegation(justExp.right) &&
    !isNegation(exp.left) &&
    isNegation(exp.right) &&
    formulaToString(justExp.left) === formulaToString(exp.right.inner) &&
    formulaToString(justExp.right.inner) === formulaToString(exp.left)
  ) {
    return
  }

  throw new InvalidDeductionError('Invalid deduction')
}

function isNegation(exp: Expression): exp is UnaryExpression {
  return exp instanceof UnaryExpression && exp.operator.lexeme === Operator.NEGATION['libChar']
}

function isConditional(exp: Expression): exp is BinaryExpression {
  return exp instanceof BinaryExpression && exp.operator.lexeme === Operator.CONDITIONAL['libChar']
}

function isBiconditional(exp: Expression): exp is BinaryExpression {
  return (
    exp instanceof BinaryExpression && exp.operator.lexeme === Operator.BICONDITIONAL['libChar']
  )
}

function isConjunction(exp: Expression): exp is BinaryExpression {
  return exp instanceof BinaryExpression && exp.operator.lexeme === Operator.CONJUNCTION['libChar']
}

function isDisjunction(exp: Expression): exp is BinaryExpression {
  return exp instanceof BinaryExpression && exp.operator.lexeme === Operator.DISJUNCTION['libChar']
}

function isContradiction(exp: Expression): exp is BinaryExpression {
  if (!isConjunction(exp)) {
    return false
  }
  const pairs = [
    [exp.left, exp.right],
    [exp.right, exp.left],
  ]
  return !!pairs.find(([a, b]) => isNegation(a) && formulaToString(a.inner) === formulaToString(b))
}
