// A small PDF text extractor for the wage monitor, with no dependencies.
//
// It reads the text layer only: plain and compressed objects (including
// PDF 1.5 object streams), Flate-encoded content streams, and fonts with a
// ToUnicode map (how Devanagari text is usually stored). It does not do OCR,
// so a scanned order with no text layer yields no text; the monitor still
// compares the file's bytes and page count. Good enough to show what changed
// in a notification, not a general-purpose PDF reader.
import { inflateSync, constants } from "node:zlib";

const WS = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const DELIM = new Set([...'()<>[]{}/%'].map((c) => c.charCodeAt(0)));

/** A reference to an indirect object, `12 0 R`. */
class Ref {
  constructor(num) {
    this.num = num;
  }
}

/** A PDF name, `/Font`, kept apart from strings. */
class Name {
  constructor(value) {
    this.value = value;
  }
}

/**
 * Tokenises and parses PDF object syntax from a latin1 string (one char per
 * byte). Used for object dictionaries and for content streams.
 */
class Lexer {
  constructor(src, pos = 0) {
    this.src = src;
    this.pos = pos;
  }

  skipSpace() {
    const { src } = this;
    while (this.pos < src.length) {
      const c = src.charCodeAt(this.pos);
      if (WS.has(c)) this.pos++;
      else if (c === 0x25 /* % */) {
        while (this.pos < src.length && src[this.pos] !== "\n" && src[this.pos] !== "\r") this.pos++;
      } else break;
    }
  }

  /** The next token: { type, value }, or null at the end. */
  next() {
    this.skipSpace();
    const { src } = this;
    if (this.pos >= src.length) return null;
    const ch = src[this.pos];
    if (ch === "(") return { type: "string", value: this.literalString() };
    if (ch === "<" && src[this.pos + 1] === "<") {
      this.pos += 2;
      return { type: "dict-start" };
    }
    if (ch === ">" && src[this.pos + 1] === ">") {
      this.pos += 2;
      return { type: "dict-end" };
    }
    if (ch === "<") return { type: "string", value: this.hexString() };
    if (ch === "[" || ch === "]" || ch === "{" || ch === "}") {
      this.pos++;
      return { type: ch };
    }
    if (ch === "/") {
      this.pos++;
      const start = this.pos;
      while (this.pos < src.length && !WS.has(src.charCodeAt(this.pos)) && !DELIM.has(src.charCodeAt(this.pos))) this.pos++;
      return { type: "name", value: src.slice(start, this.pos).replace(/#([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) };
    }
    const start = this.pos;
    while (this.pos < src.length && !WS.has(src.charCodeAt(this.pos)) && !DELIM.has(src.charCodeAt(this.pos))) this.pos++;
    if (this.pos === start) {
      this.pos++; // a stray delimiter such as ")" or ">"
      return this.next();
    }
    const word = src.slice(start, this.pos);
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(word)) return { type: "number", value: Number(word) };
    return { type: "word", value: word };
  }

  literalString() {
    const { src } = this;
    this.pos++; // (
    let depth = 1;
    let out = "";
    while (this.pos < src.length) {
      const ch = src[this.pos++];
      if (ch === "\\") {
        const n = src[this.pos++];
        if (n === undefined) break;
        if (n === "n") out += "\n";
        else if (n === "r") out += "\r";
        else if (n === "t") out += "\t";
        else if (n === "b") out += "\b";
        else if (n === "f") out += "\f";
        else if (n === "\r") {
          if (src[this.pos] === "\n") this.pos++;
        } else if (n === "\n") {
          // line continuation
        } else if (/[0-7]/.test(n)) {
          let oct = n;
          while (oct.length < 3 && /[0-7]/.test(src[this.pos])) oct += src[this.pos++];
          out += String.fromCharCode(parseInt(oct, 8) & 0xff);
        } else out += n;
      } else if (ch === "(") {
        depth++;
        out += ch;
      } else if (ch === ")") {
        if (--depth === 0) break;
        out += ch;
      } else out += ch;
    }
    return out;
  }

  hexString() {
    const { src } = this;
    this.pos++; // <
    const end = src.indexOf(">", this.pos);
    const stop = end === -1 ? src.length : end;
    let hex = src.slice(this.pos, stop).replace(/[^0-9a-fA-F]/g, "");
    this.pos = stop + 1;
    if (hex.length % 2) hex += "0";
    let out = "";
    for (let i = 0; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    return out;
  }

  /** Parses one object (dict, array, ref, name, string, number, word). */
  parse() {
    const token = this.next();
    return token ? this.fromToken(token) : undefined;
  }

  fromToken(token) {
    switch (token.type) {
      case "dict-start": {
        const dict = {};
        for (;;) {
          const key = this.next();
          if (!key || key.type === "dict-end") return dict;
          if (key.type !== "name") continue;
          const value = this.parse();
          dict[key.value] = value;
        }
      }
      case "[": {
        const items = [];
        for (;;) {
          const t = this.next();
          if (!t || t.type === "]") return items;
          items.push(this.fromToken(t));
        }
      }
      case "number": {
        // `12 0 R` is a reference.
        const save = this.pos;
        const gen = this.next();
        if (gen?.type === "number") {
          const r = this.next();
          if (r?.type === "word" && r.value === "R") return new Ref(token.value);
        }
        this.pos = save;
        return token.value;
      }
      case "name":
        return new Name(token.value);
      case "string":
        return token.value;
      case "word":
        return token.value === "true" ? true : token.value === "false" ? false : token.value === "null" ? null : token.value;
      default:
        return undefined;
    }
  }
}

function inflate(buffer) {
  try {
    return inflateSync(buffer, { finishFlush: constants.Z_SYNC_FLUSH });
  } catch {
    return null;
  }
}

const nameOf = (v) => (v instanceof Name ? v.value : undefined);
const filters = (dict) => {
  const f = dict.Filter;
  return (Array.isArray(f) ? f : f ? [f] : []).map(nameOf);
};

/** Reads every object in the file, later definitions (incremental updates) winning. */
function readObjects(buffer) {
  const src = buffer.toString("latin1");
  const objects = new Map();
  const header = /(\d+)\s+(\d+)\s+obj\b/g;
  let match;
  while ((match = header.exec(src))) {
    const num = Number(match[1]);
    const lexer = new Lexer(src, header.lastIndex);
    let value;
    try {
      value = lexer.parse();
    } catch {
      continue;
    }
    const entry = { value };
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Name) && !(value instanceof Ref)) {
      lexer.skipSpace();
      if (src.startsWith("stream", lexer.pos)) {
        let start = lexer.pos + 6;
        if (src[start] === "\r") start++;
        if (src[start] === "\n") start++;
        const length = typeof value.Length === "number" ? value.Length : -1;
        let end = length >= 0 && src.startsWith("endstream", skipWs(src, start + length)) ? start + length : src.indexOf("endstream", start);
        if (end === -1) end = src.length;
        entry.raw = buffer.subarray(start, end);
        header.lastIndex = end;
      }
    }
    objects.set(num, entry);
  }

