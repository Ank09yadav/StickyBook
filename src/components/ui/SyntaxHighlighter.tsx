import { Text, StyleSheet } from 'react-native';

type SyntaxHighlighterTextProps = {
  code: string;
  extension: string;
};

// Colors inspired by premium VS Code Dark+ syntax themes (color-only)
const SYNTAX_COLORS = {
  keyword: '#569CD6',       // VS Code Blue for declaration keywords
  controlKeyword: '#C586C0',// VS Code Magenta for control-flow / module keywords
  string: '#CE9178',        // VS Code Orange-brown for strings
  comment: '#6A9955',       // VS Code Muted Green for comments
  number: '#B5CEA8',        // VS Code Light Green for numbers
  type: '#4EC9B0',          // VS Code Teal for data types
  operator: '#D4D4D4',      // VS Code Light Gray for operators
  bracket: '#FFD700',       // VS Code Yellow/Gold for brackets and braces
  variable: '#9CDCFE',      // VS Code Light Blue for variables and identifiers
  default: '#D4D4D4',       // VS Code default plain text
};

// VS Code Magenta keywords (control flow, imports, logical blocks)
const CONTROL_KEYWORDS = new Set([
  'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
  'break', 'continue', 'import', 'export', 'from', 'async', 'await', 'try',
  'catch', 'finally', 'throw', 'yield', 'and', 'or', 'not', 'is', 'as'
]);

// VS Code Standard declaration/class keywords
const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'class', 'new', 'this', 'typeof', 'instanceof',
  'in', 'of', 'def', 'elif', 'lambda', 'with', 'global', 'nonlocal', 'pass',
  'public', 'private', 'protected', 'interface', 'type', 'implements', 'extends'
]);

// List of built-in data type keywords
const TYPES = new Set([
  'string', 'number', 'boolean', 'any', 'void', 'null', 'undefined', 'never', 'unknown',
  'object', 'array', 'Promise', 'Map', 'Set', 'Record', 'Partial', 'Omit', 'Pick'
]);

export default function SyntaxHighlighterText({ code, extension }: SyntaxHighlighterTextProps) {
  // Safe default if code is empty
  if (!code) {
    return <Text style={styles.codeText} />;
  }

  // Tokenize using regex (matches comments, strings, numbers, words/keywords/variables, symbols/brackets/operators, spaces)
  const regex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#.*|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\`(?:\\\`|[^\`])*\`|\b\d+\b|\b[a-zA-Z_]\w*\b|[{}\[\]()]|[=+\-*/!?.&|<>:,;]|\s+|\S+)/g;
  
  const tokens = code.match(regex) || [code];

  const extLower = extension.toLowerCase();

  const getStyleForToken = (token: string) => {
    // 1. Whitespace
    if (/^\s+$/.test(token)) {
      return null;
    }

    // 2. Comments (JS/TS '//' or '/*', Python/YAML '#')
    if (token.startsWith('//') || token.startsWith('/*') || (extLower === '.py' && token.startsWith('#'))) {
      return styles.comment;
    }

    // 3. Strings (double, single, or backtick)
    if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      return styles.string;
    }

    // 4. Numbers
    if (/^\d+$/.test(token)) {
      return styles.number;
    }

    // 5. Brackets/Braces/Parentheses (colored Gold/Yellow)
    if (/[{}\[\]()]/.test(token)) {
      return styles.bracket;
    }

    // 6. Operators & Special Characters
    if (/[=+\-*/!?.&|<>:,;]/.test(token)) {
      return styles.operator;
    }

    // 7. Control Flow Keywords (Magenta)
    if (CONTROL_KEYWORDS.has(token)) {
      return styles.controlKeyword;
    }

    // 8. Standard Declaration Keywords (Blue)
    if (KEYWORDS.has(token)) {
      return styles.keyword;
    }

    // 9. Data Types (Teal)
    if (TYPES.has(token)) {
      return styles.type;
    }

    // 10. Variables / Identifiers (VS Code Light Blue)
    if (/^[a-zA-Z_]\w*$/.test(token)) {
      return styles.variable;
    }

    // Default token text style
    return styles.defaultToken;
  };

  return (
    <Text style={styles.codeText}>
      {tokens.map((token, index) => {
        const tokenStyle = getStyleForToken(token);
        return (
          <Text key={index} style={tokenStyle}>
            {token}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  codeText: {
    fontFamily: 'Courier', // Monospace font
    fontSize: 14,
    lineHeight: 20,
    color: SYNTAX_COLORS.default,
  },
  keyword: { color: SYNTAX_COLORS.keyword },
  controlKeyword: { color: SYNTAX_COLORS.controlKeyword },
  string: { color: SYNTAX_COLORS.string },
  comment: { color: SYNTAX_COLORS.comment },
  number: { color: SYNTAX_COLORS.number },
  type: { color: SYNTAX_COLORS.type },
  bracket: { color: SYNTAX_COLORS.bracket },
  operator: { color: SYNTAX_COLORS.operator },
  variable: { color: SYNTAX_COLORS.variable },
  defaultToken: { color: SYNTAX_COLORS.default },
});
