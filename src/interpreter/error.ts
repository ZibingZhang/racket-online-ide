import {
  SExpr,
  isAtomSExpr,
  isListSExpr
} from "./sexpr";
import {
  TokenType
} from "./token";
import {
  ordinalSuffixOf
} from "./utils";

export {
  CE_ACTUAL_VALUE_NOT_EXPECTED_ERR,
  CE_CANT_COMPARE_INEXACT_ERR,
  CE_EXPECTED_AN_ERROR_ERR,
  CE_EXPECTED_ERROR_MESSAGE_ERR,
  CE_NOT_IN_RANGE_ERR,
  CE_NOT_MEMBER_OF_ERR,
  CE_NOT_SATISFIED_ERR,
  CE_NOT_WITHIN_ERR,
  CE_SATISFIED_NOT_BOOLEAN_ERR,
  CE_TEST_NOT_TOP_LEVEL_ERR,
  CE_WRONG_ERROR_ERR,
  CN_ALL_QUESTION_RESULTS_FALSE_ERR,
  CN_ELSE_NOT_LAST_CLAUSE_ERR,
  CN_EXPECTED_TWO_PART_CLAUSE_ERR,
  DF_DUPLICATE_VARIABLE_ERR,
  DF_EXPECTED_AT_LEAST_ONE_PARAM_ERR,
  DF_EXPECTED_EXPR_ERR,
  DF_EXPECTED_FUNCTION_BODY_ERR,
  DF_EXPECTED_FUNCTION_NAME_ERR,
  DF_EXPECTED_VAR_OR_FUN_NAME_ERR,
  DF_EXPECTED_VARIABLE_ERR,
  DF_TOO_MANY_EXPRS_ERR,
  DF_TOO_MANY_FUNCTION_BODIES_ERR,
  DF_PREVIOUSLY_DEFINED_NAME_ERR,
  DS_DUPLICATE_FIELD_NAME,
  DS_EXPECTED_FIELD_NAME_ERR,
  DS_EXPECTED_FIELD_NAMES_ERR,
  DS_EXPECTED_STRUCT_NAME_ERR,
  DS_EXTRA_PARTS_ERR,
  EL_EXPECTED_FINISHED_EXPR_ERR,
  ES_NOT_IN_COND_ERR,
  FA_ARITY_ERR,
  FA_COMPLEX_NUMBERS_UNSUPPORTED_ERR,
  FA_DIV_BY_ZERO_ERR,
  FA_MIN_ARITY_ERR,
  FA_NTH_WRONG_TYPE_ERR,
  FA_WRONG_TYPE_ERR,
  FC_EXPECTED_FUNCTION_ERR,
  IF_EXPECTED_THREE_PARTS_ERR,
  QU_EXPECTED_EXPRESSION,
  QU_EXPECTED_POST_QUOTE_ERR,
  RS_BAD_SYNTAX_ERR,
  RS_DIV_BY_ZERO_ERR,
  RS_EXPECTED_CLOSING_PAREN_ERR,
  RS_EXPECTED_COMMENTED_OUT_ELEMENT_ERR,
  RS_EXPECTED_CORRECT_CLOSING_PAREN_ERR,
  RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR,
  RS_EXPECTED_ELEMENT_FOR_QUOTING_IMMEDIATELY_ERR,
  RS_ILLEGAL_USE_OF_DOT_ERR,
  RS_NESTED_QUOTES_UNSUPPORTED_ERR,
  RS_QUASI_QUOTE_UNSUPPORTED_ERR,
  RS_UNCLOSED_STRING_ERR,
  RS_UNEXPECTED_ERR,
  RT_MAX_CALL_STACK_SIZE_ERR,
  SC_UNDEFINED_FUNCTION_ERR,
  SC_UNDEFINED_VARIABLE_ERR,
  SC_USED_BEFORE_DEFINITION_ERR,
  SX_EXPECTED_OPEN_PAREN_ERR,
  SX_NOT_TOP_LEVEL_DEFN_ERR,
  WF_EXPECTED_FUNCTION_CALL_ERR,
  WF_QUESTION_NOT_BOOL_ERR,
  WF_STRUCTURE_TYPE_ERR
};