  // Objects packed inside object streams (PDF 1.5+).
  for (const [, entry] of [...objects]) {
    if (nameOf(entry.value?.Type) !== "ObjStm" || !entry.raw) continue;
    const data = decodeStream(entry, objects);
    if (!data) continue;
    const text = data.toString("latin1");
    const n = entry.value.N ?? 0;
    const first = entry.value.First ?? 0;
    const head = text.slice(0, first).trim().split(/\s+/).map(Number);
    for (let i = 0; i < n; i++) {
      const num = head[i * 2];
      const offset = head[i * 2 + 1];
      if (!Number.isFinite(num) || objects.has(num)) continue;
      try {
        objects.set(num, { value: new Lexer(text, first + offset).parse() });
      } catch {
        // skip a malformed member
      }
    }
  }
  return objects;
}

function skipWs(src, pos) {
  while (pos < src.length && WS.has(src.charCodeAt(pos))) pos++;
  return pos;
}

function decodeStream(entry, objects) {
  if (!entry.raw) return null;
  if (entry.decoded !== undefined) return entry.decoded;
  let data = entry.raw;
  // A Length given as a reference: trim to it now that we can resolve it.
  const len = entry.value.Length instanceof Ref ? objects.get(entry.value.Length.num)?.value : undefined;
  if (typeof len === "number" && len <= data.length) data = data.subarray(0, len);
  for (const f of filters(entry.value)) {
    if (f === "FlateDecode" || f === "Fl") data = inflate(data);
    else data = null; // images and other filters carry no text
    if (!data) break;
  }
  entry.decoded = data;
  return data;
}

