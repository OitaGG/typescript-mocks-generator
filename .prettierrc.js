const importGroups = {
  root: '@root',
  lib: '@lib',
  templates: '@templates',
  internal: '.{1,2}/(?!lib)[^.]',
};

const getDirsForNegativeLookAhead = () => Object.values(importGroups).join('|');

const regExpForImportOrder = {
  libsAdditional: `^(?!${getDirsForNegativeLookAhead()}|./.*).*$`,
  root: `^(${importGroups.root}).*$`,
  lib: `^(${importGroups.lib}).*$`,
  templates: `^(${importGroups.templates}).*$`,
  internal: `^(${importGroups.internal}).*$`,
};

module.exports = {
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'auto',
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
  importOrder: [...Object.values(regExpForImportOrder)],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  quoteProps: 'consistent',
  printWidth: 100,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
};
