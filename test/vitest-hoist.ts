const kept = /^import\s+type\s|from\s*["']vitest["']/;

function skipString(src: string, i: number): number {
  const quote = src[i];
  for (let j = i + 1; j < src.length; j++) {
    if (src[j] === "\\") j++;
    else if (src[j] === quote) return j;
  }
  return src.length;
}

function closeParen(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") i = skipString(src, i);
    else if (c === "/" && src[i + 1] === "/") i = src.indexOf("\n", i);
    else if (c === "(") depth++;
    else if (c === ")" && --depth === 0) return i;
  }
  throw new Error("vitest-hoist: unbalanced parentheses");
}

function dynamicImport(statement: string): string {
  const match = /^import\s+([\s\S]*?)\s+from\s*(["'][^"']+["'])/.exec(statement);
  if (!match) return `await import(${/["'][^"']+["']/.exec(statement)?.[0]});`;
  const [, clause = "", source] = match;
  const namespace = /^\*\s+as\s+(\w+)$/.exec(clause.trim());
  if (namespace) return `const ${namespace[1]} = await import(${source});`;
  const parts: string[] = [];
  const named = /\{([\s\S]*)\}/.exec(clause);
  const defaultName = clause
    .replace(/\{[\s\S]*\}/, "")
    .replace(/,/g, "")
    .trim();
  if (defaultName) parts.push(`default: ${defaultName}`);
  for (const raw of named?.[1]?.split(",") ?? []) {
    const spec = raw.trim();
    if (!spec || spec.startsWith("type ")) continue;
    const [name, alias] = spec.split(/\s+as\s+/);
    parts.push(alias ? `${name}: ${alias}` : `${name}`);
  }
  return `const { ${parts.join(", ")} } = await import(${source});`;
}

export function hoistMocks(src: string): string {
  if (!/^vi\.mock\(/m.test(src)) return src;
  const staticImports: string[] = [];
  const hoisted: string[] = [];
  const imports: string[] = [];
  let body = "";
  let i = 0;
  while (i < src.length) {
    const lineEnd = src.indexOf("\n", i) === -1 ? src.length : src.indexOf("\n", i);
    const line = src.slice(i, lineEnd);
    const importMatch = /^import[\s{"'*]/.test(line)
      ? /^import[\s\S]*?["'][^"']+["'];?/.exec(src.slice(i))
      : null;
    const hoistMatch = /^(vi\.mock\(|(const|let)\s[^=]+=\s*vi\.hoisted\()/.exec(line);
    if (importMatch) {
      const statement = importMatch[0];
      (kept.test(statement) ? staticImports : imports).push(
        kept.test(statement) ? statement : dynamicImport(statement),
      );
      i += statement.length;
    } else if (hoistMatch) {
      const open = i + hoistMatch[0].length - 1;
      let end = closeParen(src, open) + 1;
      if (src[end] === ";") end++;
      const statement = src.slice(i, end);
      hoisted.push(
        statement.startsWith("vi.mock(")
          ? `await __vitestMock(import.meta.dir, ${statement.slice("vi.mock(".length)}`
          : statement,
      );
      i = end;
    } else {
      body += `${line}\n`;
      i = lineEnd + 1;
    }
  }
  return [...staticImports, ...hoisted, ...imports, body].join("\n");
}
