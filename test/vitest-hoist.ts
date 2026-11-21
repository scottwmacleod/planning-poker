const KEPT_IMPORT = /^import\s+type\s|from\s*["']vitest["']/u;
const QUOTES = new Set(['"', "'", "`"]);

function skipString(src: string, start: number): number {
  const quote = src[start];
  let index = start + 1;
  while (index < src.length && src[index] !== quote) {
    index += src[index] === "\\" ? 2 : 1;
  }
  return index;
}

function closeParen(src: string, open: number): number {
  let depth = 0;
  for (let index = open; index < src.length; index += 1) {
    const char = src[index] ?? "";
    if (QUOTES.has(char)) {
      index = skipString(src, index);
    } else if (char === "/" && src[index + 1] === "/") {
      index = src.indexOf("\n", index);
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error("vitest-hoist: unbalanced parentheses");
}

function bindingFor(spec: string): string | undefined {
  const trimmed = spec.trim();
  if (trimmed === "" || trimmed.startsWith("type ")) return undefined;
  const parts = /^(?<name>\w+)(?:\s+as\s+(?<alias>\w+))?$/u.exec(trimmed)?.groups;
  if (parts?.name === undefined) throw new Error(`vitest-hoist: can't read import "${trimmed}"`);
  return parts.alias === undefined ? parts.name : `${parts.name}: ${parts.alias}`;
}

function dynamicImport(statement: string): string {
  const parsed = /^import\s+(?<clause>[\s\S]*?)\s+from\s*(?<source>["'][^"']+["'])/u.exec(
    statement,
  )?.groups;
  if (parsed?.source === undefined) {
    const bare = /(?<source>["'][^"']+["'])/u.exec(statement)?.groups?.source ?? "";
    return `await import(${bare});`;
  }
  const clause = (parsed.clause ?? "").trim();
  const namespace = /^\*\s+as\s+(?<name>\w+)$/u.exec(clause)?.groups?.name;
  if (namespace !== undefined) return `const ${namespace} = await import(${parsed.source});`;
  const named = /\{(?<list>[\s\S]*)\}/u.exec(clause)?.groups?.list ?? "";
  const defaultName = clause
    .replace(/\{[\s\S]*\}/u, "")
    .replaceAll(",", "")
    .trim();
  const bindings = named
    .split(",")
    .map((spec) => bindingFor(spec))
    .filter((binding) => binding !== undefined);
  if (defaultName !== "") bindings.unshift(`default: ${defaultName}`);
  return `const { ${bindings.join(", ")} } = await import(${parsed.source});`;
}

function hoistedStatement(statement: string): string {
  return statement.startsWith("vi.mock(")
    ? `await __vitestMock(import.meta.dir, ${statement.slice("vi.mock(".length)}`
    : statement;
}

export function hoistMocks(src: string): string {
  if (!/^vi\.mock\(/mu.test(src)) return src;
  const staticImports: string[] = [];
  const hoisted: string[] = [];
  const imports: string[] = [];
  const body: string[] = [];
  let index = 0;
  while (index < src.length) {
    const newline = src.indexOf("\n", index);
    const lineEnd = newline === -1 ? src.length : newline;
    const line = src.slice(index, lineEnd);
    const statement = /^import[\s{"'*]/u.test(line)
      ? /^import[\s\S]*?["'][^"']+["'];?/u.exec(src.slice(index))?.[0]
      : undefined;
    const hoist = /^(?:vi\.mock\(|(?:const|let)\s[^=]+=\s*vi\.hoisted\()/u.exec(line)?.[0];
    if (statement !== undefined) {
      if (KEPT_IMPORT.test(statement)) staticImports.push(statement);
      else imports.push(dynamicImport(statement));
      index += statement.length;
    } else if (hoist === undefined) {
      body.push(line);
      index = lineEnd + 1;
    } else {
      let end = closeParen(src, index + hoist.length - 1) + 1;
      if (src[end] === ";") end += 1;
      hoisted.push(hoistedStatement(src.slice(index, end)));
      index = end;
    }
  }
  return [...staticImports, ...hoisted, ...imports, body.join("\n")].join("\n");
}
