/* eslint-disable @typescript-eslint/no-explicit-any */
export {
  prettyPrint
};

// https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-521460510
function prettyPrint(any: any) {
  console.log(
    JSON.stringify(
      any,
      (_, value) =>
        typeof value === "bigint"
          ? value.toString()
          : value /* return everything else unchanged */,
      2
    )
  );
}
