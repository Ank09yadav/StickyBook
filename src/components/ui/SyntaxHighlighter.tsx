import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';

type SyntaxHighlighterTextProps = {
  code: string;
  extension: string;
};

// Colors inspired by premium VS Code Dark+ syntax themes
const SYNTAX_COLORS = {
  keyword: '#569CD6',        // VS Code Blue for declarations (const, let, var, class, etc.)
  controlKeyword: '#C586C0', // VS Code Magenta for control flow (if, else, return, import)
  string: '#CE9178',         // VS Code Orange-brown for strings
  comment: '#6A9955',        // VS Code Muted Green for comments
  number: '#B5CEA8',         // VS Code Light Green for numbers
  type: '#4EC9B0',           // VS Code Teal for types, classes, interfaces
  jsxComponent: '#4EC9B0',   // VS Code Teal for JSX/React Components
  jsxTag: '#569CD6',         // VS Code Blue for intrinsic JSX/HTML tags
  attribute: '#9CDCFE',      // VS Code Light Blue for properties/attributes/JSON keys
  function: '#DCDCAA',       // VS Code Light Yellow for functions
  variable: '#9CDCFE',       // VS Code Light Blue for variables
  operator: '#D4D4D4',       // VS Code Light Gray for operators
  bracket: '#FFD700',        // VS Code Yellow/Gold for brackets and braces
  cssSelector: '#D7BA7D',    // VS Code Gold/Orange for CSS Selectors
  cssProperty: '#9CDCFE',    // VS Code Light Blue for CSS Properties
  cssValue: '#CE9178',       // VS Code Orange-brown for CSS values
  default: '#D4D4D4',        // VS Code default plain text
};

export type TokenType = keyof typeof SYNTAX_COLORS;

type Token = {
  text: string;
  type: TokenType;
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

const BUILTINS = new Set([
  'console', 'window', 'document', 'process', 'global', 'module', 'require',
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Function', 'Symbol', 'Error',
  'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Math', 'JSON',
  'React', 'useState', 'useEffect', 'useContext', 'useRef', 'useMemo', 'useCallback',
  'Component', 'PureComponent'
]);

// 1. JS / TS / JSX / TSX Tokenizer
function tokenizeJS(code: string): Token[] {
  const regexJS = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b0x[a-fA-F0-9]+\b|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_$][\w-]*\b|[{}\[\]()]|[=+\-*/!?.&|<>:,;~%^]|\s+|\S)/g;
  const rawTokens = code.match(regexJS) || [code];
  const tokens: Token[] = [];
  
  let inJsxTag = false;
  let jsxTagNameRead = false;
  
  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    
    // Whitespace
    if (/^\s+$/.test(token)) {
      tokens.push({ text: token, type: 'default' });
      continue;
    }
    
    // Comments
    if (token.startsWith('//') || token.startsWith('/*')) {
      tokens.push({ text: token, type: 'comment' });
      continue;
    }
    
    // Strings
    if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      tokens.push({ text: token, type: 'string' });
      continue;
    }
    
    // Numbers
    if (/^(?:0x[a-fA-F0-9]+|\d+(?:\.\d+)?)$/.test(token)) {
      tokens.push({ text: token, type: 'number' });
      continue;
    }
    
    // Brackets
    if (/[[{}\[\]()]/.test(token)) {
      tokens.push({ text: token, type: 'bracket' });
      continue;
    }
    
    // Operators & Symbols
    if (/[=+\-*/!?.&|<>:,;~%^]/.test(token)) {
      if (token === '<' || token === '</') {
        // Lookahead to see if this is a JSX tag or less-than operator
        let isTag = false;
        for (let j = i + 1; j < rawTokens.length; j++) {
          if (/^\s+$/.test(rawTokens[j])) continue;
          if (/^[a-zA-Z_$][\w-]*$/.test(rawTokens[j])) {
            isTag = true;
          }
          break;
        }
        if (isTag) {
          inJsxTag = true;
          jsxTagNameRead = false;
        }
        tokens.push({ text: token, type: 'operator' });
      } else if (token === '>' || token === '/>') {
        inJsxTag = false;
        tokens.push({ text: token, type: 'operator' });
      } else if (token === '=' && inJsxTag) {
        tokens.push({ text: token, type: 'operator' });
      } else {
        tokens.push({ text: token, type: 'operator' });
      }
      continue;
    }
    
    // Words / Identifiers
    if (/^[a-zA-Z_$][\w-]*$/.test(token)) {
      if (inJsxTag) {
        if (!jsxTagNameRead) {
          jsxTagNameRead = true;
          if (/^[A-Z]/.test(token)) {
            tokens.push({ text: token, type: 'jsxComponent' });
          } else {
            tokens.push({ text: token, type: 'jsxTag' });
          }
        } else {
          // Attribute or property name
          let isAttr = false;
          for (let j = i + 1; j < rawTokens.length; j++) {
            if (/^\s+$/.test(rawTokens[j])) continue;
            if (rawTokens[j] === '=') {
              isAttr = true;
            }
            break;
          }
          if (isAttr) {
            tokens.push({ text: token, type: 'attribute' });
          } else {
            tokens.push({ text: token, type: 'variable' });
          }
        }
      } else {
        if (CONTROL_KEYWORDS.has(token)) {
          tokens.push({ text: token, type: 'controlKeyword' });
        } else if (KEYWORDS.has(token)) {
          tokens.push({ text: token, type: 'keyword' });
        } else if (TYPES.has(token)) {
          tokens.push({ text: token, type: 'type' });
        } else if (BUILTINS.has(token)) {
          tokens.push({ text: token, type: 'type' });
        } else {
          // Lookahead for function call
          let isFunc = false;
          for (let j = i + 1; j < rawTokens.length; j++) {
            if (/^\s+$/.test(rawTokens[j])) continue;
            if (rawTokens[j] === '(') {
              isFunc = true;
            }
            break;
          }
          if (isFunc) {
            tokens.push({ text: token, type: 'function' });
          } else {
            tokens.push({ text: token, type: 'variable' });
          }
        }
      }
      continue;
    }
    
    // Default fallback
    tokens.push({ text: token, type: 'default' });
  }
  
  return tokens;
}

