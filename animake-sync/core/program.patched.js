"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var program_exports = {};
__export(program_exports, {
  program: () => import_utilsBundle2.program
});
module.exports = __toCommonJS(program_exports);
var import_fs = __toESM(require("fs"));
var import_os = __toESM(require("os"));
var import_path = __toESM(require("path"));
var playwright = __toESM(require("../.."));
var import_driver = require("./driver");
var import_server = require("../server");
var import_utils = require("../utils");
var import_traceViewer = require("../server/trace/viewer/traceViewer");
var import_utils2 = require("../utils");
var import_ascii = require("../server/utils/ascii");
var import_utilsBundle = require("../utilsBundle");
var import_utilsBundle2 = require("../utilsBundle");
const packageJSON = require("../../package.json");
import_utilsBundle.program.version("Version " + (process.env.PW_CLI_DISPLAY_VERSION || packageJSON.version)).name(buildBasePlaywrightCLICommand(process.env.PW_LANG_NAME));
import_utilsBundle.program.command("mark-docker-image [dockerImageNameTemplate]", { hidden: true }).description("mark docker image").allowUnknownOption(true).action(function(dockerImageNameTemplate) {
  (0, import_utils2.assert)(dockerImageNameTemplate, "dockerImageNameTemplate is required");
  (0, import_server.writeDockerVersion)(dockerImageNameTemplate).catch(logErrorAndExit);
});
commandWithOpenOptions("open [url]", "open page in browser specified via -b, --browser", []).action(function(url, options) {
  open(options, url).catch(logErrorAndExit);
}).addHelpText("afterAll", `
Examples:

  $ open
  $ open -b webkit https://example.com`);
commandWithOpenOptions(
  "codegen [url]",
  "open page and generate code for user actions",
  [
    ["-o, --output <file name>", "saves the generated script to a file"],
    ["--target <language>", `language to generate, one of javascript, playwright-test, python, python-async, python-pytest, csharp, csharp-mstest, csharp-nunit, java, java-junit`, codegenId()],
    ["--test-id-attribute <attributeName>", "use the specified attribute to generate data test ID selectors"],
    ["--after <dependencies...>", "run these test files before recording to continue from their final state"]
  ]
).action(async function(url, options) {
  await codegen(options, url);
}).addHelpText("afterAll", `
Examples:

  $ codegen
  $ codegen --target=python
  $ codegen -b webkit https://example.com
  $ codegen --after test-login.spec.ts http://localhost:3000/dashboard`);
