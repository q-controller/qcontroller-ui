import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { useComputedColorScheme, useMantineTheme } from '@mantine/core';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export interface LogTerminalHandle {
  write: (data: string) => void;
  clear: () => void;
}

// LogTerminal is a read-only xterm terminal. It interprets the full ANSI
// stream (colours, cursor moves, screen clears) the way a real serial console
// would.
export function LogTerminal({
  ref,
  scrollback = 10000,
  fontSize = 12,
}: {
  ref?: Ref<LogTerminalHandle>;
  scrollback?: number;
  fontSize?: number;
}) {
  const theme = useMantineTheme();
  const scheme = useComputedColorScheme('light');
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    const term = new Terminal({
      convertEol: true, // treat bare \n as \r\n so console output lines up
      disableStdin: true,
      scrollback,
      fontSize,
      fontFamily: theme.fontFamilyMonospace,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);

    const container = containerRef.current;
    if (container) {
      term.open(container);
    }
    termRef.current = term;

    // Refit whenever the container resizes — including when its tab goes from
    // hidden (0x0) to visible, which is when fitting actually has dimensions.
    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {
        // container not laid out yet (hidden tab) — refit on the next resize.
      }
    });
    if (container) {
      ro.observe(container);
    }

    return () => {
      ro.disconnect();
      term.dispose();
      termRef.current = null;
    };
  }, [theme.fontFamilyMonospace, scrollback, fontSize]);

  // Restyle in place when the colour scheme changes so the terminal tracks the
  // app's light/dark mode without being rebuilt.
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.theme =
      scheme === 'dark'
        ? { background: theme.black, foreground: theme.white }
        : { background: theme.white, foreground: theme.black };
  }, [scheme, theme.black, theme.white]);

  useImperativeHandle(
    ref,
    () => ({
      write: (data: string) => termRef.current?.write(data),
      clear: () => termRef.current?.clear(),
    }),
    []
  );

  return <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />;
}