// 2. CSS Tokenizer
function tokenizeCSS(code: string): Token[] {
  const regexCSS = /(\/\*[\s\S]*?\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[a-fA-F0-9]{3,8}\b|#[a-zA-Z_-][\w-]*|\.[a-zA-Z_-][\w-]*|\b\d+(?:px|em|rem|%|s|ms|deg)?\b|\b[a-zA-Z_-][\w-]*\b|[{}\[\]()]|[=+\-*/!?.&|<>:,;~%^]|\s+|\S)/g;
  const rawTokens = code.match(regexCSS) || [code];
  const tokens: Token[] = [];
  
  let inCssBlock = false;
  let expectingValue = false;
  
  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    
    if (/^\s+$/.test(token)) {
      tokens.push({ text: token, type: 'default' });
      continue;
    }
    
    if (token.startsWith('/*')) {
      tokens.push({ text: token, type: 'comment' });
      continue;
    }
    
    if (token.startsWith('"') || token.startsWith("'")) {
      tokens.push({ text: token, type: 'string' });
      continue;
    }
    
    if (token.startsWith('.') || token.startsWith('#')) {
      if (inCssBlock) {
        tokens.push({ text: token, type: 'cssValue' });
      } else {
        tokens.push({ text: token, type: 'cssSelector' });
      }
      continue;
    }
    
    if (/[{}]/.test(token)) {
      if (token === '{') {
        inCssBlock = true;
        expectingValue = false;
      } else if (token === '}') {
        inCssBlock = false;
        expectingValue = false;
      }
      tokens.push({ text: token, type: 'bracket' });
      continue;
    }
    
    if (token === ':') {
      if (inCssBlock) expectingValue = true;
      tokens.push({ text: token, type: 'operator' });
      continue;
    }
    if (token === ';') {
      if (inCssBlock) expectingValue = false;
      tokens.push({ text: token, type: 'operator' });
      continue;
    }
    
    if (/^\d+(?:px|em|rem|%|s|ms|deg)?$/.test(token)) {
      if (inCssBlock) {
        tokens.push({ text: token, type: 'number' });
      } else {
        tokens.push({ text: token, type: 'cssSelector' });
      }
      continue;
    }
    
    if (/^[a-zA-Z_-][\w-]*$/.test(token)) {
      if (inCssBlock) {
        if (!expectingValue) {
          tokens.push({ text: token, type: 'cssProperty' });
        } else {
          tokens.push({ text: token, type: 'cssValue' });
        }
      } else {
        tokens.push({ text: token, type: 'cssSelector' });
      }
      continue;
    }
    
    tokens.push({ text: token, type: 'default' });
  }
  
  return tokens;
}

