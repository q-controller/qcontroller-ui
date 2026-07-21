import React from 'react';
import { Text, useComputedColorScheme } from '@mantine/core';
const CodeMirror = React.lazy(() => import('@uiw/react-codemirror'));
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
import { syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { yaml as yamlMode } from '@codemirror/lang-yaml';
import { linter, type Diagnostic } from '@codemirror/lint';
import YAML, { YAMLError } from 'yaml';

const yamlLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  const docText = view.state.doc.toString();

  try {
    YAML.parse(docText);
  } catch (e: unknown) {
    if (e instanceof YAMLError) {
      if (e.linePos && Array.isArray(e.linePos) && e.linePos.length > 0) {
        const start = e.linePos[0];
        const end = e.linePos[1] || start;

        const lineObj = view.state.doc.line(start.line);
        const from = lineObj.from + (start.col - 1);
        const to = lineObj.from + (end.col || start.col) - 1;

        diagnostics.push({
          from,
          to,
          severity: 'error',
          message: e.message || 'Invalid YAML',
        });
      } else {
        // fallback: highlight the whole document
        diagnostics.push({
          from: 0,
          to: view.state.doc.length,
          severity: 'error',
          message: e.message || 'Invalid YAML',
        });
      }
    }
  }

  return diagnostics;
});

// Dark chrome comes entirely from the semantic tokens — the same card surface
// the stdout/stderr terminals use — with only one-dark's syntax colours on top,
// so there is no competing background rule from a prebuilt editor theme.
const darkChrome = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--color-semantic-surface-card)',
      color: 'var(--color-semantic-text-primary)',
    },
    '.cm-content': { caretColor: 'var(--color-semantic-text-primary)' },
    '.cm-gutters': {
      backgroundColor: 'var(--color-semantic-surface-card)',
      color: 'var(--color-semantic-text-muted)',
      border: 'none',
    },
  },
  { dark: true }
);
const darkTheme = [darkChrome, syntaxHighlighting(oneDarkHighlightStyle)];

export interface YamlEditorProps {
  value: string;
  onChange: (val: string) => void;
  editable?: boolean;
  label?: React.ReactNode;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  style?: React.CSSProperties;
}

export default function YamlEditor({
  value,
  onChange,
  editable = true,
  label,
  height = '120px',
  minHeight = '80px',
  maxHeight = '300px',
  style = {},
}: YamlEditorProps) {
  const colorScheme = useComputedColorScheme('light');
  return (
    <>
      {label && <Text mb={4}>{label}</Text>}
      <CodeMirror
        value={value}
        height={height}
        minHeight={minHeight}
        maxHeight={maxHeight}
        extensions={[yamlMode(), yamlLinter]}
        theme={colorScheme === 'dark' ? darkTheme : 'light'}
        onChange={onChange}
        editable={editable}
        style={{
          resize: style?.resize ?? 'vertical',
          width: style?.width ?? '100%',
          borderRadius: style?.borderRadius ?? 6,
          ...style,
        }}
        basicSetup={{ lineNumbers: true }}
      />
    </>
  );
}