function suggestedBrowsersToInstall() {
  return import_server.registry.executables().filter((e) => e.installType !== "none" && e.type !== "tool").map((e) => e.name).join(", ");
}
function defaultBrowsersToInstall(options) {
  let executables = import_server.registry.defaultExecutables();
  if (options.noShell)
    executables = executables.filter((e) => e.name !== "chromium-headless-shell");
  if (options.onlyShell)
    executables = executables.filter((e) => e.name !== "chromium");
  return executables;
}
function checkBrowsersToInstall(args, options) {
  if (options.noShell && options.onlyShell)
    throw new Error(`Only one of --no-shell and --only-shell can be specified`);
  const faultyArguments = [];
  const executables = [];
  const handleArgument = (arg) => {
    const executable = import_server.registry.findExecutable(arg);
    if (!executable || executable.installType === "none")
      faultyArguments.push(arg);
    else
      executables.push(executable);
    if (executable?.browserName === "chromium")
      executables.push(import_server.registry.findExecutable("ffmpeg"));
  };
  for (const arg of args) {
    if (arg === "chromium") {
      if (!options.onlyShell)
        handleArgument("chromium");
      if (!options.noShell)
        handleArgument("chromium-headless-shell");
    } else {
      handleArgument(arg);
    }
  }
  if (process.platform === "win32")
    executables.push(import_server.registry.findExecutable("winldd"));
  if (faultyArguments.length)
    throw new Error(`Invalid installation targets: ${faultyArguments.map((name) => `'${name}'`).join(", ")}. Expecting one of: ${suggestedBrowsersToInstall()}`);
  return executables;
}
function printInstalledBrowsers(browsers2) {
  const browserPaths = /* @__PURE__ */ new Set();
  for (const browser of browsers2)
    browserPaths.add(browser.browserPath);
  console.log(`  Browsers:`);
  for (const browserPath of [...browserPaths].sort())
    console.log(`    ${browserPath}`);
  console.log(`  References:`);
  const references = /* @__PURE__ */ new Set();
  for (const browser of browsers2)
    references.add(browser.referenceDir);
  for (const reference of [...references].sort())
    console.log(`    ${reference}`);
}
function printGroupedByPlaywrightVersion(browsers2) {
  const dirToVersion = /* @__PURE__ */ new Map();
  for (const browser of browsers2) {
    if (dirToVersion.has(browser.referenceDir))
      continue;
    const packageJSON2 = require(import_path.default.join(browser.referenceDir, "package.json"));
    const version = packageJSON2.version;
    dirToVersion.set(browser.referenceDir, version);
  }
  const groupedByPlaywrightMinorVersion = /* @__PURE__ */ new Map();
  for (const browser of browsers2) {
    const version = dirToVersion.get(browser.referenceDir);
    let entries = groupedByPlaywrightMinorVersion.get(version);
    if (!entries) {
      entries = [];
      groupedByPlaywrightMinorVersion.set(version, entries);
    }
    entries.push(browser);
  }
  const sortedVersions = [...groupedByPlaywrightMinorVersion.keys()].sort((a, b) => {
    const aComponents = a.split(".");
    const bComponents = b.split(".");
    const aMajor = parseInt(aComponents[0], 10);
    const bMajor = parseInt(bComponents[0], 10);
    if (aMajor !== bMajor)
      return aMajor - bMajor;
    const aMinor = parseInt(aComponents[1], 10);
    const bMinor = parseInt(bComponents[1], 10);
    if (aMinor !== bMinor)
      return aMinor - bMinor;
    return aComponents.slice(2).join(".").localeCompare(bComponents.slice(2).join("."));
  });
  for (const version of sortedVersions) {
    console.log(`
Playwright version: ${version}`);
    printInstalledBrowsers(groupedByPlaywrightMinorVersion.get(version));
  }
}
import_utilsBundle.program.command("install [browser...]").description("ensure browsers necessary for this version of Playwright are installed").option("--with-deps", "install system dependencies for browsers").option("--dry-run", "do not execute installation, only print information").option("--list", "prints list of browsers from all playwright installations").option("--force", "force reinstall of stable browser channels").option("--only-shell", "only install headless shell when installing chromium").option("--no-shell", "do not install chromium headless shell").action(async function(args, options) {
  if (options.shell === false)
    options.noShell = true;
  if ((0, import_utils.isLikelyNpxGlobal)()) {
    console.error((0, import_ascii.wrapInASCIIBox)([
      `WARNING: It looks like you are running 'npx playwright install' without first`,
      `installing your project's dependencies.`,
      ``,
      `To avoid unexpected behavior, please install your dependencies first, and`,
      `then run Playwright's install command:`,
      ``,
      `    npm install`,
      `    npx playwright install`,
      ``,
      `If your project does not yet depend on Playwright, first install the`,
      `applicable npm package (most commonly @playwright/test), and`,
      `then run Playwright's install command to download the browsers:`,
      ``,
      `    npm install @playwright/test`,
      `    npx playwright install`,
      ``
    ].join("\n"), 1));
  }
  try {
    const hasNoArguments = !args.length;
    const executables = hasNoArguments ? defaultBrowsersToInstall(options) : checkBrowsersToInstall(args, options);
    if (options.withDeps)
      await import_server.registry.installDeps(executables, !!options.dryRun);
    if (options.dryRun && options.list)
      throw new Error(`Only one of --dry-run and --list can be specified`);
    if (options.dryRun) {
      for (const executable of executables) {
        const version = executable.browserVersion ? `version ` + executable.browserVersion : "";
        console.log(`browser: ${executable.name}${version ? " " + version : ""}`);
        console.log(`  Install location:    ${executable.directory ?? "<system>"}`);
        if (executable.downloadURLs?.length) {
          const [url, ...fallbacks] = executable.downloadURLs;
          console.log(`  Download url:        ${url}`);
          for (let i = 0; i < fallbacks.length; ++i)
            console.log(`  Download fallback ${i + 1}: ${fallbacks[i]}`);
        }
        console.log(``);
      }
    } else if (options.list) {
      const browsers2 = await import_server.registry.listInstalledBrowsers();
      printGroupedByPlaywrightVersion(browsers2);
    } else {
      const forceReinstall = hasNoArguments ? false : !!options.force;
      await import_server.registry.install(executables, forceReinstall);
      await import_server.registry.validateHostRequirementsForExecutablesIfNeeded(executables, process.env.PW_LANG_NAME || "javascript").catch((e) => {
        e.name = "Playwright Host validation warning";
        console.error(e);
      });
    }
  } catch (e) {
    console.log(`Failed to install browsers
${e}`);
    (0, import_utils.gracefullyProcessExitDoNotHang)(1);
  }
}).addHelpText("afterAll", `

Examples:
  - $ install
    Install default browsers.

  - $ install chrome firefox
    Install custom browsers, supports ${suggestedBrowsersToInstall()}.`);
import_utilsBundle.program.command("uninstall").description("Removes browsers used by this installation of Playwright from the system (chromium, firefox, webkit, ffmpeg). This does not include branded channels.").option("--all", "Removes all browsers used by any Playwright installation from the system.").action(async (options) => {
  delete process.env.PLAYWRIGHT_SKIP_BROWSER_GC;
  await import_server.registry.uninstall(!!options.all).then(({ numberOfBrowsersLeft }) => {
    if (!options.all && numberOfBrowsersLeft > 0) {
      console.log("Successfully uninstalled Playwright browsers for the current Playwright installation.");
      console.log(`There are still ${numberOfBrowsersLeft} browsers left, used by other Playwright installations.
To uninstall Playwright browsers for all installations, re-run with --all flag.`);
    }
  }).catch(logErrorAndExit);
});
import_utilsBundle.program.command("install-deps [browser...]").description("install dependencies necessary to run browsers (will ask for sudo permissions)").option("--dry-run", "Do not execute installation commands, only print them").action(async function(args, options) {
  try {
    if (!args.length)
      await import_server.registry.installDeps(defaultBrowsersToInstall({}), !!options.dryRun);
    else
      await import_server.registry.installDeps(checkBrowsersToInstall(args, {}), !!options.dryRun);
  } catch (e) {
    console.log(`Failed to install browser dependencies
${e}`);
    (0, import_utils.gracefullyProcessExitDoNotHang)(1);
  }
}).addHelpText("afterAll", `
Examples:
  - $ install-deps
    Install dependencies for default browsers.

  - $ install-deps chrome firefox
    Install dependencies for specific browsers, supports ${suggestedBrowsersToInstall()}.`);