function foundStr(found: SExpr | string): string {
  if (typeof found === "string") {
    return found.toString();
  } else {
    if (isAtomSExpr(found)) {
      switch (found.token.type) {
        case TokenType.TRUE:
        case TokenType.FALSE:
          return "boolean";
        case TokenType.INTEGER:
        case TokenType.RATIONAL:
        case TokenType.DECIMAL:
          return "number";
        case TokenType.STRING:
          return "string";
        case TokenType.KEYWORD:
          return "keyword";
        case TokenType.PLACEHOLDER:
          return "template";
        default:
          throw "something else";
      }
    } else {
      return "part";
    }
  }
}

const CE_ACTUAL_VALUE_NOT_EXPECTED_ERR = (actual: string, expected: string) => {
  return `Actual value ${actual} differs from ${expected}, the expected value.`;
};
const CE_CANT_COMPARE_INEXACT_ERR = (name: string, actual: string, expected: string) => {
  return `${name} cannot compare inexact numbers. Try (check-within ${actual} ${expected} range).`;
};
const CE_EXPECTED_AN_ERROR_ERR = (value: string) => {
  return `check-error expected an error, but instead received the value ${value}`;
};
const CE_EXPECTED_ERROR_MESSAGE_ERR = (value: string) => {
  return `check-error: expects a string (the expected error message) for the second argument. Given ${value}`;
};
const CE_NOT_IN_RANGE_ERR = (actual: string, lowerBound: string, upperBound: string) => {
  return `Actual value ${actual} is not between ${lowerBound} and ${upperBound}, inclusive.`;
};
const CE_NOT_MEMBER_OF_ERR = (actual: string, against: string[]) => {
  return `Actual value ${actual} differs from all given members in ${against.join(" ")}`;
};
const CE_NOT_SATISFIED_ERR = (name: string, actual: string) => {
  return `Actual value ${actual} does not satisfy ${name}.`;
};
const CE_NOT_WITHIN_ERR = (actual: string, expected: string, within: string) => {
  return `Actual value ${actual} is not within ${within} of expected value ${expected}`;
};
const CE_SATISFIED_NOT_BOOLEAN_ERR = (name: string, value: string) => {
  return `check-satisfied encountered an error instead of the expected kind of value, "${name}".\n  :: ${name} [as predicate in check-satisfied]: is expected to return a boolean, but it returned ${value}`;
};
const CE_TEST_NOT_TOP_LEVEL_ERR = (name: string) => {
  return `${name}: found a test that is not at the top level`;
};
const CE_WRONG_ERROR_ERR = (expected: string, actual: string) => {
  return `check-error encountered the following error instead of the expected ${expected}\n  :: ${actual}`;
};

const CN_ALL_QUESTION_RESULTS_FALSE_ERR = "cond: all question results were false";
const CN_ELSE_NOT_LAST_CLAUSE_ERR = "cond: found an else clause that isn't the last clause in its cond expression";
const CN_EXPECTED_TWO_PART_CLAUSE_ERR = (found?: SExpr) => {
  if (found) {
    if (isListSExpr(found)) {
      switch (found.subExprs.length) {
        case 0:
          return "cond: expected a clause with a question and an answer, but found an empty part";
        case 1:
          return "cond: expected a clause with a question and an answer, but found a clause with only one part";
        default:
          return `cond: expected a clause with a question and an answer, but found a clause with ${found.subExprs.length} parts`;
      }
    } else {
      return `cond: expected a clause with a question and an answer, but found a ${foundStr(found)}`;
    }
  } else {
    return "cond: expected a clause after cond, but nothing's there";
  }
};