// 3. HTML / XML Tokenizer
function tokenizeHTML(code: string): Token[] {
  const regexHTML = /(<!--[\s\S]*?-->|<\/?[a-zA-Z0-9:-]+|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/?>|[{}\[\]()]|[=+\-*/!?.&|<>:,;~%^]|\s+|\S)/g;
  const rawTokens = code.match(regexHTML) || [code];
  const tokens: Token[] = [];
  
  let inHtmlTag = false;
  
  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    
    if (/^\s+$/.test(token)) {
      tokens.push({ text: token, type: 'default' });
      continue;
    }
    
    if (token.startsWith('<!--')) {
      tokens.push({ text: token, type: 'comment' });
      continue;
    }
    
    if (token.startsWith('<') || token.startsWith('</')) {
      inHtmlTag = true;
      tokens.push({ text: token, type: 'jsxTag' });
      continue;
    }
    
    if (token === '>' || token === '/>') {
      inHtmlTag = false;
      tokens.push({ text: token, type: 'jsxTag' });
      continue;
    }
    
    if (inHtmlTag) {
      if (token.startsWith('"') || token.startsWith("'")) {
        tokens.push({ text: token, type: 'string' });
      } else if (token === '=') {
        tokens.push({ text: token, type: 'operator' });
      } else if (/^[a-zA-Z0-9:-]+$/.test(token)) {
        tokens.push({ text: token, type: 'attribute' });
      } else {
        tokens.push({ text: token, type: 'default' });
      }
    } else {
      tokens.push({ text: token, type: 'default' });
    }
  }
  
  return tokens;
}

// 4. JSON Tokenizer
function tokenizeJSON(code: string): Token[] {
  const regexJSON = /("(?:\\.|[^"\\])*"|\b\d+(?:\.\d+)?\b|\b(?:true|false|null)\b|[{}\[\]()]|[:,]|\s+|\S)/g;
  const rawTokens = code.match(regexJSON) || [code];
  const tokens: Token[] = [];
  
  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    
    if (/^\s+$/.test(token)) {
      tokens.push({ text: token, type: 'default' });
      continue;
    }
    
    if (token.startsWith('"')) {
      let isKey = false;
      for (let j = i + 1; j < rawTokens.length; j++) {
        if (/^\s+$/.test(rawTokens[j])) continue;
        if (rawTokens[j] === ':') {
          isKey = true;
        }
        break;
      }
      if (isKey) {
        tokens.push({ text: token, type: 'attribute' });
      } else {
        tokens.push({ text: token, type: 'string' });
      }
      continue;
    }
    
    if (/^\d+(?:\.\d+)?$/.test(token)) {
      tokens.push({ text: token, type: 'number' });
      continue;
    }
    
    if (token === 'true' || token === 'false' || token === 'null') {
      tokens.push({ text: token, type: 'controlKeyword' });
      continue;
    }
    
    if (/[[{}\[\]()]/.test(token)) {
      tokens.push({ text: token, type: 'bracket' });
      continue;
    }
    
    if (token === ':' || token === ',') {
      tokens.push({ text: token, type: 'operator' });
      continue;
    }
    
    tokens.push({ text: token, type: 'default' });
  }
  
  return tokens;
}

// 5. Markdown Tokenizer
function tokenizeMarkdown(code: string): Token[] {
  const lines = code.split('\n');
  const tokens: Token[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeading = line.startsWith('#');
    const isList = /^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line);
    
    if (isHeading) {
      tokens.push({ text: line, type: 'jsxComponent' });
    } else if (isList) {
      const match = line.match(/^(\s*[-*+]\s+|\s*\d+\.\s+)(.*)$/);
      if (match) {
        tokens.push({ text: match[1], type: 'operator' });
        tokens.push({ text: match[2], type: 'default' });
      } else {
        tokens.push({ text: line, type: 'default' });
      }
    } else {
      tokens.push({ text: line, type: 'default' });
    }
    
    if (i < lines.length - 1) {
      tokens.push({ text: '\n', type: 'default' });
    }
  }
  
  return tokens;
}

// Main syntax parser orchestrator
function tokenizeCode(code: string, extension: string): Token[] {
  const extLower = extension.toLowerCase();
  
  if (['.js', '.jsx', '.ts', '.tsx'].includes(extLower)) {
    return tokenizeJS(code);
  } else if (extLower === '.css') {
    return tokenizeCSS(code);
  } else if (['.html', '.xml'].includes(extLower)) {
    return tokenizeHTML(code);
  } else if (extLower === '.json') {
    return tokenizeJSON(code);
  } else if (extLower === '.md') {
    return tokenizeMarkdown(code);
  } else {
    // Default plain text (single token)
    return [{ text: code, type: 'default' }];
  }
}

