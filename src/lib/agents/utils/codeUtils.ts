/**
 * Utility functions for code manipulation
 */

/**
 * Extract component name from file path
 */
export function getComponentNameFromPath(path: string): string {
  const fileName = path.split("/").pop() || "";
  const baseName = fileName.replace(/\.(tsx?|jsx?)$/, "");
  // Convert to PascalCase
  return baseName
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Check if a file is a React component
 */
export function isReactComponent(path: string): boolean {
  return /\.(tsx|jsx)$/.test(path) && !path.includes(".test.");
}

/**
 * Check if a file is a page component
 */
export function isPageComponent(path: string): boolean {
  return path.includes("/app/") && path.endsWith("page.tsx");
}

/**
 * Check if a file is a layout component
 */
export function isLayoutComponent(path: string): boolean {
  return path.includes("/app/") && path.endsWith("layout.tsx");
}

/**
 * Get the route path from a page file path
 */
export function getRouteFromPagePath(pagePath: string): string {
  // src/app/about/page.tsx -> /about
  // src/app/blog/[slug]/page.tsx -> /blog/[slug]
  const match = pagePath.match(/src\/app(.*)\/page\.tsx$/);
  if (!match) return "/";
  const route = match[1] || "/";
  return route === "" ? "/" : route;
}

/**
 * Generate a valid file path for a new component
 */
export function generateComponentPath(name: string): string {
  // Convert to PascalCase for the file name
  const fileName = name
    .split(/[-_\s]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
  return `src/components/${fileName}.tsx`;
}

/**
 * Generate a valid file path for a new page
 */
export function generatePagePath(routeName: string): string {
  // Convert to lowercase kebab-case for the route
  const route = routeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `src/app/${route}/page.tsx`;
}

/**
 * Extract imports from TypeScript/JavaScript code
 */
export function extractImports(code: string): string[] {
  const importRegex = /^import\s+.*?from\s+['"](.+?)['"];?\s*$/gm;
  const imports: string[] = [];
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

/**
 * Check if code uses client-side features
 */
export function needsUseClient(code: string): boolean {
  const clientPatterns = [
    /useState/,
    /useEffect/,
    /useRef/,
    /useCallback/,
    /useMemo/,
    /useReducer/,
    /useContext/,
    /onClick/,
    /onChange/,
    /onSubmit/,
    /addEventListener/,
    /window\./,
    /document\./,
  ];
  return clientPatterns.some((pattern) => pattern.test(code));
}

/**
 * Add "use client" directive if needed
 */
export function ensureUseClient(code: string): string {
  if (needsUseClient(code) && !code.includes('"use client"')) {
    return `"use client";\n\n${code}`;
  }
  return code;
}

/**
 * Format component code (basic formatting)
 */
export function formatCode(code: string): string {
  // Remove excessive blank lines
  let formatted = code.replace(/\n{3,}/g, "\n\n");
  // Ensure file ends with newline
  if (!formatted.endsWith("\n")) {
    formatted += "\n";
  }
  return formatted;
}

/**
 * Validate that code is syntactically valid TypeScript/JSX
 * This is a basic check - real validation would use the TypeScript compiler
 */
export function isValidCode(code: string): { valid: boolean; error?: string } {
  // Check for balanced braces
  const braces = { "{": 0, "(": 0, "[": 0, "<": 0 };
  const closers: Record<string, keyof typeof braces> = {
    "}": "{",
    ")": "(",
    "]": "[",
    ">": "<",
  };

  let inString = false;
  let stringChar = "";
  let inTemplate = false;
  let inComment = false;
  let inMultilineComment = false;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1];
    const prevChar = code[i - 1];

    // Handle comments
    if (!inString && !inTemplate) {
      if (char === "/" && nextChar === "/") {
        inComment = true;
        continue;
      }
      if (char === "/" && nextChar === "*") {
        inMultilineComment = true;
        continue;
      }
      if (char === "*" && nextChar === "/" && inMultilineComment) {
        inMultilineComment = false;
        i++;
        continue;
      }
      if (char === "\n" && inComment) {
        inComment = false;
        continue;
      }
    }

    if (inComment || inMultilineComment) continue;

    // Handle strings
    if ((char === '"' || char === "'" || char === "`") && prevChar !== "\\") {
      if (!inString && !inTemplate) {
        if (char === "`") {
          inTemplate = true;
        } else {
          inString = true;
          stringChar = char;
        }
      } else if (inString && char === stringChar) {
        inString = false;
      } else if (inTemplate && char === "`") {
        inTemplate = false;
      }
      continue;
    }

    if (inString || inTemplate) continue;

    // Count braces
    if (char in braces) {
      braces[char as keyof typeof braces]++;
    } else if (char in closers) {
      braces[closers[char]]--;
      if (braces[closers[char]] < 0) {
        return { valid: false, error: `Unmatched ${char}` };
      }
    }
  }

  // Check all braces are closed
  for (const [brace, count] of Object.entries(braces)) {
    if (count !== 0) {
      return { valid: false, error: `Unclosed ${brace}` };
    }
  }

  return { valid: true };
}