const DF_DUPLICATE_VARIABLE_ERR = (name: string) => {
  return `define: found a variable that is used more than once: ${name}`;
};
const DF_EXPECTED_AT_LEAST_ONE_PARAM_ERR = "define: expected at least one variable after the function name, but found none";
const DF_EXPECTED_EXPR_ERR = (name: string) => {
  return `define: expected an expression after the variable name ${name}, but nothing's there`;
};
const DF_EXPECTED_FUNCTION_BODY_ERR = "define: expected an expression for the function body, but nothing's there";
const DF_EXPECTED_FUNCTION_NAME_ERR = (found?: SExpr) => {
  return `define: expected the name of the function, but ${found ? `found a ${foundStr(found)}` : "nothing's there" }`;
};
const DF_EXPECTED_VAR_OR_FUN_NAME_ERR = (found?: SExpr) => {
  return `define: expected a variable name, or a function name and its variables (in parentheses), but ${found ? `found a ${foundStr(found)}` : "nothing's there"}`;
};
const DF_EXPECTED_VARIABLE_ERR = (found: SExpr) => {
  return `define: expected a variable, but found a ${foundStr(found)}`;
};
const DF_TOO_MANY_EXPRS_ERR = (name: string, parts: number) => {
  return `define: expected only one expression after the variable name ${name}, but found ${parts} extra part${parts > 1 ? "s" : ""}`;
};
const DF_TOO_MANY_FUNCTION_BODIES_ERR = (parts: number) => {
  return `define: expected only one expression for the function body, but found ${parts} extra part${parts > 1 ? "s" : ""}`;
};
const DF_PREVIOUSLY_DEFINED_NAME_ERR = (name: string) => {
  return `${name}: this name was defined previously and cannot be re-defined`;
};

const DS_DUPLICATE_FIELD_NAME = (name: string) => {
  return `define-struct: found a field name that is used more than once: ${name}`;
};
const DS_EXPECTED_FIELD_NAME_ERR = (found: SExpr) => {
  return `define-struct: expected a field name, but found a ${foundStr(found)}`;
};
const DS_EXPECTED_FIELD_NAMES_ERR = (found?: SExpr) => {
  return `define-struct: expected at least one field name (in parentheses) after the structure name, but ${found ? `found a ${foundStr(found)}` : "nothing's there"}`;
};
const DS_EXPECTED_STRUCT_NAME_ERR = (found?: SExpr) => {
  return `define-struct: expected the structure name after define-struct, but ${found ? `found a ${foundStr(found)}` : "nothing's there"}`;
};
const DS_EXTRA_PARTS_ERR = (parts: number) => {
  return `define-struct: expected nothing after the field names, but found ${parts} extra part${parts > 1 ? "s" : ""}`;
};

const EL_EXPECTED_FINISHED_EXPR_ERR = (name: string) => {
  return `${name}: expected a finished expression, but found a template`;
};

const ES_NOT_IN_COND_ERR = "else: not allowed here, because this is not a question in a clause";

const FA_ARITY_ERR = (name: string, expected: number, actual: number) => {
  if (expected < actual) {
    if (expected === 0) {
      return `${name}: expects no argument, but found ${actual}`;
    } else {
      return `${name}: expects only ${expected} argument${expected > 1 ? "s" : ""}, but found ${actual}`;
    }
  } else {
    return `${name}: expects ${expected} argument${expected > 1 ? "s" : ""}, but found ${actual === 0 ? "none" : `only ${actual}`}`;
  }
};
const FA_COMPLEX_NUMBERS_UNSUPPORTED_ERR = (name: string) => {
  return `${name}: complex numbers are not supported`;
};
const FA_DIV_BY_ZERO_ERR = "/: division by zero";
const FA_MIN_ARITY_ERR = (name: string, expected: number, actual: number) => {
  return `${name}: expects at least ${expected} argument${expected > 1 ? "s" : ""}, but found ${actual >= 2 ? actual : actual === 1 ? "only 1" : "none"}`;
};
const FA_NTH_WRONG_TYPE_ERR = (name: string, expected: string, n: number, actual: string) => {
  return `${name}: expects a${expected.match(/^[aeiou]/) ? "n" : ""} ${expected} as ${ordinalSuffixOf(n + 1)} argument, given ${actual}`;
};
const FA_WRONG_TYPE_ERR = (name: string, expected: string, actual: string) => {
  return `${name}: expects a${expected.match(/^[aeiou]/) ? "n" : ""} ${expected}, given ${actual}`;
};

const FC_EXPECTED_FUNCTION_ERR = (found?: SExpr | string) => {
  return `function call: expected a function after the open parenthesis, but ${found ? `found a ${foundStr(found)}`: "nothing's there"}`;
};

