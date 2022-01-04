import {
  Environment
} from "./environment.js";
import {
  FA_DIV_BY_ZERO_ERR
} from "./error.js";
import {
  StageError
} from "./pipeline.js";
import {
  RMath,
  RNumber,
  RPrimFun,
  RValue
} from "./rvalue.js";
import { SourceSpan } from "./sourcespan.js";

export {
  RDivide,
  RMinus,
  RMultiply,
  RPlus
};

class RDivide extends RPrimFun {
  call(_: Environment, args: RValue[], sourceSpan: SourceSpan): RValue {
    return args.slice(1).reduce(
      (prev, curr) => {
        if ((<RNumber>curr).numerator === 0n) {
          throw new StageError(
            FA_DIV_BY_ZERO_ERR, sourceSpan
          );
        }
        return RMath.div(<RNumber>prev, <RNumber>curr)
      },
      args[0]
    );
  }
}

class RMinus extends RPrimFun {
  call(_: Environment, args: RValue[]): RValue {
    if (args.length === 1) {
      return RMath.negate(<RNumber>args[0]);
    }
    return args.slice(1).reduce(
      (prev, curr) => RMath.sub(<RNumber>prev, <RNumber>curr), args[0]
    );
  }
}

class RMultiply extends RPrimFun {
  call(_: Environment, args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.mul(<RNumber>prev, <RNumber>curr), new RNumber(1n, 1n)
    );
  }
}

class RPlus extends RPrimFun {
  call(_: Environment, args: RValue[]): RValue {
    return args.reduce(
      (prev, curr) => RMath.add(<RNumber>prev, <RNumber>curr), new RNumber(0n, 1n)
    );
  }
}