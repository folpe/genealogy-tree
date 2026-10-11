// syntax-worker: {"sha256":"12e6a141d5bda6486f285da9af96d09c638ceb26a321f1362a1df064b8eefea3","bytes":3588399}
// <define:__VOID_SYNTAX_WORKER_IDENTITY__>
var define_VOID_SYNTAX_WORKER_IDENTITY_default = { sha256: "12e6a141d5bda6486f285da9af96d09c638ceb26a321f1362a1df064b8eefea3", bytes: 3588399 };

var GOVERNING_SKILL = {
  "boundary-direction": "void-hexagonal-architecture",
  // The remedy the refusal teaches -- build the byte rather than type it -- is a
  // fixture practice, and void-testing is the only skill that already carries it.
  "control-character": "void-testing",
  "dangerous-command": "void-security-guidance",
  "design-slop": "void-frontend-design",
  "no-any": "void-typescript-strict",
  "no-as-cast": "void-typescript-strict",
  "no-console": "void-observability",
  "no-focused-test": "void-testing",
  "no-null": "void-functional",
  "protected-file": "void-security-guidance",
  "secret-content": "void-security-guidance",
  "tdd-order": "void-tdd",
  "test-name": "void-testing"
};
var RULE_NAMES = [
  "boundary-direction",
  "control-character",
  "dangerous-command",
  "design-slop",
  "no-any",
  "no-as-cast",
  "no-console",
  "no-focused-test",
  "no-null",
  "protected-file",
  "secret-content",
  "tdd-order",
  "test-name"
];
function governingSkill(rule) {
  return GOVERNING_SKILL[rule];
}
function withGoverningSkill(rule, message) {
  return `${message} (doctrine: the ${governingSkill(rule)} skill)`;
}

import {
  existsSync as existsSync3,
  readFileSync as readFileSync5,
  realpathSync,
  statSync as statSync2
} from "node:fs";
import {
  basename as basename2,
  dirname as dirname2,
  isAbsolute as isAbsolute2,
  join as join3,
  relative as relative2,
  resolve as resolve4
} from "node:path";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function allow(code2 = "ALLOW", message = "allowed") {
  return { allow: true, code: code2, message, evidence: [] };
}
function block(code2, message, evidence) {
  return { allow: false, code: code2, message, evidence };
}

function normalizedPath(path) {
  return path.replaceAll("\\", "/");
}
function isTestPath(path) {
  return /\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/.test(path);
}
function isGeneratedPath(path) {
  return /\/__(?:generated|fixtures)__\//.test(path);
}
function lineEvidence(edits, applies, violates, allowTag) {
  const evidence = [];
  for (const edit of edits) {
    const path = normalizedPath(edit.path);
    if (!applies(path)) continue;
    edit.addedContent.split(/\r?\n/).forEach((line, index) => {
      if (allowTag !== void 0 && line.includes(allowTag)) return;
      if (violates(line, path)) evidence.push(`${path}:${index + 1}`);
    });
  }
  return evidence;
}
function evidenceVerdict(code2, message, evidence) {
  return evidence.length === 0 ? allow() : block(code2, message, evidence);
}

