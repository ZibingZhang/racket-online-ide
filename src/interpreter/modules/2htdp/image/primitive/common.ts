import {
  RNumber,
  RString,
  RSymbol,
  RValue,
  isRExactReal,
  isRStruct
} from "../../../../values/rvalue";
import {
  RMode
} from "../rvalue";

export {
  COLOR_NAMES,
  OUTLINE_WIDTH,
  HALF_OUTLINE_WIDTH,
  BACKGROUND_COLOR,
  TAU,
  newCanvas,
  toRgb,
  isOutlineMode,
  isValidColorName
};

const OUTLINE_WIDTH = 2;
const HALF_OUTLINE_WIDTH = OUTLINE_WIDTH / 2;
const BACKGROUND_COLOR = "white";
const TAU = 2 * Math.PI;

function newCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const element = <HTMLCanvasElement> document.createElement("canvas");
  element.width = width;
  element.height = height;
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  return [element, element.getContext("2d")!];
}

function toRgb(color: RValue, mode: RMode): string {
  let a = isRExactReal(mode) ? Number(mode.numerator) / 255 : 1;
  if (isRStruct(color)) {
    a *= Number((<RNumber>color.vals[3]).numerator) / 255;
    return `rgba(${color.vals[0].stringify()}, ${color.vals[1].stringify()}, ${color.vals[2].stringify()}, ${a})`;
  } else {
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    return `rgba(${COLOR_NAMES.get((<RString>color).val)!.join(", ")}, ${a})`;
  }
}

function isOutlineMode(mode: RMode) {
  return !isRExactReal(mode)
    && mode.val === "outline";
}

function isValidColorName(rval: RString | RSymbol): boolean {
  return COLOR_NAMES.has(rval.val.toLowerCase());
}