const IF_EXPECTED_THREE_PARTS_ERR = (parts: number) => {
  if (parts === 0) {
    return "if: expected a question and two answers, but nothing's there";
  } else if (parts === 1) {
    return "if: expected a question and two answers, but found only 1 part";
  } else if (parts === 2) {
    return "if: expected a question and two answers, but found only 2 parts";
  } else {
    return `if: expected a question and two answers, but found ${parts} parts`;
  }
};

const QU_EXPECTED_EXPRESSION = "quote: expected an expression after quote, but nothing's there";
const QU_EXPECTED_POST_QUOTE_ERR = (found: SExpr) => {
  return `quote: expected the name of a symbol or () after the quote, but found a ${foundStr(found)}`;
};

const RS_BAD_SYNTAX_ERR = (syntax: string) => {
  return `read-syntax: bad syntax \`${syntax}\``;
};
const RS_DIV_BY_ZERO_ERR = (number: string) => {
  return `read-syntax: division by zero in \`${number}\``;
};
const RS_EXPECTED_CLOSING_PAREN_ERR = (opening: string) => {
  if (opening === "(") {
    return "read-syntax: expected a `)` to close preceding `(`";
  } else if (opening === "[") {
    return "read-syntax: expected a `]` to close preceding `[`";
  } else {
    return "read-syntax: expected a `}` to close preceding `{`";
  }
};
const RS_EXPECTED_COMMENTED_OUT_ELEMENT_ERR = "read-syntax: expected a commented-out element for `#;`, but found end-of-file";
const RS_EXPECTED_CORRECT_CLOSING_PAREN_ERR = (opening: string | null, found: string): string => {
  if (opening === "(") {
    return `read-syntax: expected \`)\` to close preceding \`(\`, found instead \`${found}\``;
  } else if (opening === "[") {
    return `read-syntax: expected \`]\` to close preceding \`[\`, found instead \`${found}\``;
  } else {
    return `read-syntax: expected \`}\` to close preceding \`{\`, found instead \`${found}\``;
  }
};
const RS_EXPECTED_ELEMENT_FOR_QUOTING_ERR = (found: string) => {
  return `read-syntax: expected an element for quoting "'", but found ${found}`;
};
const RS_EXPECTED_ELEMENT_FOR_QUOTING_IMMEDIATELY_ERR = "read-syntax: expected an element for quoting immediately after quote";
const RS_ILLEGAL_USE_OF_DOT_ERR = "read-syntax: illegal use of `.`";
const RS_NESTED_QUOTES_UNSUPPORTED_ERR = "read-syntax: nested quotes are not supported";
const RS_QUASI_QUOTE_UNSUPPORTED_ERR = "read-syntax: quasiquotes are not supported";
const RS_UNCLOSED_STRING_ERR = "read-syntax: expected a closing `\"`";
const RS_UNEXPECTED_ERR = (found: string) => {
  return `read-syntax: unexpected \`${found}\``;
};

const RT_MAX_CALL_STACK_SIZE_ERR = "runtime: maximum call stack size exceeded";

const SC_UNDEFINED_FUNCTION_ERR = (name: string) => {
  return `${name}: this function is undefined`;
};
const SC_UNDEFINED_VARIABLE_ERR = (name: string) => {
  return `${name}: this variable is not defined`;
};
const SC_USED_BEFORE_DEFINITION_ERR = (name: string) => {
  return `${name} is used here before its definition`;
};

const SX_EXPECTED_OPEN_PAREN_ERR = (name: string) => {
  return `${name}: expected an open parenthesis before ${name}, but found none`;
};
const SX_NOT_TOP_LEVEL_DEFN_ERR = (name: string) => {
  return `${name}: found a definition that is not at the top level`;
};

const WF_EXPECTED_FUNCTION_CALL_ERR = (name: string) => {
  return `${name}: expected a function call, but there is no open parenthesis before this function`;
};
const WF_QUESTION_NOT_BOOL_ERR = (name: string, found: string) => {
  return `${name}: question result is not true or false: ${found}`;
};
const WF_STRUCTURE_TYPE_ERR = (name: string) => {
  return `${name}: structure type; do you mean make-${name}`;
};