var IMPORT = /\bfrom\s+['"](@[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+)/;
function nearestManifest(projectRoot2, filePath) {
  const root = resolve(projectRoot2);
  let directory = dirname(resolve(projectRoot2, filePath));
  while (directory.startsWith(root)) {
    const candidate = join(directory, "package.json");
    if (existsSync(candidate)) {
      try {
        const parsed = JSON.parse(readFileSync(candidate, "utf8"));
        return {
          ...parsed.name === void 0 ? {} : { name: parsed.name },
          declared: /* @__PURE__ */ new Set([
            ...Object.keys(parsed.dependencies ?? {}),
            ...Object.keys(parsed.devDependencies ?? {}),
            ...Object.keys(parsed.peerDependencies ?? {}),
            ...Object.keys(parsed.optionalDependencies ?? {})
          ])
        };
      } catch {
        return void 0;
      }
    }
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return void 0;
}
function boundaryDirection(edits, projectRoot2) {
  const evidence = [];
  if (projectRoot2 !== void 0) {
    const manifests = /* @__PURE__ */ new Map();
    for (const edit of edits) {
      const path = normalizedPath(edit.path);
      if (!/\.(?:ts|tsx|js|jsx)$/.test(path) || isTestPath(path) || isGeneratedPath(path)) continue;
      if (!manifests.has(path)) manifests.set(path, nearestManifest(projectRoot2, path));
      const manifest = manifests.get(path);
      if (manifest === void 0) continue;
      edit.addedContent.split(/\r?\n/).forEach((line, index) => {
        if (line.includes("allow-boundary:")) return;
        const target = line.match(IMPORT)?.[1];
        if (target === void 0 || target === manifest.name) return;
        if (manifest.declared.has(target)) return;
        evidence.push(`${path}:${index + 1} -> ${target}`);
      });
    }
  }
  return evidenceVerdict(
    "MONOREPO_UNDECLARED_DEPENDENCY",
    "imports a workspace package this one does not declare; add it to package.json dependencies",
    evidence
  );
}

var SOURCE_EXTENSIONS = /\.(?:ts|tsx|js|mjs|json|md|yaml|sh)$/;
var ALLOWED = /* @__PURE__ */ new Set([9, 10, 13]);
function isControl(point) {
  return (point < 32 || point === 127) && !ALLOWED.has(point);
}
var MAX_EVIDENCE = 6;
function hexPoint(point) {
  return `U+${point.toString(16).toUpperCase().padStart(4, "0")}`;
}
function controlCharacter(edits) {
  const evidence = [];
  for (const edit of edits) {
    const path = normalizedPath(edit.path);
    if (!SOURCE_EXTENSIONS.test(path)) continue;
    edit.addedContent.split(/\r?\n/).forEach((line, lineIndex) => {
      [...line].forEach((character, column) => {
        if (evidence.length >= MAX_EVIDENCE) return;
        const point = character.codePointAt(0) ?? 0;
        if (!isControl(point)) return;
        evidence.push(`${path}:${lineIndex + 1}:${column + 1} ${hexPoint(point)}`);
      });
    });
  }
  return evidenceVerdict(
    "CONTROL_CHARACTER_IN_SOURCE",
    "control character in a source file; it is invisible in the diff and drops the file out of the project graph. A fixture that needs the byte builds it (String.fromCharCode(0), Buffer.concat) instead of holding it literally.",
    evidence
  );
}

var BRACED_HOME = `$${"{"}HOME}`;
var ROOT_TARGETS = /* @__PURE__ */ new Set([
  "/",
  "/*",
  "~",
  "~/",
  "~/*",
  "$HOME",
  "$HOME/",
  "$HOME/*",
  BRACED_HOME,
  `${BRACED_HOME}/`,
  `${BRACED_HOME}/*`,
  ".",
  "./",
  "./*",
  "*"
]);
function unquote(command) {
  return command.replaceAll('"', "").replaceAll("'", "");
}
function shellSegments(command) {
  return command.split(/&&|\|\||[;\n]/).map((segment2) => segment2.trim()).filter(Boolean);
}
function recursiveRootOperation(segment2, operation) {
  const tokens = unquote(segment2).split(/\s+/);
  const index = tokens.indexOf(operation);
  if (index < 0) return false;
  const args = tokens.slice(index + 1);
  const recursive = args.some(
    (token) => token === "--recursive" || /^-[A-Za-z]*R[A-Za-z]*$/.test(token) || /^-[A-Za-z]*r[A-Za-z]*$/.test(token)
  );
  if (!recursive) return false;
  return args.some((target) => ROOT_TARGETS.has(target));
}
function violation(command) {
  if (/:\(\)\s*\{\s*:\s*\|\s*:/.test(command)) return "fork bomb";
  if (/(^|\s)mkfs(?:\.[a-z0-9]+)?(?:\s|$)/i.test(command)) return "filesystem / raw-device write";
  if (/(^|\s)dd\b[^|]*\bof=\/dev\//i.test(command) || />\s*\/dev\/(?:sd|nvme|hd|disk)/i.test(command)) {
    return "raw-device write";
  }
  if (/\b(?:drop\s+(?:database|table|schema)|truncate\s+table)\b/i.test(command)) {
    return "destructive SQL (DROP / TRUNCATE)";
  }
  for (const segment2 of shellSegments(command)) {
    if (recursiveRootOperation(segment2, "rm")) return "recursive delete of a root path";
    if (recursiveRootOperation(segment2, "chmod") || recursiveRootOperation(segment2, "chown")) {
      return "recursive permission/ownership change on a root path";
    }
    if (/\bgit\s+push\b/.test(segment2) && /(?:^|\s)(?:--force(?:\s|$)|-f(?:\s|$))/.test(segment2) && !/--force-with-lease/.test(segment2)) {
      return "git push --force (use --force-with-lease)";
    }
    if (/\bgit(?:\s+-\S+)*\s+(?:rebase|am|apply|cherry-pick)\b/.test(segment2) && /(?:--exec(?:\s|=|$)|--rebase-merges|--strategy-option|--unsafe-paths)/.test(segment2)) {
      return "git command-execution / unsafe-path flag";
    }
  }
  return void 0;
}
function dangerousCommand(command) {
  const evidence = violation(command);
  return evidence === void 0 ? allow() : block(
    "DANGEROUS_COMMAND",
    "refusing a destructive command; use the reviewed one-shot override only when deliberate",
    [evidence]
  );
}

var INTER = /font-family[^;]*\bInter\b|font-\[.?Inter|fontFamily[^,]*\bInter\b/i;
var GRADIENT = /(?:from|to)-(?:purple|indigo|violet|fuchsia)-\d+[^"' ]*[^"']*(?:from|to)-(?:blue|cyan|teal|sky|indigo)-\d+|linear-gradient\([^)]*(?:purple|indigo|violet)[^)]*(?:blue|cyan|teal)/i;
var GREY_ON_COLOR = /\btext-(?:gray|grey|slate|zinc|neutral)-\d+\b[^"']*\bbg-(?:indigo|purple|blue|violet|fuchsia|emerald|rose|pink)-\d+\b/i;
var NESTED_CARD = /class(?:Name)?="[^"]*\bcard\b[^"]*"[^>]*>[^<]*<[^>]*class(?:Name)?="[^"]*\bcard\b/i;
function designSlop(edits) {
  const evidence = [];
  for (const edit of edits) {
    const path = normalizedPath(edit.path);
    if (!/\.(?:tsx|jsx|css|scss)$/.test(path) || isTestPath(path) || isGeneratedPath(path)) {
      continue;
    }
    edit.addedContent.split(/\r?\n/).forEach((line, index) => {
      if (/allow-design-slop:/.test(line)) return;
      const code2 = line.replace(/`[^`]*`|\/\*.*?\*\/|\/\/.*$/g, "");
      if (INTER.test(code2)) evidence.push(`${path}:${index + 1}: default Inter font`);
      if (GRADIENT.test(code2)) evidence.push(`${path}:${index + 1}: clich\xE9 gradient`);
      if (GREY_ON_COLOR.test(code2)) evidence.push(`${path}:${index + 1}: grey text on color`);
    });
    if (NESTED_CARD.test(edit.addedContent) && !edit.addedContent.includes("allow-design-slop:")) {
      evidence.push(`${path}: card nested directly inside card`);
    }
  }
  return evidenceVerdict(
    "GENERIC_AI_DESIGN_TELL",
    "conservative generic-design tell detected; apply the project visual language",
    evidence
  );
}

var ANY = /:\s*any\b|<any>|\bas\s+any\b/;
function noAny(edits) {
  const evidence = lineEvidence(
    edits,
    (path) => /\.(?:ts|tsx)$/.test(path) && !isTestPath(path) && !path.endsWith(".d.ts") && !isGeneratedPath(path),
    (line) => ANY.test(line),
    "allow-any:"
  );
  return evidenceVerdict(
    "TYPESCRIPT_ANY",
    "any weakens the type boundary; use a precise type or unknown plus narrowing",
    evidence
  );
}

var ASSERTION_CAST = /\bas\s+[A-Z][A-Za-z0-9_]*/;
function noAsCast(edits) {
  const evidence = lineEvidence(
    edits,
    (path) => /\.(?:ts|tsx)$/.test(path) && !isTestPath(path) && !path.endsWith(".d.ts") && !isGeneratedPath(path),
    (line) => ASSERTION_CAST.test(line),
    "allow-as-cast:"
  );
  return evidenceVerdict(
    "TYPESCRIPT_ASSERTION_CAST",
    "assertion cast detected; prefer narrowing, a type guard, a generic or boundary parsing",
    evidence
  );
}

import { existsSync as existsSync2, readFileSync as readFileSync2 } from "node:fs";
import { join as join2 } from "node:path";
var CONFIGS = ["biome.json", "biome.jsonc"];
function normalize(path) {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}
function globMatches(pattern2, path) {
  const source2 = normalize(pattern2);
  const target = normalize(path);
  let regex = "";
  for (let index = 0; index < source2.length; index += 1) {
    const character = source2[index];
    if (character === "*") {
      const doubled = source2[index + 1] === "*";
      if (doubled && source2[index + 2] === "/") {
        regex += "(?:[^/]*/)*";
        index += 2;
        continue;
      }
      if (doubled) {
        regex += ".*";
        index += 1;
        continue;
      }
      regex += "[^/]*";
      continue;
    }
    if (character === "?") {
      regex += "[^/]";
      continue;
    }
    regex += character.replace(/[.*+?^${}()|[\]\\]/, (match) => `\\${match}`);
  }
  try {
    return new RegExp(`^${regex}$`).test(target);
  } catch {
    return false;
  }
}
function stripJsonc(text2) {
  let out = "";
  let inString = false;
  let inLine = false;
  let inBlock = false;
  for (let index = 0; index < text2.length; index += 1) {
    const character = text2[index];
    const next = text2[index + 1];
    if (inLine) {
      if (character === "\n") {
        inLine = false;
        out += character;
      }
      continue;
    }
    if (inBlock) {
      if (character === "*" && next === "/") {
        inBlock = false;
        index += 1;
      }
      continue;
    }
    if (inString) {
      out += character;
      if (character === "\\") {
        out += next ?? "";
        index += 1;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
      out += character;
      continue;
    }
    if (character === "/" && next === "/") {
      inLine = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      inBlock = true;
      index += 1;
      continue;
    }
    out += character;
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}
function readConfig(root) {
  for (const name of CONFIGS) {
    const path = join2(root, name);
    if (!existsSync2(path)) continue;
    try {
      return JSON.parse(stripJsonc(readFileSync2(path, "utf8")));
    } catch {
      return void 0;
    }
  }
  return void 0;
}
function severityOf(rules, rule) {
  if (rules === void 0) return void 0;
  for (const group of Object.values(rules)) {
    const severity = group?.[rule];
    if (severity === void 0) continue;
    if (typeof severity === "string") return severity === "off" ? "off" : "on";
    if (typeof severity === "object" && severity !== null) return severity.level === "off" ? "off" : "on";
  }
  return void 0;
}
function pathList(override) {
  const raw = override.includes ?? override.include;
  return Array.isArray(raw) ? raw.filter((entry) => typeof entry === "string") : [];
}
function isRuleSuppressed(projectRoot2, rule, path) {
  const config = readConfig(projectRoot2);
  if (config === void 0) return false;
  const target = normalize(path);
  for (const override of [...config.overrides ?? []].reverse()) {
    if (!pathList(override).some((pattern2) => globMatches(pattern2, target))) continue;
    const severity = severityOf(override.linter?.rules, rule);
    if (severity !== void 0) return severity === "off";
  }
  return severityOf(config.linter?.rules, rule) === "off";
}

var CONSOLE = /\bconsole\.(?:log|error|warn|info|debug)\b/;
function noConsole(edits, projectRoot2) {
  const evidence = lineEvidence(
    edits,
    (path) => /\.(?:ts|tsx|js|jsx)$/.test(path) && !/(^|\/)scripts\//.test(path) && !isTestPath(path) && !isGeneratedPath(path) && !(projectRoot2 !== void 0 && isRuleSuppressed(projectRoot2, "noConsole", path)),
    (line) => CONSOLE.test(line),
    "allow-console:"
  );
  return evidenceVerdict(
    "CONSOLE_IN_SOURCE",
    "console call detected in source; use the project logger",
    evidence.map((item) => `console.* in ${item}`)
  );
}

var FOCUSED = /\b(?:it|test|describe)\.only\b|\b(?:it|test)\.skip\b|\b(?:xit|xdescribe)\b/;
function noFocusedTest(edits) {
  return evidenceVerdict(
    "FOCUSED_OR_SKIPPED_TEST",
    "focused or skipped test detected; use todo only for explicitly pending coverage",
    lineEvidence(edits, isTestPath, (line) => FOCUSED.test(line))
  );
}

function codeOnly(line) {
  return line.replace(/"(?:[^"\\]|\\.)*"/g, "").replace(/'(?:[^'\\]|\\.)*'/g, "").replace(/`[^`]*`/g, "").replace(/\/\*.*?\*\//g, "").replace(/\/\/.*$/, "");
}
function noNull(edits) {
  const evidence = lineEvidence(
    edits,
    (path) => /\.(?:ts|tsx)$/.test(path) && !isTestPath(path) && !path.endsWith(".d.ts") && !isGeneratedPath(path),
    (line, path) => {
      if (/from\s+['"]drizzle-orm|JSON\.(?:stringify|parse)|typeof.*===\s*['"]null/.test(line)) {
        return false;
      }
      const code2 = path.endsWith(".tsx") ? codeOnly(line).replace(/\breturn\s+null\b/g, "") : codeOnly(line);
      return /\bnull\b/.test(code2);
    },
    "allow-null:"
  );
  return evidenceVerdict(
    "NULL_IN_TYPESCRIPT",
    "null literal detected; prefer undefined or an explicit Option type",
    evidence
  );
}

import { readFileSync as readFileSync3 } from "node:fs";
import { basename, isAbsolute, relative, resolve as resolve2 } from "node:path";
function manifestOwnedPaths(root) {
  try {
    const parsed = JSON.parse(readFileSync3(resolve2(root, ".void/install-manifest.json"), "utf8"));
    if (typeof parsed !== "object" || parsed === void 0 || Array.isArray(parsed)) return /* @__PURE__ */ new Set();
    const files = parsed.files;
    if (!Array.isArray(files)) return /* @__PURE__ */ new Set();
    return new Set(files.flatMap((file) => {
      if (typeof file !== "object" || file === void 0 || Array.isArray(file)) return [];
      const path = file.path;
      return typeof path === "string" && path.length > 0 ? [path.replaceAll("\\", "/")] : [];
    }));
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function projectPath(root, path) {
  const absolute = resolve2(root, path);
  const relativePath = relative(resolve2(root), absolute).replaceAll("\\", "/");
  return relativePath === ".." || relativePath.startsWith("../") || isAbsolute(relativePath) ? void 0 : relativePath;
}
function protectedReason(path, root) {
  if (root !== void 0) {
    const relativePath = projectPath(root, path);
    if (relativePath !== void 0 && manifestOwnedPaths(root).has(relativePath)) {
      return "delivered harness asset; change the harness through void-learn";
    }
  }
  const normalized = path.replaceAll("\\", "/").toLowerCase();
  const base = basename(normalized);
  if (/^\.env(?:\..+)?$/.test(base) && !/\.(?:example|sample|template|dist)$/.test(base)) {
    return "environment file with secrets";
  }
  if (/\.(?:pem|key|p12|pfx|keystore|jks|asc)$/.test(base) || /^id_(?:rsa|ed25519|ecdsa|dsa)$/.test(base)) {
    return "private key / certificate";
  }
  if (/(?:\.npmrc|\.netrc|\.pgpass)$/.test(base)) return "credential file";
  if (!base.endsWith(".md") && /(?:secret|credential)/.test(base)) return "credential file";
  if ((/* @__PURE__ */ new Set([
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lock",
    "bun.lockb",
    "cargo.lock",
    "poetry.lock",
    "composer.lock"
  ])).has(base)) {
    return "lockfile (regenerate via the package manager, do not hand-edit)";
  }
  if (/(^|\/)\.git\//.test(normalized)) return "internal git metadata";
  return void 0;
}
function protectedFile(paths, options = {}) {
  for (const path of paths) {
    const reason = protectedReason(path, options.root);
    if (reason !== void 0) {
      const learn = reason.includes("void-learn") ? " Use void-learn to capture the missing harness capability." : "";
      return block("PROTECTED_FILE", `refusing to edit ${path}.${learn}`, [`${path}: ${reason}`]);
    }
  }
  return allow();
}

var HIGH_CONFIDENCE = [
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}/,
  /\bgh[posru]_[A-Za-z0-9]{36}/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/,
  /\bsk-(?:ant|proj)-[A-Za-z0-9_-]{40,}\b/,
  /\bsk-[A-Za-z0-9]{40,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/
];
var GENERIC_ASSIGNMENT = /(?:_KEY|_SECRET|_TOKEN|_PASSWORD|_PASSWD|_APIKEY)["' ]*[:=]\s*["']([A-Za-z0-9+/=_-]{24,})["']/i;
var PLACEHOLDER = /process\.env|import\.meta\.env|xxx|changeme|example|redacted|your[-_]|<[a-z]|placeholder|todo/i;
var EXEMPT_PATH = /\.(?:test|spec)\.|\/__tests__\/|\/__fixtures__\/|\/fixtures\/|\/__generated__\//;
function lineHasSecret(line) {
  if (line.includes("allow-secret-pattern:")) return false;
  if (HIGH_CONFIDENCE.some((pattern2) => pattern2.test(line))) return true;
  const assignment = line.match(GENERIC_ASSIGNMENT);
  if (assignment === null || PLACEHOLDER.test(line)) return false;
  const value = assignment[1] ?? "";
  if (/^[0-9a-f]+$/i.test(value) || /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
    return false;
  }
  return /[A-Za-z]/.test(value) && /[0-9]/.test(value);
}
function secretContent(edits) {
  const evidence = [];
  for (const edit of edits) {
    if (EXEMPT_PATH.test(edit.path.replaceAll("\\", "/"))) continue;
    edit.addedContent.split(/\r?\n/).forEach((line, index) => {
      if (lineHasSecret(line)) evidence.push(`${edit.path}:${index + 1}`);
    });
  }
  return evidence.length === 0 ? allow() : block("SECRET_IN_CONTENT", "secret-in-content: likely secret detected in edited content", evidence);
}

function globRegExp(glob) {
  let pattern2 = "^";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index] ?? "";
    if (char === "*" && glob[index + 1] === "*") {
      pattern2 += ".*";
      index += 1;
    } else if (char === "*") {
      pattern2 += "[^/]*";
    } else {
      pattern2 += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`${pattern2}$`);
}
function matches(path, globs) {
  return globs.some((glob) => globRegExp(glob).test(path));
}
function bypass(path, spikeGlobs) {
  return !/\.(?:ts|tsx|js|jsx)$/.test(path) || /(^|\/)docs\//.test(path) || /\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/.test(path) || /\.d\.ts$/.test(path) || /\/(?:tests?|__tests__)\/fixtures\/|\/seed\/|\/migrations\/|\/drizzle\/meta\/|\/codemods?\//.test(path) || /\/__generated__\//.test(path) || matches(path, spikeGlobs);
}
function tddApplies(path, businessGlobs, spikeGlobs) {
  return !bypass(path, spikeGlobs) && matches(path, businessGlobs);
}
var MAX_TOP_LEVEL_STATEMENTS = 512;
var DIRECTIVE = /^(['"])use [a-z][a-z ]*\1\s*;?/;
var TYPE_IMPORT = /^import\s+type\s+[^;'"]*from\s*(['"])[^'"]*\1\s*;?/;
var RE_EXPORT = /^export\s+(?:type\s+)?(?:\*(?:\s+as\s+[A-Za-z_$][\w$]*)?|\{[^}]*\})\s*(?:from\s*(['"])[^'"]*\1)?\s*;?/;
function endOfLiteral(source2, start) {
  const quote = source2[start] ?? "";
  for (let index = start + 1; index < source2.length; index += 1) {
    const char = source2[index] ?? "";
    if (char === "\\") {
      index += 1;
      continue;
    }
    if (char === quote) return index;
  }
  return void 0;
}
function withoutComments(source2) {
  let output = "";
  let index = 0;
  while (index < source2.length) {
    const char = source2[index] ?? "";
    const next = source2[index + 1] ?? "";
    if (char === "/" && next === "/") {
      const end = source2.indexOf("\n", index);
      if (end === -1) return output;
      index = end;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = source2.indexOf("*/", index + 2);
      if (end === -1) return void 0;
      index = end + 2;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      const end = endOfLiteral(source2, index);
      if (end === void 0) return void 0;
      output += source2.slice(index, end + 1);
      index = end + 1;
      continue;
    }
    output += char;
    index += 1;
  }
  return output;
}
function isPureReExport(source2) {
  const stripped = withoutComments(source2);
  if (stripped === void 0) return false;
  let rest = stripped.replace(/\s+/g, " ").trim();
  for (let count = 0; rest !== "" && count < MAX_TOP_LEVEL_STATEMENTS; count += 1) {
    const statement = DIRECTIVE.exec(rest) ?? TYPE_IMPORT.exec(rest) ?? RE_EXPORT.exec(rest) ?? void 0;
    if (statement === void 0) return false;
    rest = rest.slice(statement[0].length).trim();
  }
  return rest === "";
}
function carriesNoBehaviour(original, proposed) {
  return isPureReExport(original) && isPureReExport(proposed);
}
function fileMode(path, input) {
  const header = (input.existingHeaders[path] ?? "").split(/\r?\n/).slice(0, 5).join("\n");
  const marker = header.match(/\/\/\s*tdd-mode:\s*(strict|souple|exploratory)/)?.[1];
  return marker === "strict" || marker === "souple" || marker === "exploratory" ? marker : input.mode;
}
function siblingFor(path) {
  if (path.endsWith(".tsx")) return `${path.slice(0, -4)}.test.tsx`;
  if (path.endsWith(".ts")) return `${path.slice(0, -3)}.test.ts`;
  if (path.endsWith(".jsx")) return `${path.slice(0, -4)}.test.jsx`;
  if (path.endsWith(".js")) return `${path.slice(0, -3)}.test.js`;
  return `${path}.test`;
}
function tddOrder(input) {
  const warnings = [];
  const declared = [];
  for (const edit of input.edits) {
    if (edit.operation === "delete" && edit.addedContent === "") continue;
    const path = edit.path.replaceAll("\\", "/");
    if (!tddApplies(path, input.businessGlobs, input.spikeGlobs)) continue;
    const original = input.originalSources[path];
    const proposed = input.proposedSources[path];
    if (original !== void 0 && proposed !== void 0 && carriesNoBehaviour(original, proposed)) continue;
    const declaredTest2 = input.declaredTests?.[path];
    if (declaredTest2 !== void 0) {
      declared.push(`${path} -> ${declaredTest2}`);
      continue;
    }
    const mode = fileMode(path, input);
    if (mode === "exploratory") continue;
    const sibling = siblingFor(path);
    if (input.siblingTests.has(sibling)) continue;
    const evidence = `${path} -> ${sibling}`;
    if (mode === "souple") {
      warnings.push(evidence);
      continue;
    }
    return block(
      "TDD_SIBLING_TEST_MISSING",
      "missing sibling test: add one or declare // tdd-cover: e2e <project-relative spec> on the first line",
      [evidence]
    );
  }
  if (warnings.length === 0 && declared.length > 0) return {
    allow: true,
    code: "TDD_DECLARED_TEST",
    message: "declared test file exists; suite not executed",
    evidence: declared
  };
  return warnings.length === 0 ? allow() : {
    allow: true,
    code: "TDD_SIBLING_TEST_WARNING",
    message: "warning: souple mode, sibling test missing",
    evidence: warnings
  };
}

var GENERIC_NAME = /\b(?:it|test)\(\s*['"]should\s|\b(?:it|test)\(\s*['"]works?\b|\b(?:it|test)\(\s*['"]test['"]/;
function testName(edits) {
  return evidenceVerdict(
    "GENERIC_TEST_NAME",
    "generic test name must describe observable behavior",
    lineEvidence(edits, isTestPath, (line) => GENERIC_NAME.test(line))
  );
}

var REDIRECTION = /(?:^|\s)(?:\d*|&)>{1,2}\s*("[^"]*"|'[^']*'|[^\s;|&<>]+)/g;
var TEE = /(?:^|[\s|])tee\s+(?:-a\s+)?("[^"]*"|'[^']*'|[^\s;|&<>-][^\s;|&<>]*)/g;
function unquote2(target) {
  const quoted = /^(["'])(.*)\1$/.exec(target);
  return quoted?.[2] ?? target;
}
function shellWriteTargets(command) {
  const targets = /* @__PURE__ */ new Set();
  for (const pattern2 of [REDIRECTION, TEE]) {
    for (const match of command.matchAll(pattern2)) {
      const target = match[1];
      if (target === void 0) continue;
      const path = unquote2(target);
      if (path !== "") targets.add(path);
    }
  }
  return [...targets].sort();
}

var MAX_FIELD_BYTES = 1024 * 1024;
function record(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function safeString(value, label, limit = MAX_FIELD_BYTES) {
  if (typeof value !== "string") return "";
  if (value.includes("\0") || Buffer.byteLength(value) > limit) {
    throw new Error(`unsafe hook input: ${label}`);
  }
  return value;
}
function commandText(value) {
  if (Array.isArray(value)) return value.map((part) => safeString(part, "command")).join(" ");
  return safeString(value, "command");
}
function patchText(input) {
  const candidates = [
    input["patch"],
    input["input"],
    input["content"],
    input["command"]
  ];
  return candidates.map((value) => commandText(value)).filter((value) => value.includes("*** Begin Patch")).join("\n");
}
function parsePatchEdits(patch) {
  const edits = [];
  let path = "";
  let added = "";
  let deleting = false;
  const emit = () => {
    if (path !== "") edits.push({
      path,
      addedContent: added,
      ...deleting ? { operation: "delete" } : {}
    });
  };
  for (const line of patch.split(/\r?\n/)) {
    const section = line.match(/^\*\*\* (Add|Update|Delete) File: (.+)$/);
    if (section !== null) {
      emit();
      path = safeString(section[2] ?? "", "patch path");
      added = "";
      deleting = section[1] === "Delete";
      continue;
    }
    if (path !== "" && line.startsWith("+") && !line.startsWith("+++")) {
      added += `${line.slice(1)}
`;
    }
  }
  emit();
  return edits;
}
function normalizeToolCall(value, contentLimit = MAX_FIELD_BYTES) {
  const raw = record(value);
  if (raw === void 0) throw new Error("invalid hook input: expected object");
  const input = record(raw["tool_input"]) ?? {};
  const tool = safeString(raw["tool_name"], "tool_name");
  const command = commandText(input["command"]);
  const file = safeString(input["file_path"] ?? input["path"], "file_path");
  let edits;
  if (file !== "") {
    edits = [{
      path: file,
      addedContent: safeString(input["content"] ?? input["new_string"], "edit content", contentLimit)
    }];
  } else {
    edits = parsePatchEdits(patchText(input));
  }
  const shellTargets = shellWriteTargets(command).filter((path) => !edits.some((edit) => edit.path === path)).map((path) => ({ path, addedContent: "" }));
  return { tool, command, edits: [...edits, ...shellTargets] };
}

import { closeSync, constants, fstatSync, openSync, readSync } from "node:fs";

import { resolve as resolve3 } from "node:path";
var MAX_SOURCE_BYTES = 65536;
var unresolved = (reason) => ({ kind: "unresolved", reason });
function object(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}
function source(content) {
  return Buffer.byteLength(content) <= MAX_SOURCE_BYTES ? { kind: "source", content } : unresolved("proposed file exceeds 64 KiB");
}
function replace(existing, input) {
  const before = input["old_string"];
  const after = input["new_string"];
  if (existing === void 0 || typeof before !== "string" || before === "" || typeof after !== "string") {
    return unresolved("Edit requires an existing file and a nonempty old_string");
  }
  const first = existing.indexOf(before);
  if (first < 0) return unresolved("old_string no longer matches the file");
  if (input["replace_all"] === true) {
    let count = 0;
    for (let index = first; index >= 0; index = existing.indexOf(before, index + before.length)) count += 1;
    const length = existing.length + count * (after.length - before.length);
    if (length > MAX_SOURCE_BYTES) return unresolved("replacement exceeds the 64 KiB source limit");
    return source(existing.split(before).join(after));
  }
  if (existing.indexOf(before, first + 1) >= 0) return unresolved("old_string matches more than once");
  return source(existing.slice(0, first) + after + existing.slice(first + before.length));
}
function update(existing, patch) {
  let lines = existing.replaceAll("\r\n", "\n").split("\n");
  let cursor = 0;
  let index = 0;
  let hunks = 0;
  let comparisons = 0;
  while (index < patch.length) {
    if (++hunks > 128 || !patch[index]?.startsWith("@@")) return unresolved("unsupported patch hunk");
    index += 1;
    const before = [];
    const after = [];
    while (index < patch.length && !patch[index]?.startsWith("@@")) {
      const line = patch[index++] ?? "";
      if (line === "*** End of File") {
        if (index !== patch.length) return unresolved("misplaced end-of-file marker");
        break;
      }
      if (![" ", "+", "-"].includes(line[0] ?? "")) return unresolved("unsupported patch line");
      if (!line.startsWith("+")) before.push(line.slice(1));
      if (!line.startsWith("-")) after.push(line.slice(1));
    }
    if (before.length === 0) return unresolved("patch insertion has no exact context");
    const matches2 = [];
    for (let start2 = cursor; start2 + before.length <= lines.length; start2 += 1) {
      comparisons += before.length;
      if (comparisons > 1e6) return unresolved("patch matching exceeds its comparison limit");
      if (before.every((line, offset) => lines[start2 + offset] === line)) matches2.push(start2);
      if (matches2.length > 1) break;
    }
    const start = matches2[0];
    if (matches2.length !== 1 || start === void 0) return unresolved("patch context is stale or ambiguous");
    lines = [...lines.slice(0, start), ...after, ...lines.slice(start + before.length)];
    cursor = start + after.length;
    if (Buffer.byteLength(lines.join("\n")) > MAX_SOURCE_BYTES) return unresolved("proposed file exceeds 64 KiB");
  }
  return source(lines.join("\n"));
}
function fromPatch(patch, root, target, existing) {
  if (Buffer.byteLength(patch) > 1024 * 1024) return unresolved("patch exceeds input limit");
  const lines = patch.replaceAll("\r\n", "\n").split("\n");
  if (lines[0] !== "*** Begin Patch" || !patch.trimEnd().endsWith("*** End Patch")) {
    return unresolved("patch requires complete begin and end markers");
  }
  const sections = [];
  let active;
  for (const line of lines) {
    const header = /^\*\*\* (Add|Update|Delete) File: (.+)$/.exec(line);
    if (header !== null) {
      active = resolve3(root, header[2] ?? "") === target ? { kind: header[1] ?? "", lines: [] } : void 0;
      if (active !== void 0) sections.push(active);
    } else if (line === "*** End Patch") {
      active = void 0;
    } else if (active !== void 0) active.lines.push(line);
  }
  const section = sections[0];
  if (sections.length !== 1 || section === void 0) return unresolved("patch must name the file exactly once");
  if (section.kind === "Add") {
    if (existing !== void 0 || section.lines.some((line) => !line.startsWith("+"))) {
      return unresolved("Add File requires a new file and literal added lines");
    }
    return source(`${section.lines.map((line) => line.slice(1)).join("\n")}
`);
  }
  if (section.kind !== "Update" || existing === void 0) return unresolved("patch requires an existing file");
  return update(existing, section.lines);
}
function proposedSource(raw, root, path, existing) {
  const call = object(raw);
  const input = object(call["tool_input"]);
  if (call["tool_name"] === "Write" && typeof input["content"] === "string") return source(input["content"]);
  if (call["tool_name"] === "Edit") return replace(existing, input);
  for (const key of ["patch", "input", "content", "command"]) {
    const value = input[key];
    if (typeof value === "string" && value.includes("*** Begin Patch")) {
      return fromPatch(value, root, resolve3(root, path), existing);
    }
  }
  return unresolved("tool input does not describe a reconstructable file");
}

function readOriginalSource(path) {
  let descriptor;
  try {
    descriptor = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK);
    const before = fstatSync(descriptor);
    if (!before.isFile()) return { kind: "unavailable" };
    const buffer = Buffer.alloc(MAX_SOURCE_BYTES + 1);
    let size = 0;
    while (size < buffer.length) {
      const count = readSync(descriptor, buffer, size, buffer.length - size, size);
      if (count === 0) break;
      size += count;
    }
    const after = fstatSync(descriptor);
    if (after.size !== before.size || after.mtimeMs !== before.mtimeMs || size !== Math.min(before.size, buffer.length)) return { kind: "unavailable" };
    return {
      kind: "read",
      header: buffer.subarray(0, Math.min(size, 8192)).toString("utf8"),
      source: size <= MAX_SOURCE_BYTES ? buffer.subarray(0, size).toString("utf8") : void 0
    };
  } catch (error) {
    return error instanceof Error && "code" in error && error.code === "ENOENT" ? { kind: "absent" } : { kind: "unavailable" };
  } finally {
    if (descriptor !== void 0) closeSync(descriptor);
  }
}

var SYNTAX_OPERATION_BUDGET_MS = 5e3;
function syntaxResult(value) {
  if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("kind" in value)) return void 0;
  if (value.kind === "invalid-request" || value.kind === "invalid-source" || value.kind === "limit" || value.kind === "unavailable") return { version: 1, kind: value.kind };
  if (value.kind !== "inspected" || !("lines" in value) || !Array.isArray(value.lines) || value.lines.length > 2e4 || !value.lines.every((line) => Number.isSafeInteger(line) && line > 0 && line <= 65537)) return void 0;
  return { version: 1, kind: "inspected", lines: value.lines };
}

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync as readFileSync4, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

var SYNTAX_WORKER_IDENTITY = { "sha256": "12e6a141d5bda6486f285da9af96d09c638ceb26a321f1362a1df064b8eefea3", "bytes": 3588399 };

function runSyntaxWorker(root, input, remainingMs) {
  const started = performance.now();
  const worker = fileURLToPath(new URL(true ? "./_syntax-worker.cjs" : "../../../core/hooks/_syntax-worker.cjs", import.meta.url));
  const identity = typeof define_VOID_SYNTAX_WORKER_IDENTITY_default === "object" ? define_VOID_SYNTAX_WORKER_IDENTITY_default : SYNTAX_WORKER_IDENTITY;
  try {
    if (identity.bytes > 8 * 1024 * 1024 || statSync(worker).size !== identity.bytes || createHash("sha256").update(readFileSync4(worker)).digest("hex") !== identity.sha256) {
      return { version: 1, kind: "unavailable" };
    }
    const timeout = Math.min(SYNTAX_OPERATION_BUDGET_MS, remainingMs) - (performance.now() - started);
    if (timeout < 1) return { version: 1, kind: "limit" };
    const child = spawnSync(process.execPath, ["--max-old-space-size=128", worker], {
      cwd: root,
      env: {},
      encoding: "utf8",
      timeout: Math.ceil(timeout),
      killSignal: "SIGKILL",
      maxBuffer: 65536,
      input: JSON.stringify({ version: 1, ...input }),
      windowsHide: true
    });
    if (child.error !== void 0 || child.status !== 0 || performance.now() - started > remainingMs) {
      return { version: 1, kind: "limit" };
    }
    return syntaxResult(JSON.parse(child.stdout)) ?? { version: 1, kind: "unavailable" };
  } catch {
    return { version: 1, kind: "unavailable" };
  }
}

function unavailableSyntax(reason, path, correction = "provide valid complete source within the limits; if the bundled parser is unavailable, repair the harness installation, then retry") {
  return {
    allow: false,
    code: "TEST_SYNTAX_UNVERIFIED",
    message: `source syntax verification unavailable: ${reason}; ${correction}`,
    evidence: [path]
  };
}
function syntaxVerdict(result, path, purpose) {
  try {
    if (!result || typeof result !== "object") throw new Error();
    if ("unavailable" in result && typeof result.unavailable === "string") {
      const permitted = [
        "bundled syntax parser is unavailable",
        "source could not be parsed within the supported limits"
      ];
      return unavailableSyntax(permitted.includes(result.unavailable) ? result.unavailable : "parser returned an invalid result", path);
    }
    const lines = "lines" in result ? result.lines : void 0;
    if (!Array.isArray(lines) || lines.length > 2e4 || !lines.every((line) => Number.isSafeInteger(line) && line > 0)) throw new Error();
    if (purpose === "declarations") return lines.length === 0 || lines.length === 1 && lines[0] === 1 ? {
      allow: true,
      code: lines.length === 0 ? "TDD_DECLARATION_NONE" : "TDD_DECLARATION_HEADER",
      message: "declaration comment syntax checked",
      evidence: []
    } : {
      allow: false,
      code: "TDD_DECLARATION_INVALID",
      message: "put exactly one E2E declaration comment on the first line",
      evidence: [path]
    };
    return lines.length === 0 ? { allow: true, code: "OK", message: "focused-test syntax checked", evidence: [] } : {
      allow: false,
      code: "FOCUSED_OR_SKIPPED_TEST",
      message: "focused or skipped test detected; use todo only for explicitly pending coverage",
      evidence: lines.map((line) => `${path}:${line}`)
    };
  } catch {
    return unavailableSyntax("parser returned an invalid result", path);
  }
}

function inspectSourceSyntax(root, path, source2, remainingMs = SYNTAX_OPERATION_BUDGET_MS, purpose = "focused-tests") {
  if (Buffer.byteLength(source2) > MAX_SOURCE_BYTES) return unavailableSyntax("file exceeds 64 KiB", path);
  if (remainingMs < 1) return unavailableSyntax("operation exhausted its five-second parsing budget", path, "split the operation into smaller edits");
  const result = runSyntaxWorker(root, { path, source: source2, purpose }, remainingMs);
  switch (result.kind) {
    case "inspected":
      return syntaxVerdict({ lines: result.lines }, path, purpose);
    case "invalid-source":
      return unavailableSyntax("source could not be parsed within the supported limits", path);
    case "limit":
      return unavailableSyntax("parser process failed or exceeded its resource limit", path);
    case "invalid-request":
    case "unavailable":
      return unavailableSyntax("bundled syntax parser is unavailable", path);
  }
}

// packages/core/data/identity.json
var identity_default = {
  repository: { owner: "voidcorp-core", name: "void-machine", formerNames: ["void-harness"] },
  packageName: "voidmachine",
  formerPackages: [{ name: "voidharness", lastMajor: 3 }],
  commands: { primary: "void-machine", aliases: ["vm"], deprecated: ["void-harness"] },
  markers: { namespace: "void-machine", deprecated: ["void-harness"] },
  environment: { prefix: "VOID_MACHINE_", deprecated: ["VOID_HARNESS_"] }
};

var SEGMENT = /^[a-z0-9][a-z0-9._-]*$/;
function isRecord(value) {
  return typeof value === "object" && value !== void 0 && value !== null && !Array.isArray(value);
}
function segment(value, field) {
  if (typeof value !== "string" || !SEGMENT.test(value)) {
    throw new Error(`product identity: ${field} must be a lowercase name without separators`);
  }
  return value;
}
function segments(value, field) {
  if (!Array.isArray(value)) throw new Error(`product identity: ${field} must be a list`);
  return value.map((entry, index) => segment(entry, `${field}[${index}]`));
}
function formerPackages(value) {
  if (value === void 0) return [];
  if (!Array.isArray(value)) throw new Error("product identity: formerPackages must be a list");
  return value.map((entry, index) => {
    const record8 = isRecord(entry) ? entry : {};
    const lastMajor = record8["lastMajor"];
    if (typeof lastMajor !== "number" || !Number.isInteger(lastMajor) || lastMajor < 0) {
      throw new Error(`product identity: formerPackages[${index}].lastMajor must be a whole number`);
    }
    return { name: segment(record8["name"], `formerPackages[${index}].name`), lastMajor };
  });
}
var NAMESPACE = SEGMENT;
var PREFIX = /^[A-Z][A-Z0-9_]*_$/;
function exclusive(current, deprecated, field) {
  if (deprecated.includes(current)) throw new Error(`product identity: ${current} is both current and deprecated (${field})`);
}
function pattern(value, shape, field, rule) {
  if (typeof value !== "string" || !shape.test(value)) throw new Error(`product identity: ${field} must be ${rule}`);
  return value;
}
function patterns(value, shape, field, rule) {
  if (!Array.isArray(value)) throw new Error(`product identity: ${field} must be a list`);
  return value.map((entry, index) => pattern(entry, shape, `${field}[${index}]`, rule));
}
function managed(namespaces, pair) {
  const recognized = namespaces.map(pair);
  const [current] = recognized;
  if (current === void 0) throw new Error("product identity: markers.namespace is required");
  return { current, recognized };
}
function markers(value) {
  const record8 = isRecord(value) ? value : {};
  const rule = "a lowercase name without separators";
  const namespace = pattern(record8["namespace"], NAMESPACE, "markers.namespace", rule);
  const deprecated = patterns(record8["deprecated"], NAMESPACE, "markers.deprecated", rule);
  exclusive(namespace, deprecated, "markers");
  const namespaces = [namespace, ...deprecated];
  return {
    agentDoc: managed(namespaces, (name) => ({ begin: `<!-- ${name}:begin -->`, end: `<!-- ${name}:end -->` })),
    contextContinuity: managed(namespaces, (name) => ({
      begin: `<!-- ${name}:context-continuity:begin -->`,
      end: `<!-- ${name}:context-continuity:end -->`
    })),
    gitignore: managed(namespaces, (name) => ({ begin: `# ${name}:begin`, end: `# ${name}:end` }))
  };
}
function environment(value) {
  const record8 = isRecord(value) ? value : {};
  const rule = "an upper-case prefix ending in _";
  const prefix = pattern(record8["prefix"], PREFIX, "environment.prefix", rule);
  const deprecated = patterns(record8["deprecated"], PREFIX, "environment.deprecated", rule);
  exclusive(prefix, deprecated, "environment");
  return { prefix, deprecated };
}
var MAJOR = /^(0|[1-9]\d*)\.\d+\.\d+/;
function parseProductIdentity(value) {
  if (!isRecord(value)) throw new Error("product identity: document must be an object");
  const repository = isRecord(value["repository"]) ? value["repository"] : {};
  const owner = segment(repository["owner"], "repository.owner");
  const name = segment(repository["name"], "repository.name");
  const formerNames = repository["formerNames"] === void 0 ? [] : segments(repository["formerNames"], "repository.formerNames");
  const commands = isRecord(value["commands"]) ? value["commands"] : {};
  const primary = segment(commands["primary"], "commands.primary");
  const aliases = segments(commands["aliases"], "commands.aliases");
  const deprecated = segments(commands["deprecated"], "commands.deprecated");
  const current = [primary, ...aliases];
  const clash = deprecated.find((command) => current.includes(command));
  if (clash !== void 0) throw new Error(`product identity: ${clash} is both current and deprecated`);
  const packageName = segment(value["packageName"], "packageName");
  const former = formerPackages(value["formerPackages"]);
  const byLastMajor = [...former].sort((left, right) => left.lastMajor - right.lastMajor);
  const packageFor = (version) => {
    const match = MAJOR.exec(version);
    if (match === null) return packageName;
    const major = Number(match[1]);
    return byLastMajor.find((entry) => major <= entry.lastMajor)?.name ?? packageName;
  };
  return {
    repository: { owner, name },
    repositorySlug: `${owner}/${name}`,
    repositoryUrl: `https://github.com/${owner}/${name}`,
    formerRepositorySlugs: formerNames.map((former2) => `${owner}/${former2}`),
    packageName,
    formerPackages: former,
    packageFor,
    commands: { primary, aliases, deprecated },
    markers: markers(value["markers"]),
    environment: environment(value["environment"])
  };
}
var PRODUCT_IDENTITY = parseProductIdentity(identity_default);
var PRODUCT_COMMAND = PRODUCT_IDENTITY.commands.primary;
function productSetting(env, name, identity = PRODUCT_IDENTITY) {
  for (const prefix of [identity.environment.prefix, ...identity.environment.deprecated]) {
    const value = env[`${prefix}${name}`];
    if (value !== void 0) return value;
  }
  return void 0;
}

var MAX_HOOK_INPUT_BYTES = 1024 * 1024;
var MAX_CI_CONTENT_BYTES = 8 * 1024 * 1024;
var BINARY_INPUT_MESSAGE = "HOOK_INPUT_BINARY: a NUL byte in the tool payload. A source file holding one is dropped from the project graph, and no diff shows it. A fixture that needs the byte builds it (String.fromCharCode(0), Buffer.concat) instead of holding it literally.";
function containsNul(value) {
  if (typeof value === "string") return value.includes("\0");
  if (Array.isArray(value)) return value.some((item) => containsNul(item));
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).some((item) => containsNul(item));
}
function parseHookText(input) {
  if (input.byteLength > MAX_HOOK_INPUT_BYTES) {
    throw new Error("HOOK_INPUT_TOO_LARGE");
  }
  return decodeText(input);
}
function parseCiContent(input) {
  if (input.byteLength > MAX_CI_CONTENT_BYTES) throw new Error("CI_CONTENT_TOO_LARGE");
  return decodeText(input);
}
function decodeText(input) {
  const text2 = new TextDecoder("utf-8", { fatal: true }).decode(input);
  if (text2.includes("\0")) throw new Error(BINARY_INPUT_MESSAGE);
  return text2;
}
function parseHookPayload(input) {
  const text2 = parseHookText(input);
  const parsed = JSON.parse(text2);
  if (containsNul(parsed)) throw new Error(BINARY_INPUT_MESSAGE);
  return parsed;
}
function physicalPath(path) {
  const absolute = resolve4(path);
  let existing = absolute;
  const suffix = [];
  while (true) {
    try {
      return join3(realpathSync(existing), ...suffix);
    } catch {
      const parent = dirname2(existing);
      if (parent === existing) return absolute;
      suffix.unshift(basename2(existing));
      existing = parent;
    }
  }
}
function discoverProjectRoot(start) {
  let current = physicalPath(start);
  while (true) {
    if (existsSync3(join3(current, ".void", "config.json")) || existsSync3(join3(current, ".git"))) {
      return current;
    }
    const parent = dirname2(current);
    if (parent === current) return physicalPath(start);
    current = parent;
  }
}
function projectRelativePath(root, path) {
  const physicalRoot = physicalPath(root);
  const absolute = physicalPath(isAbsolute2(path) ? path : resolve4(physicalRoot, path));
  const projectPath2 = relative2(physicalRoot, absolute).replaceAll("\\", "/");
  return projectPath2 === ".." || projectPath2.startsWith("../") || isAbsolute2(projectPath2) ? void 0 : projectPath2;
}
function projectEdits(root, edits) {
  return edits.flatMap((edit) => {
    const path = projectRelativePath(root, edit.path);
    return path === void 0 ? [] : [{ ...edit, path, originalPath: edit.path }];
  });
}
function record2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function configuredString(parent, key, fallback) {
  const value = parent?.[key];
  return typeof value === "string" ? value : fallback;
}
function configuredStrings(parent, key, fallback) {
  const value = parent?.[key];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    const kept = value.filter((entry) => typeof entry === "string");
    if (kept.length > 0) return kept;
  }
  return [fallback];
}
function readTddConfig(root) {
  let config = {};
  try {
    config = record2(JSON.parse(readFileSync5(join3(root, ".void/config.json"), "utf8"))) ?? {};
  } catch {
  }
  const modes = record2(config["modes"]);
  const paths = record2(config["paths"]);
  const configuredMode = configuredString(modes, "tdd", "auto");
  const mode = configuredMode === "strict" || configuredMode === "souple" || configuredMode === "exploratory" ? configuredMode : "auto";
  return {
    mode,
    businessGlobs: configuredStrings(paths, "business", "apps/*/src/**"),
    spikesGlob: configuredString(paths, "spikes", "apps/*/scripts/spike-*")
  };
}
function focusedVerdict(root, edits, raw, syntaxInspector) {
  const deadline = performance.now() + SYNTAX_OPERATION_BUDGET_MS;
  const governed = projectEdits(root, edits).filter((edit) => isTestPath(edit.path) && edit.operation !== "delete");
  const limit = () => unavailableSyntax(
    "operation exceeds its file or five-second work budget",
    "",
    "split the operation into smaller edits"
  );
  if (governed.length > 32) return limit();
  if (new Set(governed.map((edit) => edit.path)).size !== governed.length) {
    return unavailableSyntax("patch must name each physical file exactly once", "", "combine edits to the same file");
  }
  for (const edit of governed) {
    if (performance.now() >= deadline) return limit();
    const original = readOriginalSource(join3(root, edit.path));
    const proposed = proposedSource(raw, root, edit.originalPath, original.kind === "read" ? original.source : void 0);
    if (performance.now() >= deadline) return limit();
    if (proposed.kind === "unresolved") return unavailableSyntax(
      proposed.reason,
      edit.path,
      "provide an exact supported Edit/patch or a complete Write within 64 KiB"
    );
    if (!/\b(?:only|skip|xit|xdescribe)\b|\\u/.test(proposed.content)) continue;
    if (/^[ \t]*(?:(?:it|test|describe)\.only|(?:it|test)\.skip|xit|xdescribe)[ \t]*\(/.test(proposed.content)) {
      return noFocusedTest([{ path: edit.path, addedContent: proposed.content.split("\n")[0] ?? "" }]);
    }
    const verdict = syntaxInspector(root, edit.path, proposed.content, deadline - performance.now());
    if (performance.now() >= deadline) return limit();
    if (!verdict.allow) return verdict;
  }
  return governed.length > 0 && performance.now() >= deadline ? limit() : allow();
}
function declaredTest(root, content) {
  const lines = content.split(/\r?\n/);
  if (!/^\s*\/\/\s*tdd-cover:/.test(lines[0] ?? "")) return void 0;
  const match = /^\/\/ tdd-cover: e2e (.+)$/.exec(lines[0] ?? "");
  const path = match?.[1];
  if (path === void 0 || path !== path.trim() || isAbsolute2(path) || /^[A-Za-z]:|\\/.test(path) || path.split("/").some((part) => part === ".." || part === ".") || !isTestPath(path)) throw new Error("declare exactly one project-relative E2E spec on the first line");
  const target = realpathSync(join3(root, path));
  const location = relative2(root, target);
  if (location.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || location === ".." || isAbsolute2(location) || !statSync2(target).isFile()) {
    throw new Error("E2E spec must be a regular file inside the physical project root");
  }
  return path;
}
function tddOperationLimit(reason) {
  return {
    allow: false,
    code: "TDD_DECLARATION_UNVERIFIED",
    message: `cannot verify TDD evidence: ${reason}; split the operation into smaller edits`,
    evidence: []
  };
}
function tddVerdict(root, edits, raw, checkedOut, syntaxInspector) {
  const physicalRoot = physicalPath(root);
  const projectChanges = projectEdits(physicalRoot, edits);
  const config = readTddConfig(physicalRoot);
  const existingHeaders = {};
  const originalSources = {};
  const siblingTests = /* @__PURE__ */ new Set();
  const declaredTests = {};
  const proposedSources = {};
  const deadline = performance.now() + SYNTAX_OPERATION_BUDGET_MS;
  const governed = projectChanges.filter((edit) => !(edit.operation === "delete" && edit.addedContent === "") && tddApplies(edit.path, config.businessGlobs, [config.spikesGlob]));
  if (governed.length > 32) return tddOperationLimit("operation exceeds 32 governed production files");
  if (new Set(governed.map((edit) => edit.path)).size !== governed.length) {
    return tddOperationLimit("patch must name each physical file exactly once");
  }
  for (const edit of governed) {
    if (performance.now() >= deadline) return tddOperationLimit("operation exhausted its five-second work budget");
    const original = readOriginalSource(join3(physicalRoot, edit.path));
    if (original.kind === "unavailable") return {
      allow: false,
      code: "TDD_DECLARATION_UNVERIFIED",
      message: "cannot read original TDD mode; restore readable regular source before editing",
      evidence: [edit.path]
    };
    const existing = original.kind === "read" ? original.source : void 0;
    const proposed = checkedOut ? existing === void 0 ? { kind: "unresolved", reason: "checked-out source is absent or exceeds 64 KiB" } : { kind: "source", content: existing } : proposedSource(raw, physicalRoot, edit.originalPath, existing);
    if (performance.now() >= deadline) return tddOperationLimit("operation exhausted its five-second work budget");
    if (proposed.kind === "unresolved") return {
      allow: false,
      code: "TDD_DECLARATION_UNVERIFIED",
      message: `cannot verify E2E declaration: ${proposed.reason}; provide exact context, or a complete Write within 64 KiB (oversized originals require replacement or restructuring)`,
      evidence: [edit.path]
    };
    const [header = "", ...body] = proposed.content.split(/\r?\n/);
    const startsWithDeclaration = /^\/\/\s*tdd-cover:/.test(header);
    if (body.some((line) => line.includes("tdd-cover:")) || header.includes("tdd-cover:") && !startsWithDeclaration) {
      const syntax = syntaxInspector(
        physicalRoot,
        edit.path,
        proposed.content,
        deadline - performance.now(),
        "declarations"
      );
      if (performance.now() >= deadline) return tddOperationLimit("operation exhausted its five-second work budget");
      if (syntax.code === "TDD_DECLARATION_HEADER" && !startsWithDeclaration) {
        return {
          allow: false,
          code: "TDD_DECLARATION_INVALID",
          message: "put the E2E declaration on its own first line before code",
          evidence: [edit.path]
        };
      }
      if (!syntax.allow) return { ...syntax, code: syntax.code === "TDD_DECLARATION_INVALID" ? syntax.code : "TDD_DECLARATION_UNVERIFIED" };
    }
    try {
      proposedSources[edit.path] = proposed.content;
      const test = declaredTest(physicalRoot, proposed.content);
      if (test !== void 0) declaredTests[edit.path] = test;
      existingHeaders[edit.path] = original.kind === "read" ? original.header : "";
      originalSources[edit.path] = original.kind === "read" ? original.source : "";
    } catch {
      return {
        allow: false,
        code: "TDD_DECLARATION_INVALID",
        message: "put one // tdd-cover: e2e <project-relative spec> on the first line, pointing to an existing regular test file inside the project",
        evidence: [edit.path]
      };
    }
    for (const sibling of [
      edit.path.replace(/\.tsx$/, ".test.tsx"),
      edit.path.replace(/\.ts$/, ".test.ts"),
      edit.path.replace(/\.jsx$/, ".test.jsx"),
      edit.path.replace(/\.js$/, ".test.js")
    ]) {
      if (sibling !== edit.path && existsSync3(join3(physicalRoot, sibling))) {
        siblingTests.add(sibling);
      }
    }
  }
  const verdict = tddOrder({
    edits: projectChanges,
    mode: config.mode,
    businessGlobs: config.businessGlobs,
    spikeGlobs: [config.spikesGlob],
    existingHeaders,
    originalSources,
    siblingTests,
    declaredTests,
    proposedSources
  });
  return governed.length > 0 && performance.now() >= deadline ? tddOperationLimit("operation exhausted its five-second work budget") : verdict;
}
function evaluateRule(rule, rawInput, options) {
  const call = normalizeToolCall(
    rawInput,
    options.source === "checked-out" ? MAX_CI_CONTENT_BYTES : MAX_HOOK_INPUT_BYTES
  );
  const env = options.env ?? process.env;
  if (rule === "dangerous-command") {
    if (call.tool !== "Bash" && call.tool !== "shell") return allow();
    if (productSetting(env, "ALLOW_DANGEROUS") === "1") return allow("OVERRIDE", "one-shot override");
    return dangerousCommand(call.command);
  }
  if (call.tool !== "Edit" && call.tool !== "Write" && call.tool !== "apply_patch" && call.tool !== "Bash" && call.tool !== "shell") {
    return allow();
  }
  if (rule === "protected-file") {
    if (productSetting(env, "ALLOW_SECRET_EDIT") === "1") return allow("OVERRIDE", "one-shot override");
    const ownership = options.source === "checked-out" ? {} : { root: options.root };
    return protectedFile(call.edits.map((edit) => edit.path), ownership);
  }
  if (rule === "secret-content") return secretContent(call.edits);
  if (rule === "control-character") return controlCharacter(call.edits);
  if (rule === "tdd-order") return tddVerdict(
    options.root,
    call.edits,
    rawInput,
    options.source === "checked-out",
    options.syntaxInspector ?? inspectSourceSyntax
  );
  if (rule === "no-focused-test") return focusedVerdict(
    options.root,
    call.edits,
    rawInput,
    options.syntaxInspector ?? inspectSourceSyntax
  );
  const edits = projectEdits(options.root, call.edits);
  if (rule === "no-any") return noAny(edits);
  if (rule === "no-as-cast") return noAsCast(edits);
  if (rule === "no-console") return noConsole(edits, options.root);
  if (rule === "no-null") return noNull(edits);
  if (rule === "boundary-direction") return boundaryDirection(edits, options.root);
  if (rule === "test-name") return testName(edits);
  if (rule === "design-slop") return designSlop(edits);
  rule;
  throw new Error("UNKNOWN_ENFORCEMENT_RULE");
}

import { mkdirSync, readFileSync as readFileSync6, renameSync, writeFileSync } from "node:fs";
import { dirname as dirname3, join as join4 } from "node:path";
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
var isRecord2 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function cacheFilePath(env) {
  const xdg = env["XDG_CACHE_HOME"]?.trim();
  const home = env["HOME"]?.trim();
  const base = xdg !== void 0 && xdg !== "" ? xdg : home !== void 0 && home !== "" ? join4(home, ".cache") : void 0;
  return base === void 0 ? void 0 : join4(base, PRODUCT_COMMAND, "freshness.json");
}
function parseEntry(raw) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    return void 0;
  }
  if (!isRecord2(json)) return void 0;
  const { latest, checkedAt } = json;
  if (typeof latest !== "string" || latest.trim() === "") return void 0;
  if (typeof checkedAt !== "number" || !Number.isFinite(checkedAt)) return void 0;
  return { latest, checkedAt };
}
function readFreshnessCache(env, now) {
  const path = cacheFilePath(env);
  if (path === void 0) return void 0;
  let raw;
  try {
    raw = readFileSync6(path, "utf8");
  } catch {
    return void 0;
  }
  const entry = parseEntry(raw);
  if (entry === void 0) return void 0;
  const age = now - entry.checkedAt;
  return age >= 0 && age <= CACHE_TTL_MS ? entry : void 0;
}
async function writeFreshnessCache(env, entry) {
  const path = cacheFilePath(env);
  if (path === void 0) return void 0;
  const tmp = `${path}.${process.pid}.tmp`;
  try {
    mkdirSync(dirname3(path), { recursive: true });
    writeFileSync(tmp, JSON.stringify({ latest: entry.latest, checkedAt: entry.checkedAt }), "utf8");
    renameSync(tmp, path);
  } catch {
  }
  return void 0;
}

var SEMVER_TRIPLE = /^(\d{1,10})\.(\d{1,10})\.(\d{1,10})$/;
function clean(raw) {
  return raw.trim().replace(/^v/, "");
}
function triple(raw) {
  const match = SEMVER_TRIPLE.exec(clean(raw)) ?? void 0;
  if (match === void 0) return void 0;
  const parts = [Number(match[1]), Number(match[2]), Number(match[3])];
  return parts.every(Number.isSafeInteger) ? parts : void 0;
}
function unusable(raw) {
  const value = clean(raw);
  if (value === "") return "is empty";
  if (value === "unknown") return "is unknown";
  if (value.includes("-") || value.includes("+")) {
    return "is a prerelease or carries build metadata, which is not comparable";
  }
  return "is not a M.m.p version";
}
function compareFreshness(installed, latest) {
  const local = triple(installed);
  if (local === void 0) {
    return {
      verdict: "unknown",
      installed,
      latest,
      reason: `installed version ${unusable(installed)}`
    };
  }
  const remote = triple(latest);
  if (remote === void 0) {
    return {
      verdict: "unknown",
      installed,
      latest,
      reason: `published version ${unusable(latest)}`
    };
  }
  for (let i = 0; i < 3; i += 1) {
    const mine = local[i] ?? 0;
    const theirs = remote[i] ?? 0;
    if (mine !== theirs) {
      return { verdict: mine < theirs ? "behind" : "ahead", installed, latest };
    }
  }
  return { verdict: "up-to-date", installed, latest };
}

var DEFAULT_REGISTRY = "https://registry.npmjs.org";
var NPM_PACKAGE = PRODUCT_IDENTITY.packageName;
var DEFAULT_TIMEOUT_MS = 1500;
var isRecord3 = (v) => typeof v === "object" && v !== void 0 && v !== null && !Array.isArray(v);
function safeRegistry(candidate) {
  if (candidate === void 0 || candidate.trim() === "") return void 0;
  let url;
  try {
    url = new URL(candidate.trim());
  } catch {
    return void 0;
  }
  if (url.protocol !== "https:") return void 0;
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}
function registryFromNpmrc(npmrc) {
  if (npmrc === void 0) return void 0;
  for (const rawLine of npmrc.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#") || line.startsWith(";") || line.startsWith("//")) continue;
    const match = /^registry\s*=\s*(.+)$/i.exec(line) ?? void 0;
    if (match !== void 0) return match[1]?.trim();
  }
  return void 0;
}
function resolveRegistry(env, npmrc) {
  const fromEnv = safeRegistry(env["npm_config_registry"] ?? env["NPM_CONFIG_REGISTRY"]);
  if (fromEnv !== void 0) return fromEnv;
  return safeRegistry(registryFromNpmrc(npmrc)) ?? DEFAULT_REGISTRY;
}
function distTagsUrl(registry, pkg) {
  const name = pkg.trim();
  if (name === "" || name.includes("..") || name.startsWith("/")) {
    throw new Error(`unsafe package name: ${JSON.stringify(pkg)}`);
  }
  return `${registry}/-/package/${encodeURIComponent(name)}/dist-tags`;
}
function parseLatestTag(json) {
  if (!isRecord3(json)) return void 0;
  const latest = json["latest"];
  return typeof latest === "string" && latest.trim() !== "" ? latest.trim() : void 0;
}
async function fetchLatestVersion(options = {}) {
  const {
    fetchImpl = fetch,
    registry = DEFAULT_REGISTRY,
    pkg = NPM_PACKAGE,
    timeoutMs = DEFAULT_TIMEOUT_MS
  } = options;
  let url;
  try {
    url = distTagsUrl(registry, pkg);
  } catch {
    return { reason: "unsafe package name" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      headers: { "user-agent": PRODUCT_COMMAND },
      signal: controller.signal
    });
    if (!res.ok) {
      if (res.status === 403 || res.status === 429) return { reason: `HTTP ${res.status} (rate-limited)` };
      return { reason: `HTTP ${res.status}` };
    }
    let json;
    try {
      json = await res.json();
    } catch {
      return { reason: "malformed response" };
    }
    const latest = parseLatestTag(json);
    return latest === void 0 ? { reason: "no usable latest tag in response" } : { latest };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    return { reason: name === "AbortError" ? "timed out" : "network error" };
  } finally {
    clearTimeout(timer);
  }
}

import { readFileSync as readFileSync7, statSync as statSync3 } from "node:fs";
import { join as join5 } from "node:path";
var MAX_NPMRC_BYTES = 64 * 1024;
function readIfSmall(path) {
  try {
    if (statSync3(path).size > MAX_NPMRC_BYTES) return void 0;
    return readFileSync7(path, "utf8");
  } catch {
    return void 0;
  }
}
function readNpmrc(cwd, env) {
  const project = readIfSmall(join5(cwd, ".npmrc"));
  if (project !== void 0) return project;
  const home = env["HOME"]?.trim();
  return home === void 0 || home === "" ? void 0 : readIfSmall(join5(home, ".npmrc"));
}

async function resolveFreshness(options) {
  const { installed, env, now, fetchImpl, npmrc, cwd, allowNetwork = true, timeoutMs } = options;
  const cached = readFreshnessCache(env, now);
  if (cached !== void 0) return compareFreshness(installed, cached.latest);
  if (!allowNetwork) {
    return { verdict: "unknown", installed, reason: "no fresh cached version and network lookups are disabled" };
  }
  const resolvedNpmrc = npmrc ?? readNpmrc(cwd ?? process.cwd(), env);
  const { latest, reason } = await fetchLatestVersion({
    registry: resolveRegistry(env, resolvedNpmrc),
    ...fetchImpl === void 0 ? {} : { fetchImpl },
    ...timeoutMs === void 0 ? {} : { timeoutMs }
  });
  if (latest === void 0) {
    return { verdict: "unknown", installed, reason: reason ?? "could not read the published version" };
  }
  await writeFreshnessCache(env, { latest, checkedAt: now });
  return compareFreshness(installed, latest);
}
function freshnessRelay(freshness, source2) {
  if (freshness.verdict !== "behind" || source2 !== "local") return void 0;
  const { installed, latest } = freshness;
  return `A newer harness is published: ${installed} is installed, ${latest ?? "a newer version"} is available. Tell the user this once, near the start of your first reply, and offer to run \`${PRODUCT_COMMAND} update\`. Explain that update writes project files and link the release notes for possible breaking changes: ${PRODUCT_IDENTITY.repositoryUrl}/releases. Wait for explicit human permission before running it, even in autonomous mode. If the user declines or does not reply, continue the task without updating. Do not repeat the offer later in this session.`;
}

import { existsSync as existsSync5, mkdirSync as mkdirSync2, readFileSync as readFileSync9, readdirSync as readdirSync2, renameSync as renameSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { dirname as dirname4, join as join8 } from "node:path";

import { lstatSync, readFileSync as readFileSync8, readdirSync, statSync as statSync4 } from "node:fs";
import { join as join7 } from "node:path";

import { existsSync as existsSync4 } from "node:fs";
import { join as join6 } from "node:path";
var VOID_DIR = ".void";
var VOID_MACHINE_DIR = "machine";
var VOID_PREVIOUS_MACHINE_DIR = "local";
var VOID_OWNERSHIP = Object.freeze({
  // Declared: authored or hand-edited, never regenerable from a pin. These are
  // the ONLY things at the top of `.void/`, which is what makes "everything at
  // the top is committed" a rule you can see rather than one you must look up.
  "config.json": "project",
  "PROJECT-DOCTRINE.md": "project",
  "program.md": "project",
  knowledge: "project",
  // Plans, despite the name. Measured on sesame: eight committed `.plan.md`
  // files carrying frozen model decisions that still govern its schema. Read as
  // `observed`, doctor told the project to untrack its own architecture
  // decisions — and nothing writes this directory anyway. It is a leftover of
  // the `backlog-autopilot` engine deleted at the 2026-07-30 cutover; the
  // current autopilot writes to `machine/autopilot/`. So there is no writer to
  // redirect, only a classification that was wrong.
  "autonomous-runs": "project",
  // Derived: `void-machine install` re-materializes these, byte for byte from a
  // pin. Not committed — 1.2 MB of vendored prose rewritten on every bump — but
  // their absence degrades the agent rather than breaking the project.
  "PHILOSOPHY.md": "derived",
  // Derived AND committed, which is why it stays at the top rather than moving
  // into `installed/`. `.claude/settings.json` names this path and is itself
  // committed, so ignoring the runner would give a fresh clone a settings file
  // pointing at a missing file and every tool call would fail on it. See
  // `DERIVED_LOAD_BEARING`: its absence is an error, not a degradation.
  hooks: "derived",
  // Observed: this machine's history. Never meaningful in another checkout, and
  // losing it costs nothing.
  runs: "observed",
  cache: "observed",
  outputs: "observed",
  generated: "observed",
  archives: "observed",
  autopilot: "observed",
  receipts: "observed",
  history: "observed",
  worktrees: "observed",
  // Renamed from `state.json`, which named two different things: this snapshot
  // and an autopilot run's cursor. The cursor keeps its name inside its own run
  // directory, where nothing else competes for it.
  "status.json": "observed",
  // The session checkpoint. Observed on purpose: it is what THIS machine was
  // doing, so committing it would guarantee a conflict on a file rewritten every
  // evening while serving nobody else.
  "checkpoint.md": "observed",
  // Nothing WRITES these any more — the current telemetry is `runs/*/events.jsonl`
  // — but they still exist on disk in the park (424 KB in one project), and
  // "no longer read" is not "no longer there". Dropping them from this table
  // would let them fall through to the `project` default, and doctor would start
  // telling those projects to commit their own telemetry.
  "activations.jsonl": "observed",
  "outcomes.jsonl": "observed",
  "usage.log": "observed",
  // The pre-rename name of `status.json`. Classified for the same reason: it is
  // on disk in the park, and forgetting it here would make doctor ask projects
  // to commit it. `LEGACY_RENAMES` sends it to its new name on migration.
  "state.json": "observed"
});
var LEGACY_RENAMES = Object.freeze({
  "state.json": "status.json"
});
var RETIRED_ENTRIES = Object.freeze([
  "activations.jsonl",
  "outcomes.jsonl",
  "usage.log"
]);
var MATERIALIZED_OWNERSHIP = Object.freeze({
  // The project's own wiring: hand-editable, merged rather than regenerated.
  ".claude/settings.json": "project",
  // Regenerated by `init` from the harness assets.
  ".claude/skills/": "derived",
  ".claude/agents/": "derived",
  ".claude/commands/": "derived",
  ".agents/skills/": "derived",
  ".codex/agents/": "derived",
  ".void/hooks/": "derived",
  ".void/installed/PHILOSOPHY.md": "derived",
  ".codex/hooks.json": "derived"
});
var DERIVED_LOAD_BEARING = Object.freeze([
  ".void/hooks/",
  ".codex/hooks.json"
]);
var UNIT_ROOTS = Object.freeze([
  ".claude/skills",
  ".claude/agents",
  ".claude/commands",
  ".agents/skills",
  ".codex/agents"
]);
var PREFIXED_UNIT_ROOTS = Object.freeze([
  ".claude/skills",
  ".agents/skills"
]);
var LISTED_UNIT_ROOTS = Object.freeze([
  ".claude/agents",
  ".claude/commands",
  ".codex/agents"
]);
var MACHINE_ENTRIES = Object.freeze(
  Object.keys(VOID_OWNERSHIP).filter((entry) => VOID_OWNERSHIP[entry] === "observed").sort()
);
var INSTALLED_ENTRIES = Object.freeze(
  Object.keys(VOID_OWNERSHIP).filter((entry) => VOID_OWNERSHIP[entry] === "derived").filter((entry) => !DERIVED_LOAD_BEARING.includes(`${VOID_DIR}/${entry}/`)).sort()
);
var IGNORE_MARKERS = PRODUCT_IDENTITY.markers.gitignore;
function voidDir(root) {
  return join6(root, VOID_DIR);
}
function voidMachineDir(root) {
  return join6(root, VOID_DIR, VOID_MACHINE_DIR);
}
function previousMachinePath(root, ...segments2) {
  return join6(root, VOID_DIR, VOID_PREVIOUS_MACHINE_DIR, ...segments2);
}
function voidMachinePath(root, ...segments2) {
  return join6(voidMachineDir(root), ...segments2);
}
function legacyVoidPath(root, ...segments2) {
  return join6(voidDir(root), ...segments2);
}
function voidReadPath(root, ...segments2) {
  const candidates = [
    voidMachinePath(root, ...segments2),
    previousMachinePath(root, ...segments2),
    legacyVoidPath(root, ...segments2)
  ];
  return candidates.find((candidate) => existsSync4(candidate)) ?? candidates[0];
}

var MISSION_DIRECTORY = /^mis_[A-Za-z0-9_-]{8,100}$/;
var MAX_MISSION_LOGS = 1e4;
var MAX_JOURNAL_BYTES = 64 * 1024 * 1024;
function regularFile(path) {
  try {
    const info = lstatSync(path);
    return info.isFile() && !info.isSymbolicLink();
  } catch {
    return false;
  }
}
function missionEntries(runs) {
  try {
    const info = lstatSync(runs);
    if (!info.isDirectory() || info.isSymbolicLink()) return [];
    return readdirSync(runs, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !entry.isSymbolicLink() && MISSION_DIRECTORY.test(entry.name)).sort((a, b) => a.name.localeCompare(b.name)).slice(0, MAX_MISSION_LOGS);
  } catch {
    return [];
  }
}
function journalFiles(root) {
  const locations = [voidMachinePath(root, "runs"), legacyVoidPath(root, "runs")].filter((directory, index, all) => all.indexOf(directory) === index);
  const files = [];
  for (const runs of locations) {
    for (const entry of missionEntries(runs)) {
      const path = join7(runs, entry.name, "events.jsonl");
      if (!regularFile(path)) continue;
      try {
        const info = statSync4(path);
        files.push({ path, modifiedMs: info.mtimeMs, bytes: info.size });
      } catch {
      }
    }
  }
  return files;
}
function readMissionJournals(root, options = {}) {
  const ceiling = options.maxBytes ?? MAX_JOURNAL_BYTES;
  let files = journalFiles(root);
  if (options.recentMissions !== void 0) {
    files = [...files].sort((a, b) => b.modifiedMs - a.modifiedMs).slice(0, Math.max(0, options.recentMissions));
  }
  const parts = [];
  let bytes = 0;
  for (const file of [...files].sort((a, b) => a.modifiedMs - b.modifiedMs)) {
    if (file.bytes > ceiling || bytes + file.bytes > ceiling) break;
    try {
      parts.push(readFileSync8(file.path, "utf8"));
      bytes += file.bytes;
    } catch {
    }
  }
  return parts.join("\n");
}
function journalFingerprint(root) {
  let bytes = 0;
  let newest = 0;
  for (const file of journalFiles(root)) {
    bytes += file.bytes;
    if (file.modifiedMs > newest) newest = file.modifiedMs;
  }
  return `${Math.round(newest)}:${bytes}`;
}

var RETIRED_SKILLS = {
  "accessibility-first": "void-accessibility",
  "adr-workflow": "void-decide",
  "autonomous-backlog-loop": "void-autopilot",
  "backlog-autopilot": "void-autopilot",
  "backlog-batch": "void-autopilot",
  brainstorming: "void-brainstorm",
  "capture-rule": "void-learn",
  "claude-md-authoring": "void-claude-md",
  compounding: "void-learn",
  "context-management": "void-context",
  "harness-evolution": "void-learn",
  "learning-capture": "void-learn",
  "migrations-safety": "void-migrations",
  refactoring: "void-refactor",
  "session-handoff": "void-checkpoint",
  "systematic-debugging": "void-debug",
  "ticket-runner": "void-implement",
  "ticket-writer": "void-ticket",
  "verification-before-completion": "void-verify",
  "void-backlog-loop": "void-autopilot",
  "void-feedback": "void-learn",
  "writing-plans": "void-plan",
  // Every skill this harness ships gained the `void-` prefix. A project installed
  // before that carries journals full of the bare names, and someone who learnt
  // `/tdd` will type it again: both must land on an answer rather than on silence.
  accessibility: "void-accessibility",
  "accessibility-check": "void-accessibility-check",
  "api-and-interface-design": "void-api-and-interface-design",
  "async-safety": "void-async-safety",
  autopilot: "void-autopilot",
  "background-job-pattern": "void-background-job-pattern",
  brainstorm: "void-brainstorm",
  "cache-component-pattern": "void-cache-component-pattern",
  checkpoint: "void-checkpoint",
  "claude-md": "void-claude-md",
  "client-vs-server-component": "void-client-vs-server-component",
  "code-review": "void-code-review",
  "commit-discipline": "void-commit-discipline",
  context: "void-context",
  debug: "void-debug",
  decide: "void-decide",
  "dependency-direction": "void-dependency-direction",
  "devex-audit": "void-devex-audit",
  "domain-driven-design": "void-domain-driven-design",
  "drizzle-migration-safe": "void-drizzle-migration-safe",
  "eas-build-profile": "void-eas-build-profile",
  "env-validation": "void-env-validation",
  "expo-config-plugins": "void-expo-config-plugins",
  "expo-router-pattern": "void-expo-router-pattern",
  "form-pattern": "void-form-pattern",
  "frontend-design": "void-frontend-design",
  functional: "void-functional",
  "hexagonal-architecture": "void-hexagonal-architecture",
  implement: "void-implement",
  "install-prompt-ux": "void-install-prompt-ux",
  "instrumentation-setup": "void-instrumentation-setup",
  learn: "void-learn",
  "llm-cost-discipline": "void-llm-cost-discipline",
  "loading-error-boundaries": "void-loading-error-boundaries",
  "make-pdf": "void-make-pdf",
  "manifest-checklist": "void-manifest-checklist",
  merge: "void-merge",
  migrations: "void-migrations",
  observability: "void-observability",
  "offline-first-mutation": "void-offline-first-mutation",
  "ota-update-strategy": "void-ota-update-strategy",
  "package-extraction": "void-package-extraction",
  "parallel-routes-slots": "void-parallel-routes-slots",
  plan: "void-plan",
  "plan-review": "void-plan-review",
  qa: "void-qa",
  "rate-limit-strategy": "void-rate-limit-strategy",
  refactor: "void-refactor",
  retrospective: "void-retrospective",
  "route-group-decision": "void-route-group-decision",
  "security-audit": "void-security-audit",
  "security-guidance": "void-security-guidance",
  "server-action": "void-server-action",
  "service-package": "void-service-package",
  "service-worker-strategy": "void-service-worker-strategy",
  "source-driven-development": "void-source-driven-development",
  "state-architecture": "void-state-architecture",
  tdd: "void-tdd",
  testing: "void-testing",
  "testing-server-modules": "void-testing-server-modules",
  ticket: "void-ticket",
  "turbo-pipeline-tuning": "void-turbo-pipeline-tuning",
  "typescript-strict": "void-typescript-strict",
  "ui-review": "void-ui-review",
  verify: "void-verify",
  "webhook-handler-pattern": "void-webhook-handler-pattern"
};
function wasEverOurs(name) {
  return Object.hasOwn(RETIRED_SKILLS, name);
}

var SKILL_RUNTIME_DIRS = [".claude", ".agents"];
function bareName(raw) {
  const colon = raw.lastIndexOf(":");
  return colon >= 0 ? raw.slice(colon + 1) : raw;
}
function installedSkillNames(root) {
  const names = /* @__PURE__ */ new Set();
  for (const runtime3 of SKILL_RUNTIME_DIRS) {
    const skills = join8(root, runtime3, "skills");
    let entries;
    try {
      entries = readdirSync2(skills, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (existsSync5(join8(skills, entry.name, "SKILL.md"))) names.add(entry.name);
    }
  }
  return names;
}
function eachEvent(body, visit) {
  for (const line of body.split("\n")) {
    if (line === "") continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (typeof parsed !== "object" || parsed === null) continue;
    const record8 = parsed;
    const payload = record8["payload"];
    const category = typeof payload === "object" && payload !== null ? payload["category"] : void 0;
    visit({
      kind: typeof record8["kind"] === "string" ? record8["kind"] : "",
      missionId: typeof record8["missionId"] === "string" ? record8["missionId"] : "",
      category: typeof category === "string" ? category : "",
      subject: typeof record8["subject"] === "string" ? record8["subject"] : "",
      ts: typeof record8["ts"] === "string" ? record8["ts"] : ""
    });
  }
}
var LIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1e3;
function newestMission(body, nowMs) {
  let latest = "";
  let mission = "";
  eachEvent(body, (event) => {
    if (event.kind !== "runtime.tool.started") return;
    if (nowMs !== void 0) {
      const at = Date.parse(event.ts);
      if (!Number.isNaN(at) && at < nowMs - LIVE_WINDOW_MS) return;
    }
    if (event.ts > latest) {
      latest = event.ts;
      mission = event.missionId;
    }
  });
  return mission;
}
function recordedSkillNames(body, nowMs) {
  const names = [];
  const floor = nowMs === void 0 ? void 0 : nowMs - LIVE_WINDOW_MS;
  eachEvent(body, (event) => {
    if (event.kind !== "runtime.tool.started" || event.category !== "skill") return;
    if (!event.subject.startsWith("skill:")) return;
    if (floor !== void 0) {
      const at = Date.parse(event.ts);
      if (!Number.isNaN(at) && at < floor) return;
    }
    names.push({ name: bareName(event.subject.slice("skill:".length)), missionId: event.missionId });
  });
  return names;
}
function replacementFor(name) {
  return RETIRED_SKILLS[name];
}
function resolutionVerdict(body, installed, options = {}) {
  const recorded = recordedSkillNames(body, options.nowMs);
  const ours = (entry) => !installed.has(entry.name) && wasEverOurs(entry.name);
  const retired = [...new Set(recorded.filter(ours).map((entry) => entry.name))].sort();
  const newest = newestMission(body, options.nowMs);
  const unresolved2 = [
    ...new Set(recorded.filter((entry) => ours(entry) && entry.missionId === newest).map((entry) => entry.name))
  ].sort();
  return { ok: unresolved2.length === 0, unresolved: unresolved2, retired };
}
function withSuccessor(name) {
  const replacement = replacementFor(name);
  return replacement === void 0 ? name : `${name} -> ${replacement}`;
}
var MAX_NAMED = 5;
function invocationAlert(resolution, liveness) {
  if (resolution.ok && liveness.ok) return void 0;
  const lines = [`${PRODUCT_COMMAND}, invocation surface:`];
  if (!resolution.ok) {
    const named = resolution.unresolved.slice(0, MAX_NAMED).map(withSuccessor).join(", ");
    const rest = resolution.unresolved.length - MAX_NAMED;
    const tail = rest > 0 ? `, and ${rest} more` : "";
    lines.push(
      `  ${resolution.unresolved.length} skill invocation(s) in this run name a skill that no longer exists: ${named}${tail}`
    );
  }
  if (!liveness.ok) {
    lines.push(
      `  no skill fired in the last ${liveness.missions} working missions (${liveness.toolCalls} tool calls)`
    );
  }
  lines.push(`  run \`${PRODUCT_COMMAND} doctor\` for the detail`);
  return lines.join("\n");
}
var WORKING_MISSION_CALLS = 20;
var LIVENESS_WINDOW = 3;
function livenessVerdict(body) {
  const tallies = /* @__PURE__ */ new Map();
  eachEvent(body, (event) => {
    if (event.kind !== "runtime.tool.started" || event.missionId === "") return;
    const tally = tallies.get(event.missionId) ?? { toolCalls: 0, skillCalls: 0, lastTs: "" };
    tally.toolCalls += 1;
    if (event.category === "skill") tally.skillCalls += 1;
    if (event.ts > tally.lastTs) tally.lastTs = event.ts;
    tallies.set(event.missionId, tally);
  });
  const judged = [...tallies.values()].filter((tally) => tally.toolCalls >= WORKING_MISSION_CALLS).sort((a, b) => a.lastTs < b.lastTs ? 1 : a.lastTs > b.lastTs ? -1 : 0).slice(0, LIVENESS_WINDOW);
  const toolCalls = judged.reduce((total, tally) => total + tally.toolCalls, 0);
  const skillCalls = judged.reduce((total, tally) => total + tally.skillCalls, 0);
  const ok = judged.length < LIVENESS_WINDOW || judged.some((tally) => tally.skillCalls > 0);
  return { ok, missions: judged.length, toolCalls, skillCalls };
}
var REFRESH_MISSIONS = 20;
function cachePath(root) {
  return voidMachinePath(root, "invocation.json");
}
function cachedInvocationAlert(root) {
  try {
    const parsed = JSON.parse(readFileSync9(cachePath(root), "utf8"));
    if (typeof parsed !== "object" || parsed === null) return void 0;
    const alert = parsed["alert"];
    return typeof alert === "string" && alert !== "" ? alert : void 0;
  } catch {
    return void 0;
  }
}
function refreshInvocationVerdict(root) {
  try {
    const fingerprint = journalFingerprint(root);
    const path = cachePath(root);
    try {
      const previous = JSON.parse(readFileSync9(path, "utf8"));
      if (typeof previous === "object" && previous !== null && previous["fingerprint"] === fingerprint) return;
    } catch {
    }
    const journals = readMissionJournals(root, { recentMissions: REFRESH_MISSIONS });
    const alert = invocationAlert(
      resolutionVerdict(journals, installedSkillNames(root), { nowMs: Date.now() }),
      livenessVerdict(journals)
    );
    const entry = alert === void 0 ? { fingerprint } : { fingerprint, alert };
    mkdirSync2(dirname4(path), { recursive: true });
    const temporary = `${path}.${process.pid}.tmp`;
    writeFileSync2(temporary, `${JSON.stringify(entry)}
`);
    renameSync2(temporary, path);
  } catch {
  }
}

var DAY_MS = 864e5;
var STALE_DAYS = 7;
function auditCheckpoint(input) {
  const reasons = [];
  if (input.checkpoint === void 0) reasons.push("checkpoint-absent");
  else if (input.checkpoint.isEmpty) reasons.push("checkpoint-empty");
  if (input.checkpoint !== void 0 && input.checkpointWrittenAt !== void 0 && Math.max(0, input.now - input.checkpointWrittenAt) > STALE_DAYS * DAY_MS) {
    reasons.push("checkpoint-stale");
  }
  if (input.checkpoint?.branch !== void 0 && input.git.branch !== void 0 && input.checkpoint.branch !== input.git.branch) {
    reasons.push("checkpoint-branch-moved");
  }
  if (input.checkpoint?.head !== void 0 && input.git.head !== void 0 && input.checkpoint.head !== input.git.head) {
    reasons.push("checkpoint-head-moved");
  }
  return reasons.length === 0 ? { status: "ok", reasons } : { status: "degraded", reasons };
}

function sessionStartOutput(version, notice, invocationAlert2, resumeContext) {
  const installed = version.trim() === "" ? "unknown" : version.trim();
  const base = `${PRODUCT_COMMAND} ${installed} is active. Non-negotiable floor: never edit secrets or keys; never hand-edit lockfiles; regenerate them via the package manager for requested dependency changes; never run destructive shell commands; tests and fresh evidence gate "done". Capture durable project rules explicitly. Run \`${PRODUCT_COMMAND} doctor\` if runtime health is uncertain.`;
  const suffix = notice === void 0 || notice.trim() === "" ? "" : ` ${notice.trim()}`;
  const alert = invocationAlert2 === void 0 || invocationAlert2.trim() === "" ? "" : `
${invocationAlert2.trim()}`;
  const resume = resumeContext === void 0 || resumeContext.trim() === "" ? "" : `
${resumeContext.trimEnd()}`;
  return {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: `${base}${suffix}${alert}${resume}`
    }
  };
}

import { createHash as createHash3 } from "node:crypto";
import {
  closeSync as closeSync2,
  constants as constants3,
  fstatSync as fstatSync2,
  lstatSync as lstatSync3,
  mkdirSync as mkdirSync3,
  openSync as openSync2,
  readSync as readSync2,
  realpathSync as realpathSync3,
  renameSync as renameSync3,
  statSync as statSync5,
  unlinkSync,
  writeSync
} from "node:fs";
import { homedir } from "node:os";
import { basename as basename3, isAbsolute as isAbsolute4, join as join10, relative as relative4, resolve as resolve5 } from "node:path";

import { createHash as createHash2 } from "node:crypto";
var PROSE_SECTIONS = {
  objective: "objective",
  position: "position",
  state: "state",
  "where you are": "state",
  "next action": "nextAction",
  next: "nextAction"
};
var LIST_SECTIONS = {
  "open loops": "openLoops",
  open: "openLoops",
  "dead ends": "deadEnds",
  assumptions: "assumptions",
  "working set": "workingSet",
  files: "workingSet"
};
var MAX_INPUT = 5e5;
var MAX_LINE = 200;
var MAX_ITEMS = 20;
var MAX_PATH = 500;
function hashCheckpointObjective(objective) {
  return `sha256:${createHash2("sha256").update(objective?.trim() ?? "").digest("hex")}`;
}
function markerPositions(raw, marker) {
  const positions = [];
  let cursor = 0;
  while (cursor <= raw.length) {
    const found = raw.indexOf(marker, cursor);
    if (found < 0)
      break;
    positions.push(found);
    cursor = found + marker.length;
  }
  return positions;
}
function mechanicalBounds(raw, markers2) {
  const begins = markers2.recognized.flatMap((pair) => markerPositions(raw, pair.begin).map((at) => ({ at, pair })));
  const ends = markers2.recognized.flatMap((pair) => markerPositions(raw, pair.end).map((at) => ({ at, pair })));
  if (begins.length === 0 && ends.length === 0)
    return { status: "absent" };
  const begin = begins[0];
  const end = ends[0];
  if (begins.length !== 1 || ends.length !== 1 || begin === void 0 || end === void 0) {
    return { status: "invalid" };
  }
  if (begin.pair !== end.pair || end.at <= begin.at)
    return { status: "invalid" };
  return {
    status: "valid",
    begin: begin.at,
    end: end.at + end.pair.end.length,
    body: raw.slice(begin.at + begin.pair.begin.length, end.at)
  };
}
function semanticMarkdown(raw, markers2) {
  const bounds = mechanicalBounds(raw, markers2);
  return bounds.status === "valid" ? `${raw.slice(0, bounds.begin)}${raw.slice(bounds.end)}` : raw;
}
function scalar(block2, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}:\\s*(.*?)\\s*$`, "m").exec(block2)?.[1];
}
function integerScalar(block2, key) {
  const value = Number(scalar(block2, key));
  return Number.isSafeInteger(value) && value >= 0 ? value : void 0;
}
function booleanScalar(block2, key) {
  const value = scalar(block2, key);
  if (value === "true")
    return true;
  if (value === "false")
    return false;
  return void 0;
}
function pathList2(block2, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const section = new RegExp(`^### ${escaped}\\s*$([\\s\\S]*?)(?=^### |(?![\\s\\S]))`, "m").exec(block2)?.[1];
  if (section === void 0)
    return void 0;
  const paths = section.split(/\r?\n/).map((line) => /^- (.+)$/.exec(line)?.[1]).filter((path) => path !== void 0);
  if (paths.length > MAX_ITEMS)
    return void 0;
  if (paths.some((path) => path.length > MAX_PATH || [...path].some((character) => character.charCodeAt(0) < 32)))
    return void 0;
  return paths;
}
function stateFromMechanicalBody(block2) {
  const objectiveHash = scalar(block2, "objective_hash");
  const transcriptFingerprint = scalar(block2, "transcript_fingerprint");
  const workRevision = integerScalar(block2, "work_revision");
  const semanticRevision = integerScalar(block2, "semantic_revision");
  const sealedWorkRevision = integerScalar(block2, "sealed_work_revision");
  const readFiles = pathList2(block2, "Read files");
  const modifiedFiles = pathList2(block2, "Modified files");
  if (scalar(block2, "schema_version") !== "1" || objectiveHash === void 0 || !/^sha256:[a-f0-9]{64}$/.test(objectiveHash) || transcriptFingerprint === void 0 || !/^sha256:[a-f0-9]{64}$/.test(transcriptFingerprint) || workRevision === void 0 || semanticRevision === void 0 || sealedWorkRevision === void 0 || semanticRevision > workRevision || sealedWorkRevision > workRevision || readFiles === void 0 || modifiedFiles === void 0)
    return void 0;
  return mechanicalScalars(block2, {
    objectiveHash,
    transcriptFingerprint,
    workRevision,
    semanticRevision,
    sealedWorkRevision,
    readFiles,
    modifiedFiles
  });
}
function mechanicalScalars(block2, required) {
  const nudgeEmitted = booleanScalar(block2, "nudge_emitted");
  const unwatchableNotified = booleanScalar(block2, "unwatchable_notified") ?? false;
  const clearPending = booleanScalar(block2, "clear_pending");
  const transcriptCursorBytes = integerScalar(block2, "transcript_cursor_bytes");
  const lastMeasurementAtMs = integerScalar(block2, "last_measurement_at_ms");
  const lastUsedTokens = integerScalar(block2, "last_used_tokens");
  const readFilesOverflow = integerScalar(block2, "read_files_overflow");
  const modifiedFilesOverflow = integerScalar(block2, "modified_files_overflow");
  const lastResumeSource = scalar(block2, "last_resume_source");
  if (nudgeEmitted === void 0 || clearPending === void 0 || transcriptCursorBytes === void 0 || lastMeasurementAtMs === void 0 || lastUsedTokens === void 0 || readFilesOverflow === void 0 || modifiedFilesOverflow === void 0 || !isMechanicalResumeSource(lastResumeSource))
    return void 0;
  return {
    schemaVersion: 1,
    ...required,
    nudgeEmitted,
    unwatchableNotified,
    transcriptCursorBytes,
    lastMeasurementAtMs,
    lastUsedTokens,
    readFilesOverflow,
    modifiedFilesOverflow,
    clearPending,
    lastResumeSource
  };
}
function isMechanicalResumeSource(value) {
  return value === "none" || value === "startup" || value === "resume" || value === "clear" || value === "compact" || value === "fork";
}
function parseMechanicalContextBlock(raw, markers2) {
  const bounds = mechanicalBounds(raw, markers2);
  if (bounds.status === "absent")
    return { status: "absent" };
  if (bounds.status === "invalid")
    return { status: "invalid", reason: "ambiguous" };
  const state = stateFromMechanicalBody(bounds.body);
  return state === void 0 ? { status: "invalid", reason: "malformed" } : { status: "valid", state };
}
function renderPaths(paths) {
  return paths.map((path) => `- ${path}`).join("\n");
}
function renderMechanicalContextBlock(state, markers2) {
  return [
    markers2.current.begin,
    "## Mechanical context",
    "",
    "```yaml",
    "schema_version: 1",
    `objective_hash: ${state.objectiveHash}`,
    `work_revision: ${String(state.workRevision)}`,
    `semantic_revision: ${String(state.semanticRevision)}`,
    `sealed_work_revision: ${String(state.sealedWorkRevision)}`,
    `nudge_emitted: ${String(state.nudgeEmitted)}`,
    `unwatchable_notified: ${String(state.unwatchableNotified)}`,
    `transcript_fingerprint: ${state.transcriptFingerprint}`,
    `transcript_cursor_bytes: ${String(state.transcriptCursorBytes)}`,
    `last_measurement_at_ms: ${String(state.lastMeasurementAtMs)}`,
    `last_used_tokens: ${String(state.lastUsedTokens)}`,
    `read_files_overflow: ${String(state.readFilesOverflow)}`,
    `modified_files_overflow: ${String(state.modifiedFilesOverflow)}`,
    `clear_pending: ${String(state.clearPending)}`,
    `last_resume_source: ${state.lastResumeSource}`,
    "```",
    "",
    "### Read files",
    "",
    renderPaths(state.readFiles),
    "",
    "### Modified files",
    "",
    renderPaths(state.modifiedFiles),
    markers2.current.end
  ].join("\n");
}
function mergeRecentPaths(current, overflow, observed) {
  if (observed === void 0 || observed.length === 0) {
    return { paths: current, overflow, changed: false };
  }
  const uniqueObserved = [...new Set(observed)];
  const merged = [
    ...current.filter((path) => !uniqueObserved.includes(path)),
    ...uniqueObserved
  ];
  const displaced = Math.max(0, merged.length - MAX_ITEMS);
  const paths = merged.slice(displaced);
  const changed = displaced > 0 || paths.length !== current.length || paths.some((path, index) => path !== current[index]);
  return {
    paths: changed ? paths : current,
    overflow: overflow + displaced,
    changed
  };
}
function advanceMechanicalContext(state, observation) {
  if (observation.objectiveHash !== void 0 && observation.objectiveHash !== state.objectiveHash) {
    const revision = state.workRevision + 1;
    return {
      ...state,
      objectiveHash: observation.objectiveHash,
      workRevision: revision,
      semanticRevision: revision,
      sealedWorkRevision: 0,
      nudgeEmitted: false,
      unwatchableNotified: false,
      readFiles: [],
      modifiedFiles: [],
      readFilesOverflow: 0,
      modifiedFilesOverflow: 0,
      clearPending: false
    };
  }
  const reads = mergeRecentPaths(state.readFiles, state.readFilesOverflow, observation.readFiles);
  const modifications = mergeRecentPaths(state.modifiedFiles, state.modifiedFilesOverflow, observation.modifiedFiles);
  const tokensChanged = observation.usedTokens !== void 0 && observation.usedTokens !== state.lastUsedTokens;
  const sourceChanged = observation.resumeSource !== void 0 && observation.resumeSource !== state.lastResumeSource;
  const cycleChanged = observation.resumeSource === "compact" ? state.nudgeEmitted : observation.resumeSource === "clear" && !state.clearPending;
  const workChanged = reads.changed || modifications.changed || tokensChanged || sourceChanged || cycleChanged;
  const workRevision = state.workRevision + (workChanged ? 1 : 0);
  const reconcile = observation.semanticCheckpointWritten === true;
  const sealChanged = observation.compactionSealed === true && state.sealedWorkRevision !== workRevision;
  if (!workChanged && !reconcile && !sealChanged)
    return state;
  return {
    ...state,
    workRevision,
    semanticRevision: reconcile ? workRevision : state.semanticRevision,
    sealedWorkRevision: observation.compactionSealed === true ? workRevision : reconcile ? 0 : state.sealedWorkRevision,
    nudgeEmitted: observation.resumeSource === "clear" || observation.resumeSource === "compact" ? false : state.nudgeEmitted,
    unwatchableNotified: observation.resumeSource === "clear" || observation.resumeSource === "compact" ? false : state.unwatchableNotified,
    lastUsedTokens: observation.usedTokens ?? state.lastUsedTokens,
    readFiles: reads.paths,
    modifiedFiles: modifications.paths,
    readFilesOverflow: reads.overflow,
    modifiedFilesOverflow: modifications.overflow,
    clearPending: reconcile ? false : observation.resumeSource === "clear" || state.clearPending,
    lastResumeSource: observation.resumeSource ?? state.lastResumeSource
  };
}
function evaluateContextMeasurement(state, measurement) {
  const usedTokens = Number.isSafeInteger(measurement.usedTokens) && measurement.usedTokens >= 0 ? measurement.usedTokens : state.lastUsedTokens;
  const tokensChanged = usedTokens !== state.lastUsedTokens;
  const windowKnown = Number.isSafeInteger(measurement.windowTokens) && (measurement.windowTokens ?? 0) > 0;
  const thresholdValid = Number.isSafeInteger(measurement.thresholdPercent) && measurement.thresholdPercent >= 40 && measurement.thresholdPercent <= 60;
  const usagePercent = windowKnown ? usedTokens / (measurement.windowTokens ?? 1) * 100 : void 0;
  const revisionAfterTokens = state.workRevision + (tokensChanged ? 1 : 0);
  const unjudgeable = !windowKnown ? "window-unknown" : thresholdValid ? void 0 : "threshold-unusable";
  const emitNudge = usagePercent !== void 0 && thresholdValid && usagePercent >= measurement.thresholdPercent && !state.nudgeEmitted && state.semanticRevision < revisionAfterTokens;
  const workChanged = tokensChanged || emitNudge;
  const measuredAtMs = Number.isSafeInteger(measurement.measuredAtMs) && measurement.measuredAtMs >= 0 ? measurement.measuredAtMs : state.lastMeasurementAtMs;
  const changed = workChanged || measuredAtMs !== state.lastMeasurementAtMs;
  const next = changed ? {
    ...state,
    workRevision: state.workRevision + (workChanged ? 1 : 0),
    nudgeEmitted: state.nudgeEmitted || emitNudge,
    lastMeasurementAtMs: measuredAtMs,
    lastUsedTokens: usedTokens
  } : state;
  return {
    state: next,
    emitNudge,
    ...usagePercent === void 0 ? {} : { usagePercent },
    ...unjudgeable === void 0 ? {} : { unjudgeable }
  };
}
function mergeMechanicalContextBlock(raw, state, markers2) {
  const bounds = mechanicalBounds(raw, markers2);
  if (bounds.status === "invalid")
    return { ok: false, error: "ambiguous-mechanical-block" };
  const block2 = renderMechanicalContextBlock(state, markers2);
  if (bounds.status === "absent") {
    const separator = raw === "" || raw.endsWith("\n\n") ? "" : raw.endsWith("\n") ? "\n" : "\n\n";
    return { ok: true, value: `${raw}${separator}${block2}
` };
  }
  return {
    ok: true,
    value: `${raw.slice(0, bounds.begin)}${block2}${raw.slice(bounds.end)}`
  };
}
function clamp(text2) {
  const flat = [...text2].filter((ch) => {
    const point = ch.codePointAt(0) ?? 0;
    return point >= 32 || ch === "\n" || ch === "	";
  }).join("").trim();
  return flat.length <= MAX_LINE ? flat : `${flat.slice(0, MAX_LINE - 1)}\u2026`;
}
function frontmatterField(raw, key) {
  const block2 = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)?.[1];
  if (block2 === void 0)
    return void 0;
  for (const line of block2.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 1)
      continue;
    if (line.slice(0, separator).trim().toLowerCase() !== key)
      continue;
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    return value === "" ? void 0 : clamp(value);
  }
  return void 0;
}
function bodyOf(raw) {
  return /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n([\s\S]*))?$/.exec(raw)?.[1] ?? raw;
}
function sectionsOf(body) {
  const found = [];
  for (const line of body.split(/\r?\n/)) {
    const heading = /^#{1,6}\s+(.+?)\s*$/.exec(line) ?? void 0;
    if (heading !== void 0) {
      found.push({ title: (heading[1] ?? "").toLowerCase().replace(/\s+/g, " ").trim(), lines: [] });
      continue;
    }
    found[found.length - 1]?.lines.push(line);
  }
  return found;
}
function prose(lines) {
  const text2 = lines.join("\n").trim();
  return text2 === "" ? void 0 : text2;
}
function bullets(lines) {
  const items = [];
  let open2 = false;
  for (const line of lines) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line)?.[1];
    if (bullet !== void 0) {
      items.push(bullet);
      open2 = true;
      continue;
    }
    if (line.trim() === "") {
      open2 = false;
      continue;
    }
    if (open2 && items.length > 0) {
      items[items.length - 1] = `${items[items.length - 1] ?? ""} ${line.trim()}`;
    }
  }
  return items.map((item) => clamp(item)).filter((item) => item !== "").slice(0, MAX_ITEMS);
}
function parseCheckpoint(raw, markers2) {
  const bounded = raw.length > MAX_INPUT ? raw.slice(0, MAX_INPUT) : raw;
  const mechanical = parseMechanicalContextBlock(bounded, markers2);
  const semantic = semanticMarkdown(bounded, markers2);
  const proseFields = {};
  const listFields = {
    openLoops: [],
    deadEnds: [],
    assumptions: [],
    workingSet: []
  };
  for (const section of sectionsOf(bodyOf(semantic))) {
    const proseKey = PROSE_SECTIONS[section.title];
    if (proseKey !== void 0) {
      const text2 = prose(section.lines);
      if (text2 !== void 0)
        proseFields[proseKey] = text2;
      continue;
    }
    const listKey = LIST_SECTIONS[section.title];
    if (listKey !== void 0)
      listFields[listKey] = bullets(section.lines);
  }
  const objective = proseFields["objective"];
  const nextAction = proseFields["nextAction"];
  const resumeSource = objective ?? nextAction;
  const resumeLine = resumeSource === void 0 ? void 0 : clamp(resumeSource.split("\n")[0] ?? "");
  const branch = frontmatterField(bounded, "branch");
  const head = frontmatterField(bounded, "head");
  const date = frontmatterField(bounded, "date");
  const isEmpty = objective === void 0 && nextAction === void 0 && proseFields["state"] === void 0 && proseFields["position"] === void 0 && Object.values(listFields).every((items) => items.length === 0) && mechanical.status !== "valid";
  return {
    ...objective === void 0 ? {} : { objective },
    ...proseFields["position"] === void 0 ? {} : { position: proseFields["position"] },
    ...proseFields["state"] === void 0 ? {} : { state: proseFields["state"] },
    ...nextAction === void 0 ? {} : { nextAction },
    openLoops: listFields["openLoops"] ?? [],
    deadEnds: listFields["deadEnds"] ?? [],
    assumptions: listFields["assumptions"] ?? [],
    workingSet: listFields["workingSet"] ?? [],
    ...branch === void 0 ? {} : { branch },
    ...head === void 0 ? {} : { head },
    ...date === void 0 ? {} : { date },
    ...resumeLine === void 0 || resumeLine === "" ? {} : { resumeLine },
    ...mechanical.status === "valid" ? { mechanicalContext: mechanical.state } : {},
    mechanicalBlockStatus: mechanical.status,
    isEmpty
  };
}
function checkpointCodec(markers2) {
  const all = markers2.recognized.flatMap((pair) => [pair.begin, pair.end]);
  return {
    parseCheckpoint: (raw) => parseCheckpoint(raw, markers2),
    parseMechanicalContextBlock: (raw) => parseMechanicalContextBlock(raw, markers2),
    renderMechanicalContextBlock: (state) => renderMechanicalContextBlock(state, markers2),
    mergeMechanicalContextBlock: (raw, state) => mergeMechanicalContextBlock(raw, state, markers2),
    mentionsMarker: (text2) => all.some((marker) => text2.includes(marker))
  };
}

var DAY_MS2 = 864e5;
var STALE_DAYS2 = 7;
var CONTEXT_CHARS_MAX = 4e3;
function summarizeProgram(descriptor) {
  return {
    status: descriptor.status,
    program: descriptor.program,
    plan: descriptor.plan,
    spec: descriptor.spec,
    ...descriptor.progress === void 0 ? {} : {
      progress: {
        provider: descriptor.progress.provider,
        scope: descriptor.progress.scope
      }
    }
  };
}
function programGap(input) {
  if (input.programError !== void 0) {
    return { reason: "program-invalid", detail: input.programError };
  }
  if (input.program === void 0) {
    return {
      reason: "program-absent",
      detail: "no .void/program.md; resume can still use a local checkpoint and Git"
    };
  }
  return void 0;
}
function checkpointGap(input) {
  if (input.checkpoint === void 0) {
    return {
      reason: "checkpoint-absent",
      detail: "no .void/machine/checkpoint.md; invoke void-checkpoint before ending a session"
    };
  }
  if (input.checkpoint.isEmpty) {
    return {
      reason: "checkpoint-empty",
      detail: "the checkpoint exists but carries no recognised session residue"
    };
  }
  if (input.checkpointWrittenAt === void 0)
    return void 0;
  const ageDays = Math.max(0, Math.floor((input.now - input.checkpointWrittenAt) / DAY_MS2));
  return ageDays > STALE_DAYS2 ? {
    reason: "checkpoint-stale",
    detail: `the checkpoint is ${String(ageDays)} days old`
  } : void 0;
}
function treeGaps(input) {
  const gaps = [];
  const checkpoint = input.checkpoint;
  if (checkpoint?.branch !== void 0 && input.git.branch !== void 0 && checkpoint.branch !== input.git.branch) {
    gaps.push({
      reason: "checkpoint-branch-moved",
      detail: `checkpoint branch ${checkpoint.branch}; current branch ${input.git.branch}`
    });
  }
  if (checkpoint?.head !== void 0 && input.git.head !== void 0 && checkpoint.head !== input.git.head) {
    gaps.push({
      reason: "checkpoint-head-moved",
      detail: `checkpoint HEAD ${checkpoint.head}; current HEAD ${input.git.head}`
    });
  }
  return gaps;
}
function continuityFor(input) {
  if (input.resumeSource === "clear") {
    return { status: "degraded", reasons: ["clear-not-reconciled"] };
  }
  const checkpoint = input.checkpoint;
  if (checkpoint?.mechanicalBlockStatus === "invalid") {
    return { status: "degraded", reasons: ["mechanical-block-invalid"] };
  }
  const mechanical = checkpoint?.mechanicalContext;
  if (mechanical === void 0) {
    return { status: "degraded", reasons: ["mechanical-block-absent"] };
  }
  const reasons = [];
  if (mechanical.semanticRevision < mechanical.workRevision) {
    reasons.push("semantic-revision-behind");
  }
  if (input.resumeSource === "compact" && mechanical.sealedWorkRevision !== mechanical.workRevision) {
    reasons.push("precompact-seal-unconfirmed");
  }
  if (mechanical.clearPending)
    reasons.push("clear-not-reconciled");
  return reasons.length === 0 ? { status: "complete", reasons } : { status: "degraded", reasons };
}
function continuityGaps(continuity) {
  return continuity.reasons.map((reason) => {
    switch (reason) {
      case "mechanical-block-absent":
        return { reason, detail: "the mechanical context block is absent" };
      case "mechanical-block-invalid":
        return { reason, detail: "the mechanical context block is ambiguous or malformed" };
      case "semantic-revision-behind":
        return {
          reason: "checkpoint-semantic-stale",
          detail: "the semantic revision is behind mechanical work"
        };
      case "precompact-seal-unconfirmed":
        return {
          reason,
          detail: "the pre-compaction seal is not confirmed for the latest work revision"
        };
      case "clear-not-reconciled":
        return { reason: "clear-unreconciled", detail: "the last clear is not reconciled" };
      default: {
        const exhaustive = reason;
        return exhaustive;
      }
    }
  });
}
function composeResumeBundle(input) {
  const continuity = continuityFor(input);
  const gaps = [
    programGap(input),
    checkpointGap(input),
    ...treeGaps(input),
    ...continuityGaps(continuity)
  ].filter((gap) => gap !== void 0);
  return {
    schemaVersion: 1,
    project: input.project,
    ...input.program === void 0 ? {} : { program: summarizeProgram(input.program) },
    ...input.checkpoint === void 0 ? {} : { checkpoint: input.checkpoint },
    git: {
      ...input.git.branch === void 0 ? {} : { branch: input.git.branch },
      ...input.git.head === void 0 ? {} : { head: input.git.head },
      dirtyFiles: input.git.dirtyFiles
    },
    gaps,
    continuity
  };
}
function checkpointContext(checkpoint) {
  const mechanical = checkpoint.mechanicalContext;
  const readOverflow = mechanical === void 0 || mechanical.readFilesOverflow === 0 ? "" : ` (+${String(mechanical.readFilesOverflow)} older)`;
  const modifiedOverflow = mechanical === void 0 || mechanical.modifiedFilesOverflow === 0 ? "" : ` (+${String(mechanical.modifiedFilesOverflow)} older)`;
  return [
    checkpoint.date === void 0 ? void 0 : `Checkpoint date: ${checkpoint.date}`,
    checkpoint.objective === void 0 ? void 0 : `Objective: ${checkpoint.objective}`,
    checkpoint.position === void 0 ? void 0 : `Position: ${checkpoint.position}`,
    checkpoint.state === void 0 ? void 0 : `State: ${checkpoint.state}`,
    checkpoint.nextAction === void 0 ? void 0 : `Next action: ${checkpoint.nextAction}`,
    checkpoint.openLoops.length === 0 ? void 0 : `Open loops: ${checkpoint.openLoops.join("; ")}`,
    checkpoint.deadEnds.length === 0 ? void 0 : `Dead ends: ${checkpoint.deadEnds.join("; ")}`,
    checkpoint.assumptions.length === 0 ? void 0 : `Unverified assumptions: ${checkpoint.assumptions.join("; ")}`,
    mechanical === void 0 || mechanical.readFiles.length === 0 ? void 0 : `Read files: ${mechanical.readFiles.join(", ")}${readOverflow}`,
    mechanical === void 0 || mechanical.modifiedFiles.length === 0 ? void 0 : `Modified files: ${mechanical.modifiedFiles.join(", ")}${modifiedOverflow}`
  ].filter((line) => line !== void 0);
}
function boundedResumeLines(required, optional) {
  const requiredText = required.join("\n");
  const remaining = CONTEXT_CHARS_MAX - requiredText.length - 1;
  if (remaining <= 0 || optional.length === 0) {
    return `${requiredText.slice(0, CONTEXT_CHARS_MAX - 1)}
`;
  }
  const optionalText = optional.join("\n");
  const boundedOptional = optionalText.length <= remaining ? optionalText : `${optionalText.slice(0, Math.max(0, remaining - 3))}...`;
  return `${requiredText}
${boundedOptional}
`.slice(0, CONTEXT_CHARS_MAX);
}
function renderResumeContext(bundle) {
  const usefulCheckpoint = bundle.checkpoint !== void 0 && !bundle.checkpoint.isEmpty;
  if (bundle.program === void 0 && !usefulCheckpoint && bundle.continuity.status === "complete")
    return "";
  const continuityReasons = /* @__PURE__ */ new Set([
    "mechanical-block-absent",
    "mechanical-block-invalid",
    "checkpoint-semantic-stale",
    "precompact-seal-unconfirmed",
    "clear-unreconciled"
  ]);
  const required = [
    "[void-machine resume]",
    `Project: ${bundle.project.name}`,
    `Context continuity: ${bundle.continuity.status}`,
    ...bundle.continuity.status === "degraded" ? ["Reconstruct context before any mutation."] : [],
    ...bundle.gaps.filter((gap) => continuityReasons.has(gap.reason)).map((gap) => `Gap: ${gap.detail}`)
  ];
  const optional = [];
  if (bundle.git.branch !== void 0)
    optional.push(`Branch: ${bundle.git.branch}`);
  if (bundle.git.head !== void 0)
    optional.push(`HEAD: ${bundle.git.head}`);
  if (bundle.git.dirtyFiles > 0)
    optional.push(`Dirty files: ${String(bundle.git.dirtyFiles)}`);
  if (bundle.program !== void 0) {
    optional.push(`Program: ${bundle.program.program}`);
    optional.push(`Plan: ${bundle.program.plan}`);
    optional.push(`Spec: ${bundle.program.spec}`);
    if (bundle.program.progress !== void 0) {
      optional.push(`Progress: ${bundle.program.progress.provider} at ${bundle.program.progress.scope}`);
    }
  }
  if (usefulCheckpoint && bundle.checkpoint !== void 0) {
    optional.push(...checkpointContext(bundle.checkpoint));
  }
  optional.push(...bundle.gaps.filter((gap) => !continuityReasons.has(gap.reason)).map((gap) => `Gap: ${gap.detail}`));
  return boundedResumeLines(required, optional);
}

var {
  parseCheckpoint: parseCheckpoint2,
  parseMechanicalContextBlock: parseMechanicalContextBlock2,
  renderMechanicalContextBlock: renderMechanicalContextBlock2,
  mergeMechanicalContextBlock: mergeMechanicalContextBlock2,
  mentionsMarker: mentionsCheckpointMarker
} = checkpointCodec(PRODUCT_IDENTITY.markers.contextContinuity);

import {
  accessSync,
  constants as constants2,
  lstatSync as lstatSync2,
  readFileSync as readFileSync10,
  realpathSync as realpathSync2
} from "node:fs";
import { delimiter, isAbsolute as isAbsolute3, join as join9, relative as relative3 } from "node:path";
function record3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function boundedInteger(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}
function within(root, target) {
  const rel = relative3(root, target);
  return rel === "" || !rel.startsWith("..") && !isAbsolute3(rel);
}
function executable(path) {
  try {
    accessSync(path, process.platform === "win32" ? constants2.F_OK : constants2.X_OK);
    return true;
  } catch {
    return false;
  }
}
function findExecutable(name, root, env) {
  if ((isAbsolute3(name) || name.includes("/") || name.includes("\\")) && executable(name)) {
    return name;
  }
  const suffixes = process.platform === "win32" ? ["", ".cmd", ".exe", ".bat"] : [""];
  const local = join9(root, "node_modules", ".bin", name);
  for (const suffix of suffixes) {
    if (executable(`${local}${suffix}`)) return `${local}${suffix}`;
  }
  for (const directory of (env["PATH"] ?? "").split(delimiter)) {
    if (directory === "") continue;
    for (const suffix of suffixes) {
      const candidate = join9(directory, `${name}${suffix}`);
      if (executable(candidate)) return candidate;
    }
  }
  return void 0;
}
function safeExistingFiles(paths, root) {
  const canonicalRoot = realpathSync2(root);
  return paths.filter((path) => {
    try {
      const info = lstatSync2(path);
      if (!info.isFile() || info.isSymbolicLink()) return false;
      return within(canonicalRoot, realpathSync2(path));
    } catch {
      return false;
    }
  });
}
function readJson(path) {
  try {
    return JSON.parse(readFileSync10(path, "utf8"));
  } catch {
    return void 0;
  }
}

var CHECKPOINT = join10(".void", "machine", "checkpoint.md");
var MAX_CHECKPOINT_BYTES = 5e5;
var LOCK_STALE_MS = 1e3;
var POST_TOOL_MEASUREMENT_COOLDOWN_MS = 5e3;
var MAX_TRANSCRIPT_BYTES = 1048576;
var MAX_CONFIG_BYTES = 65536;
var EMPTY_TRANSCRIPT_HASH = `sha256:${createHash3("sha256").update("").digest("hex")}`;
var MAX_RECOVERY_GENERATIONS = 16;
function errorCode(error) {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : void 0;
}
function rawCheckpoint(path) {
  let descriptor;
  try {
    const info = lstatSync3(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_CHECKPOINT_BYTES) return void 0;
    descriptor = openSync2(
      path,
      constants3.O_RDONLY | constants3.O_NONBLOCK | (constants3.O_NOFOLLOW ?? 0)
    );
    const opened = fstatSync2(descriptor);
    if (!opened.isFile() || opened.size > MAX_CHECKPOINT_BYTES) return void 0;
    return readBoundedDescriptor(descriptor, MAX_CHECKPOINT_BYTES);
  } catch (error) {
    return errorCode(error) === "ENOENT" ? "" : void 0;
  } finally {
    if (descriptor !== void 0) closeSync2(descriptor);
  }
}
function initialState(raw) {
  const parsed = parseCheckpoint2(raw);
  const hasSemantic = parsed.objective !== void 0 || parsed.nextAction !== void 0;
  return {
    schemaVersion: 1,
    objectiveHash: hashCheckpointObjective(parsed.objective),
    workRevision: 1,
    semanticRevision: hasSemantic ? 1 : 0,
    sealedWorkRevision: 0,
    nudgeEmitted: false,
    unwatchableNotified: false,
    transcriptFingerprint: EMPTY_TRANSCRIPT_HASH,
    transcriptCursorBytes: 0,
    lastMeasurementAtMs: 0,
    lastUsedTokens: 0,
    readFiles: [],
    modifiedFiles: [],
    readFilesOverflow: 0,
    modifiedFilesOverflow: 0,
    clearPending: false,
    lastResumeSource: "none"
  };
}
function sameFile(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}
function unlinkOwnedPath(path, owner) {
  try {
    const current = lstatSync3(path);
    if (!sameFile(current, owner)) return false;
    unlinkSync(path);
    return true;
  } catch {
    return false;
  }
}
function staleFile(info, now) {
  return now - Math.max(info.mtimeMs, info.ctimeMs) >= LOCK_STALE_MS;
}
function openExclusive(path) {
  try {
    const descriptor = openSync2(
      path,
      constants3.O_WRONLY | constants3.O_CREAT | constants3.O_EXCL | (constants3.O_NOFOLLOW ?? 0),
      384
    );
    const info = fstatSync2(descriptor);
    return { descriptor, dev: info.dev, ino: info.ino };
  } catch {
    return void 0;
  }
}
function releaseLock(path, lock) {
  try {
    closeSync2(lock.descriptor);
  } finally {
    unlinkOwnedPath(path, lock);
  }
}
function acquireLock(path, now) {
  const recovery = readRecoveryClaim(`${path}.recovery`);
  if (recovery.status === "unsafe") return void 0;
  if (recovery.status === "present") {
    try {
      const observed2 = lstatSync3(path);
      if (!observed2.isFile() || observed2.isSymbolicLink() || !staleFile(observed2, now)) {
        return void 0;
      }
      return claimStaleLock(path, observed2, now);
    } catch (error) {
      return errorCode(error) === "ENOENT" ? claimStaleLock(path, void 0, now) : void 0;
    }
  }
  const direct = openExclusive(path);
  if (direct !== void 0) {
    const afterOpen = readRecoveryClaim(`${path}.recovery`);
    if (afterOpen.status === "missing") return direct;
    releaseLock(path, direct);
    return void 0;
  }
  let observed;
  try {
    observed = lstatSync3(path);
    if (!observed.isFile() || observed.isSymbolicLink() || !staleFile(observed, now)) {
      return void 0;
    }
  } catch {
    return void 0;
  }
  return claimStaleLock(path, observed, now);
}
function readRecoveryClaim(path) {
  try {
    const info = lstatSync3(path);
    return !info.isFile() || info.isSymbolicLink() ? { status: "unsafe" } : {
      status: "present",
      claim: {
        path,
        dev: info.dev,
        ino: info.ino,
        mtimeMs: info.mtimeMs,
        ctimeMs: info.ctimeMs
      }
    };
  } catch (error) {
    return { status: errorCode(error) === "ENOENT" ? "missing" : "unsafe" };
  }
}
function acquireRecoveryFence(path, now) {
  const claims = [];
  let claimPath = `${path}.recovery`;
  let generation = 0;
  while (generation <= MAX_RECOVERY_GENERATIONS) {
    const read = readRecoveryClaim(claimPath);
    if (read.status === "unsafe") return void 0;
    if (read.status === "missing") {
      const created = openExclusive(claimPath);
      if (created === void 0) return void 0;
      return {
        tip: created,
        claims: [...claims, { ...created, path: claimPath, mtimeMs: now, ctimeMs: now }]
      };
    }
    const claim = read.claim;
    claims.push(claim);
    if (!staleFile(claim, now)) return void 0;
    generation += 1;
    claimPath = `${path}.recovery-${String(generation)}-${String(claim.dev)}-${String(claim.ino)}`;
  }
  return void 0;
}
function releaseRecoveryFence(fence) {
  closeSync2(fence.tip.descriptor);
  for (const claim of [...fence.claims].reverse()) unlinkOwnedPath(claim.path, claim);
}
function claimStaleLock(path, observed, now) {
  const fence = acquireRecoveryFence(path, now);
  if (fence === void 0) return void 0;
  try {
    try {
      const current = lstatSync3(path);
      if (observed === void 0 || !sameFile(current, observed)) return void 0;
      if (!staleFile(current, now)) return void 0;
      if (!unlinkOwnedPath(path, observed)) return void 0;
    } catch (error) {
      if (observed !== void 0 || errorCode(error) !== "ENOENT") return void 0;
    }
    return openExclusive(path);
  } finally {
    releaseRecoveryFence(fence);
  }
}
function safeMachineDirectory(root) {
  try {
    const canonicalRoot = realpathSync3(resolve5(root));
    let cursor = canonicalRoot;
    for (const segment2 of [".void", "machine"]) {
      cursor = join10(cursor, segment2);
      try {
        const existing = lstatSync3(cursor);
        if (!existing.isDirectory() || existing.isSymbolicLink()) return void 0;
      } catch (error) {
        if (errorCode(error) !== "ENOENT") return void 0;
        try {
          mkdirSync3(cursor, { mode: 448 });
        } catch (mkdirError) {
          if (errorCode(mkdirError) !== "EEXIST") return void 0;
        }
        const created = lstatSync3(cursor);
        if (!created.isDirectory() || created.isSymbolicLink()) return void 0;
      }
      const canonical2 = realpathSync3(cursor);
      if (!within(canonicalRoot, canonical2) || canonical2 !== cursor) return void 0;
    }
    return cursor;
  } catch {
    return void 0;
  }
}
function anchorMachineDirectory(root) {
  const directory = safeMachineDirectory(root);
  if (directory === void 0) return void 0;
  let descriptor;
  const previousCwd = process.cwd();
  let changedDirectory = false;
  let anchorEstablished = false;
  try {
    descriptor = openSync2(
      directory,
      constants3.O_RDONLY | (constants3.O_DIRECTORY ?? 0) | (constants3.O_NOFOLLOW ?? 0)
    );
    const opened = fstatSync2(descriptor);
    if (!opened.isDirectory()) return void 0;
    process.chdir(directory);
    changedDirectory = true;
    const current = statSync5(".");
    if (current.dev !== opened.dev || current.ino !== opened.ino || realpathSync3(".") !== directory) return void 0;
    anchorEstablished = true;
    return { descriptor, previousCwd };
  } catch {
    return void 0;
  } finally {
    if (descriptor !== void 0 && !anchorEstablished) {
      if (changedDirectory) process.chdir(previousCwd);
      closeSync2(descriptor);
    }
  }
}
function releaseMachineDirectory(anchor) {
  try {
    process.chdir(anchor.previousCwd);
  } finally {
    closeSync2(anchor.descriptor);
  }
}
function atomicCheckpointWrite(content, now) {
  const temporary = `.checkpoint-${String(process.pid)}-${String(now)}.tmp`;
  let descriptor;
  let owned;
  let renamed = false;
  try {
    descriptor = openSync2(
      temporary,
      constants3.O_WRONLY | constants3.O_CREAT | constants3.O_EXCL | (constants3.O_NOFOLLOW ?? 0),
      384
    );
    const opened = fstatSync2(descriptor);
    owned = { dev: opened.dev, ino: opened.ino };
    const bytes = Buffer.from(content, "utf8");
    let offset = 0;
    while (offset < bytes.length) {
      const written = writeSync(descriptor, bytes, offset, bytes.length - offset);
      if (written <= 0) return false;
      offset += written;
    }
    closeSync2(descriptor);
    descriptor = void 0;
    renameSync3(temporary, "checkpoint.md");
    renamed = true;
    return true;
  } catch {
    return false;
  } finally {
    if (descriptor !== void 0) closeSync2(descriptor);
    if (!renamed && owned !== void 0) {
      try {
        const current = lstatSync3(temporary);
        if (!current.isSymbolicLink() && current.dev === owned.dev && current.ino === owned.ino) {
          unlinkSync(temporary);
        }
      } catch {
      }
    }
  }
}
function mutateCheckpoint(root, now, decide) {
  const anchor = anchorMachineDirectory(root);
  if (anchor === void 0) {
    return { status: "degraded", details: { reason: "unsafe-checkpoint-path" } };
  }
  try {
    const lockPath = "checkpoint.md.lock";
    const lock = acquireLock(lockPath, now);
    if (lock === void 0) {
      return { status: "skipped", details: { reason: "checkpoint-lock-or-write-failed" } };
    }
    try {
      const raw = rawCheckpoint("checkpoint.md");
      if (raw === void 0) {
        return { status: "degraded", details: { reason: "checkpoint-unreadable" } };
      }
      const mutation = decide(raw);
      if (mutation.content === void 0) return mutation.execution;
      if (!atomicCheckpointWrite(mutation.content, now)) {
        return { status: "skipped", details: { reason: "checkpoint-lock-or-write-failed" } };
      }
      return mutation.execution;
    } finally {
      releaseLock(lockPath, lock);
    }
  } finally {
    releaseMachineDirectory(anchor);
  }
}
function canonicalDirectory(path) {
  try {
    const info = lstatSync3(path);
    if (!info.isDirectory() || info.isSymbolicLink()) return void 0;
    const canonical2 = realpathSync3(path);
    return canonical2 === resolve5(path) ? canonical2 : void 0;
  } catch {
    return void 0;
  }
}
function encodedClaudeProject(root) {
  return root.replace(/[^a-zA-Z0-9]/g, "-");
}
function transcriptRoots(root, runtime3) {
  const canonicalRoot = realpathSync3(resolve5(root));
  const candidates = [canonicalRoot];
  if (runtime3 === "claude") {
    candidates.push(
      join10(homedir(), ".claude", "projects", encodedClaudeProject(canonicalRoot))
    );
  }
  return candidates.map(canonicalDirectory).filter((path) => path !== void 0);
}
function runtimeSessionId(input) {
  const value = input["session_id"] ?? input["sessionId"] ?? input["thread_id"] ?? input["threadId"];
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,200}$/.test(value) ? value : void 0;
}
function isExternalTranscriptBound(path, runtime3, sessionId) {
  return runtime3 === "claude" && /^[A-Za-z0-9_-]{8,200}$/.test(sessionId) && basename3(path) === `${sessionId}.jsonl`;
}
function openBoundedRegularFile(path, maxBytes, allowedRoots) {
  let descriptor;
  try {
    const before = lstatSync3(path);
    if (!before.isFile() || before.isSymbolicLink() || before.size > maxBytes) return void 0;
    const canonicalPath = realpathSync3(path);
    if (!allowedRoots.some((root) => within(root, canonicalPath))) return void 0;
    descriptor = openSync2(
      path,
      constants3.O_RDONLY | constants3.O_NONBLOCK | (constants3.O_NOFOLLOW ?? 0)
    );
    const opened = fstatSync2(descriptor);
    const currentPath = realpathSync3(path);
    const current = statSync5(currentPath);
    if (!opened.isFile() || opened.size > maxBytes || currentPath !== canonicalPath || opened.dev !== current.dev || opened.ino !== current.ino || !allowedRoots.some((root) => within(root, currentPath))) {
      closeSync2(descriptor);
      return void 0;
    }
    return { descriptor, canonicalPath, size: opened.size };
  } catch {
    if (descriptor !== void 0) closeSync2(descriptor);
    return void 0;
  }
}
function readBoundedDescriptor(descriptor, maxBytes) {
  const bytes = Buffer.alloc(maxBytes + 1);
  let offset = 0;
  while (offset < bytes.length) {
    const count = readSync2(descriptor, bytes, offset, bytes.length - offset, offset);
    if (count === 0) break;
    offset += count;
  }
  return offset > maxBytes ? void 0 : bytes.subarray(0, offset).toString("utf8");
}
function finiteToken(value) {
  if (value === void 0) return 0;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : void 0;
}
function usageFromLine(line) {
  try {
    const parsed = record3(JSON.parse(line));
    const usage = record3(record3(parsed?.["message"])?.["usage"]);
    if (usage === void 0) return { status: "none" };
    const input = finiteToken(usage["input_tokens"]);
    const output = finiteToken(usage["output_tokens"]);
    const cacheRead = finiteToken(usage["cache_read_input_tokens"]);
    const cacheCreation = finiteToken(usage["cache_creation_input_tokens"]);
    return input === void 0 || output === void 0 || cacheRead === void 0 || cacheCreation === void 0 ? { status: "invalid" } : { status: "usage", usedTokens: input + output + cacheRead + cacheCreation };
  } catch {
    return { status: "invalid" };
  }
}
function observeTranscript(path, state, input, root, runtime3) {
  if (path === "" || path.length > 4096 || path.includes("\0") || !isAbsolute4(path)) {
    return void 0;
  }
  let descriptor;
  try {
    const roots = transcriptRoots(root, runtime3);
    const opened = openBoundedRegularFile(path, Number.MAX_SAFE_INTEGER, roots);
    if (opened === void 0) return void 0;
    descriptor = opened.descriptor;
    const canonicalRoot = realpathSync3(resolve5(root));
    if (!within(canonicalRoot, opened.canonicalPath)) {
      const sessionId = runtimeSessionId(input);
      if (sessionId === void 0 || !isExternalTranscriptBound(opened.canonicalPath, runtime3, sessionId)) {
        return void 0;
      }
    }
    const fingerprint = `sha256:${createHash3("sha256").update(opened.canonicalPath).digest("hex")}`;
    const sameTranscript = fingerprint === state.transcriptFingerprint;
    const previousCursor = sameTranscript && opened.size >= state.transcriptCursorBytes ? state.transcriptCursorBytes : 0;
    const available = Math.max(0, opened.size - previousCursor);
    if (available === 0) return void 0;
    const readStart = available > MAX_TRANSCRIPT_BYTES ? opened.size - MAX_TRANSCRIPT_BYTES : previousCursor;
    const requested = Math.min(MAX_TRANSCRIPT_BYTES, opened.size - readStart);
    const bytes = Buffer.alloc(requested);
    const bytesRead = readSync2(descriptor, bytes, 0, requested, readStart);
    const bounded = bytes.subarray(0, bytesRead);
    let contentStart = 0;
    let skippedBytes = Math.max(0, readStart - previousCursor);
    if (readStart > previousCursor) {
      const firstNewline = bounded.indexOf(10);
      if (firstNewline < 0) {
        return {
          fingerprint,
          cursorBytes: readStart + bytesRead,
          skippedBytes: skippedBytes + bytesRead,
          skippedLines: 1
        };
      }
      contentStart = firstNewline + 1;
      skippedBytes += contentStart;
    }
    const lastNewline = bounded.lastIndexOf(10);
    if (lastNewline < contentStart) {
      return {
        fingerprint,
        cursorBytes: previousCursor,
        skippedBytes,
        skippedLines: 0
      };
    }
    const complete = bounded.subarray(contentStart, lastNewline).toString("utf8");
    let usedTokens;
    let skippedLines = 0;
    for (const line of complete.split("\n")) {
      if (line.trim() === "") continue;
      const usage = usageFromLine(line);
      if (usage.status === "invalid") {
        skippedLines += 1;
      } else if (usage.status === "usage") {
        usedTokens = usage.usedTokens;
      }
    }
    return {
      fingerprint,
      cursorBytes: readStart + lastNewline + 1,
      ...usedTokens === void 0 ? {} : { usedTokens },
      skippedBytes,
      skippedLines
    };
  } catch {
    return void 0;
  } finally {
    if (descriptor !== void 0) closeSync2(descriptor);
  }
}
function contextConfig(root) {
  let descriptor;
  try {
    const canonicalRoot = realpathSync3(resolve5(root));
    const opened = openBoundedRegularFile(
      join10(canonicalRoot, ".void", "config.json"),
      MAX_CONFIG_BYTES,
      [canonicalRoot]
    );
    if (opened === void 0) return void 0;
    descriptor = opened.descriptor;
    const raw = readBoundedDescriptor(descriptor, MAX_CONFIG_BYTES);
    return raw === void 0 ? void 0 : JSON.parse(raw);
  } catch {
    return void 0;
  } finally {
    if (descriptor !== void 0) closeSync2(descriptor);
  }
}
function thresholdConfig(root) {
  const config = record3(contextConfig(root));
  const context = record3(config?.["context"]);
  const window = context?.["windowTokens"];
  const threshold = context?.["checkpointThresholdPercent"];
  const windowTokens = Number.isSafeInteger(window) && Number(window) > 0 ? Number(window) : void 0;
  const thresholdPercent = threshold === void 0 ? 50 : Number.isSafeInteger(threshold) && Number(threshold) >= 40 && Number(threshold) <= 60 ? Number(threshold) : 0;
  return {
    ...windowTokens === void 0 ? {} : { windowTokens },
    thresholdPercent
  };
}
function measureContext(state, input, root, event, runtime3, now) {
  if (event === "PostToolUse" && now - state.lastMeasurementAtMs < POST_TOOL_MEASUREMENT_COOLDOWN_MS) {
    return { state, emitNudge: false, skippedBytes: 0, skippedLines: 0 };
  }
  const path = input["transcript_path"];
  if (typeof path !== "string") {
    return { state, emitNudge: false, skippedBytes: 0, skippedLines: 0 };
  }
  const observed = observeTranscript(path, state, input, root, runtime3);
  if (observed === void 0) {
    return { state, emitNudge: false, skippedBytes: 0, skippedLines: 0 };
  }
  const cursorState = observed.fingerprint === state.transcriptFingerprint && observed.cursorBytes === state.transcriptCursorBytes ? state : {
    ...state,
    transcriptFingerprint: observed.fingerprint,
    transcriptCursorBytes: observed.cursorBytes
  };
  if (observed.usedTokens === void 0) {
    return {
      state: cursorState,
      emitNudge: false,
      skippedBytes: observed.skippedBytes,
      skippedLines: observed.skippedLines
    };
  }
  const config = thresholdConfig(root);
  const decision = evaluateContextMeasurement(cursorState, {
    usedTokens: observed.usedTokens,
    measuredAtMs: now,
    thresholdPercent: config.thresholdPercent,
    ...config.windowTokens === void 0 ? {} : { windowTokens: config.windowTokens }
  });
  return {
    state: decision.state,
    emitNudge: decision.emitNudge,
    ...decision.usagePercent === void 0 ? {} : { usagePercent: decision.usagePercent },
    ...decision.unjudgeable === void 0 ? {} : { unjudgeable: decision.unjudgeable },
    skippedBytes: observed.skippedBytes,
    skippedLines: observed.skippedLines
  };
}
function unwatchableOutput(event, reason) {
  return {
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: reason === "window-unknown" ? "Context usage is being recorded but cannot be watched: no `context.windowTokens` is configured in `.void/config.json`, so no percentage and no checkpoint threshold can be computed. Set it to the model context window to enable the reminder." : "Context usage is being recorded but the checkpoint threshold cannot be applied: `context.checkpointThresholdPercent` in `.void/config.json` is outside the accepted 40 to 60 range, which disarms the reminder entirely. Set it within that range, or remove it to take the default of 50."
    }
  };
}
function nudgeOutput(event, thresholdPercent) {
  return {
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: `Context usage reached the configured ${String(thresholdPercent)}% checkpoint threshold. Invoke \`void-checkpoint\` before continuing a long branch of work.`
    }
  };
}
function sealPreCompact(input, root, runtime3, now) {
  return mutateCheckpoint(root, now, (raw) => {
    const block2 = parseMechanicalContextBlock2(raw);
    if (block2.status === "invalid") {
      return {
        execution: {
          status: "degraded",
          details: { reason: "mechanical-block-ambiguous" }
        }
      };
    }
    const current = block2.status === "valid" ? block2.state : initialState(raw);
    const advanced = advanceMechanicalContext(current, {
      objectiveHash: hashCheckpointObjective(parseCheckpoint2(raw).objective)
    });
    const measurement = measureContext(advanced, input, root, "PreCompact", runtime3, now);
    const sealed = advanceMechanicalContext(measurement.state, { compactionSealed: true });
    const merged = mergeMechanicalContextBlock2(raw, sealed);
    if (!merged.ok) {
      return {
        execution: { status: "degraded", details: { reason: merged.error } }
      };
    }
    return {
      content: merged.value,
      execution: {
        status: "ok",
        details: {
          sealed: true,
          transcriptSkippedBytes: measurement.skippedBytes,
          transcriptSkippedLines: measurement.skippedLines
        }
      }
    };
  });
}
function successfulToolUse(input) {
  const response = record3(input["tool_response"]) ?? record3(input["tool_result"]);
  if (response?.["is_error"] === true || response?.["success"] === false) return false;
  return input["error"] === void 0 && input["tool_error"] === void 0;
}
function boundedProjectPath(root, candidate) {
  if (candidate === "" || candidate.length > 500 || mentionsCheckpointMarker(candidate) || [...candidate].some((character) => character.charCodeAt(0) < 32)) return void 0;
  const target = isAbsolute4(candidate) ? resolve5(candidate) : resolve5(root, candidate);
  const local = relative4(resolve5(root), target);
  if (local === "" || local.startsWith("..") || isAbsolute4(local)) return void 0;
  return local.split("\\").join("/");
}
function toolPaths(call, root) {
  const isModification = call.tool === "Edit" || call.tool === "Write" || call.tool === "apply_patch";
  const isRead = call.tool === "Read" || call.tool === "read_file" || call.tool === "view_image";
  if (!isModification && !isRead) return { readFiles: [], modifiedFiles: [] };
  const paths = call.edits.map((edit) => boundedProjectPath(root, edit.path)).filter((path) => path !== void 0 && path !== CHECKPOINT);
  return isRead ? { readFiles: paths, modifiedFiles: [] } : { readFiles: [], modifiedFiles: paths };
}
function evolveCheckpoint(root, now, runtime3, observation, input, event) {
  return mutateCheckpoint(root, now, (raw) => {
    const block2 = parseMechanicalContextBlock2(raw);
    if (block2.status === "invalid") {
      return {
        execution: {
          status: "degraded",
          details: { reason: "mechanical-block-ambiguous" }
        }
      };
    }
    const current = block2.status === "valid" ? block2.state : initialState(raw);
    const reconcile = observation.semanticCheckpointWritten === true;
    const advanced = advanceMechanicalContext(current, {
      ...observation,
      ...reconcile ? { objectiveHash: hashCheckpointObjective(parseCheckpoint2(raw).objective) } : {},
      semanticCheckpointWritten: false
    });
    const measurement = input === void 0 || event === void 0 ? { state: advanced, emitNudge: false, skippedBytes: 0, skippedLines: 0 } : measureContext(advanced, input, root, event, runtime3, now);
    const measured = reconcile ? advanceMechanicalContext(measurement.state, { semanticCheckpointWritten: true }) : measurement.state;
    const unjudgeable = measurement.unjudgeable ?? (thresholdConfig(root).windowTokens === void 0 ? "window-unknown" : void 0);
    const unwatchable = unjudgeable !== void 0 && !measured.unwatchableNotified && event !== void 0;
    const next = unwatchable ? { ...measured, unwatchableNotified: true } : measured;
    if (next === current && block2.status === "valid") {
      return {
        execution: { status: "skipped", details: { reason: "duplicate-observation" } }
      };
    }
    const merged = mergeMechanicalContextBlock2(raw, next);
    if (!merged.ok) {
      return { execution: { status: "degraded", details: { reason: merged.error } } };
    }
    return {
      content: merged.value,
      execution: {
        status: "ok",
        details: {
          advanced: next.workRevision !== current.workRevision,
          transcriptSkippedBytes: measurement.skippedBytes,
          transcriptSkippedLines: measurement.skippedLines
        },
        ...measurement.emitNudge && event !== void 0 ? { output: nudgeOutput(event, thresholdConfig(root).thresholdPercent) } : unwatchable && event !== void 0 && unjudgeable !== void 0 ? { output: unwatchableOutput(event, unjudgeable) } : {}
      }
    };
  });
}
function observePostToolUse(input, root, runtime3, now) {
  if (!successfulToolUse(input)) {
    return { status: "skipped", details: { reason: "tool-use-failed" } };
  }
  try {
    const call = normalizeToolCall(input);
    const paths = toolPaths(call, root);
    const checkpointWrite = (call.tool === "Edit" || call.tool === "Write" || call.tool === "apply_patch") && call.edits.some(
      (edit) => boundedProjectPath(root, edit.path) === CHECKPOINT
    );
    return evolveCheckpoint(root, now, runtime3, {
      readFiles: paths.readFiles,
      modifiedFiles: paths.modifiedFiles,
      ...checkpointWrite ? { semanticCheckpointWritten: true } : {}
    }, checkpointWrite ? void 0 : input, checkpointWrite ? void 0 : "PostToolUse");
  } catch {
    return { status: "degraded", details: { reason: "invalid-tool-input" } };
  }
}
function executeContextContinuity(rawInput, root, runtime3, now) {
  const projectRoot2 = resolve5(root);
  const input = record3(rawInput);
  if (input === void 0) {
    return { status: "degraded", details: { reason: "invalid-hook-input" } };
  }
  const event = input["hook_event_name"];
  if (event === "PreCompact") return sealPreCompact(input, projectRoot2, runtime3, now);
  if (event === "PostToolUse") return observePostToolUse(input, projectRoot2, runtime3, now);
  if (event === "UserPromptSubmit") {
    return evolveCheckpoint(projectRoot2, now, runtime3, {}, input, "UserPromptSubmit");
  }
  if (event === "SessionStart") {
    const source2 = input["source"];
    if (source2 === "startup" || source2 === "resume" || source2 === "clear" || source2 === "compact" || source2 === "fork") {
      return evolveCheckpoint(projectRoot2, now, runtime3, { resumeSource: source2 });
    }
  }
  return { status: "skipped", details: { reason: "event-not-actionable" } };
}

import { join as join11 } from "node:path";
var VERSION_SHAPE = /^[0-9A-Za-z.+-]{1,64}$/;
function readVersion(path) {
  const version = record3(readJson(path))?.["version"];
  return typeof version === "string" && VERSION_SHAPE.test(version) ? version : void 0;
}
function resolveInstall(root, env) {
  const explicit = productSetting(env, "VERSION");
  if (explicit !== void 0 && VERSION_SHAPE.test(explicit)) {
    return { version: explicit, source: void 0 };
  }
  const pluginRoot = env["CLAUDE_PLUGIN_ROOT"];
  if (pluginRoot !== void 0) {
    const version2 = readVersion(join11(pluginRoot, ".claude-plugin", "plugin.json"));
    if (version2 !== void 0) return { version: version2, source: "marketplace" };
  }
  const receipt = record3(readJson(voidReadPath(root, "receipts", "install-v1.json")));
  const version = receipt?.["version"];
  if (typeof version === "string" && VERSION_SHAPE.test(version)) {
    const declared = receipt?.["source"];
    const source2 = declared === "local" || declared === "marketplace" ? declared : void 0;
    return { version, source: source2 };
  }
  return { version: "unknown", source: void 0 };
}

import { spawnSync as spawnSync2 } from "node:child_process";

import {
  isAbsolute as isAbsolute5,
  relative as relative5,
  resolve as resolve6
} from "node:path";
var FORMATTABLE = /\.(?:ts|tsx|js|jsx|mjs|cjs|json|jsonc|css)$/;
function within2(root, target) {
  const rel = relative5(root, target);
  return rel === "" || !rel.startsWith("..") && !isAbsolute5(rel);
}
function formatCandidates(touchedPaths, projectRoot2) {
  const root = resolve6(projectRoot2);
  const found = /* @__PURE__ */ new Set();
  for (const touchedPath of touchedPaths) {
    const target = resolve6(root, touchedPath);
    if (touchedPath.trim() !== "" && FORMATTABLE.test(touchedPath.replaceAll("\\", "/")) && within2(root, target)) {
      found.add(target);
    }
  }
  return [...found];
}

function executeFormat(rawInput, root, env) {
  const call = normalizeToolCall(rawInput);
  if (call.tool !== "Edit" && call.tool !== "Write" && call.tool !== "apply_patch") {
    return { status: "skipped", details: { reason: "tool-not-applicable" } };
  }
  const files = safeExistingFiles(
    formatCandidates(call.edits.map((edit) => edit.path), root),
    root
  );
  if (files.length === 0) {
    return { status: "skipped", details: { reason: "no-formattable-touched-file" } };
  }
  const biome = findExecutable("biome", root, env);
  if (biome === void 0) {
    return { status: "skipped", details: { reason: "formatter-unavailable" } };
  }
  const timeout = boundedInteger(
    productSetting(env, "FORMAT_TIMEOUT_MS"),
    1e4,
    100,
    3e4
  );
  let formatted = 0;
  for (const file of files) {
    const result = spawnSync2(biome, ["format", "--write", file], {
      cwd: root,
      env: { ...process.env, ...env },
      shell: false,
      stdio: "ignore",
      timeout
    });
    if (result.error !== void 0 || result.status !== 0) {
      const timedOut = result.error?.message.includes("ETIMEDOUT") ?? false;
      return {
        status: "degraded",
        details: {
          reason: timedOut ? "timeout" : "formatter-error",
          formatted,
          timeoutMs: timeout
        }
      };
    }
    formatted += 1;
  }
  return { status: "ok", details: { formatted } };
}

import { spawnSync as spawnSync3 } from "node:child_process";

function parseAddedLines(numstat) {
  return numstat.split(/\r?\n/).reduce((total, line) => {
    const [added] = line.split("	", 1);
    const count = Number(added);
    if (!Number.isSafeInteger(count) || count < 0) return total;
    return Math.min(Number.MAX_SAFE_INTEGER, total + count);
  }, 0);
}
function hasLargeChangeJustification(text2) {
  return /^\s*large-cl-justification\s*:\s*\S.*$/imu.test(text2);
}
function assessLargeChange(assessment) {
  if (assessment.addedLines <= assessment.threshold || assessment.justified) {
    return allow();
  }
  return {
    allow: true,
    code: "LARGE_CHANGE_WARNING",
    message: `change adds ${assessment.addedLines} lines (threshold ${assessment.threshold}); split it or justify why it is atomic`,
    evidence: ["large-cl-justification: <reason>"]
  };
}

function runGit(git3, root, args, env) {
  const result = spawnSync3(git3, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
    shell: false,
    timeout: 5e3,
    maxBuffer: 2 * 1024 * 1024
  });
  return {
    ok: result.status === 0,
    output: result.status === 0 ? result.stdout.trim() : ""
  };
}
function verifiedRef(git3, root, ref, env) {
  if (ref === "" || ref.includes("\r") || ref.includes("\n") || ref.includes("\0")) return false;
  return runGit(
    git3,
    root,
    ["rev-parse", "--verify", "--quiet", "--end-of-options", `${ref}^{commit}`],
    env
  ).ok;
}
function baseRef(git3, root, env) {
  const configured = productSetting(env, "BASE_REF")?.trim();
  if (configured !== void 0 && configured !== "") {
    return verifiedRef(git3, root, configured, env) ? configured : void 0;
  }
  const upstream = runGit(
    git3,
    root,
    ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"],
    env
  );
  const candidates = [
    upstream.ok ? upstream.output : "",
    "origin/main",
    "origin/master",
    "main",
    "master"
  ];
  return candidates.find((candidate) => verifiedRef(git3, root, candidate, env));
}
function executeLargeChange(root, env) {
  const git3 = findExecutable("git", root, env);
  if (git3 === void 0) {
    return { status: "skipped", details: { reason: "git-unavailable" } };
  }
  const base = baseRef(git3, root, env);
  if (base === void 0) {
    const configuredBase = productSetting(env, "BASE_REF")?.trim();
    return {
      status: "skipped",
      details: {
        reason: configuredBase === void 0 || configuredBase === "" ? "base-ref-unavailable" : "configured-base-ref-invalid"
      }
    };
  }
  const mergeBase = runGit(git3, root, ["merge-base", "HEAD", base], env);
  if (!mergeBase.ok) {
    return { status: "degraded", details: { reason: "merge-base-failed" } };
  }
  const range = `${mergeBase.output}..HEAD`;
  const diff = runGit(
    git3,
    root,
    ["diff", "--numstat", "--no-renames", range, "--"],
    env
  );
  const messages = runGit(git3, root, ["log", "--format=%B", range, "--"], env);
  if (!diff.ok || !messages.ok) {
    return { status: "degraded", details: { reason: "change-query-failed" } };
  }
  const threshold = boundedInteger(
    productSetting(env, "LARGE_CHANGE_THRESHOLD") ?? env["VOIDCORP_LARGE_CL_THRESHOLD"],
    400,
    1,
    1e6
  );
  const addedLines = parseAddedLines(diff.output);
  const justified = hasLargeChangeJustification(messages.output);
  const verdict = assessLargeChange({ addedLines, threshold, justified });
  const details = {
    baseRef: base,
    addedLines,
    threshold,
    justified,
    code: verdict.code
  };
  if (verdict.code === "ALLOW") return { status: "ok", details };
  return {
    status: "degraded",
    details,
    diagnostic: `${verdict.code}: ${verdict.message}
- ${verdict.evidence.join("\n- ")}
`
  };
}

import { execFileSync } from "node:child_process";
import {
  existsSync as existsSync6,
  lstatSync as lstatSync4,
  readFileSync as readFileSync11,
  statSync as statSync6
} from "node:fs";
import { basename as basename4, join as join12 } from "node:path";
var PROGRAM_PATHS = [
  join12(".void", "program.md"),
  join12(".void", "active.md"),
  join12("plans", "ACTIVE.md")
];
var CHECKPOINT_PATHS = [
  join12(".void", "machine", "checkpoint.md"),
  join12(".void", "local", "checkpoint.md"),
  join12(".void", "session", "current.md")
];
var MAX_READ_BYTES = 5e5;
var GIT_TIMEOUT_MS = 200;
function readBounded(path) {
  try {
    const info = lstatSync4(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_READ_BYTES) return void 0;
    return readFileSync11(path, "utf8");
  } catch {
    return void 0;
  }
}
function frontmatter(raw) {
  return /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)?.[1];
}
function cleanScalar(value) {
  if (value === void 0) return void 0;
  const clean2 = value.trim().replace(/^['"]|['"]$/g, "");
  return clean2 === "" ? void 0 : clean2;
}
function rootScalar(block2, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return cleanScalar(new RegExp(`^${escaped}:\\s*(.+?)\\s*$`, "m").exec(block2)?.[1]);
}
function nestedBlock(block2, key) {
  const lines = block2.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `${key}:` && /^\S/.test(line));
  if (start < 0) return void 0;
  const nested = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    nested.push(line.replace(/^ {2}/, ""));
  }
  return nested.join("\n");
}
function programFrom(raw, legacy) {
  const block2 = frontmatter(raw);
  if (block2 === void 0) return void 0;
  if (!legacy && rootScalar(block2, "schemaVersion") !== "1") return void 0;
  const status = rootScalar(block2, "status");
  const program = rootScalar(block2, "program");
  const plan = rootScalar(block2, "plan");
  const spec = rootScalar(block2, "spec");
  if (status !== "executing" && status !== "completed" || program === void 0 || plan === void 0 || spec === void 0) {
    return void 0;
  }
  const progressBlock = nestedBlock(block2, legacy ? "tracker" : "progress");
  const provider = progressBlock === void 0 ? void 0 : rootScalar(progressBlock, "provider");
  const scope = progressBlock === void 0 ? void 0 : rootScalar(progressBlock, "scope");
  return {
    status,
    program,
    plan,
    spec,
    ...provider === void 0 || scope === void 0 ? {} : { progress: { provider, scope } }
  };
}
function observeProgram(root) {
  const present = PROGRAM_PATHS.filter((relative11) => existsSync6(join12(root, relative11)));
  if (present.length === 0) return { program: void 0 };
  if (present.length > 1) {
    return {
      program: void 0,
      programError: `multiple program descriptors: ${present.join(", ")}`
    };
  }
  const relative10 = present[0];
  if (relative10 === void 0) return { program: void 0 };
  const raw = readBounded(join12(root, relative10));
  const program = raw === void 0 ? void 0 : programFrom(raw, relative10 !== PROGRAM_PATHS[0]);
  return program === void 0 ? { program: void 0, programError: `invalid program descriptor: ${relative10}` } : { program };
}
function git(root, args) {
  try {
    return execFileSync("git", [...args], {
      cwd: root,
      encoding: "utf8",
      timeout: GIT_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return void 0;
  }
}
function gitObservation(root) {
  const branch = git(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const head = git(root, ["rev-parse", "HEAD"]);
  const dirty = git(root, ["status", "--porcelain"]);
  return {
    branch: branch === "HEAD" ? void 0 : branch,
    head,
    dirtyFiles: dirty === void 0 || dirty === "" ? 0 : dirty.split(/\r?\n/).length
  };
}
function checkpointObservation(root) {
  for (const relative10 of CHECKPOINT_PATHS) {
    const path = join12(root, relative10);
    const raw = readBounded(path);
    if (raw === void 0) continue;
    try {
      return { checkpoint: parseCheckpoint2(raw), checkpointWrittenAt: statSync6(path).mtimeMs };
    } catch {
      return { checkpoint: parseCheckpoint2(raw) };
    }
  }
  return {};
}
function observeResume(root, now, options = {}) {
  const checkpoint = checkpointObservation(root);
  const bundle = composeResumeBundle({
    project: { name: basename4(root), path: root },
    now,
    git: gitObservation(root),
    ...observeProgram(root),
    checkpoint: checkpoint.checkpoint,
    ...checkpoint.checkpointWrittenAt === void 0 ? {} : { checkpointWrittenAt: checkpoint.checkpointWrittenAt },
    ...options.source === void 0 ? {} : { resumeSource: options.source }
  });
  return {
    bundle,
    context: renderResumeContext(bundle),
    ...checkpoint.checkpointWrittenAt === void 0 ? {} : { checkpointWrittenAt: checkpoint.checkpointWrittenAt }
  };
}

var MAX_PROMPT_CHARS = 8e3;
function searchablePrompt(prompt) {
  return prompt.slice(0, MAX_PROMPT_CHARS).normalize("NFD").replace(new RegExp("\\p{Diacritic}", "gu"), "").toLowerCase().replace(/[’'_-]/g, " ").replace(/\s+/g, " ").trim();
}
var NEGATED_CLOSE = [
  /\b(?:do not|don t|dont|never) stop here\b/,
  /\bne (?:nous )?arretons? pas ici\b/
];
var EXPLICIT_CLOSE = [
  /\bon s arrete ici\b/,
  /\bon reprend (?:demain|plus tard)\b/,
  /\bje reprends? demain\b/,
  /\bfin de journee\b/,
  /\bstop here(?: for today)?\b/,
  /\b(?:let us |we will )?resume tomorrow\b/,
  /\b(?:fais|faire|make|create|write) (?:un |a )?checkpoint\b/,
  /\bcheckpoint\b.*\b(?:end|close|finish|finir|termine?r?)\b.*\b(?:session|journee|today)\b/,
  /\b(?:end|close) the session\b/
];
function detectsSessionCloseIntent(prompt) {
  const searchable = searchablePrompt(prompt);
  if (NEGATED_CLOSE.some((pattern2) => pattern2.test(searchable))) return false;
  return EXPLICIT_CLOSE.some((pattern2) => pattern2.test(searchable));
}
function checkpointReminderOutput(prompt) {
  if (!detectsSessionCloseIntent(prompt)) return void 0;
  return {
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: "Explicit session-close intent detected. Invoke `void-checkpoint` before the closing response. Route durable facts to their owner, show any shared write before applying it, and do not mark the current work unit complete merely because the session ends."
    }
  };
}

import { createHash as createHash4 } from "node:crypto";
import {
  lstatSync as lstatSync5,
  mkdirSync as mkdirSync4,
  realpathSync as realpathSync4,
  writeFileSync as writeFileSync3
} from "node:fs";
import { join as join13, relative as relative6 } from "node:path";

function record4(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function contentText(value) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((item) => {
    if (typeof item === "string") return item;
    const block2 = record4(item);
    return typeof block2?.["text"] === "string" ? block2["text"] : "";
  }).filter((item) => item !== "").join("\n");
}
function responseText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return contentText(value);
  const response = record4(value);
  if (response === void 0) return "";
  return [
    response["stdout"],
    response["stderr"],
    response["output"],
    response["result"],
    contentText(response["content"])
  ].filter((item) => typeof item === "string" && item !== "").join("\n");
}
function extractToolOutput(value) {
  const raw = record4(value);
  if (raw === void 0) return void 0;
  const tool = raw["tool_name"];
  if (typeof tool !== "string" || tool !== "Bash" && tool !== "shell" && !tool.startsWith("mcp__")) {
    return void 0;
  }
  const text2 = responseText(raw["tool_response"]);
  return text2 === "" ? void 0 : { tool, text: text2 };
}
function errorEvidence(text2) {
  return text2.split(/\r?\n/).filter(
    (line) => /error|fail|exception|traceback|fatal|panic|not ok|assert/i.test(line)
  ).join("\n").slice(0, 1500);
}
function planOutputTrim(text2, options) {
  const originalBytes = Buffer.byteLength(text2, "utf8");
  if (originalBytes <= options.thresholdBytes) return void 0;
  const head = text2.slice(0, 3e3);
  const tail = text2.slice(-3e3);
  const errors = errorEvidence(text2);
  const updatedToolOutput = `${head}

[trimmed ${originalBytes} bytes. Full output: ${options.spillPath}]

${tail}

[error-like lines]
${errors}
`;
  return {
    fullOutput: text2,
    originalBytes,
    updatedToolOutput,
    note: `trim-large-output: ${options.tool} result ${originalBytes}B trimmed; full output at ${options.spillPath}`
  };
}

function safeOutputDirectory(root) {
  try {
    const canonicalRoot = realpathSync4(root);
    const directory = voidMachinePath(root, "outputs");
    mkdirSync4(directory, { recursive: true, mode: 448 });
    const info = lstatSync5(directory);
    const canonicalDirectory2 = realpathSync4(directory);
    if (!info.isDirectory() || info.isSymbolicLink() || !within(canonicalRoot, canonicalDirectory2)) {
      return void 0;
    }
    return canonicalDirectory2;
  } catch {
    return void 0;
  }
}
function executeTrim(rawInput, root, env) {
  if (productSetting(env, "NO_TRIM") === "1") {
    return { status: "skipped", details: { reason: "disabled" } };
  }
  const extracted = extractToolOutput(rawInput);
  if (extracted === void 0) {
    return { status: "skipped", details: { reason: "output-not-applicable" } };
  }
  const thresholdBytes = boundedInteger(
    productSetting(env, "TRIM_BYTES"),
    12e3,
    1,
    10 * 1024 * 1024
  );
  if (Buffer.byteLength(extracted.text, "utf8") <= thresholdBytes) {
    return { status: "skipped", details: { reason: "below-threshold" } };
  }
  const directory = safeOutputDirectory(root);
  if (directory === void 0) {
    return {
      status: "degraded",
      details: { reason: "unsafe-output-directory" }
    };
  }
  const hash = createHash4("sha256").update(extracted.text).digest("hex").slice(0, 12);
  const tool = extracted.tool.replaceAll(/[^A-Za-z0-9_]/g, "_").slice(0, 80);
  const file = join13(directory, `${tool}-${process.pid}-${Date.now()}-${hash}.log`);
  const spillPath = relative6(realpathSync4(root), file).replaceAll("\\", "/");
  const plan = planOutputTrim(extracted.text, {
    tool: extracted.tool,
    thresholdBytes,
    spillPath
  });
  if (plan === void 0) {
    return { status: "skipped", details: { reason: "below-threshold" } };
  }
  try {
    writeFileSync3(file, plan.fullOutput, {
      encoding: "utf8",
      flag: "wx",
      mode: 384
    });
  } catch {
    return { status: "degraded", details: { reason: "spill-write-failed" } };
  }
  return {
    status: "ok",
    details: {
      originalBytes: plan.originalBytes,
      spillPath
    },
    output: {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        updatedToolOutput: plan.updatedToolOutput,
        additionalContext: plan.note
      }
    }
  };
}

import { existsSync as existsSync7 } from "node:fs";
import { join as join15 } from "node:path";
import { spawnSync as spawnSync4 } from "node:child_process";

import {
  dirname as dirname5,
  isAbsolute as isAbsolute6,
  join as join14,
  relative as relative7,
  resolve as resolve7
} from "node:path";
function record5(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
var AMBIENT_KEPT = /* @__PURE__ */ new Set([
  "PATH",
  "Path",
  "PATHEXT",
  "HOME",
  "USERPROFILE",
  "SystemRoot",
  "windir",
  "COMSPEC",
  "TMPDIR",
  "TEMP",
  "TMP",
  "LANG",
  "LC_ALL",
  "TZ",
  "SHELL",
  "USER",
  "LOGNAME"
]);
function minimalEnvironment(ambient, passed) {
  const kept = {};
  for (const [name, value] of Object.entries(ambient)) {
    if (value !== void 0 && AMBIENT_KEPT.has(name)) kept[name] = value;
  }
  for (const [name, value] of Object.entries(passed)) {
    if (value !== void 0) kept[name] = value;
  }
  return kept;
}
var LAUNCHERS = {
  pnpm: ["exec", "dlx"],
  npm: ["exec"],
  yarn: ["exec", "dlx"],
  bun: ["x"],
  // Runners that take the binary directly, with no subcommand.
  npx: [],
  bunx: [],
  pnpx: []
};
var CHECKERS = /* @__PURE__ */ new Set(["tsc", "vue-tsc", "svelte-check", "astro", "tsgo"]);
function argumentIsSafe(argument) {
  if (argument.startsWith("-")) return /^-{1,2}[A-Za-z][\w-]*$/.test(argument);
  return /^[\w./-]+$/.test(argument) && !argument.startsWith("/") && !argument.includes("..");
}
function acceptableTypecheck(argv) {
  const [head, ...rest] = argv;
  if (head === void 0) return "empty command";
  if (head.includes("/") || head.includes("\\")) return `path-qualified executable ${head}`;
  let checkerIndex = 0;
  if (Object.hasOwn(LAUNCHERS, head)) {
    const subcommands = LAUNCHERS[head] ?? [];
    if (subcommands.length > 0) {
      const subcommand = rest[0];
      if (subcommand === void 0 || !subcommands.includes(subcommand)) {
        return `${head} must be followed by ${subcommands.join(" or ")}, not ${String(subcommand)}`;
      }
      checkerIndex = 1;
    }
  } else if (CHECKERS.has(head)) {
    return rest.every(argumentIsSafe) ? void 0 : "argument that is not a flag or a path";
  } else {
    return `unknown executable ${head}`;
  }
  const checker = rest[checkerIndex];
  if (checker === void 0 || !CHECKERS.has(checker)) return `unknown type checker ${String(checker)}`;
  return rest.slice(checkerIndex + 1).every(argumentIsSafe) ? void 0 : "argument that is not a flag or a path";
}
function configuredTypecheck(value) {
  const root = record5(value);
  const commands = record5(root?.["commands"]);
  const configured = commands?.["typecheck"];
  if (Array.isArray(configured) && configured.length > 0 && configured.every((argument) => typeof argument === "string")) {
    const refusal = acceptableTypecheck(configured);
    return refusal === void 0 ? { argv: configured } : { warning: `commands.typecheck refused (${refusal}); falling back to the resolved type checker` };
  }
  if (typeof configured === "string") {
    return {
      warning: "legacy commands.typecheck string ignored; migrate it to argv"
    };
  }
  return {};
}
function within3(root, target) {
  const rel = relative7(root, target);
  return rel === "" || !rel.startsWith("..") && !isAbsolute6(rel);
}
function nearestTsconfigs(changedPaths, projectRoot2, hasFile) {
  const root = resolve7(projectRoot2);
  const found = /* @__PURE__ */ new Set();
  for (const changedPath of changedPaths) {
    if (!/\.(?:ts|tsx)$/.test(changedPath) || changedPath.endsWith(".d.ts")) continue;
    const target = resolve7(root, changedPath);
    if (!within3(root, target)) continue;
    let current = dirname5(target);
    while (within3(root, current)) {
      const config = join14(current, "tsconfig.json");
      if (hasFile(config)) {
        found.add(config);
        break;
      }
      if (current === root) break;
      current = dirname5(current);
    }
  }
  return [...found];
}

function runGit2(root, args, env) {
  const git3 = findExecutable("git", root, env);
  if (git3 === void 0) return { ok: false, output: "" };
  const result = spawnSync4(git3, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
    shell: false,
    timeout: 5e3,
    maxBuffer: 1024 * 1024
  });
  return {
    ok: result.status === 0,
    output: result.status === 0 ? result.stdout : ""
  };
}
function changedTypeScript(root, env) {
  const head = runGit2(root, ["rev-parse", "--verify", "HEAD"], env);
  const tracked = head.ok ? runGit2(
    root,
    ["diff", "--name-only", "--diff-filter=ACM", "HEAD"],
    env
  ) : { ok: true, output: "" };
  const untracked = runGit2(
    root,
    ["ls-files", "--others", "--exclude-standard"],
    env
  );
  if (!tracked.ok || !untracked.ok) return void 0;
  return [...new Set(`${tracked.output}
${untracked.output}`.split(/\r?\n/))].filter((path) => /\.(?:ts|tsx)$/.test(path) && !path.endsWith(".d.ts"));
}
function typeErrors(output) {
  return output.split(/\r?\n/).filter((line) => /error TS\d+|error:/i.test(line)).slice(0, 20).join("\n").slice(0, 12e3);
}
function executeTypecheck(root, env) {
  const changed = changedTypeScript(root, env);
  if (changed === void 0) {
    return { status: "skipped", details: { reason: "non-git-or-git-unavailable" } };
  }
  if (changed.length === 0) {
    return { status: "skipped", details: { reason: "no-touched-typescript" } };
  }
  const configs = nearestTsconfigs(changed, root, existsSync7);
  const configured = configuredTypecheck(readJson(join15(root, ".void", "config.json")));
  const configuredArgv = "argv" in configured ? configured.argv : void 0;
  const warning = "warning" in configured ? configured.warning : void 0;
  const fallback = findExecutable("tsc", root, env);
  const argv = configuredArgv ?? (fallback === void 0 ? void 0 : [fallback, "--noEmit"]);
  if (argv === void 0) {
    return {
      status: "skipped",
      details: {
        reason: "typechecker-unavailable",
        ...warning === void 0 ? {} : { warning }
      },
      ...warning === void 0 ? {} : { diagnostic: `stop-typecheck: ${warning}
` }
    };
  }
  const executablePath = findExecutable(argv[0] ?? "", root, env);
  if (executablePath === void 0) {
    return {
      status: "degraded",
      details: { reason: "configured-executable-unavailable" }
    };
  }
  const timeout = boundedInteger(
    productSetting(env, "TYPECHECK_TIMEOUT_MS"),
    45e3,
    100,
    12e4
  );
  const args = argv.slice(1);
  const isTsc = argv.some(
    (argument) => /(?:^|[\\/])tsc(?:\.cmd|\.exe)?$/.test(argument)
  );
  const invocations = isTsc && configs.length > 0 ? configs.map((config) => [...args, "-p", config]) : [args];
  let errors = "";
  for (const invocation of invocations) {
    const result = spawnSync4(executablePath, invocation, {
      cwd: root,
      env: minimalEnvironment(process.env, env),
      encoding: "utf8",
      shell: false,
      timeout,
      maxBuffer: 1024 * 1024
    });
    if (result.error !== void 0) {
      const timedOut = result.error.message.includes("ETIMEDOUT");
      return {
        status: "degraded",
        details: {
          reason: timedOut ? "timeout" : "execution-error",
          timeoutMs: timeout
        },
        diagnostic: timedOut ? `stop-typecheck: typecheck exceeded ${timeout}ms; advisory result degraded.
` : "stop-typecheck: typecheck could not execute; advisory result degraded.\n"
      };
    }
    if (result.status !== 0) {
      errors += `${typeErrors(`${result.stdout}
${result.stderr}`)}
`;
    }
  }
  const bounded = errors.trim().slice(0, 12e3);
  if (bounded !== "") {
    return {
      status: "degraded",
      details: { reason: "type-errors", configs: invocations.length },
      diagnostic: `stop-typecheck (advisory): type errors in the touched TypeScript surface:
${bounded}
Resolve before claiming done. This never blocks.
`
    };
  }
  return {
    status: "ok",
    details: {
      checkedConfigs: invocations.length,
      ...warning === void 0 ? {} : { warning }
    },
    ...warning === void 0 ? {} : { diagnostic: `stop-typecheck: ${warning}
` }
  };
}

import { spawnSync as spawnSync5 } from "node:child_process";
import { closeSync as closeSync3, existsSync as existsSync8, lstatSync as lstatSync6, openSync as openSync3, readSync as readSync3, realpathSync as realpathSync5 } from "node:fs";
import { dirname as dirname6, isAbsolute as isAbsolute7, join as join16, resolve as resolve8 } from "node:path";
var GIT_TIMEOUT_MS2 = 5e3;
var GIT_MAX_OUTPUT_BYTES = 1e6;
function canonical(path) {
  try {
    return realpathSync5(resolve8(path));
  } catch {
    return resolve8(path);
  }
}
function git2(cwd, args, deadline) {
  const remaining = deadline === void 0 ? GIT_TIMEOUT_MS2 : Math.ceil(deadline - performance.now());
  if (remaining <= 0) return void 0;
  const result = spawnSync5("git", args, {
    cwd,
    ...deadline === void 0 ? {} : {
      env: Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_(DIR|WORK_TREE|COMMON_DIR|CONFIG|INDEX_FILE)/.test(name)))
    },
    encoding: "utf8",
    timeout: Math.min(GIT_TIMEOUT_MS2, remaining),
    maxBuffer: GIT_MAX_OUTPUT_BYTES,
    stdio: ["ignore", "pipe", "ignore"]
  });
  if (result.status !== 0 || typeof result.stdout !== "string") return void 0;
  return result.stdout;
}
function mainWorkingTree(cwd, deadline, expectedCommon, query = git2) {
  const listing = query(cwd, ["worktree", "list", "--porcelain"], deadline);
  if (listing === void 0) return void 0;
  const [first = ""] = listing.split(/\r?\n\r?\n/);
  const attributes = first.split(/\r?\n/);
  const [head = ""] = attributes;
  if (!head.startsWith("worktree ")) return void 0;
  if (attributes.includes("bare")) return void 0;
  const listed = head.slice("worktree ".length);
  const args = ["rev-parse", "--show-toplevel", ...expectedCommon === void 0 ? [] : ["--git-common-dir"]];
  const [toplevel, common] = query(listed, args, deadline)?.trim().split(/\r?\n/) ?? [];
  if (toplevel === void 0 || toplevel === "") return void 0;
  if (expectedCommon !== void 0 && (common === void 0 || canonical(resolve8(listed, common)) !== expectedCommon)) return void 0;
  return canonical(toplevel);
}
function holdsInstallReceipt(root) {
  return existsSync8(voidReadPath(root, "receipts", "install-v1.json"));
}
function gitPointer(path) {
  if (!lstatSync6(path).isFile()) throw new Error("INVALID_GIT_POINTER");
  const file = openSync3(path, "r");
  try {
    const bytes = Buffer.alloc(4097);
    const size = readSync3(file, bytes, 0, bytes.length, 0);
    if (size > 4096) throw new Error("INVALID_GIT_POINTER");
    const content = bytes.subarray(0, size);
    const value = content.toString("utf8").replace(/\r?\n$/, "");
    if (content.includes(0) || value === "" || /[\r\n]/.test(value)) {
      throw new Error("INVALID_GIT_POINTER");
    }
    return value;
  } finally {
    closeSync3(file);
  }
}
function ordinaryLinkedMain(tree) {
  const marker = join16(tree, ".git");
  const pointer = gitPointer(marker);
  if (!pointer.startsWith("gitdir: ")) throw new Error("INVALID_GIT_POINTER");
  const directory = canonical(resolve8(tree, pointer.slice(8)));
  if (!existsSync8(join16(directory, "commondir"))) return void 0;
  const common = canonical(resolve8(directory, gitPointer(join16(directory, "commondir"))));
  const backlink = gitPointer(join16(directory, "gitdir"));
  if (!isAbsolute7(backlink) || canonical(backlink) !== canonical(marker) || canonical(dirname6(directory)) !== canonical(join16(common, "worktrees"))) {
    throw new Error("INVALID_GIT_POINTER");
  }
  const candidate = dirname6(common);
  const candidateMarker = join16(candidate, ".git");
  if (!lstatSync6(candidateMarker, { throwIfNoEntry: false })?.isDirectory() || canonical(candidateMarker) !== common) return void 0;
  return candidate;
}
function resolveTelemetryRoot(cwd, query = git2) {
  const refused = { kind: "unavailable", code: "TELEMETRY_ROOT_UNRESOLVED" };
  try {
    let tree = canonical(cwd);
    while (lstatSync6(join16(tree, ".git"), { throwIfNoEntry: false }) === void 0 && !holdsInstallReceipt(tree)) {
      const parent = dirname6(tree);
      if (parent === tree) {
        return { kind: "resolved", root: canonical(discoverProjectRoot(cwd)) };
      }
      tree = parent;
    }
    const marker = join16(tree, ".git");
    const markerStat = lstatSync6(marker, { throwIfNoEntry: false });
    if (markerStat?.isSymbolicLink()) return refused;
    if (markerStat === void 0 || markerStat.isDirectory() || holdsInstallReceipt(tree)) {
      return { kind: "resolved", root: tree };
    }
    const ordinary = ordinaryLinkedMain(tree);
    if (ordinary !== void 0) return { kind: "resolved", root: ordinary };
    const deadline = performance.now() + 100;
    const [toplevel, directory, common] = query(tree, [
      "rev-parse",
      "--show-toplevel",
      "--absolute-git-dir",
      "--git-common-dir"
    ], deadline)?.trim().split(/\r?\n/) ?? [];
    if (toplevel === void 0 || canonical(toplevel) !== tree) return refused;
    if (directory === void 0 || common === void 0) return refused;
    const commonDirectory = canonical(resolve8(tree, common));
    if (canonical(directory) === commonDirectory) return { kind: "resolved", root: tree };
    const main2 = mainWorkingTree(tree, deadline, commonDirectory, query);
    if (main2 === void 0) return refused;
    return { kind: "resolved", root: main2 };
  } catch {
    return refused;
  }
}

import { createHash as createHash5 } from "node:crypto";
import {
  basename as basename5,
  extname,
  isAbsolute as isAbsolute8,
  relative as relative8,
  resolve as resolve9
} from "node:path";
var MISSION_ID = /^mis_[A-Za-z0-9_-]{8,100}$/;
function record6(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function text(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  let clean2 = "";
  for (const char of value) {
    const point = char.codePointAt(0) ?? 0;
    if (point >= 32 && point !== 127) clean2 += char;
    if (clean2.length >= 256) break;
  }
  return clean2.slice(0, 256);
}
function runtimeSession(raw) {
  return text(
    raw["session_id"] ?? raw["sessionId"] ?? raw["thread_id"] ?? raw["threadId"]
  );
}
function categoryFor(tool) {
  if (tool === "Skill") return "skill";
  if (tool === "Task" || tool === "Agent" || tool === "collaborationspawn_agent" || tool === "collaboration.spawn_agent") return "agent";
  if (tool === "Workflow") return "workflow";
  return "tool";
}
function nameFor(tool, category, input) {
  if (category === "skill") {
    return text(input["skill"] ?? input["name"], "unknown");
  }
  if (category === "agent") {
    return text(
      input["subagent_type"] ?? input["agent_type"] ?? input["agent"],
      tool === "Agent" ? "claude" : "unknown"
    );
  }
  if (category === "workflow") {
    const explicit = text(input["name"]);
    if (explicit !== "") return explicit;
    const script = text(input["scriptPath"]);
    return script === "" || script.endsWith("/") ? "inline" : basename5(script).replace(/(?:\.workflow)?\.js$/, "") || "inline";
  }
  return tool || "unknown";
}
function safePaths(input, root) {
  const absoluteRoot = resolve9(root);
  const candidates = [
    input["file_path"],
    input["path"],
    input["pattern"]
  ];
  const paths = [];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.length > 2e3) continue;
    if (!isAbsolute8(candidate)) {
      if (!candidate.startsWith("..")) paths.push(candidate.slice(0, 500));
      continue;
    }
    const rel = relative8(absoluteRoot, resolve9(candidate));
    if (rel !== "" && !rel.startsWith("..") && !isAbsolute8(rel)) {
      paths.push(rel.slice(0, 500));
    }
  }
  return paths;
}
function outcomeStatus(raw) {
  const response = record6(raw["tool_response"]);
  if (response === void 0) return "unknown";
  if (response["success"] === false || response["is_error"] === true || response["error"] !== void 0) {
    return "error";
  }
  return "ok";
}
function adaptRuntimeInput(value, options) {
  const raw = record6(value);
  if (raw === void 0) return void 0;
  const runtimeSessionId2 = runtimeSession(raw);
  if (options.phase === "stop" || text(raw["hook_event_name"]) === "Stop") {
    return {
      runtimeSessionId: runtimeSessionId2,
      source: `runtime:${options.runtime}`,
      kind: "runtime.session.stopped",
      subject: `runtime:${options.runtime}`,
      payload: {}
    };
  }
  const tool = text(raw["tool_name"], "unknown");
  const input = record6(raw["tool_input"]) ?? {};
  const category = categoryFor(tool);
  const name = nameFor(tool, category, input);
  const fileGlobs = safePaths(input, options.root);
  const extensions = fileGlobs.map((path) => extname(path).slice(1)).filter((extension) => extension !== "");
  return {
    runtimeSessionId: runtimeSessionId2,
    source: `runtime:${options.runtime}`,
    kind: options.phase === "outcome" ? "runtime.tool.completed" : "runtime.tool.started",
    subject: `${category}:${name}`,
    payload: {
      category,
      tool,
      fileGlobs,
      extensions,
      ...options.phase === "outcome" ? { status: outcomeStatus(raw) } : {}
    }
  };
}
function deriveMissionId(explicit, runtime3, runtimeSessionId2, root) {
  if (explicit !== void 0 && explicit !== "") {
    if (!MISSION_ID.test(explicit)) {
      throw new Error("HOOK_INVALID_MISSION_ID: expected mis_<opaque-id>");
    }
    return explicit;
  }
  const opaque = createHash5("sha256").update(`${runtime3}\0${runtimeSessionId2 || "unknown"}\0${resolve9(root)}`).digest("hex").slice(0, 32);
  return `mis_${opaque}`;
}

import { randomUUID as nodeRandomUUID } from "node:crypto";
import {
  constants as constants4
} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  stat,
  unlink
} from "node:fs/promises";
import {
  dirname as dirname7,
  isAbsolute as isAbsolute9,
  join as join17,
  relative as relative9,
  resolve as resolve10
} from "node:path";

var MAX_EVENT_PAYLOAD_BYTES = 16 * 1024;
var MAX_EVENT_LINE_BYTES = 32 * 1024;
var MAX_EVENT_PAYLOAD_DEPTH = 8;
var MAX_EVENT_PAYLOAD_NODES = 512;
var EVENT_ID = /^evt_[A-Za-z0-9_-]{8,100}$/;
var MISSION_ID2 = /^mis_[A-Za-z0-9_-]{8,100}$/;
var DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
var EVENT_KIND = /^[a-z][a-z0-9-]*(?:\.[a-z0-9-]+)+$/;
var EVENT_KEYS = /* @__PURE__ */ new Set([
  "schemaVersion",
  "seq",
  "eventId",
  "missionId",
  "ts",
  "source",
  "kind",
  "subject",
  "causationId",
  "correlationId",
  "payload"
]);
function utf8Bytes(value) {
  let bytes = 0;
  for (const char of value) {
    const code2 = char.codePointAt(0) ?? 0;
    bytes += code2 <= 127 ? 1 : code2 <= 2047 ? 2 : code2 <= 65535 ? 3 : 4;
  }
  return bytes;
}
function isPrintable(value) {
  for (const char of value) {
    const point = char.codePointAt(0) ?? 0;
    if (point < 32 || point === 127) return false;
  }
  return true;
}
function record7(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return void 0;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null ? value : void 0;
}
function isJsonValue(value, depth, budget) {
  budget.nodes += 1;
  if (depth > MAX_EVENT_PAYLOAD_DEPTH || budget.nodes > MAX_EVENT_PAYLOAD_NODES) {
    return false;
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) {
    return value.every(
      (entry) => isJsonValue(entry, depth + 1, budget)
    );
  }
  const object2 = record7(value);
  if (object2 === void 0) return false;
  return Object.entries(object2).every(
    ([key, entry]) => key.length <= 100 && isPrintable(key) && isJsonValue(entry, depth + 1, budget)
  );
}
function boundedLabel(value, min, max, pattern2) {
  return typeof value === "string" && value.length >= min && value.length <= max && isPrintable(value) && (pattern2 === void 0 || pattern2.test(value));
}
function contractError(message) {
  return {
    ok: false,
    issue: { code: "invalid-event-contract", message }
  };
}
function parseEvent(value) {
  const raw = record7(value);
  if (raw === void 0) return contractError("event must be a plain object");
  const unknownKeys = Object.keys(raw).filter((key) => !EVENT_KEYS.has(key));
  if (unknownKeys.length > 0) {
    return contractError(`unknown field(s): ${unknownKeys.join(", ")}`);
  }
  if (raw["schemaVersion"] !== 1) return contractError("schemaVersion must be 1");
  if (typeof raw["seq"] !== "number" || !Number.isSafeInteger(raw["seq"]) || raw["seq"] <= 0) {
    return contractError("seq must be a positive safe integer");
  }
  if (!boundedLabel(raw["eventId"], 12, 104, EVENT_ID)) {
    return contractError("eventId must be evt_<opaque-id>");
  }
  if (!boundedLabel(raw["missionId"], 12, 104, MISSION_ID2)) {
    return contractError("missionId must be mis_<opaque-id>");
  }
  if (!boundedLabel(raw["ts"], 20, 24, DATE_TIME)) {
    return contractError("ts must be an ISO UTC timestamp");
  }
  if (!boundedLabel(raw["source"], 1, 128)) {
    return contractError("source must be a bounded label");
  }
  if (!boundedLabel(raw["kind"], 3, 128, EVENT_KIND)) {
    return contractError("kind must be a dotted event name");
  }
  if (!boundedLabel(raw["subject"], 1, 256)) {
    return contractError("subject must be a bounded label");
  }
  if (raw["causationId"] !== void 0 && !boundedLabel(raw["causationId"], 12, 104, EVENT_ID)) {
    return contractError("causationId must be evt_<opaque-id>");
  }
  if (!boundedLabel(raw["correlationId"], 12, 104, MISSION_ID2)) {
    return contractError("correlationId must be mis_<opaque-id>");
  }
  if (!isJsonValue(raw["payload"], 0, { nodes: 0 })) {
    return contractError("payload must be bounded JSON data");
  }
  if (utf8Bytes(JSON.stringify(raw["payload"])) > MAX_EVENT_PAYLOAD_BYTES) {
    return contractError(`payload exceeds ${MAX_EVENT_PAYLOAD_BYTES} bytes`);
  }
  const required = {
    schemaVersion: 1,
    seq: raw["seq"],
    eventId: raw["eventId"],
    missionId: raw["missionId"],
    ts: raw["ts"],
    source: raw["source"],
    kind: raw["kind"],
    subject: raw["subject"],
    correlationId: raw["correlationId"],
    payload: raw["payload"]
  };
  return {
    ok: true,
    value: {
      ...required,
      ...raw["causationId"] === void 0 ? {} : { causationId: raw["causationId"] }
    }
  };
}
function parseEventLine(line) {
  if (utf8Bytes(line) > MAX_EVENT_LINE_BYTES) {
    return {
      ok: false,
      issue: {
        code: "event-line-too-large",
        message: `event line exceeds ${MAX_EVENT_LINE_BYTES} bytes`
      }
    };
  }
  let raw;
  try {
    raw = JSON.parse(line);
  } catch (error) {
    return {
      ok: false,
      issue: {
        code: "invalid-event-json",
        message: error instanceof Error ? error.message : String(error)
      }
    };
  }
  return parseEvent(raw);
}
function serializeEvent(event) {
  const parsed = parseEvent(event);
  if (!parsed.ok) throw new Error(`EVENT_INVALID: ${parsed.issue.message}`);
  const line = JSON.stringify(parsed.value);
  if (utf8Bytes(line) > MAX_EVENT_LINE_BYTES) {
    throw new Error(`EVENT_LINE_TOO_LARGE: exceeds ${MAX_EVENT_LINE_BYTES} bytes`);
  }
  return line;
}

function replayEventLog(text2) {
  const events = [];
  const eventIds = /* @__PURE__ */ new Set();
  const sequences = /* @__PURE__ */ new Set();
  const issues = [];
  let lastSeq = 0;
  let continuity = "empty";
  let duplicateEventIds = 0;
  let invalidLines = 0;
  const lines = text2.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (line.trim() === "") continue;
    const parsed = parseEventLine(line);
    if (parsed.ok) {
      const event = parsed.value;
      if (eventIds.has(event.eventId)) {
        duplicateEventIds += 1;
        continue;
      }
      eventIds.add(event.eventId);
      events.push(event);
      continuity = continuity === "empty" ? "complete" : continuity;
      if (sequences.has(event.seq)) {
        issues.push({ code: "duplicate-sequence", seq: event.seq });
        continuity = "partial";
      } else {
        const expectedSeq = lastSeq + 1;
        if (event.seq > expectedSeq) {
          issues.push({
            code: "sequence-gap",
            expectedSeq,
            actualSeq: event.seq
          });
          continuity = "partial";
        } else if (event.seq < expectedSeq) {
          issues.push({
            code: "out-of-order-sequence",
            previousSeq: lastSeq,
            actualSeq: event.seq
          });
          continuity = "partial";
        }
        sequences.add(event.seq);
      }
      lastSeq = Math.max(lastSeq, event.seq);
    } else {
      continuity = "partial";
      invalidLines += 1;
      issues.push({
        code: "invalid-event-line",
        line: index + 1,
        detail: `${parsed.issue.code}: ${parsed.issue.message}`
      });
    }
  }
  return {
    events,
    eventIds,
    sequences,
    lastSeq,
    continuity,
    duplicateEventIds,
    invalidLines,
    issues
  };
}

var MAX_EVENT_LOG_BYTES = 8 * 1024 * 1024;
var MISSION_ID3 = /^mis_[A-Za-z0-9_-]{8,100}$/;
var EVENT_ID2 = /^evt_[A-Za-z0-9_-]{8,100}$/;
var DEFAULT_LOCK_STALE_MS = 3e4;
var DEFAULT_LOCK_ATTEMPTS = 2e3;
var LOCK_RETRY_MS = 2;
function code(error) {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : void 0;
}
function within4(root, target) {
  const rel = relative9(root, target);
  return rel === "" || !rel.startsWith("..") && !isAbsolute9(rel);
}
async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (code(error) === "ENOENT") return false;
    throw error;
  }
}
async function safeRunDirectory(root, missionId) {
  if (!MISSION_ID3.test(missionId)) {
    throw new Error("HOOK_INVALID_MISSION_ID: expected mis_<opaque-id>");
  }
  const absoluteRoot = resolve10(root);
  const canonicalRoot = await realpath(absoluteRoot);
  const run = voidReadPath(absoluteRoot, "runs", missionId);
  let ancestor = run;
  while (!await exists(ancestor)) {
    const parent = dirname7(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  const canonicalAncestor = await realpath(ancestor);
  if (!within4(canonicalRoot, canonicalAncestor)) {
    throw new Error("HOOK_PATH_ESCAPE: run directory resolves outside project");
  }
  await mkdir(run, { recursive: true, mode: 448 });
  const canonicalRun = await realpath(run);
  if (!within4(canonicalRoot, canonicalRun)) {
    throw new Error("HOOK_PATH_ESCAPE: run directory resolves outside project");
  }
  return run;
}
async function rejectSymlink(path) {
  try {
    const info = await lstat(path);
    if (info.isSymbolicLink() || !info.isFile()) {
      throw new Error(`HOOK_UNSAFE_FILE: ${path} must be a regular file`);
    }
  } catch (error) {
    if (code(error) !== "ENOENT") throw error;
  }
}
async function wait(ms) {
  await new Promise((resolveWait) => {
    setTimeout(resolveWait, ms);
  });
}
async function acquireLock2(path, staleMs, attempts) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const token = nodeRandomUUID();
    try {
      const handle = await open(path, "wx", 384);
      try {
        await handle.writeFile(
          JSON.stringify({ token, pid: process.pid, acquiredAt: Date.now() }),
          "utf8"
        );
      } finally {
        await handle.close();
      }
      return { path, token };
    } catch (error) {
      if (code(error) !== "EEXIST") throw error;
      const info = await lstat(path).catch((statError) => {
        if (code(statError) === "ENOENT") return void 0;
        throw statError;
      });
      if (info === void 0) continue;
      if (info.isSymbolicLink() || !info.isFile()) {
        throw new Error("HOOK_UNSAFE_LOCK: lock must be a regular file");
      }
      if (Date.now() - info.mtimeMs > staleMs) {
        await unlink(path).catch((unlinkError) => {
          if (code(unlinkError) !== "ENOENT") throw unlinkError;
        });
        continue;
      }
      await wait(LOCK_RETRY_MS);
    }
  }
  throw new Error("HOOK_LOCK_TIMEOUT: event sequencer remained busy");
}
async function releaseLock2(lock) {
  try {
    const raw = await readFile(lock.path, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed.token === lock.token) await unlink(lock.path);
  } catch (error) {
    if (code(error) !== "ENOENT") throw error;
  }
}
async function readSequenceState(statePath, logPath, logBytes) {
  try {
    const raw = JSON.parse(await readFile(statePath, "utf8"));
    if (Number.isSafeInteger(raw.seq) && (raw.seq ?? -1) >= 0 && raw.logBytes === logBytes) {
      return raw.seq ?? 0;
    }
  } catch {
  }
  if (logBytes === 0) return 0;
  return replayEventLog(await readFile(logPath, "utf8")).lastSeq;
}
async function ensureLineBoundary(logPath, logBytes) {
  if (logBytes === 0) return 0;
  const handle = await open(logPath, "r");
  try {
    const finalByte = Buffer.alloc(1);
    await handle.read(finalByte, 0, 1, logBytes - 1);
    if (finalByte[0] === 10) return logBytes;
  } finally {
    await handle.close();
  }
  const append = await open(
    logPath,
    constants4.O_APPEND | constants4.O_WRONLY | (constants4.O_NOFOLLOW ?? 0)
  );
  try {
    await append.writeFile("\n", "utf8");
  } finally {
    await append.close();
  }
  return logBytes + 1;
}
async function appendLine(logPath, line) {
  const flags = constants4.O_APPEND | constants4.O_CREAT | constants4.O_WRONLY | (constants4.O_NOFOLLOW ?? 0);
  const handle = await open(logPath, flags, 384);
  try {
    await handle.writeFile(`${line}
`, "utf8");
    return (await handle.stat()).size;
  } finally {
    await handle.close();
  }
}
async function writeSequenceState(statePath, state, randomUUID) {
  const temporary = `${statePath}.${randomUUID()}.tmp`;
  const handle = await open(temporary, "wx", 384);
  try {
    await handle.writeFile(JSON.stringify(state), "utf8");
  } finally {
    await handle.close();
  }
  await rename(temporary, statePath);
}
function sameDraft(event, options) {
  return event.missionId === options.missionId && event.source === options.draft.source && event.kind === options.draft.kind && event.subject === options.draft.subject && event.correlationId === options.draft.correlationId && event.causationId === options.draft.causationId && JSON.stringify(event.payload) === JSON.stringify(options.draft.payload);
}
async function existingIdempotentEvent(logPath, options, currentBytes) {
  if (options.eventId === void 0 || currentBytes === 0) return void 0;
  const stream = replayEventLog(await readFile(logPath, "utf8"));
  if (stream.continuity === "partial" || stream.duplicateEventIds > 0) {
    throw new Error("HOOK_EVENT_LOG_INTEGRITY: continuity cannot be proved");
  }
  const existing = stream.events.find((event) => event.eventId === options.eventId);
  if (existing !== void 0 && !sameDraft(existing, options)) {
    throw new Error("HOOK_EVENT_ID_CONFLICT: event ID belongs to another draft");
  }
  return existing;
}
async function currentCanonicalEvents(logPath, currentBytes) {
  if (currentBytes === 0) return [];
  const stream = replayEventLog(await readFile(logPath, "utf8"));
  if (stream.continuity === "partial" || stream.duplicateEventIds > 0) {
    throw new Error("HOOK_EVENT_LOG_INTEGRITY: continuity cannot be proved");
  }
  return stream.events;
}
async function writeSequencedEventInternal(options) {
  if (options.eventId !== void 0 && !EVENT_ID2.test(options.eventId)) {
    throw new Error("HOOK_INVALID_EVENT_ID: expected evt_<opaque-id>");
  }
  const run = await safeRunDirectory(options.root, options.missionId);
  const logPath = join17(run, "events.jsonl");
  const statePath = join17(run, ".seq.state");
  const lockPath = join17(run, ".seq.lock");
  await Promise.all([
    rejectSymlink(logPath),
    rejectSymlink(statePath),
    rejectSymlink(lockPath)
  ]);
  const lock = await acquireLock2(
    lockPath,
    options.lockStaleMs ?? DEFAULT_LOCK_STALE_MS,
    options.lockAttempts ?? DEFAULT_LOCK_ATTEMPTS
  );
  const randomUUID = options.randomUUID ?? nodeRandomUUID;
  try {
    await rejectSymlink(logPath);
    const currentBytes = await stat(logPath).then((value) => value.size).catch((error) => {
      if (code(error) === "ENOENT") return 0;
      throw error;
    });
    if (currentBytes > MAX_EVENT_LOG_BYTES) {
      throw new Error("HOOK_EVENT_LOG_FULL: rotate or archive the run");
    }
    const existing = await existingIdempotentEvent(
      logPath,
      options,
      currentBytes
    );
    if (existing !== void 0) {
      return Object.freeze({ event: existing, appended: false });
    }
    if (options.validate !== void 0) {
      await options.validate(await currentCanonicalEvents(logPath, currentBytes));
    }
    if (currentBytes >= MAX_EVENT_LOG_BYTES) {
      throw new Error("HOOK_EVENT_LOG_FULL: rotate or archive the run");
    }
    const boundedBytes = await ensureLineBoundary(logPath, currentBytes);
    const previousSeq = await readSequenceState(
      statePath,
      logPath,
      boundedBytes
    );
    const event = {
      schemaVersion: 1,
      seq: previousSeq + 1,
      eventId: options.eventId ?? `evt_${randomUUID()}`,
      missionId: options.missionId,
      ts: (options.now ?? /* @__PURE__ */ new Date()).toISOString(),
      ...options.draft
    };
    const line = serializeEvent(event);
    if (boundedBytes + Buffer.byteLength(line) + 1 > MAX_EVENT_LOG_BYTES) {
      throw new Error("HOOK_EVENT_LOG_FULL: rotate or archive the run");
    }
    const logBytes = await appendLine(logPath, line);
    await writeSequenceState(
      statePath,
      { seq: event.seq, logBytes },
      randomUUID
    );
    return Object.freeze({ event, appended: true });
  } finally {
    await releaseLock2(lock);
  }
}
async function writeSequencedEvent(options) {
  return (await writeSequencedEventInternal(options)).event;
}

