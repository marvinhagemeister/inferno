const fs = require("fs");
const path = require("path");
const bundles = require("./rollup.bundles").default;

// Shim for hack in inferno-compat package
global.Event = false;

const typings = bundles.map(b => {
  const name = b.moduleName;
  const entry = path.join("..", b.moduleEntry);

  try {
    const exports = require(entry);
		console.log(exports);
  } catch (err) {
    console.log(entry);
    console.error(err);
  }
});