export default function SyntaxHighlighterText({ code, extension }: SyntaxHighlighterTextProps) {
  // 1. Safe default fallback
  if (!code) {
    return (
      <View style={styles.editorContainer}>
        <View style={styles.gutter}>
          <Text style={styles.lineNumber}>1</Text>
        </View>
        <ScrollView horizontal style={styles.codeScroll} showsHorizontalScrollIndicator={false}>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText} numberOfLines={1}>
              <Text style={styles.defaultToken}> </Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 2. Tokenize the entire code contents
  const tokens = tokenizeCode(code, extension);

  // 3. Map tokens to line arrays
  const lines: Token[][] = [[]];
  let currentLineIdx = 0;

  for (const token of tokens) {
    if (token.text.includes('\n')) {
      const parts = token.text.split('\n');
      
      // First part goes on the current line
      if (parts[0]) {
        lines[currentLineIdx].push({ text: parts[0], type: token.type });
      }
      
      // Subsequent parts create new lines
      for (let p = 1; p < parts.length; p++) {
        currentLineIdx++;
        lines[currentLineIdx] = [];
        if (parts[p]) {
          lines[currentLineIdx].push({ text: parts[p], type: token.type });
        }
      }
    } else {
      lines[currentLineIdx].push(token);
    }
  }

  const getTokenStyle = (type: TokenType) => {
    switch (type) {
      case 'keyword': return styles.keyword;
      case 'controlKeyword': return styles.controlKeyword;
      case 'string': return styles.string;
      case 'comment': return styles.comment;
      case 'number': return styles.number;
      case 'type': return styles.type;
      case 'jsxComponent': return styles.jsxComponent;
      case 'jsxTag': return styles.jsxTag;
      case 'attribute': return styles.attribute;
      case 'function': return styles.function;
      case 'variable': return styles.variable;
      case 'operator': return styles.operator;
      case 'bracket': return styles.bracket;
      case 'cssSelector': return styles.cssSelector;
      case 'cssProperty': return styles.cssProperty;
      case 'cssValue': return styles.cssValue;
      case 'default':
      default:
        return styles.defaultToken;
    }
  };

  return (
    <View style={styles.editorContainer}>
      {/* Gutter: Line Numbers */}
      <View style={styles.gutter}>
        {lines.map((_, index) => (
          <Text key={index} style={styles.lineNumber}>
            {index + 1}
          </Text>
        ))}
      </View>

      {/* Code Text Body: Horizontally scrollable for long lines */}
      <ScrollView 
        horizontal 
        style={styles.codeScroll} 
        contentContainerStyle={styles.codeScrollContent}
        showsHorizontalScrollIndicator={true}
      >
        <View style={styles.codeContainer}>
          {lines.map((lineTokens, index) => (
            <Text key={index} style={styles.codeText} numberOfLines={1}>
              {lineTokens.length === 0 ? (
                // Safe spacer for completely blank lines to maintain perfect vertical line matching
                <Text style={styles.defaultToken}> </Text>
              ) : (
                lineTokens.map((t, tIdx) => (
                  <Text key={tIdx} style={getTokenStyle(t.type)}>
                    {t.text}
                  </Text>
                ))
              )}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  editorContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E', // standard VS Code background color
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D2D30', // VS Code dark border
    overflow: 'hidden',
    width: '100%',
  },
  gutter: {
    backgroundColor: '#181818', // slightly darker background for line numbers
    borderRightWidth: 1,
    borderRightColor: '#2D2D30',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
    minWidth: 38,
  },
  lineNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#858585', // standard VS Code line number color
    textAlign: 'right',
  },
  codeScroll: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  codeScrollContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  codeContainer: {
    flexDirection: 'column',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#D4D4D4',
  },
  // Distinct syntax highlights
  keyword: { color: SYNTAX_COLORS.keyword },
  controlKeyword: { color: SYNTAX_COLORS.controlKeyword },
  string: { color: SYNTAX_COLORS.string },
  comment: { color: SYNTAX_COLORS.comment },
  number: { color: SYNTAX_COLORS.number },
  type: { color: SYNTAX_COLORS.type },
  jsxComponent: { color: SYNTAX_COLORS.jsxComponent, fontWeight: 'bold' },
  jsxTag: { color: SYNTAX_COLORS.jsxTag },
  attribute: { color: SYNTAX_COLORS.attribute },
  function: { color: SYNTAX_COLORS.function },
  variable: { color: SYNTAX_COLORS.variable },
  operator: { color: SYNTAX_COLORS.operator },
  bracket: { color: SYNTAX_COLORS.bracket },
  cssSelector: { color: SYNTAX_COLORS.cssSelector },
  cssProperty: { color: SYNTAX_COLORS.cssProperty },
  cssValue: { color: SYNTAX_COLORS.cssValue },
  defaultToken: { color: SYNTAX_COLORS.default },
});