async function recordRuntimeEvent(options) {
  const adapted = adaptRuntimeInput(options.rawInput, options);
  if (adapted === void 0) return void 0;
  const missionId = deriveMissionId(
    options.missionId,
    options.runtime,
    adapted.runtimeSessionId,
    options.root
  );
  const draft = {
    source: adapted.source,
    kind: adapted.kind,
    subject: adapted.subject,
    correlationId: missionId,
    payload: adapted.payload
  };
  const event = await writeSequencedEvent({
    root: options.root,
    missionId,
    draft
  });
  return event;
}
async function recordHookEvent(options) {
  if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(options.hook)) {
    throw new Error("HOOK_INVALID_NAME: expected a bounded kebab-case name");
  }
  const adapted = adaptRuntimeInput(options.rawInput ?? {}, {
    root: options.root,
    runtime: options.runtime,
    phase: "outcome"
  });
  const missionId = deriveMissionId(
    options.missionId,
    options.runtime,
    adapted?.runtimeSessionId ?? "",
    options.root
  );
  const event = await writeSequencedEvent({
    root: options.root,
    missionId,
    draft: {
      source: `runtime:${options.runtime}`,
      kind: "hook.completed",
      subject: `hook:${options.hook}`,
      correlationId: missionId,
      payload: {
        status: options.status,
        ...options.details ?? {}
      }
    }
  });
  return event;
}
function runtime(value) {
  return value === "claude" || value === "codex" ? value : "unknown";
}
function phase(value) {
  if (value === "outcome" || value === "stop") return value;
  return "activation";
}
async function recordRuntimeEventFromCli(raw, argv, env) {
  const explicitRoot = env["VOID_PROJECT_ROOT"] ?? env["CLAUDE_PROJECT_DIR"];
  const destination = explicitRoot === void 0 ? resolveTelemetryRoot(process.cwd()) : { kind: "resolved", root: explicitRoot };
  if (destination.kind === "unavailable") throw new Error(destination.code);
  await recordRuntimeEvent({
    root: destination.root,
    runtime: runtime(argv[3] ?? env["VOID_AGENT_RUNTIME"]),
    phase: phase(argv[2]),
    rawInput: raw,
    ...env["VOID_MISSION_ID"] === void 0 ? {} : { missionId: env["VOID_MISSION_ID"] }
  });
}

