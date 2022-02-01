import {
  RTestResult,
  RValue,
  R_VOID
} from "../values/rvalue";
import {
  Stage,
  StageError,
  StageOutput,
  StageTestResult
} from "../data/stage";
import {
  isCheckNode,
  isDefnNode
} from "../ir/ast";
import {
  Environment
} from "../data/environment";
import {
  NO_SOURCE_SPAN
} from "../data/sourcespan";
import {
  Program
} from "../ir/program";
import {
  RT_MAX_CALL_STACK_SIZE_ERR
} from "../error";

export {
  EvaluateCode
};

class EvaluateCode implements Stage<Program, RValue[]> {
  private globalEnv = new Environment();
  private env = new Environment();
  private testResults: StageTestResult[] = [];

  reset() {
    this.globalEnv = new Environment();
    this.env = new Environment();
  }

  run(input: StageOutput<Program>): StageOutput<RValue[]> {
    this.testResults = [];
    try {
      return new StageOutput(this.runHelper(input.output), [], this.testResults);
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput([], [e], this.testResults);
      } else if (e instanceof Error && e.message === "too much recursion") {
        return new StageOutput(
          [],
          [
            new StageError(
              RT_MAX_CALL_STACK_SIZE_ERR,
              NO_SOURCE_SPAN
            )
          ],
          this.testResults
        );
      } else {
        throw e;
      }
    }
  }

  private runHelper(program: Program): RValue[] {
    program.defns.forEach(defn => {
      defn.eval(this.globalEnv);
      if (isDefnNode(defn)) {
        defn.used = false;
      }
    });
    const output: RValue[] = [];
    for (const node of program.nodes) {
      let result;
      if (isCheckNode(node)) {
        result = node.eval(this.globalEnv);
      } else {
        result = node.eval(this.env);
      }
      if (result instanceof RTestResult) {
        this.testResults.push(new StageTestResult(
          result.passed,
          result.msg,
          result.sourceSpan
        ));
      } else if (result !== R_VOID) {
        output.push(result);
      }
    }
    return output;
  }
}