/** Parses a ToUnicode CMap into { widths, map }. */
export function parseCMap(text) {
  const map = new Map();
  const widths = new Set();
  const hexToStr = (hex) => {
    let out = "";
    for (let i = 0; i + 4 <= hex.length; i += 4) out += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16));
    if (hex.length % 4 === 2) out += String.fromCharCode(parseInt(hex.slice(-2), 16));
    return out;
  };
  for (const block of text.matchAll(/begincodespacerange([\s\S]*?)endcodespacerange/g)) {
    for (const m of block[1].matchAll(/<([0-9a-fA-F]+)>\s*<[0-9a-fA-F]+>/g)) widths.add(m[1].length / 2);
  }
  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const m of block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g)) {
      map.set(parseInt(m[1], 16), hexToStr(m[2]));
      widths.add(m[1].length / 2);
    }
  }
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const m of block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<[0-9a-fA-F]*>|\[[^\]]*\])/g)) {
      const lo = parseInt(m[1], 16);
      const hi = parseInt(m[2], 16);
      widths.add(m[1].length / 2);
      if (m[3].startsWith("[")) {
        const items = [...m[3].matchAll(/<([0-9a-fA-F]*)>/g)].map((x) => x[1]);
        for (let c = lo; c <= hi && c - lo < items.length; c++) map.set(c, hexToStr(items[c - lo]));
      } else {
        const base = m[3].slice(1, -1);
        const last = parseInt(base.slice(-4) || "0", 16);
        const prefix = hexToStr(base.slice(0, -4));
        for (let c = lo; c <= hi && c - lo < 65536; c++) map.set(c, prefix + String.fromCharCode(last + (c - lo)));
      }
    }
  }
  return { width: widths.has(2) && !widths.has(1) ? 2 : widths.has(1) ? 1 : 2, map };
}

function decodeText(bytes, font) {
  if (font?.cmap) {
    const { width, map } = font.cmap;
    let out = "";
    for (let i = 0; i + width <= bytes.length; i += width) {
      const code = width === 2 ? (bytes.charCodeAt(i) << 8) | bytes.charCodeAt(i + 1) : bytes.charCodeAt(i);
      out += map.get(code) ?? "";
    }
    return out;
  }
  if (font?.twoByte) return ""; // glyph ids with no map: not readable text
  // Simple fonts: treat the bytes as Latin-1 (close enough to WinAnsi for words and figures).
  return bytes.replace(/[^\x20-\x7e\xa0-\xff]/g, "");
}

/**
 * Extracts the text of a PDF, page by page. Returns { pages, text } where
 * text has one line per text line found; empty for a scan with no text layer.
 */
export function extractPdfText(buffer) {
  const objects = readObjects(buffer);
  const get = (v) => (v instanceof Ref ? objects.get(v.num)?.value : v);

  const fontCache = new Map();
  const fontInfo = (ref) => {
    const key = ref instanceof Ref ? ref.num : null;
    if (key !== null && fontCache.has(key)) return fontCache.get(key);
    const dict = get(ref) ?? {};
    const info = { twoByte: nameOf(dict.Subtype) === "Type0" };
    if (dict.ToUnicode instanceof Ref) {
      const entry = objects.get(dict.ToUnicode.num);
      const data = entry && decodeStream(entry, objects);
      if (data) info.cmap = parseCMap(data.toString("latin1"));
    }
    if (key !== null) fontCache.set(key, info);
    return info;
  };

  // Pages in reading order, from the page tree when it can be found.
  const pages = [];
  const seen = new Set();
  const walk = (ref, inherited) => {
    if (!(ref instanceof Ref) || seen.has(ref.num)) return;
    seen.add(ref.num);
    const node = get(ref);
    if (!node || typeof node !== "object") return;
    const resources = node.Resources ?? inherited;
    if (nameOf(node.Type) === "Pages" || Array.isArray(node.Kids)) {
      for (const kid of get(node.Kids) ?? []) walk(kid, resources);
    } else pages.push({ node, resources });
  };
  const catalog = [...objects.values()].map((e) => e.value).find((v) => nameOf(v?.Type) === "Catalog");
  if (catalog?.Pages) walk(catalog.Pages, undefined);
  if (!pages.length) {
    for (const [num, entry] of objects) if (nameOf(entry.value?.Type) === "Page") walk(new Ref(num), undefined);
  }

  const lines = [];
  for (const { node, resources } of pages) {
    const fontDict = get(get(resources)?.Font) ?? {};
    const contents = get(node.Contents);
    const parts = (Array.isArray(contents) ? contents : [node.Contents]).filter((r) => r instanceof Ref);
    const chunks = parts.map((r) => objects.get(r.num)).map((e) => (e ? decodeStream(e, objects) : null)).filter(Boolean);
    if (!chunks.length) continue;
    const pageText = runContent(Buffer.concat(chunks).toString("latin1"), (name) => fontInfo(fontDict[name]));
    lines.push(...pageText);
  }
  return { pages: pages.length, text: normaliseLines(lines.join("\n")) };
}

