// syntax-worker: {"sha256":"12e6a141d5bda6486f285da9af96d09c638ceb26a321f1362a1df064b8eefea3","bytes":3588399}
import { createRequire as createNodeRequire } from 'node:module'; const require = createNodeRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
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

// <define:__VOID_SYNTAX_WORKER_IDENTITY__>
var define_VOID_SYNTAX_WORKER_IDENTITY_default;
var init_define_VOID_SYNTAX_WORKER_IDENTITY = __esm({
  "<define:__VOID_SYNTAX_WORKER_IDENTITY__>"() {
    define_VOID_SYNTAX_WORKER_IDENTITY_default = { sha256: "12e6a141d5bda6486f285da9af96d09c638ceb26a321f1362a1df064b8eefea3", bytes: 3588399 };
  }
});

var require_identity = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode2(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias2;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode2;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

var require_visit = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit2(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit2.BREAK = BREAK;
    visit2.SKIP = SKIP;
    visit2.REMOVE = REMOVE;
    function visit_(key, node, visitor, path2) {
      const ctrl = callVisitor(key, node, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visit_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path2 = Object.freeze(path2.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path2 = Object.freeze(path2.concat(node));
          const ck = visit_("key", node.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path2) {
      const ctrl = await callVisitor(key, node, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visitAsync_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path2 = Object.freeze(path2.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path2 = Object.freeze(path2.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path2) {
      if (typeof visitor === "function")
        return visitor(key, node, path2);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path2);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path2);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path2);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path2);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path2);
      return void 0;
    }
    function replaceNode(key, path2, node) {
      const parent = path2[path2.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit2;
    exports.visitAsync = visitAsync;
  }
});

var require_directives = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var visit2 = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version2] = parts;
            if (version2 === "1.1" || version2 === "1.2") {
              this.yaml.version = version2;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version2);
              onError(6, `Unsupported YAML version ${version2}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source2, onError) {
        if (source2 === "!")
          return "!";
        if (source2[0] !== "!") {
          onError(`Not a valid tag: ${source2}`);
          return null;
        }
        if (source2[1] === "<") {
          const verbatim = source2.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source2} is invalid.`);
            return null;
          }
          if (source2[source2.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source2.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source2} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source2;
        onError(`Could not resolve tag: ${source2}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit2.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

var require_anchors = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var visit2 = require_visit();
    function anchorIsValid(anchor2) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor2)) {
        const sa = JSON.stringify(anchor2);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit2.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source2) => {
          aliasObjects.push(source2);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor2 = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor2);
          return anchor2;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source2 of aliasObjects) {
            const ref = sourceObjects.get(source2);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source2;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

var require_applyReviver = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

var require_toJS = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

var require_Node = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

var require_Alias = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var anchors = require_anchors();
    var visit2 = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source2) {
        super(identity.ALIAS);
        this.source = source2;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit2.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const { anchors: anchors2, doc, maxAliasCount } = ctx;
        const source2 = this.resolve(doc, ctx);
        if (!source2) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        let data = anchors2.get(source2);
        if (!data) {
          toJS.toJS(source2, null, ctx);
          data = anchors2.get(source2);
        }
        if (data?.res === void 0) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, source2, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
        return data.res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source2 = node.resolve(doc);
        const anchor2 = anchors2 && source2 && anchors2.get(source2);
        return anchor2 ? anchor2.count * anchor2.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

var require_Scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

var require_createNode = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

var require_Collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path2, value) {
      let v = value;
      for (let i = path2.length - 1; i >= 0; --i) {
        const k = path2[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path2) => path2 == null || typeof path2 === "object" && !!path2[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path2, value) {
        if (isEmptyPath(path2))
          this.add(value);
        else {
          const [key, ...rest] = path2;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        const [key, ...rest] = path2;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value) {
        const [key, ...rest] = path2;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

var require_stringifyComment = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

var require_foldFlowLines = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text3, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text3;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text3.length <= endStep)
        return text3;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text3, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text3[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text3[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text3, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text3[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text3[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text3;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text3;
      if (onFold)
        onFold();
      let res = text3.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text3.length;
        if (fold === 0)
          res = `
${indent}${text3.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text3[fold]}\\`;
          res += `
${indent}${text3.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text3, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text3[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text3[++i];
        } else {
          do {
            ch = text3[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text3[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

var require_stringifyString = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code2 = json.substr(i + 2, 4);
                switch (code2) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code2.substr(0, 2) === "00")
                      str += "\\x" + code2.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal2 = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal2 ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal2) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

var require_stringify = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor2 = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor2 && anchors.anchorIsValid(anchor2)) {
        anchors$1.add(anchor2);
        props.push(`&${anchor2}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify;
  }
});

var require_stringifyPair = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports.stringifyPair = stringifyPair;
  }
});

var require_log = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

var require_merge = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge2 = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge2.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge2.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge2.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source2 = resolveAliasValue(ctx, value);
      if (identity.isSeq(source2))
        for (const it of source2.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source2))
        for (const it of source2)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source2);
    }
    function mergeValue(ctx, map, value) {
      const source2 = resolveAliasValue(ctx, value);
      if (!identity.isMap(source2))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source2.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge2;
  }
});

var require_addPairToJSMap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var log = require_log();
    var merge2 = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge2.isMergeKey(ctx, key))
        merge2.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

var require_Pair = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

var require_stringifyCollection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

var require_YAMLMap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

var require_map = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports.map = map;
  }
});

var require_YAMLSeq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

var require_seq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports.seq = seq;
  }
});

var require_string = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var stringifyString = require_stringifyString();
    var string3 = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string3;
  }
});

var require_null = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source: source2 }, ctx) => typeof source2 === "string" && nullTag.test.test(source2) ? source2 : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

var require_bool = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source: source2, value }, ctx) {
        if (source2 && boolTag.test.test(source2)) {
          const sv = source2[0] === "t" || source2[0] === "T";
          if (value === sv)
            return source2;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

var require_stringifyNumber = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

var require_float = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

var require_int = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int2 = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int2;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

var require_schema = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var map = require_map();
    var _null3 = require_null();
    var seq = require_seq();
    var string3 = require_string();
    var bool = require_bool();
    var float = require_float();
    var int2 = require_int();
    var schema = [
      map.map,
      seq.seq,
      string3.string,
      _null3.nullTag,
      bool.boolTag,
      int2.intOct,
      int2.int,
      int2.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

var require_schema2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

var require_binary = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

var require_pairs = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

var require_omap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

var require_bool2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Scalar = require_Scalar();
    function boolStringify({ value, source: source2 }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source2 && boolObj.test.test(source2))
        return source2;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

var require_float2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

var require_int2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int2 = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int2;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

var require_set = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

var require_timestamp = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date3 = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date3 -= 6e4 * d;
        }
        return new Date(date3);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

var require_schema3 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var map = require_map();
    var _null3 = require_null();
    var seq = require_seq();
    var string3 = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int2 = require_int2();
    var merge2 = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string3.string,
      _null3.nullTag,
      bool.trueTag,
      bool.falseTag,
      int2.intBin,
      int2.intOct,
      int2.int,
      int2.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge2.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

var require_tags = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var map = require_map();
    var _null3 = require_null();
    var seq = require_seq();
    var string3 = require_string();
    var bool = require_bool();
    var float = require_float();
    var int2 = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge2 = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string3.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int2.int,
      intHex: int2.intHex,
      intOct: int2.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge2.merge,
      null: _null3.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge2.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge2.merge) ? schemaTags.concat(merge2.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge2.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

var require_Schema = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string3 = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge: merge2, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge2);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string3.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

var require_stringifyDocument = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

var require_Document = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version: version2 } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version2 = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version: version2 });
        this.setSchema(version2, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path2, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path2, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        if (Collection.isEmptyPath(path2)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path2) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        if (Collection.isEmptyPath(path2))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path2, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path2) {
        if (Collection.isEmptyPath(path2))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path2) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value) {
        if (Collection.isEmptyPath(path2)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path2), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path2, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version2, options = {}) {
        if (typeof version2 === "number")
          version2 = String(version2);
        let opt;
        switch (version2) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version2;
            else
              this.directives = new directives.Directives({ version: version2 });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version2);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

var require_errors = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var YAMLError = class extends Error {
      constructor(name, pos, code2, message) {
        super();
        this.name = name;
        this.code = code2;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code2, message) {
        super("YAMLParseError", pos, code2, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code2, message) {
        super("YAMLWarning", pos, code2, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

var require_resolve_props = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor2 = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor2 || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor2)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor2 = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor2 || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor: anchor2,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

var require_util_contains_newline = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

var require_util_flow_indent_check = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

var require_util_map_includes = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

var require_resolve_block_map = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep: sep2, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep2) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep2 ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep2, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

var require_resolve_block_seq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

var require_resolve_end = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep2 = "";
        for (const token of end) {
          const { source: source2, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source2.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep2 + cb;
              sep2 = "";
              break;
            }
            case "newline":
              if (comment)
                sep2 += source2;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source2.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

var require_resolve_flow_collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep: sep2, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep2 && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep2 && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep2, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep2 ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep2)
                for (const st of sep2) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep2, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

var require_compose_collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor: anchor2, newlineAfterProp: nl } = props;
        const lastProp = anchor2 && tagToken ? anchor2.offset > tagToken.offset ? anchor2 : tagToken : anchor2 ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

var require_resolve_block_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar2, onError) {
      const start = scalar2.offset;
      const header = parseBlockScalarHeader(scalar2, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar2.source ? splitLines(scalar2.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar2.source)
          end2 += scalar2.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar2.indent + header.indent;
      let offset = scalar2.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep2 = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep2 === " ")
            sep2 = "\n";
          else if (!prevMoreIndented && sep2 === "\n")
            sep2 = "\n\n";
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep2 === "\n")
            value += "\n";
          else
            sep2 = "\n";
        } else {
          value += sep2 + content;
          sep2 = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar2.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source: source2 } = props[0];
      const mode = source2[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source2.length; ++i) {
        const ch = source2[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source2}`);
      let hasSpace = false;
      let comment = "";
      let length = source2.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source2) {
      const split = source2.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

var require_resolve_flow_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar2, strict, onError) {
      const { offset, type, source: source2, end } = scalar2;
      let _type;
      let value;
      const _onError = (rel, code2, msg) => onError(offset + rel, code2, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source2, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source2, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source2, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar2, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source2.length, offset + source2.length]
          };
      }
      const valueEnd = offset + source2.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source2, onError) {
      let badChar = "";
      switch (source2[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source2[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source2[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return foldLines(source2);
    }
    function singleQuotedValue(source2, onError) {
      if (source2[source2.length - 1] !== "'" || source2.length === 1)
        onError(source2.length, "MISSING_CHAR", "Missing closing 'quote");
      return foldLines(source2.slice(1, -1)).replace(/''/g, "'");
    }
    function foldLines(source2) {
      let first, line;
      try {
        first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
        line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
      } catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
      }
      let match = first.exec(source2);
      if (!match)
        return source2;
      let res = match[1];
      let sep2 = " ";
      let pos = first.lastIndex;
      line.lastIndex = pos;
      while (match = line.exec(source2)) {
        if (match[1] === "") {
          if (sep2 === "\n")
            res += sep2;
          else
            sep2 = "\n";
        } else {
          res += sep2 + match[1];
          sep2 = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source2);
      return res + sep2 + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source2, onError) {
      let res = "";
      for (let i = 1; i < source2.length - 1; ++i) {
        const ch = source2[i];
        if (ch === "\r" && source2[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source2, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source2[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source2[i + 1];
            while (next === " " || next === "	")
              next = source2[++i + 1];
          } else if (next === "\r" && source2[i + 1] === "\n") {
            next = source2[++i + 1];
            while (next === " " || next === "	")
              next = source2[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source2, i + 1, length, onError);
            i += length;
          } else {
            const raw = source2.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source2[i + 1];
          while (next === " " || next === "	")
            next = source2[++i + 1];
          if (next !== "\n" && !(next === "\r" && source2[i + 2] === "\n"))
            res += i > wsStart ? source2.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source2[source2.length - 1] !== '"' || source2.length === 1)
        onError(source2.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source2, offset) {
      let fold = "";
      let ch = source2[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source2[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source2[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source2, offset, length, onError) {
      const cc = source2.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code2 = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code2);
      } catch {
        const raw = source2.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

var require_compose_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar2;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar2 = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar2 = new Scalar.Scalar(value);
      }
      scalar2.range = range;
      scalar2.source = value;
      if (type)
        scalar2.type = type;
      if (tagName)
        scalar2.tag = tagName;
      if (tag.format)
        scalar2.format = tag.format;
      if (comment)
        scalar2.comment = comment;
      return scalar2;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

var require_util_empty_scalar_position = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

var require_compose_node = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor: anchor2, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor2 || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor2)
            node.anchor = anchor2.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor2)
              node.anchor = anchor2.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor2 && node.anchor === "")
        onError(anchor2, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor: anchor2, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor2) {
        node.anchor = anchor2.source.substring(1);
        if (node.anchor === "")
          onError(anchor2, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source: source2, end }, onError) {
      const alias = new Alias.Alias(source2.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source2.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source2.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

var require_compose_doc = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

var require_composer = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source: source2 } = src;
      return [offset, offset + (typeof source2 === "string" ? source2.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source2 = prelude[i];
        switch (source2[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source2.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source2, code2, message, warning) => {
          const pos = getErrorPos(source2);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code2, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code2, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

var require_cst_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code2, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code2, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code2, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source2 = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source2[0]) {
        case "|":
        case ">": {
          const he = source2.indexOf("\n");
          const head = source2.substring(0, he);
          const body = source2.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source: source2, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source: source2, end };
        default:
          return { type: "scalar", offset, indent, source: source2, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source2 = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source2[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source2);
          break;
        case '"':
          setFlowScalarValue(token, source2, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source2, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source2, "scalar");
      }
    }
    function setBlockScalarValue(token, source2) {
      const he = source2.indexOf("\n");
      const head = source2.substring(0, he);
      const body = source2.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source2, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source2;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source2.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source: source2, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source2.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source: source2, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source: source2, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

var require_cst_stringify = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep: sep2, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep2)
        for (const st of sep2)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify;
  }
});

var require_cst_visit = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit2(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit2.BREAK = BREAK;
    visit2.SKIP = SKIP;
    visit2.REMOVE = REMOVE;
    visit2.itemAtPath = (cst, path2) => {
      let item = cst;
      for (const [field, index] of path2) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit2.parentCollection = (cst, path2) => {
      const parent = visit2.itemAtPath(cst, path2.slice(0, -1));
      const field = path2[path2.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path2, item, visitor) {
      let ctrl = visitor(item, path2);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path2.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path2);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path2) : ctrl;
    }
    exports.visit = visit2;
  }
});

var require_cst = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source2) {
      switch (source2) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source2[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

var require_lexer = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source2, incomplete = false) {
        if (source2) {
          if (typeof source2 !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source2 : source2;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

var require_line_counter = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

var require_parser = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source2) {
      if (source2.length < 1e5)
        Array.prototype.push.apply(target, source2);
      else
        for (let i = 0; i < source2.length; ++i)
          target.push(source2[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source2, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source2, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source2) {
        this.source = source2;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source2));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source2.length;
          return;
        }
        const type = cst.tokenType(source2);
        if (!type) {
          const message = `Not a YAML token: ${source2}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source: source2 });
          this.offset += source2.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source2.length);
              break;
            case "space":
              if (this.atNewLine && source2[0] === " ")
                this.indent += source2.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source2.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source2.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar2) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep2;
          if (scalar2.end) {
            sep2 = scalar2.end;
            sep2.push(this.sourceToken);
            delete scalar2.end;
          } else
            sep2 = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar2.offset,
            indent: scalar2.indent,
            items: [{ start, key: scalar2, sep: sep2 }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar2);
      }
      *blockScalar(scalar2) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar2.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar2.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep2 = it.sep;
                  sep2.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep: sep2 }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep2 = fc.end.splice(1, fc.end.length);
            sep2.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep: sep2 }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

var require_public_api = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source2, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source2)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source2, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source2, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument2(source2, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source2), true, source2.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source2, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source2, lineCounter2));
      }
      return doc;
    }
    function parse3(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument2(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse3;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument2;
    exports.stringify = stringify;
  }
});

var require_dist = __commonJS({
  "node_modules/.pnpm/yaml@2.9.0/node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    init_define_VOID_SYNTAX_WORKER_IDENTITY();
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit2 = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit2.visit;
    exports.visitAsync = visit2.visitAsync;
  }
});

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
function allow(code2 = "ALLOW", message = "allowed") {
  return { allow: true, code: code2, message, evidence: [] };
}
function block(code2, message, evidence) {
  return { allow: false, code: code2, message, evidence };
}

function normalizedPath(path2) {
  return path2.replaceAll("\\", "/");
}
function isTestPath(path2) {
  return /\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/.test(path2);
}
function isGeneratedPath(path2) {
  return /\/__(?:generated|fixtures)__\//.test(path2);
}
function lineEvidence(edits, applies, violates, allowTag) {
  const evidence = [];
  for (const edit of edits) {
    const path2 = normalizedPath(edit.path);
    if (!applies(path2)) continue;
    edit.addedContent.split(/\r?\n/).forEach((line, index) => {
      if (allowTag !== void 0 && line.includes(allowTag)) return;
      if (violates(line, path2)) evidence.push(`${path2}:${index + 1}`);
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
      const path2 = normalizedPath(edit.path);
      if (!/\.(?:ts|tsx|js|jsx)$/.test(path2) || isTestPath(path2) || isGeneratedPath(path2)) continue;
      if (!manifests.has(path2)) manifests.set(path2, nearestManifest(projectRoot2, path2));
      const manifest = manifests.get(path2);
      if (manifest === void 0) continue;
      edit.addedContent.split(/\r?\n/).forEach((line, index) => {
        if (line.includes("allow-boundary:")) return;
        const target = line.match(IMPORT)?.[1];
        if (target === void 0 || target === manifest.name) return;
        if (manifest.declared.has(target)) return;
        evidence.push(`${path2}:${index + 1} -> ${target}`);
      });
    }
  }
  return evidenceVerdict(
    "MONOREPO_UNDECLARED_DEPENDENCY",
    "imports a workspace package this one does not declare; add it to package.json dependencies",
    evidence
  );
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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
    const path2 = normalizedPath(edit.path);
    if (!SOURCE_EXTENSIONS.test(path2)) continue;
    edit.addedContent.split(/\r?\n/).forEach((line, lineIndex) => {
      [...line].forEach((character, column) => {
        if (evidence.length >= MAX_EVIDENCE) return;
        const point = character.codePointAt(0) ?? 0;
        if (!isControl(point)) return;
        evidence.push(`${path2}:${lineIndex + 1}:${column + 1} ${hexPoint(point)}`);
      });
    });
  }
  return evidenceVerdict(
    "CONTROL_CHARACTER_IN_SOURCE",
    "control character in a source file; it is invisible in the diff and drops the file out of the project graph. A fixture that needs the byte builds it (String.fromCharCode(0), Buffer.concat) instead of holding it literally.",
    evidence
  );
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var INTER = /font-family[^;]*\bInter\b|font-\[.?Inter|fontFamily[^,]*\bInter\b/i;
var GRADIENT = /(?:from|to)-(?:purple|indigo|violet|fuchsia)-\d+[^"' ]*[^"']*(?:from|to)-(?:blue|cyan|teal|sky|indigo)-\d+|linear-gradient\([^)]*(?:purple|indigo|violet)[^)]*(?:blue|cyan|teal)/i;
var GREY_ON_COLOR = /\btext-(?:gray|grey|slate|zinc|neutral)-\d+\b[^"']*\bbg-(?:indigo|purple|blue|violet|fuchsia|emerald|rose|pink)-\d+\b/i;
var NESTED_CARD = /class(?:Name)?="[^"]*\bcard\b[^"]*"[^>]*>[^<]*<[^>]*class(?:Name)?="[^"]*\bcard\b/i;
function designSlop(edits) {
  const evidence = [];
  for (const edit of edits) {
    const path2 = normalizedPath(edit.path);
    if (!/\.(?:tsx|jsx|css|scss)$/.test(path2) || isTestPath(path2) || isGeneratedPath(path2)) {
      continue;
    }
    edit.addedContent.split(/\r?\n/).forEach((line, index) => {
      if (/allow-design-slop:/.test(line)) return;
      const code2 = line.replace(/`[^`]*`|\/\*.*?\*\/|\/\/.*$/g, "");
      if (INTER.test(code2)) evidence.push(`${path2}:${index + 1}: default Inter font`);
      if (GRADIENT.test(code2)) evidence.push(`${path2}:${index + 1}: clich\xE9 gradient`);
      if (GREY_ON_COLOR.test(code2)) evidence.push(`${path2}:${index + 1}: grey text on color`);
    });
    if (NESTED_CARD.test(edit.addedContent) && !edit.addedContent.includes("allow-design-slop:")) {
      evidence.push(`${path2}: card nested directly inside card`);
    }
  }
  return evidenceVerdict(
    "GENERIC_AI_DESIGN_TELL",
    "conservative generic-design tell detected; apply the project visual language",
    evidence
  );
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var ANY = /:\s*any\b|<any>|\bas\s+any\b/;
function noAny(edits) {
  const evidence = lineEvidence(
    edits,
    (path2) => /\.(?:ts|tsx)$/.test(path2) && !isTestPath(path2) && !path2.endsWith(".d.ts") && !isGeneratedPath(path2),
    (line) => ANY.test(line),
    "allow-any:"
  );
  return evidenceVerdict(
    "TYPESCRIPT_ANY",
    "any weakens the type boundary; use a precise type or unknown plus narrowing",
    evidence
  );
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var ASSERTION_CAST = /\bas\s+[A-Z][A-Za-z0-9_]*/;
function noAsCast(edits) {
  const evidence = lineEvidence(
    edits,
    (path2) => /\.(?:ts|tsx)$/.test(path2) && !isTestPath(path2) && !path2.endsWith(".d.ts") && !isGeneratedPath(path2),
    (line) => ASSERTION_CAST.test(line),
    "allow-as-cast:"
  );
  return evidenceVerdict(
    "TYPESCRIPT_ASSERTION_CAST",
    "assertion cast detected; prefer narrowing, a type guard, a generic or boundary parsing",
    evidence
  );
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "node:fs";
import { join as join2 } from "node:path";
var CONFIGS = ["biome.json", "biome.jsonc"];
function normalize(path2) {
  return path2.replaceAll("\\", "/").replace(/^\.\//, "");
}
function globMatches(pattern2, path2) {
  const source2 = normalize(pattern2);
  const target = normalize(path2);
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
function stripJsonc(text3) {
  let out = "";
  let inString = false;
  let inLine = false;
  let inBlock = false;
  for (let index = 0; index < text3.length; index += 1) {
    const character = text3[index];
    const next = text3[index + 1];
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
    const path2 = join2(root, name);
    if (!existsSync2(path2)) continue;
    try {
      return JSON.parse(stripJsonc(readFileSync2(path2, "utf8")));
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
function isRuleSuppressed(projectRoot2, rule, path2) {
  const config2 = readConfig(projectRoot2);
  if (config2 === void 0) return false;
  const target = normalize(path2);
  for (const override of [...config2.overrides ?? []].reverse()) {
    if (!pathList(override).some((pattern2) => globMatches(pattern2, target))) continue;
    const severity = severityOf(override.linter?.rules, rule);
    if (severity !== void 0) return severity === "off";
  }
  return severityOf(config2.linter?.rules, rule) === "off";
}

var CONSOLE = /\bconsole\.(?:log|error|warn|info|debug)\b/;
function noConsole(edits, projectRoot2) {
  const evidence = lineEvidence(
    edits,
    (path2) => /\.(?:ts|tsx|js|jsx)$/.test(path2) && !/(^|\/)scripts\//.test(path2) && !isTestPath(path2) && !isGeneratedPath(path2) && !(projectRoot2 !== void 0 && isRuleSuppressed(projectRoot2, "noConsole", path2)),
    (line) => CONSOLE.test(line),
    "allow-console:"
  );
  return evidenceVerdict(
    "CONSOLE_IN_SOURCE",
    "console call detected in source; use the project logger",
    evidence.map((item) => `console.* in ${item}`)
  );
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var FOCUSED = /\b(?:it|test|describe)\.only\b|\b(?:it|test)\.skip\b|\b(?:xit|xdescribe)\b/;
function noFocusedTest(edits) {
  return evidenceVerdict(
    "FOCUSED_OR_SKIPPED_TEST",
    "focused or skipped test detected; use todo only for explicitly pending coverage",
    lineEvidence(edits, isTestPath, (line) => FOCUSED.test(line))
  );
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
function codeOnly(line) {
  return line.replace(/"(?:[^"\\]|\\.)*"/g, "").replace(/'(?:[^'\\]|\\.)*'/g, "").replace(/`[^`]*`/g, "").replace(/\/\*.*?\*\//g, "").replace(/\/\/.*$/, "");
}
function noNull(edits) {
  const evidence = lineEvidence(
    edits,
    (path2) => /\.(?:ts|tsx)$/.test(path2) && !isTestPath(path2) && !path2.endsWith(".d.ts") && !isGeneratedPath(path2),
    (line, path2) => {
      if (/from\s+['"]drizzle-orm|JSON\.(?:stringify|parse)|typeof.*===\s*['"]null/.test(line)) {
        return false;
      }
      const code2 = path2.endsWith(".tsx") ? codeOnly(line).replace(/\breturn\s+null\b/g, "") : codeOnly(line);
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { readFileSync as readFileSync3 } from "node:fs";
import { basename, isAbsolute, relative, resolve as resolve2 } from "node:path";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var PROJECT_DOCTRINE_PATH = ".void/PROJECT-DOCTRINE.md";
var CO_OWNED_FILES = [
  ".gitignore",
  ".void/config.json",
  PROJECT_DOCTRINE_PATH,
  ".claude/settings.json",
  "CLAUDE.md",
  "AGENTS.md"
];
var CO_OWNED = new Set(CO_OWNED_FILES);
function isCoOwned(path2) {
  return CO_OWNED.has(path2);
}

function manifestOwnedPaths(root) {
  try {
    const parsed = JSON.parse(readFileSync3(resolve2(root, ".void/install-manifest.json"), "utf8"));
    if (typeof parsed !== "object" || parsed === void 0 || Array.isArray(parsed)) return /* @__PURE__ */ new Set();
    const files = parsed.files;
    if (!Array.isArray(files)) return /* @__PURE__ */ new Set();
    return new Set(files.flatMap((file) => {
      if (typeof file !== "object" || file === void 0 || Array.isArray(file)) return [];
      const path2 = file.path;
      return typeof path2 === "string" && path2.length > 0 ? [path2.replaceAll("\\", "/")] : [];
    }));
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function projectPath(root, path2) {
  const absolute = resolve2(root, path2);
  const relativePath = relative(resolve2(root), absolute).replaceAll("\\", "/");
  return relativePath === ".." || relativePath.startsWith("../") || isAbsolute(relativePath) ? void 0 : relativePath;
}
function protectedReason(path2, root, shellWrite) {
  if (root !== void 0) {
    const relativePath = projectPath(root, path2);
    if (relativePath !== void 0 && !isCoOwned(relativePath) && manifestOwnedPaths(root).has(relativePath)) {
      return "delivered harness asset; change the harness through void-learn";
    }
  }
  const normalized = path2.replaceAll("\\", "/").toLowerCase();
  const base = basename(normalized);
  if (/^\.env(?:\..+)?$/.test(base) && !/\.(?:example|sample|template|dist)$/.test(base)) {
    return "environment file with secrets";
  }
  if (/\.(?:pem|key|p12|pfx|keystore|jks|asc)$/.test(base) || /^id_(?:rsa|ed25519|ecdsa|dsa)$/.test(base)) {
    return "private key / certificate";
  }
  if (/(?:\.npmrc|\.netrc|\.pgpass)$/.test(base)) return "credential file";
  const sourceModule = /\.(?:[cm]?[jt]s|[jt]sx)$/.test(base);
  if (!base.endsWith(".md") && (!sourceModule || shellWrite) && /(?:secret|credential)/.test(base)) {
    return sourceModule && shellWrite ? "credential-named source module with unavailable shell content; use Write/Edit or apply_patch" : "credential file";
  }
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
  for (const path2 of paths) {
    const reason = protectedReason(path2, options.root, options.shellWritePaths?.includes(path2) ?? false);
    if (reason !== void 0) {
      const learn = reason.includes("void-learn") ? " Use void-learn to capture the missing harness capability." : "";
      return block("PROTECTED_FILE", `refusing to edit ${path2}.${learn}`, [`${path2}: ${reason}`]);
    }
  }
  return allow();
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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
var GENERIC_ASSIGNMENT = /(?:_KEY|_SECRET|_TOKEN|_PASSWORD|_PASSWD|_APIKEY)["' ]*[:=]\s*["']([A-Za-z0-9+/=_-]{24,})["']/gi;
var CAMEL_ASSIGNMENT = /\b[a-z][A-Za-z0-9_$]*(?:Key|Secret|Token|Password|Passwd)["' ]*[:=]\s*["']([A-Za-z0-9+/=_-]{24,})["']/g;
var PLACEHOLDER = /process\.env|import\.meta\.env|xxx|changeme|example|redacted|your[-_]|<[a-z]|placeholder|todo/i;
var EXEMPT_PATH = /\.(?:test|spec)\.|\/__tests__\/|\/__fixtures__\/|\/fixtures\/|\/__generated__\//;
var CREDENTIAL_SOURCE_MODULE = /(?:secret|credential)[^/]*\.(?:[cm]?[jt]s|[jt]sx)$/i;
function lineHasSecret(line) {
  if (line.includes("allow-secret-pattern:")) return false;
  if (HIGH_CONFIDENCE.some((pattern2) => pattern2.test(line))) return true;
  for (const pattern2 of [GENERIC_ASSIGNMENT, CAMEL_ASSIGNMENT]) {
    for (const assignment of line.matchAll(pattern2)) {
      const value = assignment[1] ?? "";
      if (PLACEHOLDER.test(value)) continue;
      if (/^[0-9a-f]+$/i.test(value) || /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
        continue;
      }
      if (/[A-Za-z]/.test(value) && /[0-9]/.test(value)) return true;
    }
  }
  return false;
}
function secretContent(edits) {
  const evidence = [];
  for (const edit of edits) {
    const path2 = edit.path.replaceAll("\\", "/");
    if (EXEMPT_PATH.test(path2) && !CREDENTIAL_SOURCE_MODULE.test(path2)) continue;
    edit.addedContent.split(/\r?\n/).forEach((line, index) => {
      if (lineHasSecret(line)) evidence.push(`${edit.path}:${index + 1}`);
    });
  }
  return evidence.length === 0 ? allow() : block("SECRET_IN_CONTENT", "secret-in-content: likely secret detected in edited content", evidence);
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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
function matches(path2, globs) {
  return globs.some((glob) => globRegExp(glob).test(path2));
}
function bypass(path2, spikeGlobs) {
  return !/\.(?:ts|tsx|js|jsx)$/.test(path2) || /(^|\/)docs\//.test(path2) || /\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/.test(path2) || /\.d\.ts$/.test(path2) || /\/(?:tests?|__tests__)\/fixtures\/|\/seed\/|\/migrations\/|\/drizzle\/meta\/|\/codemods?\//.test(path2) || /\/__generated__\//.test(path2) || matches(path2, spikeGlobs);
}
function tddApplies(path2, businessGlobs, spikeGlobs) {
  return !bypass(path2, spikeGlobs) && matches(path2, businessGlobs);
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
function fileMode(path2, input) {
  const header = (input.existingHeaders[path2] ?? "").split(/\r?\n/).slice(0, 5).join("\n");
  const marker = header.match(/\/\/\s*tdd-mode:\s*(strict|souple|exploratory)/)?.[1];
  return marker === "strict" || marker === "souple" || marker === "exploratory" ? marker : input.mode;
}
function siblingFor(path2) {
  if (path2.endsWith(".tsx")) return `${path2.slice(0, -4)}.test.tsx`;
  if (path2.endsWith(".ts")) return `${path2.slice(0, -3)}.test.ts`;
  if (path2.endsWith(".jsx")) return `${path2.slice(0, -4)}.test.jsx`;
  if (path2.endsWith(".js")) return `${path2.slice(0, -3)}.test.js`;
  return `${path2}.test`;
}
function tddOrder(input) {
  const warnings = [];
  const declared = [];
  for (const edit of input.edits) {
    if (edit.operation === "delete" && edit.addedContent === "") continue;
    const path2 = edit.path.replaceAll("\\", "/");
    if (!tddApplies(path2, input.businessGlobs, input.spikeGlobs)) continue;
    const original = input.originalSources[path2];
    const proposed = input.proposedSources[path2];
    if (original !== void 0 && proposed !== void 0 && carriesNoBehaviour(original, proposed)) continue;
    const declaredTest2 = input.declaredTests?.[path2];
    if (declaredTest2 !== void 0) {
      declared.push(`${path2} -> ${declaredTest2}`);
      continue;
    }
    const mode = fileMode(path2, input);
    if (mode === "exploratory") continue;
    const sibling = siblingFor(path2);
    if (input.siblingTests.has(sibling)) continue;
    const evidence = `${path2} -> ${sibling}`;
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var GENERIC_NAME = /\b(?:it|test)\(\s*['"]should\s|\b(?:it|test)\(\s*['"]works?\b|\b(?:it|test)\(\s*['"]test['"]/;
function testName(edits) {
  return evidenceVerdict(
    "GENERIC_TEST_NAME",
    "generic test name must describe observable behavior",
    lineEvidence(edits, isTestPath, (line) => GENERIC_NAME.test(line))
  );
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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
      const path2 = unquote2(target);
      if (path2 !== "") targets.add(path2);
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
  let path2 = "";
  let added = "";
  let deleting = false;
  const emit = () => {
    if (path2 !== "") edits.push({
      path: path2,
      addedContent: added,
      ...deleting ? { operation: "delete" } : {}
    });
  };
  for (const line of patch.split(/\r?\n/)) {
    const section = line.match(/^\*\*\* (Add|Update|Delete) File: (.+)$/);
    if (section !== null) {
      emit();
      path2 = safeString(section[2] ?? "", "patch path");
      added = "";
      deleting = section[1] === "Delete";
      continue;
    }
    if (path2 !== "" && line.startsWith("+") && !line.startsWith("+++")) {
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
  const shellTargets = shellWriteTargets(command).filter((path2) => !edits.some((edit) => edit.path === path2)).map((path2) => ({ path: path2, addedContent: "" }));
  return { tool, command, edits: [...edits, ...shellTargets] };
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { closeSync, constants, fstatSync, openSync, readSync } from "node:fs";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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
function proposedSource(raw, root, path2, existing) {
  const call = object(raw);
  const input = object(call["tool_input"]);
  if (call["tool_name"] === "Write" && typeof input["content"] === "string") return source(input["content"]);
  if (call["tool_name"] === "Edit") return replace(existing, input);
  for (const key of ["patch", "input", "content", "command"]) {
    const value = input[key];
    if (typeof value === "string" && value.includes("*** Begin Patch")) {
      return fromPatch(value, root, resolve3(root, path2), existing);
    }
  }
  return unresolved("tool input does not describe a reconstructable file");
}

function readOriginalSource(path2) {
  let descriptor;
  try {
    descriptor = openSync(path2, constants.O_RDONLY | constants.O_NONBLOCK);
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var SYNTAX_OPERATION_BUDGET_MS = 5e3;
function syntaxResult(value) {
  if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("kind" in value)) return void 0;
  if (value.kind === "invalid-request" || value.kind === "invalid-source" || value.kind === "limit" || value.kind === "unavailable") return { version: 1, kind: value.kind };
  if (value.kind !== "inspected" || !("lines" in value) || !Array.isArray(value.lines) || value.lines.length > 2e4 || !value.lines.every((line) => Number.isSafeInteger(line) && line > 0 && line <= 65537)) return void 0;
  return { version: 1, kind: "inspected", lines: value.lines };
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync as readFileSync4, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
function unavailableSyntax(reason, path2, correction = "provide valid complete source within the limits; if the bundled parser is unavailable, repair the harness installation, then retry") {
  return {
    allow: false,
    code: "TEST_SYNTAX_UNVERIFIED",
    message: `source syntax verification unavailable: ${reason}; ${correction}`,
    evidence: [path2]
  };
}
function syntaxVerdict(result, path2, purpose) {
  try {
    if (!result || typeof result !== "object") throw new Error();
    if ("unavailable" in result && typeof result.unavailable === "string") {
      const permitted = [
        "bundled syntax parser is unavailable",
        "source could not be parsed within the supported limits"
      ];
      return unavailableSyntax(permitted.includes(result.unavailable) ? result.unavailable : "parser returned an invalid result", path2);
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
      evidence: [path2]
    };
    return lines.length === 0 ? { allow: true, code: "OK", message: "focused-test syntax checked", evidence: [] } : {
      allow: false,
      code: "FOCUSED_OR_SKIPPED_TEST",
      message: "focused or skipped test detected; use todo only for explicitly pending coverage",
      evidence: lines.map((line) => `${path2}:${line}`)
    };
  } catch {
    return unavailableSyntax("parser returned an invalid result", path2);
  }
}

function inspectSourceSyntax(root, path2, source2, remainingMs = SYNTAX_OPERATION_BUDGET_MS, purpose = "focused-tests") {
  if (Buffer.byteLength(source2) > MAX_SOURCE_BYTES) return unavailableSyntax("file exceeds 64 KiB", path2);
  if (remainingMs < 1) return unavailableSyntax("operation exhausted its five-second parsing budget", path2, "split the operation into smaller edits");
  const result = runSyntaxWorker(root, { path: path2, source: source2, purpose }, remainingMs);
  switch (result.kind) {
    case "inspected":
      return syntaxVerdict({ lines: result.lines }, path2, purpose);
    case "invalid-source":
      return unavailableSyntax("source could not be parsed within the supported limits", path2);
    case "limit":
      return unavailableSyntax("parser process failed or exceeded its resource limit", path2);
    case "invalid-request":
    case "unavailable":
      return unavailableSyntax("bundled syntax parser is unavailable", path2);
  }
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();

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
    const record9 = isRecord(entry) ? entry : {};
    const lastMajor = record9["lastMajor"];
    if (typeof lastMajor !== "number" || !Number.isInteger(lastMajor) || lastMajor < 0) {
      throw new Error(`product identity: formerPackages[${index}].lastMajor must be a whole number`);
    }
    return { name: segment(record9["name"], `formerPackages[${index}].name`), lastMajor };
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
  const record9 = isRecord(value) ? value : {};
  const rule = "a lowercase name without separators";
  const namespace = pattern(record9["namespace"], NAMESPACE, "markers.namespace", rule);
  const deprecated = patterns(record9["deprecated"], NAMESPACE, "markers.deprecated", rule);
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
  const record9 = isRecord(value) ? value : {};
  const rule = "an upper-case prefix ending in _";
  const prefix = pattern(record9["prefix"], PREFIX, "environment.prefix", rule);
  const deprecated = patterns(record9["deprecated"], PREFIX, "environment.deprecated", rule);
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
  const packageFor = (version2) => {
    const match = MAJOR.exec(version2);
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
  const text3 = new TextDecoder("utf-8", { fatal: true }).decode(input);
  if (text3.includes("\0")) throw new Error(BINARY_INPUT_MESSAGE);
  return text3;
}
function parseHookPayload(input) {
  const text3 = parseHookText(input);
  const parsed = JSON.parse(text3);
  if (containsNul(parsed)) throw new Error(BINARY_INPUT_MESSAGE);
  return parsed;
}
function physicalPath(path2) {
  const absolute = resolve4(path2);
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
function projectRelativePath(root, path2) {
  const physicalRoot = physicalPath(root);
  const absolute = physicalPath(isAbsolute2(path2) ? path2 : resolve4(physicalRoot, path2));
  const projectPath2 = relative2(physicalRoot, absolute).replaceAll("\\", "/");
  return projectPath2 === ".." || projectPath2.startsWith("../") || isAbsolute2(projectPath2) ? void 0 : projectPath2;
}
function projectEdits(root, edits) {
  return edits.flatMap((edit) => {
    const path2 = projectRelativePath(root, edit.path);
    return path2 === void 0 ? [] : [{ ...edit, path: path2, originalPath: edit.path }];
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
  let config2 = {};
  try {
    config2 = record2(JSON.parse(readFileSync5(join3(root, ".void/config.json"), "utf8"))) ?? {};
  } catch {
  }
  const modes = record2(config2["modes"]);
  const paths = record2(config2["paths"]);
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
  const path2 = match?.[1];
  if (path2 === void 0 || path2 !== path2.trim() || isAbsolute2(path2) || /^[A-Za-z]:|\\/.test(path2) || path2.split("/").some((part) => part === ".." || part === ".") || !isTestPath(path2)) throw new Error("declare exactly one project-relative E2E spec on the first line");
  const target = realpathSync(join3(root, path2));
  const location = relative2(root, target);
  if (location.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || location === ".." || isAbsolute2(location) || !statSync2(target).isFile()) {
    throw new Error("E2E spec must be a regular file inside the physical project root");
  }
  return path2;
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
  const config2 = readTddConfig(physicalRoot);
  const existingHeaders = {};
  const originalSources = {};
  const siblingTests = /* @__PURE__ */ new Set();
  const declaredTests = {};
  const proposedSources = {};
  const deadline = performance.now() + SYNTAX_OPERATION_BUDGET_MS;
  const governed = projectChanges.filter((edit) => !(edit.operation === "delete" && edit.addedContent === "") && tddApplies(edit.path, config2.businessGlobs, [config2.spikesGlob]));
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
    mode: config2.mode,
    businessGlobs: config2.businessGlobs,
    spikeGlobs: [config2.spikesGlob],
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
    const shellWritePaths = call.tool === "Bash" || call.tool === "shell" ? shellWriteTargets(call.command) : [];
    return protectedFile(call.edits.map((edit) => edit.path), { ...ownership, shellWritePaths });
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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
  const path2 = cacheFilePath(env);
  if (path2 === void 0) return void 0;
  let raw;
  try {
    raw = readFileSync6(path2, "utf8");
  } catch {
    return void 0;
  }
  const entry = parseEntry(raw);
  if (entry === void 0) return void 0;
  const age = now - entry.checkedAt;
  return age >= 0 && age <= CACHE_TTL_MS ? entry : void 0;
}
async function writeFreshnessCache(env, entry) {
  const path2 = cacheFilePath(env);
  if (path2 === void 0) return void 0;
  const tmp = `${path2}.${process.pid}.tmp`;
  try {
    mkdirSync(dirname3(path2), { recursive: true });
    writeFileSync(tmp, JSON.stringify({ latest: entry.latest, checkedAt: entry.checkedAt }), "utf8");
    renameSync(tmp, path2);
  } catch {
  }
  return void 0;
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { readFileSync as readFileSync7, statSync as statSync3 } from "node:fs";
import { join as join5 } from "node:path";
var MAX_NPMRC_BYTES = 64 * 1024;
function readIfSmall(path2) {
  try {
    if (statSync3(path2).size > MAX_NPMRC_BYTES) return void 0;
    return readFileSync7(path2, "utf8");
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
  const cached2 = readFreshnessCache(env, now);
  if (cached2 !== void 0) return compareFreshness(installed, cached2.latest);
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { existsSync as existsSync5, mkdirSync as mkdirSync2, readFileSync as readFileSync9, readdirSync as readdirSync2, renameSync as renameSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { dirname as dirname4, join as join8 } from "node:path";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { lstatSync, readFileSync as readFileSync8, readdirSync, statSync as statSync4 } from "node:fs";
import { join as join7 } from "node:path";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { existsSync as existsSync4 } from "node:fs";
import { join as join6 } from "node:path";

init_define_VOID_SYNTAX_WORKER_IDENTITY();

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
function regularFile(path2) {
  try {
    const info = lstatSync(path2);
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
      const path2 = join7(runs, entry.name, "events.jsonl");
      if (!regularFile(path2)) continue;
      try {
        const info = statSync4(path2);
        files.push({ path: path2, modifiedMs: info.mtimeMs, bytes: info.size });
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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
function eachEvent(body, visit2) {
  for (const line of body.split("\n")) {
    if (line === "") continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (typeof parsed !== "object" || parsed === null) continue;
    const record9 = parsed;
    const payload = record9["payload"];
    const category = typeof payload === "object" && payload !== null ? payload["category"] : void 0;
    visit2({
      source: typeof record9["source"] === "string" ? record9["source"] : "",
      kind: typeof record9["kind"] === "string" ? record9["kind"] : "",
      missionId: typeof record9["missionId"] === "string" ? record9["missionId"] : "",
      category: typeof category === "string" ? category : "",
      subject: typeof record9["subject"] === "string" ? record9["subject"] : "",
      ts: typeof record9["ts"] === "string" ? record9["ts"] : ""
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
  if (resolution.ok && liveness.ok && liveness.unobservable.length === 0) return void 0;
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
      `  no skill fired in the last ${liveness.missions} working missions (${liveness.toolCalls} tool calls); runtime:claude`
    );
  }
  for (const { source: source2, toolCalls } of liveness.unobservable) {
    lines.push(`  skill usage not observable for ${source2} (${toolCalls} tool calls); activation count unknown`);
  }
  lines.push(`  run \`${PRODUCT_COMMAND} doctor\` for the detail`);
  return lines.join("\n");
}
var WORKING_MISSION_CALLS = 20;
var LIVENESS_WINDOW = 3;
function livenessVerdict(body) {
  const tallies = /* @__PURE__ */ new Map();
  const unobservable = /* @__PURE__ */ new Map();
  eachEvent(body, (event) => {
    if (event.kind !== "runtime.tool.started" || event.missionId === "") return;
    if (event.source !== "runtime:claude") {
      const source2 = event.source || "runtime:unknown";
      unobservable.set(source2, (unobservable.get(source2) ?? 0) + 1);
      return;
    }
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
  return {
    ok,
    missions: judged.length,
    toolCalls,
    skillCalls,
    unobservable: [...unobservable].sort(([a], [b]) => a.localeCompare(b)).map(([source2, calls]) => ({ source: source2, toolCalls: calls }))
  };
}
var VERDICT_VERSION = 2;
function cachePath(root) {
  return voidMachinePath(root, "invocation.json");
}
function cachedInvocationAlert(root) {
  try {
    const parsed = JSON.parse(readFileSync9(cachePath(root), "utf8"));
    if (typeof parsed !== "object" || parsed === null) return void 0;
    if (parsed["version"] !== VERDICT_VERSION) return void 0;
    const alert = parsed["alert"];
    return typeof alert === "string" && alert !== "" ? alert : void 0;
  } catch {
    return void 0;
  }
}
function refreshInvocationVerdict(root) {
  try {
    const fingerprint = journalFingerprint(root);
    const path2 = cachePath(root);
    try {
      const previous = JSON.parse(readFileSync9(path2, "utf8"));
      if (typeof previous === "object" && previous !== null && previous["version"] === VERDICT_VERSION && previous["fingerprint"] === fingerprint) return;
    } catch {
    }
    const journals = readMissionJournals(root);
    const alert = invocationAlert(
      resolutionVerdict(journals, installedSkillNames(root), { nowMs: Date.now() }),
      livenessVerdict(journals)
    );
    const entry = { version: VERDICT_VERSION, fingerprint, ...alert === void 0 ? {} : { alert } };
    mkdirSync2(dirname4(path2), { recursive: true });
    const temporary = `${path2}.${process.pid}.tmp`;
    writeFileSync2(temporary, `${JSON.stringify(entry)}
`);
    renameSync2(temporary, path2);
  } catch {
  }
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
function sessionStartOutput(version2, notice, invocationAlert2, resumeContext) {
  const installed = version2.trim() === "" ? "unknown" : version2.trim();
  const base = `${PRODUCT_COMMAND} ${installed} is active. Non-negotiable floor: external credential operations require explicit bounded user authorization and verified opaque or direct external transfer under void-security-guidance; never expose secret values to the model; local file/content guards and runtime restrictions remain binding; never hand-edit lockfiles; regenerate them via the package manager for requested dependency changes; never run destructive shell commands; tests and fresh evidence gate "done". Capture durable project rules explicitly. Run \`${PRODUCT_COMMAND} doctor\` if runtime health is uncertain.`;
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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
  const paths = section.split(/\r?\n/).map((line) => /^- (.+)$/.exec(line)?.[1]).filter((path2) => path2 !== void 0);
  if (paths.length > MAX_ITEMS)
    return void 0;
  if (paths.some((path2) => path2.length > MAX_PATH || [...path2].some((character) => character.charCodeAt(0) < 32)))
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
function mechanicalScalars(block2, required2) {
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
    ...required2,
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
  return paths.map((path2) => `- ${path2}`).join("\n");
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
    ...current.filter((path2) => !uniqueObserved.includes(path2)),
    ...uniqueObserved
  ];
  const displaced = Math.max(0, merged.length - MAX_ITEMS);
  const paths = merged.slice(displaced);
  const changed = displaced > 0 || paths.length !== current.length || paths.some((path2, index) => path2 !== current[index]);
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
function clamp(text3) {
  const flat = [...text3].filter((ch) => {
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
  const text3 = lines.join("\n").trim();
  return text3 === "" ? void 0 : text3;
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
      const text3 = prose(section.lines);
      if (text3 !== void 0)
        proseFields[proseKey] = text3;
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
  const date3 = frontmatterField(bounded, "date");
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
    ...date3 === void 0 ? {} : { date: date3 },
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
    mentionsMarker: (text3) => all.some((marker) => text3.includes(marker))
  };
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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
function boundedResumeLines(required2, optional2) {
  const requiredText = required2.join("\n");
  const remaining = CONTEXT_CHARS_MAX - requiredText.length - 1;
  if (remaining <= 0 || optional2.length === 0) {
    return `${requiredText.slice(0, CONTEXT_CHARS_MAX - 1)}
`;
  }
  const optionalText = optional2.join("\n");
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
  const required2 = [
    "[void-machine resume]",
    `Project: ${bundle.project.name}`,
    `Context continuity: ${bundle.continuity.status}`,
    ...bundle.continuity.status === "degraded" ? ["Reconstruct context before any mutation."] : [],
    ...bundle.gaps.filter((gap) => continuityReasons.has(gap.reason)).map((gap) => `Gap: ${gap.detail}`)
  ];
  const optional2 = [];
  if (bundle.git.branch !== void 0)
    optional2.push(`Branch: ${bundle.git.branch}`);
  if (bundle.git.head !== void 0)
    optional2.push(`HEAD: ${bundle.git.head}`);
  if (bundle.git.dirtyFiles > 0)
    optional2.push(`Dirty files: ${String(bundle.git.dirtyFiles)}`);
  if (bundle.program !== void 0) {
    optional2.push(`Program: ${bundle.program.program}`);
    optional2.push(`Plan: ${bundle.program.plan}`);
    optional2.push(`Spec: ${bundle.program.spec}`);
    if (bundle.program.progress !== void 0) {
      optional2.push(`Progress: ${bundle.program.progress.provider} at ${bundle.program.progress.scope}`);
    }
  }
  if (usefulCheckpoint && bundle.checkpoint !== void 0) {
    optional2.push(...checkpointContext(bundle.checkpoint));
  }
  optional2.push(...bundle.gaps.filter((gap) => !continuityReasons.has(gap.reason)).map((gap) => `Gap: ${gap.detail}`));
  return boundedResumeLines(required2, optional2);
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var {
  parseCheckpoint: parseCheckpoint2,
  parseMechanicalContextBlock: parseMechanicalContextBlock2,
  renderMechanicalContextBlock: renderMechanicalContextBlock2,
  mergeMechanicalContextBlock: mergeMechanicalContextBlock2,
  mentionsMarker: mentionsCheckpointMarker
} = checkpointCodec(PRODUCT_IDENTITY.markers.contextContinuity);

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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
function executable(path2) {
  try {
    accessSync(path2, process.platform === "win32" ? constants2.F_OK : constants2.X_OK);
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
  return paths.filter((path2) => {
    try {
      const info = lstatSync2(path2);
      if (!info.isFile() || info.isSymbolicLink()) return false;
      return within(canonicalRoot, realpathSync2(path2));
    } catch {
      return false;
    }
  });
}
function readJson(path2) {
  try {
    return JSON.parse(readFileSync10(path2, "utf8"));
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
function rawCheckpoint(path2) {
  let descriptor;
  try {
    const info = lstatSync3(path2);
    if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_CHECKPOINT_BYTES) return void 0;
    descriptor = openSync2(
      path2,
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
function unlinkOwnedPath(path2, owner) {
  try {
    const current = lstatSync3(path2);
    if (!sameFile(current, owner)) return false;
    unlinkSync(path2);
    return true;
  } catch {
    return false;
  }
}
function staleFile(info, now) {
  return now - Math.max(info.mtimeMs, info.ctimeMs) >= LOCK_STALE_MS;
}
function openExclusive(path2) {
  try {
    const descriptor = openSync2(
      path2,
      constants3.O_WRONLY | constants3.O_CREAT | constants3.O_EXCL | (constants3.O_NOFOLLOW ?? 0),
      384
    );
    const info = fstatSync2(descriptor);
    return { descriptor, dev: info.dev, ino: info.ino };
  } catch {
    return void 0;
  }
}
function releaseLock(path2, lock) {
  try {
    closeSync2(lock.descriptor);
  } finally {
    unlinkOwnedPath(path2, lock);
  }
}
function acquireLock(path2, now) {
  const recovery = readRecoveryClaim(`${path2}.recovery`);
  if (recovery.status === "unsafe") return void 0;
  if (recovery.status === "present") {
    try {
      const observed2 = lstatSync3(path2);
      if (!observed2.isFile() || observed2.isSymbolicLink() || !staleFile(observed2, now)) {
        return void 0;
      }
      return claimStaleLock(path2, observed2, now);
    } catch (error) {
      return errorCode(error) === "ENOENT" ? claimStaleLock(path2, void 0, now) : void 0;
    }
  }
  const direct = openExclusive(path2);
  if (direct !== void 0) {
    const afterOpen = readRecoveryClaim(`${path2}.recovery`);
    if (afterOpen.status === "missing") return direct;
    releaseLock(path2, direct);
    return void 0;
  }
  let observed;
  try {
    observed = lstatSync3(path2);
    if (!observed.isFile() || observed.isSymbolicLink() || !staleFile(observed, now)) {
      return void 0;
    }
  } catch {
    return void 0;
  }
  return claimStaleLock(path2, observed, now);
}
function readRecoveryClaim(path2) {
  try {
    const info = lstatSync3(path2);
    return !info.isFile() || info.isSymbolicLink() ? { status: "unsafe" } : {
      status: "present",
      claim: {
        path: path2,
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
function acquireRecoveryFence(path2, now) {
  const claims = [];
  let claimPath = `${path2}.recovery`;
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
    const claim2 = read.claim;
    claims.push(claim2);
    if (!staleFile(claim2, now)) return void 0;
    generation += 1;
    claimPath = `${path2}.recovery-${String(generation)}-${String(claim2.dev)}-${String(claim2.ino)}`;
  }
  return void 0;
}
function releaseRecoveryFence(fence) {
  closeSync2(fence.tip.descriptor);
  for (const claim2 of [...fence.claims].reverse()) unlinkOwnedPath(claim2.path, claim2);
}
function claimStaleLock(path2, observed, now) {
  const fence = acquireRecoveryFence(path2, now);
  if (fence === void 0) return void 0;
  try {
    try {
      const current = lstatSync3(path2);
      if (observed === void 0 || !sameFile(current, observed)) return void 0;
      if (!staleFile(current, now)) return void 0;
      if (!unlinkOwnedPath(path2, observed)) return void 0;
    } catch (error) {
      if (observed !== void 0 || errorCode(error) !== "ENOENT") return void 0;
    }
    return openExclusive(path2);
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
      const canonical3 = realpathSync3(cursor);
      if (!within(canonicalRoot, canonical3) || canonical3 !== cursor) return void 0;
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
function releaseMachineDirectory(anchor2) {
  try {
    process.chdir(anchor2.previousCwd);
  } finally {
    closeSync2(anchor2.descriptor);
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
  const anchor2 = anchorMachineDirectory(root);
  if (anchor2 === void 0) {
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
    releaseMachineDirectory(anchor2);
  }
}
function canonicalDirectory(path2) {
  try {
    const info = lstatSync3(path2);
    if (!info.isDirectory() || info.isSymbolicLink()) return void 0;
    const canonical3 = realpathSync3(path2);
    return canonical3 === resolve5(path2) ? canonical3 : void 0;
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
  return candidates.map(canonicalDirectory).filter((path2) => path2 !== void 0);
}
function runtimeSessionId(input) {
  const value = input["session_id"] ?? input["sessionId"] ?? input["thread_id"] ?? input["threadId"];
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,200}$/.test(value) ? value : void 0;
}
function isExternalTranscriptBound(path2, runtime3, sessionId) {
  return runtime3 === "claude" && /^[A-Za-z0-9_-]{8,200}$/.test(sessionId) && basename3(path2) === `${sessionId}.jsonl`;
}
function openBoundedRegularFile(path2, maxBytes, allowedRoots) {
  let descriptor;
  try {
    const before = lstatSync3(path2);
    if (!before.isFile() || before.isSymbolicLink() || before.size > maxBytes) return void 0;
    const canonicalPath = realpathSync3(path2);
    if (!allowedRoots.some((root) => within(root, canonicalPath))) return void 0;
    descriptor = openSync2(
      path2,
      constants3.O_RDONLY | constants3.O_NONBLOCK | (constants3.O_NOFOLLOW ?? 0)
    );
    const opened = fstatSync2(descriptor);
    const currentPath = realpathSync3(path2);
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
function observeTranscript(path2, state, input, root, runtime3) {
  if (path2 === "" || path2.length > 4096 || path2.includes("\0") || !isAbsolute4(path2)) {
    return void 0;
  }
  let descriptor;
  try {
    const roots = transcriptRoots(root, runtime3);
    const opened = openBoundedRegularFile(path2, Number.MAX_SAFE_INTEGER, roots);
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
  const config2 = record3(contextConfig(root));
  const context = record3(config2?.["context"]);
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
  const path2 = input["transcript_path"];
  if (typeof path2 !== "string") {
    return { state, emitNudge: false, skippedBytes: 0, skippedLines: 0 };
  }
  const observed = observeTranscript(path2, state, input, root, runtime3);
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
  const config2 = thresholdConfig(root);
  const decision = evaluateContextMeasurement(cursorState, {
    usedTokens: observed.usedTokens,
    measuredAtMs: now,
    thresholdPercent: config2.thresholdPercent,
    ...config2.windowTokens === void 0 ? {} : { windowTokens: config2.windowTokens }
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
  const paths = call.edits.map((edit) => boundedProjectPath(root, edit.path)).filter((path2) => path2 !== void 0 && path2 !== CHECKPOINT);
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
function measureHerdrContext(input, root, runtime3, now) {
  if (runtime3 !== "claude" || input["source"] === "clear") return void 0;
  return measureContext(initialState(""), input, root, "UserPromptSubmit", runtime3, now).usagePercent;
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { spawnSync as spawnSync2 } from "node:child_process";
import { homedir as homedir2 } from "node:os";
import { join as join12 } from "node:path";

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
var Cached = class {
  constructor(getter) {
    this._getter = getter;
    this._value = void 0;
  }
  get value() {
    const getter = this._getter;
    if (getter !== void 0) {
      this._value = getter();
      this._getter = void 0;
    }
    return this._value;
  }
};
function cached(getter) {
  return new Cached(getter);
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source2) {
  const start = source2.startsWith("^") ? 1 : 0;
  const end = source2.endsWith("$") ? source2.length - 1 : source2.length;
  return source2.slice(start, end);
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = /* @__PURE__ */ (() => ({
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path2, issues) {
  return issues.map((iss) => {
    var _a2;
    (_a2 = iss).path ?? (_a2.path = []);
    iss.path.unshift(path2);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function attachSchema(issues, start, inst) {
  var _a2;
  for (let i = start; i < issues.length; i++) {
    (_a2 = issues[i]).schema ?? (_a2.schema = inst);
  }
}
function finalizeIssue(iss, ctx, config2) {
  var _a2;
  const traits = iss.inst?._zod?.traits;
  if (traits?.has("$ZodType")) {
    if (traits.has("$ZodCheck"))
      (_a2 = iss).schema ?? (_a2.schema = iss.inst);
    else
      iss.schema = iss.inst;
  }
  const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const full = {};
  for (const k of Object.keys(iss)) {
    if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
      continue;
    full[k] = iss[k];
  }
  full.path ?? (full.path = []);
  full.message = message;
  if (ctx?.reportInput) {
    full.input = iss.input;
  }
  return full;
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
  const units = str.length;
  if (!highSurrogate.test(str))
    return units;
  let count = units;
  for (let i = 0; i < units - 1; i++) {
    if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
      count--;
      i++;
    }
  }
  return count;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function members(proto, table) {
  for (const key in table) {
    const desc = Object.getOwnPropertyDescriptor(table, key);
    if (desc.get)
      Object.defineProperty(proto, key, { ...desc, enumerable: false });
    else
      defineBound(proto, key, desc.value);
  }
}
function own(inst, key, value, enumerable = true) {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}
function hide(inst, key, value) {
  return own(inst, key, value, false);
}
function defineBound(proto, key, fn) {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return this == null ? fn : own(this, key, fn.bind(this));
    },
    set(value) {
      own(this, key, value);
    }
  });
}
function claim(inst, sentinel) {
  const proto = Object.getPrototypeOf(inst);
  return sentinel in proto ? void 0 : proto;
}
var installing;
var broke = false;
var breaker = {
  configurable: true,
  get() {
    broke = true;
    return void 0;
  }
};
function defineLazyInternal(inst, key, compute) {
  const proto = Object.getPrototypeOf(inst._zod);
  if (key in proto && installing !== inst._zod) {
    installing = void 0;
    return;
  }
  installing = inst._zod;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      Object.defineProperty(this, key, breaker);
      const outer = broke;
      broke = false;
      try {
        const value = compute(this);
        if (broke)
          delete this[key];
        else
          Object.defineProperty(this, key, { configurable: true, writable: true, value });
        broke = broke || outer;
        return value;
      } catch (err) {
        delete this[key];
        broke = broke || outer;
        throw err;
      }
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, value });
    }
  });
}
function installLazyProp(inst, key, make, enumerable) {
  const proto = claim(inst, key);
  if (!proto)
    return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      const desc = { configurable: true, writable: true, enumerable, value: void 0 };
      Object.defineProperty(this, key, desc);
      desc.value = make(this);
      Object.defineProperty(this, key, desc);
      return desc.value;
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
    }
  });
}

var _a;
var _zodDesc = { value: void 0, enumerable: false };
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
  const E = _E;
  if (E) {
    const saved = E.stackTraceLimit;
    if (typeof saved === "number") {
      try {
        E.stackTraceLimit = 0;
      } catch {
        _E = null;
        return new Definition();
      }
      try {
        return new Definition();
      } finally {
        E.stackTraceLimit = saved;
      }
    }
  }
  return new Definition();
}
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer2, proto, params) {
  const zodProto = {};
  function Internals(def) {
    this.def = def;
    this.constr = _;
    this.traits = /* @__PURE__ */ new Set();
  }
  Internals.prototype = zodProto;
  const protoMembers = proto;
  const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
  function init(inst, def) {
    if (!inst._zod) {
      _zodDesc.value = new Internals(def);
      try {
        Object.defineProperty(inst, "_zod", _zodDesc);
      } finally {
        _zodDesc.value = void 0;
      }
    } else if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer2(inst, def);
    if (initialized) {
      const own2 = Object.getPrototypeOf(inst);
      const ctorProto = inst._zod.constr.prototype;
      let up = own2;
      while (up && up !== ctorProto)
        up = Object.getPrototypeOf(up);
      const target = up ?? own2;
      if (!initialized.has(target)) {
        initialized.add(target);
        members(target, protoMembers);
      }
    }
    const proto2 = _.prototype;
    for (const k in proto2) {
      if (!Object.prototype.hasOwnProperty.call(proto2, k))
        continue;
      if (!(k in inst)) {
        inst[k] = proto2[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    const inst = params?.Parent ? newError(Definition) : this;
    init(inst, def);
    const deferred = inst._zod.deferred;
    if (deferred) {
      for (const fn of deferred) {
        fn();
      }
      inst._zod.deferred = void 0;
    }
    const pp = globalThis.__zod_globalConfig?.postProcessor;
    if (pp)
      pp(inst);
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $ZodAsyncError = class extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
function _getMessage() {
  const internals = this._zod;
  internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
  return internals.message;
}
function _setMessage(value) {
  this._zod.message = value;
}
var _messageDesc = {
  get: _getMessage,
  set: _setMessage,
  enumerable: true,
  configurable: true
};
var _issuesDesc = { value: void 0, enumerable: false };
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  _issuesDesc.value = def;
  Object.defineProperty(inst, "issues", _issuesDesc);
  _issuesDesc.value = void 0;
  Object.defineProperty(inst, "message", _messageDesc);
  const proto = Object.getPrototypeOf(inst);
  if (!_installedToString.has(proto)) {
    _installedToString.add(proto);
    Object.defineProperty(proto, "toString", {
      configurable: true,
      enumerable: false,
      get() {
        const value = () => this.message;
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
        return value;
      },
      set(value) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      }
    });
  }
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, void 0, {
  Parent: Error
});

var _parse = (_Err) => {
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError();
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, _params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var parse = /* @__PURE__ */ _parse($ZodRealError);
var _parseAsync = (_Err) => {
  const fn = async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
      result = await result;
    if (result.issues.length) {
      const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError);
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
function failure(Err, issues, ctx) {
  let error;
  return {
    success: false,
    get error() {
      if (!error) {
        error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
        issues = void 0;
        ctx = void 0;
      }
      return error;
    },
    set error(e) {
      error = e;
      issues = void 0;
      ctx = void 0;
    }
  };
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
function anchor(source2) {
  return new RegExp(`^${source2}$`);
}
var date = /* @__PURE__ */ anchor(dateSource);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const opts = ["Z"];
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`;
  const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var anyString = /^[\s\S]{0,}$/;
var number = /^-?\d+(?:\.\d+)?$/;

var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a2;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a2 = inst._zod).onattach ?? (_a2.onattach = []);
});
var _whenHasLength = (payload) => {
  const val = payload.value;
  return !nullish(val) && val.length !== void 0;
};
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units > def.maximum ? codePointLength(input) : units;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a2, _b;
  $ZodCheck.init(inst, def);
  if (def.pattern)
    (_a2 = inst._zod).check ?? (_a2.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var version = {
  major: 4,
  minor: 6,
  patch: 5
};

var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a2;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const defChecks = inst._zod.def.checks;
  const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      if (payload.memo)
        return payload;
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            attachSchema(payload.issues, currLen, inst);
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          attachSchema(payload.issues, currLen, inst);
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
}, {
  // Wrappers extend this by installing a richer factory over it; reading it eagerly would defeat the laziness.
  get "~standard"() {
    return hide(this, "~standard", standardProps(this));
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  }
});
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync(inst, value) {
  const ctx = { async: true };
  return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
}
function standardProps(inst) {
  return {
    validate: (value) => {
      const ctx = { async: false };
      try {
        const r = inst._zod.run({ value, issues: [] }, ctx);
        if (!(r instanceof Promise))
          return toStandardResult(r, ctx);
      } catch (_) {
      }
      return validateAsync(inst, value);
    },
    vendor: "zod",
    version: 1
  };
}
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = def.pattern ?? anyString;
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
    const proms = [];
    const abortEarly = ctx?.abortEarly;
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
        if (abortEarly && result.issues.length !== 0 && aborted(result))
          break;
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input, optin, optout) {
  const isPresent = key in input;
  const isOptionalOut = optout === "optional";
  if (!isPresent && isOptionalOut && optin === "optional") {
    return;
  }
  if (result.issues.length) {
    if (optin !== void 0 && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && optin === void 0) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent || optin === "defaulted" && !isOptionalOut) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  const ownSymbols = Object.getOwnPropertySymbols(def.shape);
  const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
  const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  for (const k of allKeys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    allKeys,
    symbolKeys,
    // string-only: handleCatchall matches it against `for...in`, which never yields a symbol
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const optin = _catchall.optin;
  const optout = _catchall.optout;
  let seen = 0;
  for (const key in input) {
    if (abortEarly && payload.issues.length !== seen) {
      if (aborted(payload, seen))
        break;
      seen = payload.issues.length;
    }
    if (keySet.has(key))
      continue;
    if (key === "__proto__") {
      if (t === "never")
        unrecognized.push(key);
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
    } else {
      handlePropertyResult(r, payload, key, input, optin, optout);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst,
      // Describes the shape of the input, not the validity of the parsed value, so it never aborts. The parse still fails; the schema's own checks just get to run first, and an enclosing intersection can reconcile the key against a sibling operand.
      continue: true
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  const sh = desc?.get ? desc.get.raw : def.shape ?? {};
  if (sh) {
    const get = () => {
      const newSh = { ...sh };
      Object.defineProperty(def, "shape", { value: newSh });
      get.raw = newSh;
      return newSh;
    };
    get.raw = sh;
    Object.defineProperty(def, "shape", { get });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazyInternal(inst, "propValues", (zod) => {
    const shape = zod.def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
          assignProp(propValues, key, /* @__PURE__ */ new Set());
        }
        for (const v of field.values)
          propValues[key].add(v);
        if (field.optin !== void 0)
          propValues[key].add(void 0);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
    const proms = [];
    const shape = value.shape;
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const key of value.allKeys) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      if (key === "__proto__")
        continue;
      const el = shape[key];
      const optin = el._zod.optin;
      const optout = el._zod.optout;
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
      } else {
        handlePropertyResult(r, payload, key, input, optin, optout);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
  };
});
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values && !def.partial) {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      const recordKeys = /* @__PURE__ */ new Set();
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          if (key === "__proto__")
            continue;
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          if (outKey === "__proto__")
            continue;
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[outKey] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          if (def.mode === "loose") {
            if (key === "__proto__")
              continue;
            payload.value[key] = input[key];
          } else {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          }
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    } else {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      let unrecognized;
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else if (values) {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const outKey = keyResult.value;
        if (outKey === "__proto__")
          continue;
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[outKey] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[outKey] = result.value;
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  defineLazyInternal(inst, "pattern", (zod) => {
    const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
    return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const values = new Set(def.values);
  inst._zod.values = values;
  defineLazyInternal(inst, "pattern", (zod) => {
    const vals = zod.def.values;
    return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
function handleOptionalResult(payload, result) {
  payload.value = result.issues.length ? void 0 : result.value;
  return payload;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  inst._zod.optout = "optional";
  defineLazyInternal(inst, "values", (zod) => {
    const values = zod.def.innerType._zod.values;
    return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern2 = zod.def.innerType._zod.pattern;
    return pattern2 ? new RegExp(`^(${cleanRegex(pattern2.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0) {
      if (def.innerType._zod.optin !== "defaulted")
        return payload;
      const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
      if (result instanceof Promise)
        return result.then((result2) => handleOptionalResult(payload, result2));
      return handleOptionalResult(payload, result);
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern2 = zod.def.innerType._zod.pattern;
    return pattern2 ? new RegExp(`^(${cleanRegex(pattern2.source)}|null)$`) : void 0;
  });
  defineLazyInternal(inst, "values", (zod) => {
    return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
function snapshotChecks(def) {
  if (def.checks)
    def.checks = [...def.checks];
  return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
  return new Class(snapshotChecks({ type: "string", ...normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
  return new Class({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
  return new Class({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
  return new Class({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
  return new Class({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
  return new Class(snapshotChecks({ type: "number", checks: [], ...normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
  return new Class({
    type: "never",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern2, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern: pattern2
  });
}
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var ZodMiniType = /* @__PURE__ */ $constructor("ZodMiniType", (inst, def) => {
  if (!inst._zod)
    throw new Error("Uninitialized schema in ZodMiniType.");
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
}, {
  // `with` is an alias for `check`: the same function object, not a wrapper.
  get with() {
    return this.check;
  },
  set with(value) {
    own(this, "with", value);
  },
  parse(data, params) {
    return parse(this, data, params, { callee: this.parse });
  },
  parseAsync(data, params) {
    return parseAsync(this, data, params, { callee: this.parseAsync });
  },
  safeParse(data, params) {
    return safeParse(this, data, params);
  },
  safeParseAsync(data, params) {
    return safeParseAsync(this, data, params);
  },
  check(...checks) {
    const def = this.def;
    return this.clone({
      ...def,
      checks: [
        ...def.checks ?? [],
        ...checks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }, { parent: true });
  },
  clone(_def, params) {
    return clone(this, _def, params);
  },
  brand() {
    return this;
  },
  register(reg, meta2) {
    reg.add(this, meta2);
    return this;
  },
  apply(fn, ...args) {
    return args.length === 0 ? fn(this) : fn(this, ...args);
  }
});
var ZodMiniString = /* @__PURE__ */ $constructor("ZodMiniString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function string2(params) {
  return _string(ZodMiniString, params);
}
var ZodMiniStringFormat = /* @__PURE__ */ $constructor("ZodMiniStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  ZodMiniString.init(inst, def);
});
var ZodMiniNumber = /* @__PURE__ */ $constructor("ZodMiniNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function number2(params) {
  return _number(ZodMiniNumber, params);
}
var ZodMiniNumberFormat = /* @__PURE__ */ $constructor("ZodMiniNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodMiniNumber.init(inst, def);
});
function int(params) {
  return _int(ZodMiniNumberFormat, params);
}
var ZodMiniNever = /* @__PURE__ */ $constructor("ZodMiniNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function never(params) {
  return _never(ZodMiniNever, params);
}
var ZodMiniArray = /* @__PURE__ */ $constructor("ZodMiniArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function array(element, params) {
  return new ZodMiniArray({
    type: "array",
    element,
    ...normalizeParams(params)
  });
}
var ZodMiniObject = /* @__PURE__ */ $constructor("ZodMiniObject", (inst, def) => {
  $ZodObject.init(inst, def);
  ZodMiniType.init(inst, def);
  installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
});
// @__NO_SIDE_EFFECTS__
function object2(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...normalizeParams(params)
  };
  return new ZodMiniObject(def);
}
// @__NO_SIDE_EFFECTS__
function strictObject(shape, params) {
  return new ZodMiniObject({
    type: "object",
    shape,
    catchall: /* @__PURE__ */ never(),
    ...normalizeParams(params)
  });
}
var ZodMiniRecord = /* @__PURE__ */ $constructor("ZodMiniRecord", (inst, def) => {
  $ZodRecord.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function record4(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodMiniRecord({
      type: "record",
      keyType: /* @__PURE__ */ string2(),
      valueType: keyType,
      ...normalizeParams(valueType)
    });
  }
  return new ZodMiniRecord({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
var ZodMiniEnum = /* @__PURE__ */ $constructor("ZodMiniEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodMiniType.init(inst, def);
  inst.options = [...inst._zod.values];
});
// @__NO_SIDE_EFFECTS__
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodMiniEnum({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
var ZodMiniLiteral = /* @__PURE__ */ $constructor("ZodMiniLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function literal(value, params) {
  return new ZodMiniLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
var ZodMiniOptional = /* @__PURE__ */ $constructor("ZodMiniOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function optional(innerType) {
  return new ZodMiniOptional({
    type: "optional",
    innerType
  });
}
var ZodMiniNullable = /* @__PURE__ */ $constructor("ZodMiniNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function nullable(innerType) {
  return new ZodMiniNullable({
    type: "nullable",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function nullish2(innerType) {
  return /* @__PURE__ */ optional(/* @__PURE__ */ nullable(innerType));
}
var ZodMiniCustom = /* @__PURE__ */ $constructor("ZodMiniCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function refine(fn, _params = {}) {
  return _refine(ZodMiniCustom, fn, _params);
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();

var iso_exports = {};
__export(iso_exports, {
  ZodMiniISODate: () => ZodMiniISODate,
  ZodMiniISODateTime: () => ZodMiniISODateTime,
  ZodMiniISODuration: () => ZodMiniISODuration,
  ZodMiniISOTime: () => ZodMiniISOTime,
  date: () => date2,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});
init_define_VOID_SYNTAX_WORKER_IDENTITY();
var ZodMiniISODateTime = /* @__PURE__ */ $constructor("ZodMiniISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodMiniStringFormat.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function datetime2(params) {
  return _isoDateTime(ZodMiniISODateTime, params);
}
var ZodMiniISODate = /* @__PURE__ */ $constructor("ZodMiniISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodMiniStringFormat.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function date2(params) {
  return _isoDate(ZodMiniISODate, params);
}
var ZodMiniISOTime = /* @__PURE__ */ $constructor("ZodMiniISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodMiniStringFormat.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function time2(params) {
  return _isoTime(ZodMiniISOTime, params);
}
var ZodMiniISODuration = /* @__PURE__ */ $constructor("ZodMiniISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodMiniStringFormat.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function duration2(params) {
  return _isoDuration(ZodMiniISODuration, params);
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var STATE_TTL = 864e5;
var CONTEXT_TTL = 72e5;
var PANE_KEYS = ["mission", "worker", "ticket", "wstatus", "ctx"];
var WORKSPACE_KEYS = ["mission", "wstatus", "workers"];
function metadataSequence(originMs, elapsedMs) {
  const nanoseconds = (ms) => BigInt(Math.trunc(ms)) * 1000000n + BigInt(Math.trunc(ms % 1 * 1e6));
  return nanoseconds(originMs) + nanoseconds(elapsedMs);
}
function metadataCommands(snapshot, event, sequence, contextPercent, workspaceMission) {
  const { mission, pane, worker, coordinator, workers } = snapshot;
  const commands = [];
  let seq = sequence;
  const patch = (kind, id, fields2, ttl) => {
    commands.push([
      kind,
      "report-metadata",
      id,
      "--source",
      "void-machine",
      ...fields2,
      "--ttl-ms",
      String(ttl),
      "--seq",
      String(seq++)
    ]);
  };
  const clear = (keys) => keys.flatMap((key) => ["--clear-token", key]);
  if (mission.status === "done" || mission.status === "failed") {
    for (const owned of coordinator ? snapshot.ownedPanes ?? [pane] : [pane]) {
      if (owned.tokens?.["mission"] === mission.mission) patch("pane", owned.pane_id, clear(PANE_KEYS), STATE_TTL);
    }
    if (coordinator && workspaceMission === mission.mission) {
      patch("workspace", pane.workspace_id, clear(WORKSPACE_KEYS), STATE_TTL);
    }
    return commands;
  }
  if (event.hook_event_name === "SessionEnd") return commands;
  if (event.hook_event_name === "SessionStart" && event.source === "clear") {
    patch("pane", pane.pane_id, clear(["ctx"]), CONTEXT_TTL);
  }
  const fields = ["--token", `mission=${mission.mission}`, "--token", `wstatus=${worker?.status ?? mission.status}`];
  if (worker !== void 0) fields.push("--token", `worker=${worker.label}`, "--token", `ticket=${worker.ticket}`);
  patch("pane", pane.pane_id, fields, STATE_TTL);
  if (coordinator) {
    const active = workers.filter((item) => item.status === "running").length;
    const blocked = workers.filter((item) => item.status === "blocked").length;
    patch("workspace", pane.workspace_id, [
      "--token",
      `mission=${mission.mission}`,
      "--token",
      `wstatus=${mission.status}`,
      "--token",
      `workers=${active} active, ${blocked} blocked`
    ], STATE_TTL);
  }
  if (contextPercent !== void 0 && Number.isFinite(contextPercent) && contextPercent >= 0) {
    patch("pane", pane.pane_id, ["--token", `ctx=${Math.round(contextPercent)}%`], CONTEXT_TTL);
  }
  return commands;
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { createHash as createHash4 } from "node:crypto";
import { closeSync as closeSync3, constants as constants4, fstatSync as fstatSync3, lstatSync as lstatSync4, opendirSync, openSync as openSync3, readSync as readSync3, realpathSync as realpathSync4 } from "node:fs";
import { isAbsolute as isAbsolute6, join as join11, parse as parse2, relative as relative5, resolve as resolve6, sep } from "node:path";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
var import_yaml = __toESM(require_dist(), 1);
import { isAbsolute as isAbsolute5 } from "node:path";
var identifier = string2().check(_regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/));
var text = string2().check(_minLength(1), _maxLength(4096), refine((value) => [...value].every((char) => char.charCodeAt(0) >= 32 && !(char.charCodeAt(0) >= 127 && char.charCodeAt(0) <= 159))));
var path = text.check(refine((value) => isAbsolute5(value) && !value.split(/[\\/]/).includes("..")));
var selectionSchema = strictObject({
  schema: literal(1),
  project: string2().check(_regex(/^[a-f0-9]{64}$/)),
  mission: identifier,
  coordinator: strictObject({ label: identifier, worktree: path })
});
var instant = iso_exports.datetime();
var status = _enum(["planned", "running", "blocked", "done", "failed"]);
var workerSchema = strictObject({
  label: identifier,
  pane_id: optional(text),
  agent: _enum(["claude", "codex"]),
  worktree: path,
  branch: text,
  ticket: identifier,
  status,
  attempt: identifier,
  session: optional(text)
});
var missionSchema = strictObject({
  schema: literal(1),
  mission: identifier,
  project: identifier,
  status,
  updated_at: instant,
  repository: path,
  coordinator: strictObject({ label: identifier, worktree: path, workspace: optional(text) }),
  workers: array(workerSchema).check(_maxLength(4))
}).check(refine((value) => new Set(value.workers.map((worker) => worker.label)).size === value.workers.length && !value.workers.some((worker) => worker.label === value.coordinator.label), "ambiguous labels"));
var reportSchema = strictObject({
  schema: literal(1),
  mission: identifier,
  attempt: identifier,
  status: _enum(["running", "blocked", "done", "failed"]),
  worker: identifier,
  branch: text,
  commits: array(string2().check(_regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/))).check(_maxLength(64)),
  tests: _enum(["passed", "failed", "not_run"]),
  updated_at: instant
});
var briefSchema = strictObject({ schema: literal(1), mission: identifier, attempt: identifier, worker: identifier });
function strictDocument(input) {
  const document = (0, import_yaml.parseDocument)(input, {
    strict: true,
    stringKeys: true,
    uniqueKeys: true,
    version: "1.2"
  });
  if (document.errors.length || document.warnings.length) throw Error("invalid orchestra YAML");
  (0, import_yaml.visit)(document, (_key, node) => {
    if ((0, import_yaml.isAlias)(node) || (0, import_yaml.isNode)(node) && ("tag" in node && node.tag !== void 0 || "anchor" in node && node.anchor !== void 0)) throw Error("YAML aliases/tags refused");
  });
  return document.toJS({ maxAliasCount: 0 });
}
function frontmatter(input, limit) {
  if (Buffer.byteLength(input) > limit) throw Error("orchestra document exceeds byte limit");
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(input);
  if (match?.[1] === void 0 || /^---(?:\r?\n|$)/.test(match[2] ?? "")) {
    throw Error("orchestra document requires one delimited frontmatter");
  }
  return strictDocument(match[1]);
}
function parseSelection(input) {
  if (Buffer.byteLength(input) > 4096) throw Error("orchestra selection exceeds byte limit");
  JSON.parse(input);
  return selectionSchema.parse(strictDocument(input));
}
function parseMission(input) {
  return missionSchema.parse(frontmatter(input, 65536));
}
function parseReport(input) {
  return reportSchema.parse(frontmatter(input, 65536));
}
function parseBrief(input) {
  return briefSchema.parse(frontmatter(input, 262144));
}
function matchReport(mission, label, report) {
  const worker = mission.workers.find((item) => item.label === label);
  if (worker === void 0 || report.worker !== label || report.mission !== mission.mission || report.attempt !== worker.attempt || report.branch !== worker.branch) {
    throw Error("foreign or stale orchestra report");
  }
  return report;
}
function resolvePane(identity, panes) {
  const matching = panes.filter((pane2) => pane2.label === identity.label && pane2.cwd === identity.worktree);
  const pane = matching[0];
  if (matching.length !== 1 || pane === void 0) throw Error("absent or ambiguous orchestra pane identity");
  return pane;
}

var MAX_MISSIONS = 64;
var MAX_DISCOVERY_BYTES = 1048576;
function projectIdentity(canonicalCommonDirectory) {
  return createHash4("sha256").update(canonicalCommonDirectory).digest("hex");
}
function absent(error) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
function canonical(path2) {
  try {
    return realpathSync4(path2);
  } catch (error) {
    if (absent(error)) return void 0;
    throw error;
  }
}
function missionEntries2(root) {
  safePath(root);
  const directory = opendirSync(root);
  const entries = [];
  try {
    for (let i = 0; i <= MAX_MISSIONS; i++) {
      const entry = directory.readSync();
      if (!entry) return entries;
      entries.push(entry.name);
    }
    throw Error("orchestra discovery incomplete: entry limit");
  } finally {
    directory.closeSync();
  }
}
function safePath(path2) {
  let current = parse2(path2).root;
  for (const component of path2.slice(current.length).split(sep).filter(Boolean)) {
    current = join11(current, component);
    if (lstatSync4(current).isSymbolicLink()) throw Error("orchestra state symlink refused");
  }
}
function readDocument(root, relativePath, limit) {
  if (isAbsolute6(relativePath) || relativePath.split(/[\\/]/).includes("..")) throw Error("orchestra traversal refused");
  const target = resolve6(root, relativePath);
  safePath(target);
  const canonicalRoot = realpathSync4(root);
  const rel = relative5(canonicalRoot, realpathSync4(target));
  if (rel.startsWith("..") || isAbsolute6(rel)) throw Error("orchestra path escapes mission");
  const descriptor = openSync3(target, constants4.O_RDONLY | constants4.O_NONBLOCK | constants4.O_NOFOLLOW);
  try {
    const info = fstatSync3(descriptor);
    if (!info.isFile() || info.size > limit) throw Error("orchestra state is not a bounded regular file");
    const buffer = Buffer.alloc(limit + 1);
    const count = readSync3(descriptor, buffer, 0, buffer.length, 0);
    const after = fstatSync3(descriptor);
    const current = lstatSync4(target);
    if (count > limit || count !== info.size || info.size !== after.size || info.mtimeMs !== after.mtimeMs || current.dev !== info.dev || current.ino !== info.ino) throw Error("orchestra state changed during read");
    safePath(target);
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, count));
  } finally {
    closeSync3(descriptor);
  }
}
function effectiveWorkers(directory, mission) {
  return mission.workers.map((worker) => {
    let briefText;
    try {
      briefText = readDocument(directory, `workers/${worker.label}/brief.md`, 262144);
    } catch (error) {
      if (!absent(error)) throw error;
    }
    if (briefText !== void 0) {
      const brief = parseBrief(briefText);
      if (brief.mission !== mission.mission || brief.worker !== worker.label || brief.attempt !== worker.attempt) {
        throw Error("foreign or stale orchestra brief");
      }
    }
    let raw;
    try {
      raw = readDocument(directory, `workers/${worker.label}/report.md`, 65536);
    } catch (error) {
      if (absent(error)) return worker;
      throw error;
    }
    const report = matchReport(mission, worker.label, parseReport(raw));
    return { ...worker, status: report.status };
  });
}
function readSelection(cwd, project) {
  const relativePath = ".void/machine/orchestra-selection.json";
  try {
    safePath(join11(cwd, relativePath));
  } catch (error) {
    if (absent(error)) return void 0;
    throw error;
  }
  const selection = parseSelection(readDocument(cwd, relativePath, 4096));
  if (selection.project !== project || selection.coordinator.worktree !== cwd) {
    throw Error("foreign orchestra selection project or coordinator worktree");
  }
  return selection;
}
function selectCandidates(candidates, binding, cwd, panes) {
  if (binding !== void 0) {
    const selected = candidates.filter(({ mission }) => mission.mission === binding.mission);
    const coordinator = selected[0]?.mission.coordinator;
    if (selected.length !== 1 || coordinator?.label !== binding.coordinator.label || coordinator.worktree !== binding.coordinator.worktree) {
      throw Error("orchestra selection target absent or coordinator mismatch");
    }
    return selected;
  }
  const active = candidates.filter((item) => !["done", "failed"].includes(item.mission.status));
  return active.length ? active : candidates.filter(({ mission }) => [mission.coordinator, ...mission.workers].some((person) => canonical(person.worktree) === cwd && panes.some((pane) => pane.label === person.label && canonical(pane.cwd) === cwd && pane.tokens?.["mission"] === mission.mission)));
}
function readOrchestra(state, common, cwd, inventory) {
  const repository = realpathSync4(common);
  const project = projectIdentity(repository);
  const canonicalCwd = realpathSync4(cwd);
  const binding = readSelection(canonicalCwd, project);
  const root = join11(state, project);
  let entries;
  try {
    entries = missionEntries2(root);
  } catch (error) {
    if (!absent(error)) throw error;
    if (binding !== void 0) throw Error("orchestra selection target absent: central state missing");
    return void 0;
  }
  if (entries.length > MAX_MISSIONS) throw Error("orchestra discovery incomplete: entry limit");
  const candidates = [];
  let bytes = 0;
  for (const entry of entries) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(entry)) throw Error("invalid orchestra mission directory");
    const directory2 = join11(root, entry);
    const raw = readDocument(directory2, "mission.md", 65536);
    bytes += Buffer.byteLength(raw);
    if (bytes > MAX_DISCOVERY_BYTES) throw Error("orchestra discovery incomplete: byte limit");
    const mission2 = parseMission(raw);
    if (mission2.project !== project || mission2.repository !== repository || mission2.mission !== entry) {
      throw Error("foreign orchestra mission");
    }
    const participants = [mission2.coordinator, ...mission2.workers];
    if (participants.some((person) => canonical(person.worktree) === canonicalCwd)) candidates.push({ directory: directory2, mission: mission2 });
  }
  if (candidates.length === 0 && binding === void 0) return void 0;
  const inventoryPanes = inventory();
  const selected = selectCandidates(candidates, binding, canonicalCwd, inventoryPanes);
  if (selected.length === 0) return void 0;
  const candidate = selected[0];
  if (selected.length !== 1 || candidate === void 0) {
    const names = selected.map((item) => item.mission.mission).sort().join(", ").slice(0, 300);
    throw Error(`ambiguous orchestra missions: ${names}; ORCH must choose an explicit selection`);
  }
  const { mission, directory } = candidate;
  const identities = [mission.coordinator, ...mission.workers].filter((person) => canonical(person.worktree) === canonicalCwd);
  if (identities.length !== 1 || identities[0] === void 0) throw Error("ambiguous orchestra participant");
  const identity = identities[0];
  const labels = new Set([mission.coordinator, ...mission.workers].map((person) => person.label));
  const panes = inventoryPanes.filter((pane2) => labels.has(pane2.label)).flatMap((pane2) => {
    const cwd2 = canonical(pane2.cwd);
    return cwd2 === void 0 ? [] : [{ ...pane2, cwd: cwd2 }];
  });
  const pane = resolvePane({ label: identity.label, worktree: canonicalCwd }, panes);
  const workers = effectiveWorkers(directory, mission);
  const ownedPanes = [mission.coordinator, ...mission.workers].flatMap((person) => {
    const cwd2 = canonical(person.worktree);
    const matches2 = panes.filter((pane2) => pane2.label === person.label && pane2.cwd === cwd2);
    if (matches2.length > 1) throw Error("ambiguous orchestra pane identity");
    return matches2;
  });
  return {
    directory,
    mission,
    pane,
    coordinator: identity.label === mission.coordinator.label,
    worker: workers.find((worker) => worker.label === identity.label),
    workers,
    ownedPanes
  };
}

var runCommand = (command, args, options) => {
  const result = spawnSync2(command, args, { ...options, encoding: "utf8" });
  if (result.error !== void 0 || result.status !== 0) {
    throw Error(`${command}: ${result.error?.message ?? result.stderr?.slice(0, 300) ?? "transport refused"}`);
  }
  return result.stdout;
};
var paneList = object2({ result: object2({ panes: array(object2({
  pane_id: string2(),
  workspace_id: string2(),
  cwd: nullish2(string2()),
  label: nullish2(string2()),
  tokens: optional(record4(string2(), string2()))
})).check(_maxLength(256)) }) });
function executeHerdrMetadata(raw, root, env, runtime3, run = runCommand) {
  if (env["HERDR_ENV"] !== "1") return { status: "skipped", details: { reason: "outside-herdr" } };
  const now = Date.now();
  const seq = metadataSequence(performance.timeOrigin, performance.now());
  const deadline = performance.now() + 2e3;
  const input = record3(raw);
  const event = input?.["hook_event_name"];
  if (input === void 0 || !["SessionStart", "Stop", "SessionEnd"].includes(String(event))) {
    return { status: "skipped", details: { reason: "event-not-actionable" } };
  }
  const call = (command, args) => {
    const timeout = Math.floor(deadline - performance.now());
    if (timeout <= 0) throw Error("Herdr projection deadline exceeded");
    return run(command, args, { cwd: root, env, shell: false, timeout, maxBuffer: 262144 });
  };
  try {
    const common = call("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"]).trim();
    const snapshot = readOrchestra(join12(env["HOME"] ?? homedir2(), ".local/state/orchestra"), common, root, () => {
      const response = paneList.parse(JSON.parse(call("herdr", ["pane", "list"])));
      return response.result.panes.flatMap((pane) => typeof pane.label === "string" && typeof pane.cwd === "string" ? [{
        pane_id: pane.pane_id,
        workspace_id: pane.workspace_id,
        label: pane.label,
        cwd: pane.cwd,
        ...pane.tokens === void 0 ? {} : { tokens: pane.tokens }
      }] : []);
    });
    if (snapshot === void 0) return { status: "skipped", details: { reason: "no-orchestra-mission" } };
    const workspace = snapshot.coordinator ? record3(record3(JSON.parse(call("herdr", ["workspace", "get", snapshot.pane.workspace_id])))?.["result"]) : void 0;
    const workspaceMission = record3(record3(workspace?.["workspace"])?.["tokens"])?.["mission"];
    const percent = measureHerdrContext(input, root, runtime3, now);
    const commands = metadataCommands(
      snapshot,
      {
        hook_event_name: String(event),
        ...typeof input["source"] === "string" ? { source: input["source"] } : {}
      },
      seq,
      percent,
      typeof workspaceMission === "string" ? workspaceMission : void 0
    );
    for (const args of commands) {
      const output = call("herdr", args).trim();
      if (output === "") continue;
      const response = record3(JSON.parse(output));
      if (record3(response?.["result"]) === void 0 || response?.["error"] !== void 0) {
        throw Error("Herdr metadata publication refused");
      }
    }
    return {
      status: "ok",
      details: {
        mission: snapshot.mission.mission,
        published: commands.length,
        context: percent === void 0 ? "unmeasurable" : "measured"
      },
      ...event === "SessionStart" ? { output: { hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: `Orchestra mission: ${snapshot.directory}
Read mission.md and the current brief/report before resuming; Herdr IDs are hints.`
      } } } : {}
    };
  } catch (error) {
    const reason = (error instanceof Error ? error.message : String(error)).slice(0, 500);
    return { status: "degraded", details: { reason }, diagnostic: `herdr-metadata: ${reason}
` };
  }
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { spawnSync as spawnSync3 } from "node:child_process";
import { statSync as statSync6 } from "node:fs";
import { homedir as homedir3 } from "node:os";
import { join as join13 } from "node:path";
var runCommand2 = (command, args, options) => {
  const result = spawnSync3(command, args, options);
  if (result.error !== void 0 || result.status !== 0) throw Error("process-failed");
  return result.stdout;
};
var discoverySchema = object2({ result: object2({ process_info: object2({
  pane_id: string2(),
  foreground_processes: array(object2({
    pid: number2().check(int(), _gte(2))
  })).check(_minLength(1), _maxLength(256))
}) }) });
function refused(reason) {
  return { status: "degraded", details: { reason }, diagnostic: `herdr-session: ${reason}
` };
}
function foreground(output, pane) {
  try {
    const value = JSON.parse(output.toString("utf8"));
    if (record3(value)?.["error"] !== void 0) return void 0;
    const result = discoverySchema.safeParse(value);
    if (!result.success || result.data.result.process_info.pane_id !== pane) return void 0;
    return result.data.result.process_info.foreground_processes.map((item) => item.pid);
  } catch {
    return void 0;
  }
}
function proveOwnership(pids, call) {
  let pid = process.pid;
  const visited = /* @__PURE__ */ new Set();
  for (let depth = 0; depth < 64; depth++) {
    if (visited.has(pid)) return "parent-cycle";
    visited.add(pid);
    if (pids.includes(pid)) return void 0;
    const parent = call("ps", ["-o", "ppid=", "-p", String(pid)]).toString("utf8").trim();
    if (!/^[0-9]+$/.test(parent) || !Number.isSafeInteger(Number(parent))) return "invalid-parent";
    pid = Number(parent);
    if (pid <= 1) return "ownership-unproven";
  }
  return "parent-depth-exceeded";
}
function nativeHook(env) {
  const path2 = join13(
    env["CODEX_HOME"] || join13(env["HOME"] || homedir3(), ".codex"),
    "herdr-agent-state.sh"
  );
  try {
    return statSync6(path2).isFile() ? path2 : void 0;
  } catch {
    return void 0;
  }
}
function executeHerdrSession(input, env, runtime3, run = runCommand2, clock = () => performance.now()) {
  if (runtime3 !== "codex" || env["HERDR_ENV"] !== "1") {
    return { status: "skipped", details: { reason: "outside-codex-herdr" } };
  }
  try {
    if (record3(parseHookPayload(input))?.["hook_event_name"] !== "SessionStart") {
      return { status: "skipped", details: { reason: "event-not-actionable" } };
    }
  } catch {
    return refused("invalid-input");
  }
  const pane = env["HERDR_PANE_ID"];
  if (pane === void 0 || pane.length === 0 || pane.length > 160 || [...pane].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) || !env["HERDR_SOCKET_PATH"]) return refused("missing-herdr-context");
  const hook = nativeHook(env);
  if (hook === void 0) return refused("native-hook-unavailable");
  const deadline = clock() + 2e3;
  let reason = "discovery-failed";
  const call = (command, args) => {
    const timeout = Math.floor(deadline - clock());
    if (timeout <= 0) {
      reason = "discovery-deadline";
      throw Error(reason);
    }
    return run(command, args, { env, shell: false, timeout, maxBuffer: 262144, killSignal: "SIGKILL" });
  };
  try {
    const pids = foreground(call("herdr", ["pane", "process-info", "--pane", pane]), pane);
    if (pids === void 0) return refused("invalid-discovery");
    reason = "parent-lookup-failed";
    const denied = proveOwnership(pids, call);
    if (denied !== void 0) return refused(denied);
  } catch {
    return refused(reason);
  }
  try {
    const output = run("sh", [hook, "session"], {
      env,
      shell: false,
      timeout: 1e3,
      maxBuffer: 262144,
      killSignal: "SIGKILL",
      input
    });
    return { status: "ok", details: { relayed: true }, output };
  } catch {
    return refused("native-relay-failed");
  }
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { randomUUID } from "node:crypto";
import { lstatSync as lstatSync5, mkdirSync as mkdirSync4, readFileSync as readFileSync11, readdirSync as readdirSync3, realpathSync as realpathSync5, renameSync as renameSync4, writeFileSync as writeFileSync3 } from "node:fs";
import { basename as basename5, dirname as dirname6, isAbsolute as isAbsolute7, join as join16 } from "node:path";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { spawnSync as spawnSync4 } from "node:child_process";
import { basename as basename4, dirname as dirname5, join as join15 } from "node:path";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { join as join14 } from "node:path";
var VERSION_SHAPE = /^[0-9A-Za-z.+-]{1,64}$/;
function readVersion(path2) {
  const version2 = record3(readJson(path2))?.["version"];
  return typeof version2 === "string" && VERSION_SHAPE.test(version2) ? version2 : void 0;
}
function resolveInstall(root, env) {
  const explicit = productSetting(env, "VERSION");
  if (explicit !== void 0 && VERSION_SHAPE.test(explicit)) {
    return { version: explicit, source: void 0 };
  }
  const pluginRoot = env["CLAUDE_PLUGIN_ROOT"];
  if (pluginRoot !== void 0) {
    const version3 = readVersion(join14(pluginRoot, ".claude-plugin", "plugin.json"));
    if (version3 !== void 0) return { version: version3, source: "marketplace" };
  }
  const receipt = record3(readJson(voidReadPath(root, "receipts", "install-v1.json")));
  const version2 = receipt?.["version"];
  if (typeof version2 === "string" && VERSION_SHAPE.test(version2)) {
    const declared = receipt?.["source"];
    const source2 = declared === "local" || declared === "marketplace" ? declared : void 0;
    return { version: version2, source: source2 };
  }
  return { version: "unknown", source: void 0 };
}

function machineRootOf(cwd) {
  const result = spawnSync4(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    { cwd, shell: false, encoding: "utf8", timeout: 5e3 }
  );
  const common = result.status === 0 ? result.stdout.replace(/\r?\n$/, "") : "";
  return common !== "" && basename4(common) === ".git" ? join15(dirname5(common), ".void", "machine") : void 0;
}

var SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
var MAX_MESSAGE_BYTES = 262144;
var MAX_CLAIM_BYTES = 4096;
var PARKING_WINDOW_MS = 6e5;
var skipped = (reason) => ({ status: "skipped", details: { reason } });
function claimedPath(root, sessionId) {
  try {
    const claim2 = record3(JSON.parse(readFileSync11(join16(root, "agents", "sessions", `${sessionId}.json`), "utf8")));
    const path2 = claim2?.["resultPath"];
    if (claim2?.["schemaVersion"] !== 1 || typeof path2 !== "string" || !isAbsolute7(path2)) return void 0;
    if (path2.length > MAX_CLAIM_BYTES || basename5(path2) !== "result.json") return void 0;
    const runs = join16(root, "runs");
    if (!within(runs, path2) || lstatSync5(dirname6(path2), { throwIfNoEntry: false })?.isDirectory() !== true) {
      return void 0;
    }
    return within(realpathSync5(runs), realpathSync5(dirname6(path2))) ? path2 : void 0;
  } catch {
    return void 0;
  }
}
function waitingRun(root, cwd, now) {
  try {
    const here = realpathSync5(cwd);
    const directory = join16(root, "agents", "pending");
    return readdirSync3(directory).filter((name) => !name.startsWith(".")).slice(0, 64).some((name) => {
      const marker = record3(JSON.parse(readFileSync11(join16(directory, name), "utf8")));
      const createdAt = marker?.["createdAt"];
      const runCwd = marker?.["cwd"];
      return typeof createdAt === "number" && now - createdAt < PARKING_WINDOW_MS && typeof runCwd === "string" && realpathSync5(runCwd) === here;
    });
  } catch {
    return false;
  }
}
function boundedMessage(message) {
  const bytes = Buffer.from(message, "utf8");
  if (bytes.byteLength <= MAX_MESSAGE_BYTES) return { text: message, truncated: false };
  return { text: bytes.subarray(0, MAX_MESSAGE_BYTES).toString("utf8").replace(/�+$/, ""), truncated: true };
}
function executeDelegationResult(input, now) {
  const fields = record3(input);
  const [sessionId, cwd] = [fields?.["session_id"], fields?.["cwd"]];
  if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId) || typeof cwd !== "string") {
    return skipped("not-a-session");
  }
  const root = machineRootOf(cwd);
  if (root === void 0) return skipped("no-repository");
  let target = claimedPath(root, sessionId);
  const parked = target === void 0;
  if (target === void 0) {
    if (!waitingRun(root, cwd, now)) return skipped("not-delegated");
    target = join16(root, "agents", "parked", `${sessionId}.json`);
  }
  const message = fields?.["last_assistant_message"];
  const { text: text3, truncated } = boundedMessage(typeof message === "string" ? message : "");
  try {
    mkdirSync4(dirname6(target), { recursive: true, mode: 448 });
    const temporary = join16(dirname6(target), `.tmp-${randomUUID()}`);
    const pendingWork = [fields?.["background_tasks"], fields?.["session_crons"]].reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
    writeFileSync3(temporary, JSON.stringify({
      schemaVersion: 1,
      sessionId,
      recordedAt: now,
      lastAssistantMessage: text3,
      truncated,
      pendingWork
    }), { mode: 384, flag: "wx" });
    renameSync4(temporary, target);
  } catch {
    return { status: "degraded", details: { reason: "result-not-written" } };
  }
  return { status: "ok", details: { recorded: true, parked, truncated } };
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { spawnSync as spawnSync5 } from "node:child_process";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import {
  isAbsolute as isAbsolute8,
  relative as relative6,
  resolve as resolve7
} from "node:path";
var FORMATTABLE = /\.(?:ts|tsx|js|jsx|mjs|cjs|json|jsonc|css)$/;
function within2(root, target) {
  const rel = relative6(root, target);
  return rel === "" || !rel.startsWith("..") && !isAbsolute8(rel);
}
function formatCandidates(touchedPaths, projectRoot2) {
  const root = resolve7(projectRoot2);
  const found = /* @__PURE__ */ new Set();
  for (const touchedPath of touchedPaths) {
    const target = resolve7(root, touchedPath);
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
    const result = spawnSync5(biome, ["format", "--write", file], {
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { spawnSync as spawnSync6 } from "node:child_process";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
function parseAddedLines(numstat) {
  return numstat.split(/\r?\n/).reduce((total, line) => {
    const [added] = line.split("	", 1);
    const count = Number(added);
    if (!Number.isSafeInteger(count) || count < 0) return total;
    return Math.min(Number.MAX_SAFE_INTEGER, total + count);
  }, 0);
}
function hasLargeChangeJustification(text3) {
  return /^\s*large-cl-justification\s*:\s*\S.*$/imu.test(text3);
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
  const result = spawnSync6(git3, args, {
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { execFileSync } from "node:child_process";
import {
  existsSync as existsSync6,
  lstatSync as lstatSync6,
  readFileSync as readFileSync12,
  statSync as statSync7
} from "node:fs";
import { basename as basename6, join as join17 } from "node:path";
var PROGRAM_PATHS = [
  join17(".void", "program.md"),
  join17(".void", "active.md"),
  join17("plans", "ACTIVE.md")
];
var CHECKPOINT_PATHS = [
  join17(".void", "machine", "checkpoint.md"),
  join17(".void", "local", "checkpoint.md"),
  join17(".void", "session", "current.md")
];
var MAX_READ_BYTES = 5e5;
var GIT_TIMEOUT_MS = 200;
function readBounded(path2) {
  try {
    const info = lstatSync6(path2);
    if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_READ_BYTES) return void 0;
    return readFileSync12(path2, "utf8");
  } catch {
    return void 0;
  }
}
function frontmatter2(raw) {
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
  const block2 = frontmatter2(raw);
  if (block2 === void 0) return void 0;
  if (!legacy && rootScalar(block2, "schemaVersion") !== "1") return void 0;
  const status2 = rootScalar(block2, "status");
  const program = rootScalar(block2, "program");
  const plan = rootScalar(block2, "plan");
  const spec = rootScalar(block2, "spec");
  if (status2 !== "executing" && status2 !== "completed" || program === void 0 || plan === void 0 || spec === void 0) {
    return void 0;
  }
  const progressBlock = nestedBlock(block2, legacy ? "tracker" : "progress");
  const provider = progressBlock === void 0 ? void 0 : rootScalar(progressBlock, "provider");
  const scope = progressBlock === void 0 ? void 0 : rootScalar(progressBlock, "scope");
  return {
    status: status2,
    program,
    plan,
    spec,
    ...provider === void 0 || scope === void 0 ? {} : { progress: { provider, scope } }
  };
}
function observeProgram(root) {
  const present = PROGRAM_PATHS.filter((relative12) => existsSync6(join17(root, relative12)));
  if (present.length === 0) return { program: void 0 };
  if (present.length > 1) {
    return {
      program: void 0,
      programError: `multiple program descriptors: ${present.join(", ")}`
    };
  }
  const relative11 = present[0];
  if (relative11 === void 0) return { program: void 0 };
  const raw = readBounded(join17(root, relative11));
  const program = raw === void 0 ? void 0 : programFrom(raw, relative11 !== PROGRAM_PATHS[0]);
  return program === void 0 ? { program: void 0, programError: `invalid program descriptor: ${relative11}` } : { program };
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
  for (const relative11 of CHECKPOINT_PATHS) {
    const path2 = join17(root, relative11);
    const raw = readBounded(path2);
    if (raw === void 0) continue;
    try {
      return { checkpoint: parseCheckpoint2(raw), checkpointWrittenAt: statSync7(path2).mtimeMs };
    } catch {
      return { checkpoint: parseCheckpoint2(raw) };
    }
  }
  return {};
}
function observeResume(root, now, options = {}) {
  const checkpoint = checkpointObservation(root);
  const bundle = composeResumeBundle({
    project: { name: basename6(root), path: root },
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { createHash as createHash5 } from "node:crypto";
import {
  lstatSync as lstatSync7,
  mkdirSync as mkdirSync5,
  realpathSync as realpathSync6,
  writeFileSync as writeFileSync4
} from "node:fs";
import { join as join18, relative as relative7 } from "node:path";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
function record5(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function contentText(value) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((item) => {
    if (typeof item === "string") return item;
    const block2 = record5(item);
    return typeof block2?.["text"] === "string" ? block2["text"] : "";
  }).filter((item) => item !== "").join("\n");
}
function responseText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return contentText(value);
  const response = record5(value);
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
  const raw = record5(value);
  if (raw === void 0) return void 0;
  const tool = raw["tool_name"];
  if (typeof tool !== "string" || tool !== "Bash" && tool !== "shell" && !tool.startsWith("mcp__")) {
    return void 0;
  }
  const text3 = responseText(raw["tool_response"]);
  return text3 === "" ? void 0 : { tool, text: text3 };
}
function errorEvidence(text3) {
  return text3.split(/\r?\n/).filter(
    (line) => /error|fail|exception|traceback|fatal|panic|not ok|assert/i.test(line)
  ).join("\n").slice(0, 1500);
}
function planOutputTrim(text3, options) {
  const originalBytes = Buffer.byteLength(text3, "utf8");
  if (originalBytes <= options.thresholdBytes) return void 0;
  const head = text3.slice(0, 3e3);
  const tail = text3.slice(-3e3);
  const errors = errorEvidence(text3);
  const updatedToolOutput = `${head}

[trimmed ${originalBytes} bytes. Full output: ${options.spillPath}]

${tail}

[error-like lines]
${errors}
`;
  return {
    fullOutput: text3,
    originalBytes,
    updatedToolOutput,
    note: `trim-large-output: ${options.tool} result ${originalBytes}B trimmed; full output at ${options.spillPath}`
  };
}

function safeOutputDirectory(root) {
  try {
    const canonicalRoot = realpathSync6(root);
    const directory = voidMachinePath(root, "outputs");
    mkdirSync5(directory, { recursive: true, mode: 448 });
    const info = lstatSync7(directory);
    const canonicalDirectory2 = realpathSync6(directory);
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
  const hash = createHash5("sha256").update(extracted.text).digest("hex").slice(0, 12);
  const tool = extracted.tool.replaceAll(/[^A-Za-z0-9_]/g, "_").slice(0, 80);
  const file = join18(directory, `${tool}-${process.pid}-${Date.now()}-${hash}.log`);
  const spillPath = relative7(realpathSync6(root), file).replaceAll("\\", "/");
  const plan = planOutputTrim(extracted.text, {
    tool: extracted.tool,
    thresholdBytes,
    spillPath
  });
  if (plan === void 0) {
    return { status: "skipped", details: { reason: "below-threshold" } };
  }
  try {
    writeFileSync4(file, plan.fullOutput, {
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { existsSync as existsSync7 } from "node:fs";
import { join as join20 } from "node:path";
import { spawnSync as spawnSync7 } from "node:child_process";

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import {
  dirname as dirname7,
  isAbsolute as isAbsolute9,
  join as join19,
  relative as relative8,
  resolve as resolve8
} from "node:path";
function record6(value) {
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
  const root = record6(value);
  const commands = record6(root?.["commands"]);
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
  const rel = relative8(root, target);
  return rel === "" || !rel.startsWith("..") && !isAbsolute9(rel);
}
function nearestTsconfigs(changedPaths, projectRoot2, hasFile) {
  const root = resolve8(projectRoot2);
  const found = /* @__PURE__ */ new Set();
  for (const changedPath of changedPaths) {
    if (!/\.(?:ts|tsx)$/.test(changedPath) || changedPath.endsWith(".d.ts")) continue;
    const target = resolve8(root, changedPath);
    if (!within3(root, target)) continue;
    let current = dirname7(target);
    while (within3(root, current)) {
      const config2 = join19(current, "tsconfig.json");
      if (hasFile(config2)) {
        found.add(config2);
        break;
      }
      if (current === root) break;
      current = dirname7(current);
    }
  }
  return [...found];
}

function runGit2(root, args, env) {
  const git3 = findExecutable("git", root, env);
  if (git3 === void 0) return { ok: false, output: "" };
  const result = spawnSync7(git3, args, {
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
${untracked.output}`.split(/\r?\n/))].filter((path2) => /\.(?:ts|tsx)$/.test(path2) && !path2.endsWith(".d.ts"));
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
  const configured = configuredTypecheck(readJson(join20(root, ".void", "config.json")));
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
  const invocations = isTsc && configs.length > 0 ? configs.map((config2) => [...args, "-p", config2]) : [args];
  let errors = "";
  for (const invocation of invocations) {
    const result = spawnSync7(executablePath, invocation, {
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { spawnSync as spawnSync8 } from "node:child_process";
import { closeSync as closeSync4, existsSync as existsSync8, lstatSync as lstatSync8, openSync as openSync4, readSync as readSync4, realpathSync as realpathSync7 } from "node:fs";
import { dirname as dirname8, isAbsolute as isAbsolute10, join as join21, resolve as resolve9 } from "node:path";
var GIT_TIMEOUT_MS2 = 5e3;
var GIT_MAX_OUTPUT_BYTES = 1e6;
function canonical2(path2) {
  try {
    return realpathSync7(resolve9(path2));
  } catch {
    return resolve9(path2);
  }
}
function git2(cwd, args, deadline) {
  const remaining = deadline === void 0 ? GIT_TIMEOUT_MS2 : Math.ceil(deadline - performance.now());
  if (remaining <= 0) return void 0;
  const result = spawnSync8("git", args, {
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
  if (expectedCommon !== void 0 && (common === void 0 || canonical2(resolve9(listed, common)) !== expectedCommon)) return void 0;
  return canonical2(toplevel);
}
function holdsInstallReceipt(root) {
  return existsSync8(voidReadPath(root, "receipts", "install-v1.json"));
}
function gitPointer(path2) {
  if (!lstatSync8(path2).isFile()) throw new Error("INVALID_GIT_POINTER");
  const file = openSync4(path2, "r");
  try {
    const bytes = Buffer.alloc(4097);
    const size = readSync4(file, bytes, 0, bytes.length, 0);
    if (size > 4096) throw new Error("INVALID_GIT_POINTER");
    const content = bytes.subarray(0, size);
    const value = content.toString("utf8").replace(/\r?\n$/, "");
    if (content.includes(0) || value === "" || /[\r\n]/.test(value)) {
      throw new Error("INVALID_GIT_POINTER");
    }
    return value;
  } finally {
    closeSync4(file);
  }
}
function ordinaryLinkedMain(tree) {
  const marker = join21(tree, ".git");
  const pointer = gitPointer(marker);
  if (!pointer.startsWith("gitdir: ")) throw new Error("INVALID_GIT_POINTER");
  const directory = canonical2(resolve9(tree, pointer.slice(8)));
  if (!existsSync8(join21(directory, "commondir"))) return void 0;
  const common = canonical2(resolve9(directory, gitPointer(join21(directory, "commondir"))));
  const backlink = gitPointer(join21(directory, "gitdir"));
  if (!isAbsolute10(backlink) || canonical2(backlink) !== canonical2(marker) || canonical2(dirname8(directory)) !== canonical2(join21(common, "worktrees"))) {
    throw new Error("INVALID_GIT_POINTER");
  }
  const candidate = dirname8(common);
  const candidateMarker = join21(candidate, ".git");
  if (!lstatSync8(candidateMarker, { throwIfNoEntry: false })?.isDirectory() || canonical2(candidateMarker) !== common) return void 0;
  return candidate;
}
function resolveTelemetryRoot(cwd, query = git2) {
  const refused2 = { kind: "unavailable", code: "TELEMETRY_ROOT_UNRESOLVED" };
  try {
    let tree = canonical2(cwd);
    while (lstatSync8(join21(tree, ".git"), { throwIfNoEntry: false }) === void 0 && !holdsInstallReceipt(tree)) {
      const parent = dirname8(tree);
      if (parent === tree) {
        return { kind: "resolved", root: canonical2(discoverProjectRoot(cwd)) };
      }
      tree = parent;
    }
    const marker = join21(tree, ".git");
    const markerStat = lstatSync8(marker, { throwIfNoEntry: false });
    if (markerStat?.isSymbolicLink()) return refused2;
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
    if (toplevel === void 0 || canonical2(toplevel) !== tree) return refused2;
    if (directory === void 0 || common === void 0) return refused2;
    const commonDirectory = canonical2(resolve9(tree, common));
    if (canonical2(directory) === commonDirectory) return { kind: "resolved", root: tree };
    const main2 = mainWorkingTree(tree, deadline, commonDirectory, query);
    if (main2 === void 0) return refused2;
    return { kind: "resolved", root: main2 };
  } catch {
    return refused2;
  }
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { createHash as createHash6 } from "node:crypto";
import {
  basename as basename7,
  extname,
  isAbsolute as isAbsolute11,
  relative as relative9,
  resolve as resolve10
} from "node:path";
var MISSION_ID = /^mis_[A-Za-z0-9_-]{8,100}$/;
function record7(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function text2(value, fallback = "") {
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
  return text2(
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
    return text2(input["skill"] ?? input["name"], "unknown");
  }
  if (category === "agent") {
    return text2(
      input["subagent_type"] ?? input["agent_type"] ?? input["agent"],
      tool === "Agent" ? "claude" : "unknown"
    );
  }
  if (category === "workflow") {
    const explicit = text2(input["name"]);
    if (explicit !== "") return explicit;
    const script = text2(input["scriptPath"]);
    return script === "" || script.endsWith("/") ? "inline" : basename7(script).replace(/(?:\.workflow)?\.js$/, "") || "inline";
  }
  return tool || "unknown";
}
function safePaths(input, root) {
  const absoluteRoot = resolve10(root);
  const candidates = [
    input["file_path"],
    input["path"],
    input["pattern"]
  ];
  const paths = [];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.length > 2e3) continue;
    if (!isAbsolute11(candidate)) {
      if (!candidate.startsWith("..")) paths.push(candidate.slice(0, 500));
      continue;
    }
    const rel = relative9(absoluteRoot, resolve10(candidate));
    if (rel !== "" && !rel.startsWith("..") && !isAbsolute11(rel)) {
      paths.push(rel.slice(0, 500));
    }
  }
  return paths;
}
function outcomeStatus(raw) {
  const response = record7(raw["tool_response"]);
  if (response === void 0) return "unknown";
  if (response["success"] === false || response["is_error"] === true || response["error"] !== void 0) {
    return "error";
  }
  return "ok";
}
function adaptRuntimeInput(value, options) {
  const raw = record7(value);
  if (raw === void 0) return void 0;
  const runtimeSessionId2 = runtimeSession(raw);
  if (options.phase === "stop" || text2(raw["hook_event_name"]) === "Stop") {
    return {
      runtimeSessionId: runtimeSessionId2,
      source: `runtime:${options.runtime}`,
      kind: "runtime.session.stopped",
      subject: `runtime:${options.runtime}`,
      payload: {}
    };
  }
  const tool = text2(raw["tool_name"], "unknown");
  const input = record7(raw["tool_input"]) ?? {};
  const category = categoryFor(tool);
  const name = nameFor(tool, category, input);
  const fileGlobs = safePaths(input, options.root);
  const extensions = fileGlobs.map((path2) => extname(path2).slice(1)).filter((extension) => extension !== "");
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
  const opaque = createHash6("sha256").update(`${runtime3}\0${runtimeSessionId2 || "unknown"}\0${resolve10(root)}`).digest("hex").slice(0, 32);
  return `mis_${opaque}`;
}

init_define_VOID_SYNTAX_WORKER_IDENTITY();
import { randomUUID as nodeRandomUUID } from "node:crypto";
import {
  constants as constants5
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
  dirname as dirname9,
  isAbsolute as isAbsolute12,
  join as join22,
  relative as relative10,
  resolve as resolve11
} from "node:path";

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();

init_define_VOID_SYNTAX_WORKER_IDENTITY();
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
function record8(value) {
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
  const object3 = record8(value);
  if (object3 === void 0) return false;
  return Object.entries(object3).every(
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
  const raw = record8(value);
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
  const required2 = {
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
      ...required2,
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();
function replayEventLog(text3) {
  const events = [];
  const eventIds = /* @__PURE__ */ new Set();
  const sequences = /* @__PURE__ */ new Set();
  const issues = [];
  let lastSeq = 0;
  let continuity = "empty";
  let duplicateEventIds = 0;
  let invalidLines = 0;
  const lines = text3.split("\n");
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

init_define_VOID_SYNTAX_WORKER_IDENTITY();

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
  const rel = relative10(root, target);
  return rel === "" || !rel.startsWith("..") && !isAbsolute12(rel);
}
async function exists(path2) {
  try {
    await lstat(path2);
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
  const absoluteRoot = resolve11(root);
  const canonicalRoot = await realpath(absoluteRoot);
  const run = voidReadPath(absoluteRoot, "runs", missionId);
  let ancestor = run;
  while (!await exists(ancestor)) {
    const parent = dirname9(ancestor);
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
async function rejectSymlink(path2) {
  try {
    const info = await lstat(path2);
    if (info.isSymbolicLink() || !info.isFile()) {
      throw new Error(`HOOK_UNSAFE_FILE: ${path2} must be a regular file`);
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
async function acquireLock2(path2, staleMs, attempts) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const token = nodeRandomUUID();
    try {
      const handle = await open(path2, "wx", 384);
      try {
        await handle.writeFile(
          JSON.stringify({ token, pid: process.pid, acquiredAt: Date.now() }),
          "utf8"
        );
      } finally {
        await handle.close();
      }
      return { path: path2, token };
    } catch (error) {
      if (code(error) !== "EEXIST") throw error;
      const info = await lstat(path2).catch((statError) => {
        if (code(statError) === "ENOENT") return void 0;
        throw statError;
      });
      if (info === void 0) continue;
      if (info.isSymbolicLink() || !info.isFile()) {
        throw new Error("HOOK_UNSAFE_LOCK: lock must be a regular file");
      }
      if (Date.now() - info.mtimeMs > staleMs) {
        await unlink(path2).catch((unlinkError) => {
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
    constants5.O_APPEND | constants5.O_WRONLY | (constants5.O_NOFOLLOW ?? 0)
  );
  try {
    await append.writeFile("\n", "utf8");
  } finally {
    await append.close();
  }
  return logBytes + 1;
}
async function appendLine(logPath, line) {
  const flags = constants5.O_APPEND | constants5.O_CREAT | constants5.O_WRONLY | (constants5.O_NOFOLLOW ?? 0);
  const handle = await open(logPath, flags, 384);
  try {
    await handle.writeFile(`${line}
`, "utf8");
    return (await handle.stat()).size;
  } finally {
    await handle.close();
  }
}
async function writeSequenceState(statePath, state, randomUUID2) {
  const temporary = `${statePath}.${randomUUID2()}.tmp`;
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
  const logPath = join22(run, "events.jsonl");
  const statePath = join22(run, ".seq.state");
  const lockPath = join22(run, ".seq.lock");
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
  const randomUUID2 = options.randomUUID ?? nodeRandomUUID;
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
      eventId: options.eventId ?? `evt_${randomUUID2()}`,
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
      randomUUID2
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
function verdictMessage(rule, verdict) {
  const evidence = verdict.evidence.length === 0 ? "" : `
${verdict.evidence.map((item) => `- ${item}`).join("\n")}`;
  return `${verdict.code}: ${withGoverningSkill(rule, verdict.message)}${evidence}
`;
}
function refuse(agentRuntime, reason) {
  if (agentRuntime !== "codex") {
    process.stderr.write(reason);
    process.exitCode = 2;
    return;
  }
  const denial = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason.trimEnd()
    }
  }).replace(
    /[\u007f-\uffff]/g,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
  process.stdout.write(`${denial}
`);
  process.exitCode = 0;
}
function enforcementRuntime() {
  return process.argv[2] === "enforce" ? runtime2(process.argv[4] ?? process.env["VOID_AGENT_RUNTIME"]) : "unknown";
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
  if (hook === "herdr-session") {
    const execution2 = executeHerdrSession(input, process.env, agentRuntime);
    if (execution2.diagnostic !== void 0) process.stderr.write(execution2.diagnostic);
    if (execution2.output !== void 0) process.stdout.write(execution2.output);
    return;
  }
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
    const cached2 = readFreshnessCache(process.env, Date.now());
    const notice = cached2 === void 0 ? void 0 : freshnessRelay(compareFreshness(install.version, cached2.latest), install.source);
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
  const execution = hook === "format" ? executeFormat(rawInput, root, process.env) : hook === "trim" ? executeTrim(rawInput, root, process.env) : hook === "typecheck" ? executeTypecheck(root, process.env) : hook === "large-change" ? executeLargeChange(root, process.env) : hook === "delegation-result" ? executeDelegationResult(rawInput, Date.now()) : hook === "herdr-metadata" ? executeHerdrMetadata(rawInput, root, process.env, agentRuntime) : void 0;
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
    if (verdict.allow) {
      if (verdict.code !== "ALLOW" && verdict.code !== "OVERRIDE") {
        process.stderr.write(verdictMessage(rule, verdict));
      }
      return;
    }
    refuse(enforcementRuntime(), verdictMessage(rule, verdict));
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ENFORCEMENT_ERROR";
    refuse(enforcementRuntime(), `HOOK_INPUT_REJECTED: ${message}
`);
  }
}
main().catch((error) => {
  const message = error instanceof Error ? error.message : "UNKNOWN_ENFORCEMENT_ERROR";
  if (process.argv[2] === "enforce" || process.argv[2] === "enforce-ci") {
    refuse(enforcementRuntime(), `HOOK_RUNNER_FAILED: ${message}
`);
    return;
  }
  process.stderr.write(`HOOK_RUNNER_FAILED: ${message}
`);
  process.exitCode = 0;
});
