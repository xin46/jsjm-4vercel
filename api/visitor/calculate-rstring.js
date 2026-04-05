const _generate = require('@babel/generator');
const generator = _generate.default;
const t = require('@babel/types');

/**
 * "sh".split("").reverse().join("") -> "hs"
 */
function calculateRString(path) {
  if (path.key !== 'object') {
    return;
  }
  let root = path;
  let count = 6;
  while (root.parentPath && count) {
    if (
      root.parentPath.isMemberExpression() ||
      root.parentPath.isCallExpression()
    ) {
      root = root.parentPath;
      --count;
    } else {
      break;
    }
  }
  if (count) {
    return;
  }
  const code = generator(root.node).code;
  try {
    const ret = eval(code);
    root.replaceWith(t.stringLiteral(ret));
  } catch {
    //
  }
}

module.exports = {
  StringLiteral: calculateRString,
};
