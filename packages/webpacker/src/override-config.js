const { config } = require("@rails/webpacker");
const { GenerateSW, InjectManifest } = require("workbox-webpack-plugin");

const overrideSassRule = (modifyConfig) => {
  const sassRule = modifyConfig.module.rules.find(
    (rule) => rule.test.toString() === "/\\.(scss|sass)(\\.erb)?$/i"
  );
  if (!sassRule) {
    return modifyConfig;
  }

  const sassLoader = sassRule.use.find((use) => {
    return (typeof use === "object") && use.loader.match(/sass-loader/);
  });
  if (!sassLoader) {
    return modifyConfig;
  }

  const imports = config.stylesheet_imports;
  if (!imports) {
    return modifyConfig;
  }

  // Add the extra importer to the sass-loader to load the import statements for
  // Decidim modules.
  sassLoader.options.sassOptions.importer = [
    (url) => {
      const matches = url.match(/^!decidim-style-([^[]+)\[([^\]]+)\]$/);
      if (!matches) {
        return null;
      }

      const type = matches[1];
      const group = matches[2];
      if (!imports[type] || !imports[type][group]) {
        // If the group is not defined, return an empty configuration because
        // otherwise the importer would continue finding the asset through
        // paths which obviously fails.
        return { contents: "" };
      }

      const statements = imports[type][group].map((style) => `@import "${style}";`);

      return { contents: statements.join("\n") };
    }
  ];

  return modifyConfig;
}

const addWorkboxPlugin = (modifyConfig) => {
//   console.log(`
//   ${"=".repeat(100)}

// // ${JSON.stringify(config, null, 2)}
// ${config.source_path}/service-worker.js

//   ${"=".repeat(100)}
//   `);

  const plugin = new InjectManifest({
    swSrc: "../decidim-core/app/packs/service-worker.js"
  })

  modifyConfig.plugins.push(plugin)

  return modifyConfig
}

// Since all modifiers are functions, we can use a reduce clause to apply all them
module.exports = (originalConfig) => [overrideSassRule, addWorkboxPlugin].reduce((acc, modifier) => modifier(acc), originalConfig)