var RULES = new Set(RULE_NAMES);
function isRuleName(value) {
  return value !== void 0 && RULES.has(value);
}
async function readStdin(ciContent) {
  const limit = ciContent ? MAX_CI_CONTENT_BYTES : MAX_HOOK_INPUT_BYTES;
  const chunks = [];
  let bytes = 0;
  for await (const raw of process.stdin) {
    const chunk = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw));
    bytes += chunk.byteLength;
    if (bytes > limit) {
      throw new Error(ciContent ? "CI_CONTENT_TOO_LARGE" : "HOOK_INPUT_TOO_LARGE");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function writeVerdict(rule, verdict, write) {
  if (verdict.code === "ALLOW" || verdict.code === "OVERRIDE") return;
  const evidence = verdict.evidence.length === 0 ? "" : `
${verdict.evidence.map((item) => `- ${item}`).join("\n")}`;
  write(`${verdict.code}: ${withGoverningSkill(rule, verdict.message)}${evidence}
`);
}
function runtime2(value) {
  return value === "claude" || value === "codex" ? value : "unknown";
}
function projectRoot() {
  return process.env["VOID_PROJECT_ROOT"] ?? process.env["CLAUDE_PROJECT_DIR"] ?? discoverProjectRoot(process.cwd());
}
function optionalPayload(input) {
  if (input.byteLength === 0) return {};
  try {
    return parseHookPayload(input);
  } catch {
    return void 0;
  }
}
async function refreshFreshnessInBackground(installed) {
  try {
    await resolveFreshness({
      installed,
      env: process.env,
      now: Date.now(),
      timeoutMs: 1e3
    });
  } catch {
  }
}
var telemetryDestination;
function reportTelemetryFailure(error) {
  const unresolved2 = error instanceof Error && error.message === "TELEMETRY_ROOT_UNRESOLVED";
  process.stderr.write(unresolved2 ? "TELEMETRY_ROOT_UNRESOLVED: cannot verify journal destination; check Git worktree metadata and Git availability.\n" : "TELEMETRY_WRITE_FAILED: journal was not recorded; check journal access and storage.\n");
}
async function observeHook(hook, execution, rawInput, agentRuntime, root) {
  try {
    const explicitRoot = process.env["VOID_PROJECT_ROOT"] ?? process.env["CLAUDE_PROJECT_DIR"];
    telemetryDestination ??= explicitRoot === void 0 ? resolveTelemetryRoot(root) : { kind: "resolved", root: explicitRoot };
    if (telemetryDestination.kind === "unavailable") throw new Error(telemetryDestination.code);
    await recordHookEvent({
      root: telemetryDestination.root,
      runtime: agentRuntime,
      hook,
      status: execution.status,
      rawInput,
      details: execution.details,
      ...process.env["VOID_MISSION_ID"] === void 0 ? {} : { missionId: process.env["VOID_MISSION_ID"] }
    });
  } catch (error) {
    reportTelemetryFailure(error);
  }
}
async function runLifecycle(input) {
  const hook = process.argv[3] ?? "";
  const agentRuntime = runtime2(process.argv[4] ?? process.env["VOID_AGENT_RUNTIME"]);
  const root = projectRoot();
  const rawInput = optionalPayload(input);
  if (hook === "context" || hook === "context-continuity") {
    const inputRecord = record3(rawInput);
    const event = inputRecord?.["hook_event_name"];
    if (hook === "context-continuity" && event !== "SessionStart") {
      const execution3 = executeContextContinuity(rawInput ?? {}, root, agentRuntime, Date.now());
      if (execution3.output !== void 0) {
        process.stdout.write(`${JSON.stringify(execution3.output)}
`);
      }
      await observeHook(hook, execution3, rawInput ?? {}, agentRuntime, root);
      return;
    }
    const install = resolveInstall(root, process.env);
    const cached = readFreshnessCache(process.env, Date.now());
    const notice = cached === void 0 ? void 0 : freshnessRelay(compareFreshness(install.version, cached.latest), install.source);
    const alert = cachedInvocationAlert(root);
    if (event === "SessionStart" || hook === "context") {
      const source2 = inputRecord?.["source"];
      const resume = observeResume(root, Date.now(), {
        ...source2 === "startup" || source2 === "resume" || source2 === "clear" || source2 === "compact" || source2 === "fork" ? { source: source2 } : {}
      });
      process.stdout.write(
        `${JSON.stringify(sessionStartOutput(install.version, notice, alert, resume.context))}
`
      );
    }
    const execution2 = hook === "context-continuity" ? executeContextContinuity(rawInput ?? {}, root, agentRuntime, Date.now()) : { status: "ok", details: {} };
    await refreshFreshnessInBackground(install.version);
    refreshInvocationVerdict(root);
    await observeHook(hook, execution2, rawInput ?? {}, agentRuntime, root);
    return;
  }
  if (rawInput === void 0) {
    await observeHook(
      hook || "unknown",
      { status: "degraded", details: { reason: "invalid-hook-input" } },
      {},
      agentRuntime,
      root
    );
    return;
  }
  if (hook === "checkpoint-reminder") {
    const prompt = record3(rawInput)?.["prompt"];
    const output = typeof prompt === "string" ? checkpointReminderOutput(prompt) : void 0;
    const execution2 = {
      status: output === void 0 ? "skipped" : "ok",
      details: { reminded: output !== void 0 }
    };
    if (output !== void 0) process.stdout.write(`${JSON.stringify(output)}
`);
    await observeHook(hook, execution2, rawInput, agentRuntime, root);
    return;
  }
  if (hook === "checkpoint-audit") {
    const now = Date.now();
    const observed = observeResume(root, now);
    const audit = auditCheckpoint({
      now,
      checkpoint: observed.bundle.checkpoint,
      ...observed.checkpointWrittenAt === void 0 ? {} : { checkpointWrittenAt: observed.checkpointWrittenAt },
      git: observed.bundle.git
    });
    const execution2 = {
      status: audit.status,
      details: { reasons: [...audit.reasons] },
      ...audit.reasons.length === 0 ? {} : {
        diagnostic: `${PRODUCT_COMMAND} SessionEnd audit: ${audit.reasons.join(", ")}
`
      }
    };
    if (execution2.diagnostic !== void 0) process.stderr.write(execution2.diagnostic);
    await observeHook(hook, execution2, rawInput, agentRuntime, root);
    return;
  }
  const execution = hook === "format" ? executeFormat(rawInput, root, process.env) : hook === "trim" ? executeTrim(rawInput, root, process.env) : hook === "typecheck" ? executeTypecheck(root, process.env) : hook === "large-change" ? executeLargeChange(root, process.env) : void 0;
  if (execution === void 0) return;
  if (execution.diagnostic !== void 0) process.stderr.write(execution.diagnostic);
  if ("output" in execution && execution.output !== void 0) {
    process.stdout.write(`${JSON.stringify(execution.output)}
`);
  }
  await observeHook(hook, execution, rawInput, agentRuntime, root);
}
async function main() {
  const input = await readStdin(process.argv[2] === "enforce-ci");
  if (process.argv[2] === "lifecycle") {
    await runLifecycle(input);
    return;
  }
  if (process.argv[2] !== "enforce" && process.argv[2] !== "enforce-ci") {
    try {
      await recordRuntimeEventFromCli(
        parseHookPayload(input),
        process.argv,
        process.env
      );
    } catch (error) {
      reportTelemetryFailure(error);
    }
    return;
  }
  try {
    const requested = process.argv[3];
    if (!isRuleName(requested)) throw new Error("UNKNOWN_ENFORCEMENT_RULE");
    const rule = requested;
    const rawInput = process.argv[2] === "enforce-ci" ? {
      tool_name: "Write",
      tool_input: {
        file_path: process.argv[4] ?? "",
        content: parseCiContent(input)
      }
    } : parseHookPayload(input);
    const verdict = evaluateRule(
      rule,
      rawInput,
      {
        root: projectRoot(),
        source: process.argv[2] === "enforce-ci" ? "checked-out" : "tool-input",
        env: process.env
      }
    );
    if (process.argv[2] === "enforce") {
      await observeHook(
        rule,
        {
          status: verdict.allow ? "ok" : "blocked",
          details: {
            code: verdict.code,
            evidenceCount: verdict.evidence.length
          }
        },
        rawInput,
        runtime2(process.argv[4] ?? process.env["VOID_AGENT_RUNTIME"]),
        projectRoot()
      );
    }
    writeVerdict(rule, verdict, (message) => process.stderr.write(message));
    if (!verdict.allow) process.exitCode = 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ENFORCEMENT_ERROR";
    process.stderr.write(`HOOK_INPUT_REJECTED: ${message}
`);
    process.exitCode = 2;
  }
}
main().catch((error) => {
  const message = error instanceof Error ? error.message : "UNKNOWN_ENFORCEMENT_ERROR";
  process.stderr.write(`HOOK_RUNNER_FAILED: ${message}
`);
  process.exitCode = process.argv[2] === "enforce" || process.argv[2] === "enforce-ci" ? 2 : 0;
});