/**
 * Interprets a content stream's text operators into lines of text. Lines
 * break where the baseline moves; a word space goes in where the next glyph
 * starts well past the last one (OCR layers place each word on its own,
 * printed PDFs place each glyph); text drawn again over itself (fake bold)
 * is dropped.
 */
function runContent(src, fontFor) {
  const lexer = new Lexer(src);
  const lines = [];
  let line = "";
  let font = null;
  let size = 10;
  let leading = 0;
  let operands = [];
  // The text line matrix [a b c d e f]: where the next glyph starts.
  let lm = [1, 0, 0, 1, 0, 0];
  let lineY = null;
  let maxX = -Infinity;
  const breakLine = () => {
    if (line.trim() && line !== lines.at(-1)) lines.push(line);
    line = "";
  };
  const translate = (tx, ty) => [lm[0], lm[1], lm[2], lm[3], lm[4] + tx * lm[0] + ty * lm[2], lm[5] + tx * lm[1] + ty * lm[3]];
  const show = (text) => {
    const em = size * (Math.hypot(lm[2], lm[3]) || 1);
    const [x, y] = [lm[4], lm[5]];
    if (lineY === null || Math.abs(y - lineY) > Math.max(1, em * 0.5)) {
      breakLine();
      lineY = y;
      maxX = -Infinity;
    } else if (x < maxX - 0.01) {
      return; // drawn again over earlier glyphs
    } else if (x - maxX > em * 1.2 && line && !line.endsWith(" ")) {
      line += " ";
    }
    maxX = x;
    line += text;
  };
  for (;;) {
    const token = lexer.next();
    if (!token) break;
    if (token.type !== "word") {
      operands.push(lexer.fromToken(token));
      continue;
    }
    const op = token.value;
    switch (op) {
      case "Tf":
        font = fontFor(nameOf(operands[0]));
        if (typeof operands[1] === "number") size = Math.abs(operands[1]) || size;
        break;
      case "TL":
        if (typeof operands[0] === "number") leading = operands[0];
        break;
      case "BT":
        lm = [1, 0, 0, 1, 0, 0];
        break;
      case "Tm":
        if (operands.length >= 6) lm = operands.slice(0, 6).map(Number);
        break;
      case "Td":
      case "TD": {
        const [tx = 0, ty = 0] = operands.map(Number);
        if (op === "TD") leading = -ty;
        lm = translate(tx, ty);
        break;
      }
      case "T*":
        lm = translate(0, -leading);
        break;
      case "Tj":
        show(decodeText(String(operands[0] ?? ""), font));
        break;
      case "'":
      case '"':
        lm = translate(0, -leading);
        show(decodeText(String(operands.at(-1) ?? ""), font));
        break;
      case "TJ": {
        let text = "";
        for (const item of Array.isArray(operands[0]) ? operands[0] : []) {
          if (typeof item === "string") text += decodeText(item, font);
          else if (typeof item === "number" && item < -200) text += " ";
        }
        show(text);
        break;
      }
      case "BI": {
        // Inline image: skip its binary data up to EI.
        const end = src.indexOf("EI", src.indexOf("ID", lexer.pos));
        lexer.pos = end === -1 ? src.length : end + 2;
        break;
      }
      default:
        break;
    }
    operands = [];
  }
  breakLine();
  return lines;
}

/**
 * Normalises extracted text for comparison: Unicode NFC, collapsed spaces,
 * trimmed lines, no blank lines.
 */
export function normaliseLines(text) {
  return text
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[\s ​]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
