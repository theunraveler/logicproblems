export class Operator {
  static all: Operator[] = []

  static readonly CONDITIONAL = new Operator('→', 'arrow')
  static readonly BICONDITIONAL = new Operator('↔', 'double arrow')
  static readonly DISJUNCTION = new Operator('∨', 'wedge')
  static readonly CONJUNCTION = new Operator('&', 'ampersand')
  static readonly NEGATION = new Operator('-', 'dash', false)

  constructor(
    public readonly symbol: string,
    public readonly label: string,
    public readonly isBinary: boolean = true,
  ) {
    Operator.all.push(this)
  }

  toString(): string {
    return this.symbol
  }

  public static findBySymbol(symbol: string): Operator {
    const found = Operator.all.find((operator) => operator.symbol === symbol)
    if (!found) {
      throw new Error('Operator not found')
    }
    return found
  }
}

export abstract class Expression {
  abstract toString() : string;
  abstract toString(includeParens: boolean) : string;

  valueOf(): string {
    return this.toString()
  }
}

abstract class OperatorExpression extends Expression {
  static readonly operator: Operator

  get operator(): Operator {
    return (this.constructor as typeof OperatorExpression).operator
  }
}

export abstract class BinaryExpression extends OperatorExpression {
  constructor(
    public readonly antecedent: Expression,
    public readonly consequent: Expression,
  ) {
    super()
  }

  toString(includeParens: boolean = false): string {
    const str = [
      this.antecedent.toString(true),
      this.operator.symbol,
      this.consequent.toString(true),
    ].join(' ')
    return includeParens ? `(${str})` : str
  }
}

export abstract class UnaryExpression extends OperatorExpression {
  constructor(public readonly expression: Expression) {
    super()
  }

  toString(): string {
    return `${this.operator.symbol}${this.expression.toString(true)}`
  }
}

export class Biconditional extends BinaryExpression {
  static readonly operator: Operator = Operator.BICONDITIONAL
}

export class Conditional extends BinaryExpression {
  static readonly operator: Operator = Operator.CONDITIONAL
}

export class Conjunction extends BinaryExpression {
  static readonly operator: Operator = Operator.CONJUNCTION

  isContradiction(): boolean {
    const pairs = [
      [this.antecedent, this.consequent],
      [this.consequent, this.antecedent],
    ]
    return !!pairs.find(
      ([a, b]) => a instanceof Negation && a.expression.toString() === b.toString(),
    )
  }
}

export class Disjunction extends BinaryExpression {
  static readonly operator: Operator = Operator.DISJUNCTION
}

export class Negation extends UnaryExpression {
  static readonly operator: Operator = Operator.NEGATION
}

export class Atom extends Expression {
  constructor(public readonly text: string) {
    super()
  }

  toString(): string {
    return this.text
  }
}
