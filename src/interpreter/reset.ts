import {
  EVALUATE_CODE_STAGE
} from "./evaluate.js";
import {
  Stage,
  StageOutput
} from "./pipeline.js";
import {
  WELL_FORMED_PROGRAM_STAGE
} from "./well-formed.js";

export {
  RESET_STAGE
};

class Reset implements Stage {
  run(input: StageOutput): StageOutput {
    WELL_FORMED_PROGRAM_STAGE.reset();
    EVALUATE_CODE_STAGE.reset();
    return input;
  }
}

const RESET_STAGE = new Reset();