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
  abstract toString(): string
  abstract toString(includeParens: boolean): string

  valueOf(): string {
    return this.toString()
  }
}

export abstract class OperatorExpression extends Expression {
  static readonly operator: Operator

  get operator(): Operator {
    return (this.constructor as typeof OperatorExpression).operator
  }
}

export abstract class BinaryExpression extends OperatorExpression {
  constructor(
    public readonly left: Expression,
    public readonly right: Expression,
  ) {
    super()
  }

  toString(includeParens: boolean = false): string {
    const str = [this.left.toString(true), this.operator.symbol, this.right.toString(true)].join(
      ' ',
    )
    return includeParens ? `(${str})` : str
  }
}

export abstract class UnaryExpression extends OperatorExpression {
  constructor(public readonly inner: Expression) {
    super()
  }

  toString(): string {
    return `${this.operator.symbol}${this.inner.toString(true)}`
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
      [this.left, this.right],
      [this.right, this.left],
    ]
    return !!pairs.find(([a, b]) => a instanceof Negation && a.inner.toString() === b.toString())
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