const browsers = [
  { alias: "cr", name: "Chromium", type: "chromium" },
  { alias: "ff", name: "Firefox", type: "firefox" },
  { alias: "wk", name: "WebKit", type: "webkit" }
];
for (const { alias, name, type } of browsers) {
  commandWithOpenOptions(`${alias} [url]`, `open page in ${name}`, []).action(function(url, options) {
    open({ ...options, browser: type }, url).catch(logErrorAndExit);
  }).addHelpText("afterAll", `
Examples:

  $ ${alias} https://example.com`);
}
commandWithOpenOptions(
  "screenshot <url> <filename>",
  "capture a page screenshot",
  [
    ["--wait-for-selector <selector>", "wait for selector before taking a screenshot"],
    ["--wait-for-timeout <timeout>", "wait for timeout in milliseconds before taking a screenshot"],
    ["--full-page", "whether to take a full page screenshot (entire scrollable area)"]
  ]
).action(function(url, filename, command) {
  screenshot(command, command, url, filename).catch(logErrorAndExit);
}).addHelpText("afterAll", `
Examples:

  $ screenshot -b webkit https://example.com example.png`);
commandWithOpenOptions(
  "pdf <url> <filename>",
  "save page as pdf",
  [
    ["--paper-format <format>", "paper format: Letter, Legal, Tabloid, Ledger, A0, A1, A2, A3, A4, A5, A6"],
    ["--wait-for-selector <selector>", "wait for given selector before saving as pdf"],
    ["--wait-for-timeout <timeout>", "wait for given timeout in milliseconds before saving as pdf"]
  ]
).action(function(url, filename, options) {
  pdf(options, options, url, filename).catch(logErrorAndExit);
}).addHelpText("afterAll", `
Examples:

  $ pdf https://example.com example.pdf`);
import_utilsBundle.program.command("run-driver", { hidden: true }).action(function(options) {
  (0, import_driver.runDriver)();
});
import_utilsBundle.program.command("run-server").option("--port <port>", "Server port").option("--host <host>", "Server host").option("--path <path>", "Endpoint Path", "/").option("--max-clients <maxClients>", "Maximum clients").option("--mode <mode>", 'Server mode, either "default" or "extension"').action(function(options) {
  (0, import_driver.runServer)({
    port: options.port ? +options.port : void 0,
    host: options.host,
    path: options.path,
    maxConnections: options.maxClients ? +options.maxClients : Infinity,
    extension: options.mode === "extension" || !!process.env.PW_EXTENSION_MODE
  }).catch(logErrorAndExit);
});
import_utilsBundle.program.command("print-api-json", { hidden: true }).action(function(options) {
  (0, import_driver.printApiJson)();
});
import_utilsBundle.program.command("launch-server", { hidden: true }).requiredOption("--browser <browserName>", 'Browser name, one of "chromium", "firefox" or "webkit"').option("--config <path-to-config-file>", "JSON file with launchServer options").action(function(options) {
  (0, import_driver.launchBrowserServer)(options.browser, options.config);
});
import_utilsBundle.program.command("show-trace [trace...]").option("-b, --browser <browserType>", "browser to use, one of cr, chromium, ff, firefox, wk, webkit", "chromium").option("-h, --host <host>", "Host to serve trace on; specifying this option opens trace in a browser tab").option("-p, --port <port>", "Port to serve trace on, 0 for any free port; specifying this option opens trace in a browser tab").option("--stdin", "Accept trace URLs over stdin to update the viewer").description("show trace viewer").action(function(traces, options) {
  if (options.browser === "cr")
    options.browser = "chromium";
  if (options.browser === "ff")
    options.browser = "firefox";
  if (options.browser === "wk")
    options.browser = "webkit";
  const openOptions = {
    host: options.host,
    port: +options.port,
    isServer: !!options.stdin
  };
  if (options.port !== void 0 || options.host !== void 0)
    (0, import_traceViewer.runTraceInBrowser)(traces, openOptions).catch(logErrorAndExit);
  else
    (0, import_traceViewer.runTraceViewerApp)(traces, options.browser, openOptions, true).catch(logErrorAndExit);
}).addHelpText("afterAll", `
Examples:

  $ show-trace https://example.com/trace.zip`);
