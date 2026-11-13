// evalMath is a function that's able to evaluates a mathematical expression and return it's output.
//
// Internally it uses the Shunting Yard algorithm. First it produces a reverse polish notation(RPN) stack.
// Example: 1 + 2 * 3 -> [1, 2, 3, *, +] which with parentheses means 1 (2 3 *) +
//
// Then it evaluates the RPN stack and returns the output.
export function evalMath(expression: string): number {
    // Stack where operators & numbers are stored in RPN.
    const rpnStack: string[] = [];
    // The working stack where new tokens are pushed.
    const workingStack: string[] = [];

    let lastToken: string | undefined;
    // Iterate over the expression.
    for (let i = 0, len = expression.length; i < len; i++) {
        const token = expression[i];

        // Skip if the token is empty or a whitespace.
        if (!token || token === ' ') {
            continue;
        }

        // Is the token a operator?
        if (operators.has(token)) {
            // '-'/'+' at the start, after an operator or after '(' is unary.
            const unary = !lastToken || operators.has(lastToken) || lastToken === '(';
            if (unary) {
                if (token === '-') {
                    workingStack.unshift('u');
                    lastToken = token;
                    continue;
                }
                if (token === '+') {
                    lastToken = token;
                    continue;
                }
            }
            const op = operators.get(token);

            // Go trough the workingstack and determine it's place in the workingStack
            while (workingStack.length) {
                const currentOp = operators.get(workingStack[0]);
                if (!currentOp) {
                    break;
                }

                // Is the current operation equal or less than the current operation?
                // Then move that operation to the rpnStack.
                if (op!.lessOrEqualThan(currentOp)) {
                    rpnStack.push(workingStack.shift()!);
                } else {
                    break;
                }
            }
            // Add the operation to the workingStack.
            workingStack.unshift(token);
        // Otherwise was the last token a operator?
        } else if (token === '(') {
            workingStack.unshift(token);
        } else if (token === ')') {
            // Close the innermost group: pop operators up to the '('.
            while (workingStack.length && workingStack[0] !== '(') {
                rpnStack.push(workingStack.shift()!);
            }
            if (workingStack[0] === '(') {
                workingStack.shift();
            }
        } else if (!lastToken || operators.has(lastToken) || lastToken === '(' || lastToken === ')') {
            rpnStack.push(token);
        // Otherwise just append the result to the last token(e.g. multiple digits numbers).
        } else {
            rpnStack[rpnStack.length - 1] += token;
        }
        // Set the last token.
        lastToken = token;
    }

    // Push the working stack on top of the rpnStack.
    rpnStack.push(...workingStack);

    // Now evaluate the rpnStack.
    const stack: number[] = [];
    for (let i = 0, len = rpnStack.length; i < len; i++) {
        const op = operators.get(rpnStack[i]);
        if (op) {
            if (rpnStack[i] === 'u') {
                // Unary minus pops only one operand.
                stack.unshift(-stack.shift()!);
                continue;
            }
            // Get the arguments of for the operation(first two in the stack).
            const args = stack.splice(0, 2);
            // Excute it, because of reverse notation we first pass second item then the first item.
            // The number stack is front-to-top (unshift), so the result must be
            // unshifted too, otherwise a nested group result ends up behind its
            // operands and later operators read the wrong pair.
            stack.unshift(op.exec(args[1], args[0]));
        } else {
            // Add the number to the stack.
            stack.unshift(parseFloat(rpnStack[i]));
        }
    }

    return stack[0];
}

// Operator class  defines a operator that can be parsed & evaluated by evalMath.
class Operator {
    private precendce: number;
    private execMethod: (left: number, right: number) => number;

    constructor(precedence: number, method: (left: number, right: number) => number) {
        this.precendce = precedence;
        this.execMethod = method;
    }

    exec(left: number, right: number): number {
        return this.execMethod(left, right);
    }

    lessOrEqualThan(op: Operator) {
        return this.precendce <= op.precendce;
    }
}

const operators: Readonly<Map<string, Operator>> = new Map([
    ['u', new Operator(3, (left: number, right: number): number => -right)], // unary minus, pops one operand
    ['+', new Operator(1, (left: number, right: number): number => left + right)],
    ['-', new Operator(1, (left: number, right: number): number => left - right)],
    ['*', new Operator(2, (left: number, right: number): number => left * right)],
    ['/', new Operator(2, (left: number, right: number): number => left / right)],
]);