const COLOR_NAMES: Map<string, [number, number, number]> = new Map([
  ["aliceblue", [240, 248, 255]],
  ["antiquewhite", [250, 235, 215]],
  ["aqua", [0, 255, 255]],
  ["azure", [240, 255, 255]],
  ["beige", [245, 245, 220]],
  ["bisque", [255, 228, 196]],
  ["blanchedalmond", [255, 235, 205]],
  ["blueviolet", [138, 43, 226]],
  ["burlywood", [222, 184, 135]],
  ["cadetblue", [95, 158, 160]],
  ["chartreuse", [127, 255, 0]],
  ["chocolate", [210, 105, 30]],
  ["cornflowerblue", [100, 149, 237]],
  ["cornsilk", [255, 248, 220]],
  ["crimson", [220, 20, 60]],
  ["darkblue", [0, 0, 139]],
  ["darkcyan", [0, 139, 139]],
  ["darkgoldenrod", [184, 134, 11]],
  ["darkgray", [169, 169, 169]],
  ["darkgreen", [0, 100, 0]],
  ["darkkhaki", [189, 183, 107]],
  ["darkmagenta", [139, 0, 139]],
  ["darkolivegreen", [85, 107, 47]],
  ["darkorange", [255, 140, 0]],
  ["darkorchid", [153, 50, 204]],
  ["darkred", [139, 0, 0]],
  ["darksalmon", [233, 150, 122]],
  ["darkseagreen", [143, 188, 139]],
  ["darkslateblue", [72, 61, 139]],
  ["darkslategray", [47, 79, 79]],
  ["darkturquoise", [0, 206, 209]],
  ["darkviolet", [148, 0, 211]],
  ["deeppink", [255, 20, 147]],
  ["deepskyblue", [0, 191, 255]],
  ["dimgray", [105, 105, 105]],
  ["dodgerblue", [30, 144, 255]],
  ["floralwhite", [255, 250, 240]],
  ["forestgreen", [34, 139, 34]],
  ["fuchsia", [255, 0, 255]],
  ["gainsboro", [220, 220, 220]],
  ["ghostwhite", [248, 248, 255]],
  ["greenyellow", [173, 255, 47]],
  ["honeydew", [240, 255, 240]],
  ["hotpink", [255, 105, 180]],
  ["indianred", [205, 92, 92]],
  ["indigo", [75, 0, 130]],
  ["ivory", [255, 255, 240]],
  ["lavender", [230, 230, 250]],
  ["lavenderblush", [255, 240, 245]],
  ["lawngreen", [124, 252, 0]],
  ["lemonchiffon", [255, 250, 205]],
  ["lightblue", [173, 216, 230]],
  ["lightcoral", [240, 128, 128]],
  ["lightcyan", [224, 255, 255]],
  ["lightgoldenrodyellow", [250, 250, 210]],
  ["lightgreen", [144, 238, 144]],
  ["lightgray", [211, 211, 211]],
  ["lightpink", [255, 182, 193]],
  ["lightsalmon", [255, 160, 122]],
  ["lightseagreen", [32, 178, 170]],
  ["lightskyblue", [135, 206, 250]],
  ["lightslategray", [119, 136, 153]],
  ["lightsteelblue", [176, 196, 222]],
  ["lightyellow", [255, 255, 224]],
  ["lime", [0, 255, 0]],
  ["limegreen", [50, 205, 50]],
  ["linen", [250, 240, 230]],
  ["mediumaquamarine", [102, 205, 170]],
  ["mediumblue", [0, 0, 205]],
  ["mediumorchid", [186, 85, 211]],
  ["mediumpurple", [147, 112, 219]],
  ["mediumseagreen", [60, 179, 113]],
  ["mediumslateblue", [123, 104, 238]],
  ["mediumspringgreen", [0, 250, 154]],
  ["mediumturquoise", [72, 209, 204]],
  ["mediumvioletred", [199, 21, 133]],
  ["midnightblue", [25, 25, 112]],
  ["mintcream", [245, 255, 250]],
  ["mistyrose", [255, 228, 225]],
  ["moccasin", [255, 228, 181]],
  ["navajowhite", [255, 222, 173]],
  ["oldlace", [253, 245, 230]],
  ["olive", [128, 128, 0]],
  ["olivedrab", [107, 142, 35]],
  ["orangered", [255, 69, 0]],
  ["palegoldenrod", [238, 232, 170]],
  ["palegreen", [152, 251, 152]],
  ["paleturquoise", [175, 238, 238]],
  ["palevioletred", [219, 112, 147]],
  ["papayawhip", [255, 239, 213]],
  ["peachpuff", [255, 218, 185]],
  ["peru", [205, 133, 63]],
  ["powderblue", [176, 224, 230]],
  ["rosybrown", [188, 143, 143]],
  ["royalblue", [65, 105, 225]],
  ["saddlebrown", [139, 69, 19]],
  ["sandybrown", [244, 164, 96]],
  ["seagreen", [46, 139, 87]],
  ["seashell", [255, 245, 238]],
  ["silver", [192, 192, 192]],
  ["skyblue", [135, 206, 235]],
  ["slateblue", [106, 90, 205]],
  ["slategray", [112, 128, 144]],
  ["snow", [255, 250, 250]],
  ["springgreen", [0, 255, 127]],
  ["steelblue", [70, 130, 180]],
  ["teal", [0, 128, 128]],
  ["tomato", [255, 99, 71]],
  ["whitesmoke", [245, 245, 245]],
  ["yellowgreen", [154, 205, 50]],
  ["aquamarine", [112, 216, 144]],
  ["black", [0, 0, 0]],
  ["blue", [0, 0, 255]],
  ["blue violet", [138, 43, 226]],
  ["brown", [132, 60, 36]],
  ["cadet blue", [96, 160, 160]],
  ["coral", [255, 127, 80]],
  ["cornflower blue", [68, 64, 108]],
  ["cyan", [0, 255, 255]],
  ["dark gray", [169, 169, 169]],
  ["dark green", [0, 100, 0]],
  ["dark olive green", [85, 107, 47]],
  ["dark orchid", [153, 50, 204]],
  ["dark slate blue", [72, 61, 139]],
  ["dark slate gray", [47, 79, 79]],
  ["dark turquoise", [0, 206, 209]],
  ["dim gray", [105, 105, 105]],
  ["firebrick", [178, 34, 34]],
  ["forest green", [34, 139, 34]],
  ["gold", [255, 215, 0]],
  ["goldenrod", [218, 165, 32]],
  ["gray", [190, 190, 190]],
  ["green", [0, 255, 0]],
  ["green yellow", [173, 255, 47]],
  ["indian red", [205, 92, 92]],
  ["khaki", [240, 230, 140]],
  ["light blue", [173, 216, 230]],
  ["light gray", [211, 211, 211]],
  ["light steel blue", [176, 196, 222]],
  ["lime green", [50, 205, 50]],
  ["magenta", [255, 0, 255]],
  ["maroon", [176, 48, 96]],
  ["medium aquamarine", [102, 205, 170]],
  ["medium blue", [0, 0, 205]],
  ["medium forest green", [107, 142, 35]],
  ["mediumforestgreen", [107, 142, 35]],
  ["medium goldenrod", [234, 234, 173]],
  ["mediumgoldenrod", [234, 234, 173]],
  ["medium orchid", [186, 85, 211]],
  ["medium sea green", [60, 179, 113]],
  ["medium slate blue", [123, 104, 238]],
  ["medium spring green", [0, 250, 154]],
  ["medium turquoise", [72, 209, 204]],
  ["medium violet red", [199, 21, 133]],
  ["midnight blue", [25, 25, 112]],
  ["navy", [36, 36, 140]],
  ["orange", [255, 165, 0]],
  ["orange red", [255, 69, 0]],
  ["orchid", [218, 112, 214]],
  ["pale green", [152, 251, 152]],
  ["pink", [255, 192, 203]],
  ["plum", [221, 160, 221]],
  ["purple", [160, 32, 240]],
  ["red", [255, 0, 0]],
  ["salmon", [250, 128, 114]],
  ["sea green", [46, 139, 87]],
  ["sienna", [160, 82, 45]],
  ["sky blue", [135, 206, 235]],
  ["slate blue", [106, 90, 205]],
  ["spring green", [0, 255, 127]],
  ["steel blue", [70, 130, 180]],
  ["tan", [210, 180, 140]],
  ["thistle", [216, 191, 216]],
  ["turquoise", [64, 224, 208]],
  ["violet", [238, 130, 238]],
  ["violet red", [208, 32, 144]],
  ["violetred", [208, 32, 144]],
  ["wheat", [245, 222, 179]],
  ["white", [255, 255, 255]],
  ["yellow", [255, 255, 0]],
  ["yellow green", [154, 205, 50]]
]);
