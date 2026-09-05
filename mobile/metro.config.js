const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// NativeWind v4 + Expo SDK 52 Metro compatibility fix
// Patch metro's TerminalReporter import that nativewind/metro relies on
try {
  const metroPath = require.resolve("metro/package.json");
  const metroDir = path.dirname(metroPath);
  const terminalReporterPath = path.join(metroDir, "src/lib/TerminalReporter.js");
  const fs = require("fs");
  if (!fs.existsSync(terminalReporterPath)) {
    // Create a shim if the internal path doesn't exist
    const shimDir = path.dirname(terminalReporterPath);
    if (!fs.existsSync(shimDir)) fs.mkdirSync(shimDir, { recursive: true });
    fs.writeFileSync(
      terminalReporterPath,
      `class TerminalReporter { constructor() {} update() {} end() {} }\nmodule.exports = TerminalReporter;\n`
    );
  }
} catch (e) {
  // metro not installed yet, skip patching
}

// NativeWind Tailwind CSS integration
let finalConfig = config;
try {
  const { withNativeWind } = require("nativewind/metro");
  finalConfig = withNativeWind(config, { input: "./src/theme/globals.css" });
} catch (e) {
  console.warn("NativeWind metro plugin not available, skipping Tailwind integration:", e.message);
}

// Redirect native-only modules to web stubs when bundling for web
const nativeOnlyWebShims = {
  "react-native-maps": path.resolve(__dirname, "src/shims/react-native-maps.web.js"),
};

const originalResolveRequest = finalConfig.resolver?.resolveRequest;
finalConfig.resolver = {
  ...finalConfig.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (platform === "web" && nativeOnlyWebShims[moduleName]) {
      return {
        filePath: nativeOnlyWebShims[moduleName],
        type: "sourceFile",
      };
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = finalConfig;