async function launchContext(options, extraOptions) {
  validateOptions(options);
  const browserType = lookupBrowserType(options);
  const launchOptions = extraOptions;
  if (options.channel)
    launchOptions.channel = options.channel;
  launchOptions.handleSIGINT = false;
  const contextOptions = (
    // Copy the device descriptor since we have to compare and modify the options.
    options.device ? { ...playwright.devices[options.device] } : {}
  );
  if (!extraOptions.headless)
    contextOptions.deviceScaleFactor = import_os.default.platform() === "darwin" ? 2 : 1;
  if (browserType.name() === "webkit" && process.platform === "linux") {
    delete contextOptions.hasTouch;
    delete contextOptions.isMobile;
  }
  if (contextOptions.isMobile && browserType.name() === "firefox")
    contextOptions.isMobile = void 0;
  if (options.blockServiceWorkers)
    contextOptions.serviceWorkers = "block";
  if (options.proxyServer) {
    launchOptions.proxy = {
      server: options.proxyServer
    };
    if (options.proxyBypass)
      launchOptions.proxy.bypass = options.proxyBypass;
  }
  if (options.viewportSize) {
    try {
      const [width, height] = options.viewportSize.split(",").map((n) => +n);
      if (isNaN(width) || isNaN(height))
        throw new Error("bad values");
      contextOptions.viewport = { width, height };
    } catch (e) {
      throw new Error('Invalid viewport size format: use "width,height", for example --viewport-size="800,600"');
    }
  }
  if (options.geolocation) {
    try {
      const [latitude, longitude] = options.geolocation.split(",").map((n) => parseFloat(n.trim()));
      contextOptions.geolocation = {
        latitude,
        longitude
      };
    } catch (e) {
      throw new Error('Invalid geolocation format, should be "lat,long". For example --geolocation="37.819722,-122.478611"');
    }
    contextOptions.permissions = ["geolocation"];
  }
  if (options.userAgent)
    contextOptions.userAgent = options.userAgent;
  if (options.lang)
    contextOptions.locale = options.lang;
  if (options.colorScheme)
    contextOptions.colorScheme = options.colorScheme;
  if (options.timezone)
    contextOptions.timezoneId = options.timezone;
  if (options.loadStorage)
    contextOptions.storageState = options.loadStorage;
  if (options.ignoreHttpsErrors)
    contextOptions.ignoreHTTPSErrors = true;
  if (options.saveHar) {
    contextOptions.recordHar = { path: import_path.default.resolve(process.cwd(), options.saveHar), mode: "minimal" };
    if (options.saveHarGlob)
      contextOptions.recordHar.urlFilter = options.saveHarGlob;
    contextOptions.serviceWorkers = "block";
  }
  let browser;
  let context;
  if (options.userDataDir) {
    context = await browserType.launchPersistentContext(options.userDataDir, { ...launchOptions, ...contextOptions });
    browser = context.browser();
  } else {
    browser = await browserType.launch(launchOptions);
    context = await browser.newContext(contextOptions);
  }
  let closingBrowser = false;
  async function closeBrowser() {
    if (closingBrowser)
      return;
    closingBrowser = true;
    if (options.saveStorage)
      await context.storageState({ path: options.saveStorage }).catch((e) => null);
    if (options.saveHar)
      await context.close();
    await browser.close();
  }
  context.on("page", (page) => {
    page.on("dialog", () => {
    });
    page.on("close", () => {
      const hasPage = browser.contexts().some((context2) => context2.pages().length > 0);
      if (hasPage)
        return;
      closeBrowser().catch(() => {
      });
    });
  });
  process.on("SIGINT", async () => {
    await closeBrowser();
    (0, import_utils.gracefullyProcessExitDoNotHang)(130);
  });
  const timeout = options.timeout ? parseInt(options.timeout, 10) : 0;
  context.setDefaultTimeout(timeout);
  context.setDefaultNavigationTimeout(timeout);
  delete launchOptions.headless;
  delete launchOptions.executablePath;
  delete launchOptions.handleSIGINT;
  delete contextOptions.deviceScaleFactor;
  return { browser, browserName: browserType.name(), context, contextOptions, launchOptions, closeBrowser };
}
async function openPage(context, url) {
  let page = context.pages()[0];
  if (!page)
    page = await context.newPage();
  if (url) {
    if (import_fs.default.existsSync(url))
      url = "file://" + import_path.default.resolve(url);
    else if (!url.startsWith("http") && !url.startsWith("file://") && !url.startsWith("about:") && !url.startsWith("data:"))
      url = "http://" + url;
    await page.goto(url);
  }
  return page;
}
async function open(options, url) {
  const { context } = await launchContext(options, { headless: !!process.env.PWTEST_CLI_HEADLESS, executablePath: process.env.PWTEST_CLI_EXECUTABLE_PATH });
  
  await openPage(context, url);
  
  
}
async function codegen(options, url) {
  const { target: language, output: outputFile, testIdAttribute: testIdAttributeName, after: dependencies } = options;
  const tracesDir = import_path.default.join(import_os.default.tmpdir(), `playwright-recorder-trace-${Date.now()}`);
  const { context, browser, launchOptions, contextOptions, closeBrowser } = await launchContext(options, {
    headless: !!process.env.PWTEST_CLI_HEADLESS,
    executablePath: process.env.PWTEST_CLI_EXECUTABLE_PATH,
    tracesDir
  });
  
  // ANIMAKE INJECTION START
  console.log('� Animake: Injecting enhanced keypress emulation...');
  
  try {
    await context.addInitScript(() => {
      if (window.animakeUniversalTools) {
        console.log('� Animake tools already loaded');
        return;
      }
      window.animakeUniversalTools = true;
      
      console.log('� Loading Enhanced Animake Tools with Keypress Emulation...');
      
      let selectedElement = null;
      let isSelectingElement = false;
      let originalBorder = '';
      
      // Create floating tool panel
      const toolPanel = document.createElement('div');
      toolPanel.id = 'animake-tools';
      toolPanel.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999999;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
      `;
      
      toolPanel.innerHTML = `
          <div style="margin-bottom: 12px; font-weight: 600; font-size: 14px; text-align: center;">
              🎬 ANIMAKE Tools
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
              <button id="random-text-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">📝 Random Text</button>
              <button id="random-int-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">🔢 Random Int</button>
              <button id="assert-exists-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">✅ Assert Exists</button>
              <button id="select-label-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">🏷️ Select by Label</button>
          </div>
          <div id="status" style="margin-top: 10px; font-size: 11px; opacity: 0.8; text-align: center;"></div>
      `;
      
      // Wait for body to be ready and append safely
      function appendToolPanel() {
        if (document.body) {
          document.body.appendChild(toolPanel);
        } else {
          setTimeout(appendToolPanel, 100);
        }
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', appendToolPanel);
      } else {
        appendToolPanel();
      }
      
      // Add hover effects
      const buttons = toolPanel.querySelectorAll('button');
      buttons.forEach(btn => {
          btn.addEventListener('mouseenter', () => {
              btn.style.background = 'rgba(255,255,255,0.3)';
              btn.style.transform = 'translateY(-1px)';
          });
          btn.addEventListener('mouseleave', () => {
              btn.style.background = 'rgba(255,255,255,0.2)';
              btn.style.transform = 'translateY(0)';
          });
      });
      
      const statusDiv = document.getElementById('status');
      
      function updateStatus(message) {
          statusDiv.textContent = message;
          setTimeout(() => statusDiv.textContent = '', 3000);
      }
      
      // Enhanced keypress simulation function
      function simulateKeypress(element, text) {
          console.log('🎹 Simulating enhanced keypress for:', text);
          
          // Focus the element first
          element.focus();
          
          // Clear existing content
          const currentValue = element.value || '';
          element.value = '';
          
          // Dispatch events to clear
          element.dispatchEvent(new Event('focus', { bubbles: true }));
          element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
          element.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Simulate typing each character with proper timing
          let index = 0;
          function typeNextChar() {
              if (index >= text.length) {
                  // Final events after all characters
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                  element.dispatchEvent(new Event('blur', { bubbles: true }));
                  setTimeout(() => {
                      element.focus();
                      element.select();
                  }, 10);
                  return;
              }
              
              const char = text[index];
              const charCode = char.charCodeAt(0);
              
              // Create comprehensive keyboard events
              const keydownEvent = new KeyboardEvent('keydown', {
                  key: char,
                  code: char.match(/[a-zA-Z]/) ? `Key${char.toUpperCase()}` : `Digit${char}`,
                  charCode: charCode,
                  keyCode: charCode,
                  which: charCode,
                  bubbles: true,
                  cancelable: true,
                  composed: true,
                  isTrusted: false
              });
              
              const keypressEvent = new KeyboardEvent('keypress', {
                  key: char,
                  code: char.match(/[a-zA-Z]/) ? `Key${char.toUpperCase()}` : `Digit${char}`,
                  charCode: charCode,
                  keyCode: charCode,
                  which: charCode,
                  bubbles: true,
                  cancelable: true,
                  composed: true,
                  isTrusted: false
              });
              
              const inputEvent = new InputEvent('input', {
                  data: char,
                  inputType: 'insertText',
                  bubbles: true,
                  cancelable: true,
                  composed: true,
                  isTrusted: false
              });
              
              const keyupEvent = new KeyboardEvent('keyup', {
                  key: char,
                  code: char.match(/[a-zA-Z]/) ? `Key${char.toUpperCase()}` : `Digit${char}`,
                  charCode: charCode,
                  keyCode: charCode,
                  which: charCode,
                  bubbles: true,
                  cancelable: true,
                  composed: true,
                  isTrusted: false
              });
              
              // Dispatch events in proper sequence
              element.dispatchEvent(keydownEvent);
              element.dispatchEvent(keypressEvent);
              
              // Update value
              element.value = text.substring(0, index + 1);
              
              element.dispatchEvent(inputEvent);
              element.dispatchEvent(keyupEvent);
              
              index++;
              
              // Continue with next character after small delay
              setTimeout(typeNextChar, 50); // 50ms delay between characters
          }
          
          // Start typing
          setTimeout(typeNextChar, 100);
      }
      
      // Smart selector generation
      function generateSmartSelector(element) {
          // Try getByLabel first
          const label = element.closest('label') || document.querySelector(`label[for="${element.id}"]`);
          if (label) {
              const labelText = label.textContent.trim();
              if (labelText) return `page.getByLabel('${labelText}')`;
          }
          
          // Try getByPlaceholder
          if (element.placeholder) {
              return `page.getByPlaceholder('${element.placeholder}')`;
          }
          
          // Try getByRole with accessible name
          if (element.tagName.toLowerCase() === 'input') {
              const type = element.type || 'textbox';
              const name = element.getAttribute('aria-label') || element.getAttribute('name');
              if (name) {
                  return `page.getByRole('${type === 'text' ? 'textbox' : type}', { name: '${name}' })`;
              }
          }
          
          // Fallback to CSS selector
          let selector = element.tagName.toLowerCase();
          if (element.id) selector += `#${element.id}`;
          if (element.className) {
              const classes = element.className.split(' ').filter(c => c.trim());
              if (classes.length > 0) selector += `.${classes.join('.')}`;
          }
          
          return `page.locator('${selector}')`;
      }
      
      // Element highlighting
      function highlightElement(element) {
          if (selectedElement && selectedElement !== element) {
              selectedElement.style.border = originalBorder;
          }
          selectedElement = element;
          originalBorder = element.style.border;
          element.style.border = '3px solid #ff6b6b';
          element.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.5)';
      }
      
      function removeHighlight() {
          if (selectedElement) {
              selectedElement.style.border = originalBorder;
              selectedElement.style.boxShadow = '';
              selectedElement = null;
          }
      }
      
      // Element selection mode
      function startElementSelection(actionType) {
          isSelectingElement = true;
          updateStatus(`Click an element for ${actionType}`);
          document.body.style.cursor = 'crosshair';
          
          // Function to check if element is valid for input actions
          function isValidInputElement(el) {
              const tagName = el.tagName.toLowerCase();
              if (tagName === 'textarea') return true;
              if (tagName === 'input') {
                  const type = el.type.toLowerCase();
                  return ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type);
              }
              return false;
          }
          
          const inputActions = ['Random Text', 'Random Int'];
          const requiresInput = inputActions.includes(actionType);
          
          // Add hover feedback for input validation
          function mouseoverHandler(e) {
              if (e.target.closest('#animake-tools')) return;
              
              const element = e.target;
              const isValid = !requiresInput || isValidInputElement(element);
              
              // Visual feedback
              element.style.outline = isValid ? '2px solid #4CAF50' : '2px solid #f44336';
              element.style.backgroundColor = isValid ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
              
              updateStatus(isValid ? 
                  `✅ Valid ${element.tagName.toLowerCase()} - click to select` : 
                  `❌ Invalid element - select input/textarea`);
          }
          
          function mouseoutHandler(e) {
              if (e.target.closest('#animake-tools')) return;
              e.target.style.outline = '';
              e.target.style.backgroundColor = '';
          }
          
          document.addEventListener('mouseover', mouseoverHandler);
          document.addEventListener('mouseout', mouseoutHandler);
          
          // Add click listener
          document.addEventListener('click', function elementClickHandler(e) {
              if (e.target.closest('#animake-tools')) return;
              
              e.preventDefault();
              e.stopPropagation();
              
              const element = e.target;
              
              // Validate element type for input actions
              function isValidInputElement(el) {
                  const tagName = el.tagName.toLowerCase();
                  if (tagName === 'textarea') return true;
                  if (tagName === 'input') {
                      const type = el.type.toLowerCase();
                      return ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type);
                  }
                  return false;
              }
              
              // Check if action requires input validation
              const inputActions = ['Random Text', 'Random Int'];
              if (inputActions.includes(actionType) && !isValidInputElement(element)) {
                  updateStatus(`❌ Please select an input field or textarea`);
                  document.body.style.cursor = 'default';
                  document.removeEventListener('click', elementClickHandler, true);
                  document.removeEventListener('mouseover', mouseoverHandler);
                  document.removeEventListener('mouseout', mouseoutHandler);
                  isSelectingElement = false;
                  
                  // Clear any remaining outline/background styles
                  document.querySelectorAll('*').forEach(el => {
                      if (el.style.outline.includes('2px solid')) {
                          el.style.outline = '';
                          el.style.backgroundColor = '';
                      }
                  });
                  return;
              }
              
              const selector = generateSmartSelector(element);
              
              // Perform the action based on type
              if (actionType === 'Random Text') {
                  const randomText = 'TestData_' + Math.random().toString(36).substring(2, 8);
                  simulateKeypress(element, randomText);
                  updateStatus(`Typing: ${randomText}`);
              } else if (actionType === 'Random Int') {
                  const randomInt = Math.floor(Math.random() * 1000).toString();
                  simulateKeypress(element, randomInt);
                  updateStatus(`Typing: ${randomInt}`);
              }
              
              // Generate and copy code
              let code = '';
              switch(actionType) {
                  case 'Random Text':
                      code = `const randomText_${Date.now()} = 'TestData_' + Math.random().toString(36).substring(2, 8);\\n${selector}.fill(randomText_${Date.now()});`;
                      break;
                  case 'Random Int':
                      code = `const randomInt_${Date.now()} = Math.floor(Math.random() * 1000).toString();\\n${selector}.fill(randomInt_${Date.now()});`;
                      break;
                  case 'Assert Exists':
                      code = `await expect(${selector}).toBeVisible();`;
                      break;
                  case 'Select by Label':
                      const labelText = prompt('Enter label text:');
                      if (labelText) {
                          code = `await page.getByLabel('${labelText}').click();`;
                      }
                      break;
              }
              
              if (code) {
                  navigator.clipboard.writeText(code).then(() => {
                      console.log('📋 Code copied:', code);
                  }).catch(err => {
                      console.log('💾 Code generated:', code);
                  });
              }
              
              // Reset selection mode
              isSelectingElement = false;
              document.body.style.cursor = 'default';
              removeHighlight();
              document.removeEventListener('click', elementClickHandler);
              document.removeEventListener('mouseover', mouseoverHandler);
              document.removeEventListener('mouseout', mouseoutHandler);
              
              // Clear any remaining outline/background styles
              document.querySelectorAll('*').forEach(el => {
                  if (el.style.outline.includes('2px solid')) {
                      el.style.outline = '';
                      el.style.backgroundColor = '';
                  }
              });
              
          }, { capture: true, once: true });
      }
      
      // Add hover highlighting during selection
      document.addEventListener('mouseover', (e) => {
          if (isSelectingElement && !e.target.closest('#animake-tools')) {
              highlightElement(e.target);
          }
      });
      
      document.addEventListener('mouseout', (e) => {
          if (isSelectingElement && !e.target.closest('#animake-tools')) {
              removeHighlight();
          }
      });
      
      // Button event listeners
      document.getElementById('random-text-btn').addEventListener('click', () => {
          startElementSelection('Random Text');
      });
      
      document.getElementById('random-int-btn').addEventListener('click', () => {
          startElementSelection('Random Int');
      });
      
      document.getElementById('assert-exists-btn').addEventListener('click', () => {
          startElementSelection('Assert Exists');
      });
      
      document.getElementById('select-label-btn').addEventListener('click', () => {
          startElementSelection('Select by Label');
      });
      
      console.log('🎬 ANIMAKE Tools Ready - Enhanced with Keypress Emulation!');
    });
    
    console.log('� Animake: Enhanced keypress emulation injected successfully.');
  } catch (error) {
    console.error('� Animake: Failed to inject enhanced tools:', error);
  }
  // ANIMAKE INJECTION END

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const donePromise = new import_utils.ManualPromise();
  maybeSetupTestHooks(browser, closeBrowser, donePromise);
  import_utilsBundle.dotenv.config({ path: "playwright.env" });
  if (dependencies && dependencies.length > 0) {
    console.log("\u{1F504} Running dependency tests before recording...");
    const page = await context.newPage();
    await page.evaluate(() => {
      const banner = document.createElement("div");
      banner.id = "__playwright_dependency_banner";
      banner.textContent = "Running dependency tests...";
      banner.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0;
        background: #ff9800; color: white; padding: 10px;
        text-align: center; z-index: 999999;
        font-family: monospace; font-size: 14px;
      `;
      document.body.appendChild(banner);
    });
    for (const depPath of dependencies) {
      try {
        console.log(`\u{1F4CB} Executing dependency: ${depPath}`);
        const absolutePath = import_path.default.resolve(depPath);
        if (!import_fs.default.existsSync(absolutePath)) {
          throw new Error(`Dependency file not found: ${absolutePath}`);
        }
        let testModule;
        if (absolutePath.endsWith(".ts")) {
          const tsSource = import_fs.default.readFileSync(absolutePath, "utf8");
          const runFunctionMatch = tsSource.match(/export\s+async\s+function\s+(run_\w+)\s*\([^)]+\)\s*\{[\s\S]*?\n\}/);
          if (!runFunctionMatch) {
            throw new Error(`No exported run_* function found in ${depPath}`);
          }
          const runFunctionCode = runFunctionMatch[0];
          const runFunctionName2 = runFunctionMatch[1];
          const fileContent = import_fs.default.readFileSync(absolutePath, "utf8");
          const importMatch = fileContent.match(/import\s+.*?from\s+['"][^'"]+['"];/);
          const importStatement = importMatch ? importMatch[0] : "import { expect } from '@playwright/test';";
          const minimalTs = `
            ${importStatement}
            ${runFunctionCode}
          `;
          const typescript = require("typescript");
          const jsResult = typescript.transpile(minimalTs, {
            target: typescript.ScriptTarget.ES2020,
            module: typescript.ModuleKind.CommonJS,
            allowJs: true,
            esModuleInterop: true,
            strict: false,
            skipLibCheck: true
          });
          const tempJsPath = absolutePath.replace(".ts", ".temp.js");
          import_fs.default.writeFileSync(tempJsPath, jsResult);
          try {
            delete require.cache[require.resolve(tempJsPath)];
            const commonjsModule = require(tempJsPath);
            testModule = {};
            if (typeof commonjsModule === "object" && commonjsModule !== null) {
              Object.assign(testModule, commonjsModule);
            }
          } finally {
            if (import_fs.default.existsSync(tempJsPath)) {
              import_fs.default.unlinkSync(tempJsPath);
            }
          }
        } else {
          testModule = await import(absolutePath);
        }
        const runFunctionName = Object.keys(testModule).find(
          (key) => key.startsWith("run_") && typeof testModule[key] === "function"
        );
        if (runFunctionName) {
          console.log(`  \u2713 Executing ${runFunctionName}...`);
          await testModule[runFunctionName](page);
          console.log(`  \u2705 Completed ${runFunctionName}`);
        } else {
          console.error(`  \u274C No run_* function found in ${depPath}`);
          throw new Error(`No executable function found in ${depPath}`);
        }
      } catch (error) {
        console.error(`\u274C Failed to run dependency ${depPath}:`, error);
        await closeBrowser();
        process.exit(1);
      }
    }
    await page.evaluate(() => {
      const banner = document.getElementById("__playwright_dependency_banner");
      if (banner) banner.remove();
    });
    console.log("\u2705 All dependencies completed. Starting recording from current state...");
    if (!url) {
      url = await page.url();
      console.log(`\u{1F4CD} Recording will continue from: ${url}`);
    }
  }
  await context._enableRecorder({
    language,
    launchOptions,
    contextOptions,
    device: options.device,
    saveStorage: options.saveStorage,
    mode: "recording",
    testIdAttributeName,
    outputFile: outputFile ? import_path.default.resolve(outputFile) : void 0,
    handleSIGINT: false
  });
  if (!dependencies || dependencies.length === 0) {
    await openPage(context, url);
  }
  
  
  
  
  donePromise.resolve();
}
async function maybeSetupTestHooks(browser, closeBrowser, donePromise) {
  if (!process.env.PWTEST_CLI_IS_UNDER_TEST)
    return;
  const logs = [];
  require("playwright-core/lib/utilsBundle").debug.log = (...args) => {
    const line = require("util").format(...args) + "\n";
    logs.push(line);
    process.stderr.write(line);
  };
  browser.on("disconnected", () => {
    const hasCrashLine = logs.some((line) => line.includes("process did exit:") && !line.includes("process did exit: exitCode=0, signal=null"));
    if (hasCrashLine) {
      process.stderr.write("Detected browser crash.\n");
      (0, import_utils.gracefullyProcessExitDoNotHang)(1);
    }
  });
  const close = async () => {
    await donePromise;
    await closeBrowser();
  };
  if (process.env.PWTEST_CLI_EXIT_AFTER_TIMEOUT) {
    setTimeout(close, +process.env.PWTEST_CLI_EXIT_AFTER_TIMEOUT);
    return;
  }
  let stdin = "";
  process.stdin.on("data", (data) => {
    stdin += data.toString();
    if (stdin.startsWith("exit")) {
      process.stdin.destroy();
      close();
    }
  });
}
async function waitForPage(page, captureOptions) {
  if (captureOptions.waitForSelector) {
    console.log(`Waiting for selector ${captureOptions.waitForSelector}...`);
    await page.waitForSelector(captureOptions.waitForSelector);
  }
  if (captureOptions.waitForTimeout) {
    console.log(`Waiting for timeout ${captureOptions.waitForTimeout}...`);
    await page.waitForTimeout(parseInt(captureOptions.waitForTimeout, 10));
  }
}
async function screenshot(options, captureOptions, url, path2) {
  const { context } = await launchContext(options, { headless: true });
  console.log("Navigating to " + url);
  const page = await openPage(context, url);
  await waitForPage(page, captureOptions);
  console.log("Capturing screenshot into " + path2);
  await page.screenshot({ path: path2, fullPage: !!captureOptions.fullPage });
  await page.close();
}
async function pdf(options, captureOptions, url, path2) {
  if (options.browser !== "chromium")
    throw new Error("PDF creation is only working with Chromium");
  const { context } = await launchContext({ ...options, browser: "chromium" }, { headless: true });
  console.log("Navigating to " + url);
  const page = await openPage(context, url);
  
  
  
  
  await waitForPage(page, captureOptions);
  console.log("Saving as pdf into " + path2);
  await page.pdf({ path: path2, format: captureOptions.paperFormat });
  await page.close();
}
function lookupBrowserType(options) {
  let name = options.browser;
  if (options.device) {
    const device = playwright.devices[options.device];
    name = device.defaultBrowserType;
  }
  let browserType;
  switch (name) {
    case "chromium":
      browserType = playwright.chromium;
      break;
    case "webkit":
      browserType = playwright.webkit;
      break;
    case "firefox":
      browserType = playwright.firefox;
      break;
    case "cr":
      browserType = playwright.chromium;
      break;
    case "wk":
      browserType = playwright.webkit;
      break;
    case "ff":
      browserType = playwright.firefox;
      break;
  }
  if (browserType)
    return browserType;
  import_utilsBundle.program.help();
}
function validateOptions(options) {
  if (options.device && !(options.device in playwright.devices)) {
    const lines = [`Device descriptor not found: '${options.device}', available devices are:`];
    for (const name in playwright.devices)
      lines.push(`  "${name}"`);
    throw new Error(lines.join("\n"));
  }
  if (options.colorScheme && !["light", "dark"].includes(options.colorScheme))
    throw new Error('Invalid color scheme, should be one of "light", "dark"');
}
function logErrorAndExit(e) {
  if (process.env.PWDEBUGIMPL)
    console.error(e);
  else
    console.error(e.name + ": " + e.message);
  (0, import_utils.gracefullyProcessExitDoNotHang)(1);
}
function codegenId() {
  return process.env.PW_LANG_NAME || "playwright-test";
}
function commandWithOpenOptions(command, description, options) {
  let result = import_utilsBundle.program.command(command).description(description);
  for (const option of options)
    result = result.option(option[0], ...option.slice(1));
  return result.option("-b, --browser <browserType>", "browser to use, one of cr, chromium, ff, firefox, wk, webkit", "chromium").option("--block-service-workers", "block service workers").option("--channel <channel>", 'Chromium distribution channel, "chrome", "chrome-beta", "msedge-dev", etc').option("--color-scheme <scheme>", 'emulate preferred color scheme, "light" or "dark"').option("--device <deviceName>", 'emulate device, for example  "iPhone 11"').option("--geolocation <coordinates>", 'specify geolocation coordinates, for example "37.819722,-122.478611"').option("--ignore-https-errors", "ignore https errors").option("--load-storage <filename>", "load context storage state from the file, previously saved with --save-storage").option("--lang <language>", 'specify language / locale, for example "en-GB"').option("--proxy-server <proxy>", 'specify proxy server, for example "http://myproxy:3128" or "socks5://myproxy:8080"').option("--proxy-bypass <bypass>", 'comma-separated domains to bypass proxy, for example ".com,chromium.org,.domain.com"').option("--save-har <filename>", "save HAR file with all network activity at the end").option("--save-har-glob <glob pattern>", "filter entries in the HAR by matching url against this glob pattern").option("--save-storage <filename>", "save context storage state at the end, for later use with --load-storage").option("--timezone <time zone>", 'time zone to emulate, for example "Europe/Rome"').option("--timeout <timeout>", "timeout for Playwright actions in milliseconds, no timeout by default").option("--user-agent <ua string>", "specify user agent string").option("--user-data-dir <directory>", "use the specified user data directory instead of a new context").option("--viewport-size <size>", 'specify browser viewport size in pixels, for example "1280, 720"');
}
function buildBasePlaywrightCLICommand(cliTargetLang) {
  switch (cliTargetLang) {
    case "python":
      return `playwright`;
    case "java":
      return `mvn exec:java -e -D exec.mainClass=com.microsoft.playwright.CLI -D exec.args="...options.."`;
    case "csharp":
      return `pwsh bin/Debug/netX/playwright.ps1`;
    default: {
      const packageManagerCommand = (0, import_utils2.getPackageManagerExecCommand)();
      return `${packageManagerCommand} playwright`;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  program
});
