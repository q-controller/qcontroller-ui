import { Terminal } from '@xterm/headless';
import convert from 'color-convert';
import type { Change, DataSource, Result } from '@krjakbrjak/virtualtable';

const COLS = 240;
const ROWS = 24;

const ANSI = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'bright-black',
  'bright-red',
  'bright-green',
  'bright-yellow',
  'bright-blue',
  'bright-magenta',
  'bright-cyan',
  'bright-white',
];

const DEFAULT_FG = 'var(--color-semantic-text-primary)';
const DEFAULT_BG = 'var(--color-semantic-surface-card)';

const css = (color: number, rgb: boolean): string => {
  if (rgb) {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
  // color-convert only handles the cube and the grayscale ramp; 0-15 are
  // design tokens.
  if (color < 16) {
    return `var(--color-ansi-${ANSI[color]})`;
  }
  const [r, g, b] = convert.ansi256.rgb(color);
  return `rgb(${r}, ${g}, ${b})`;
};

export interface LogSpan {
  text: string;
  fg?: string;
  bg?: string;
  bold?: boolean;
}

export type LogRow = LogSpan[];

// One raw log stream fed through a headless terminal, exposed as a live
// DataSource for VirtualTable. Rows that scroll out of the viewport are out of
// the emulator's reach, so they are copied out and kept indefinitely; the
// table is those rows followed by the viewport.
export class LogSource implements DataSource<LogRow> {
  // The buffer inspection API is gated behind allowProposedApi in the
  // headless build. One scrollback row keeps the line that just scrolled off
  // readable from onScroll.
  private term = new Terminal({
    cols: COLS,
    rows: ROWS,
    scrollback: 1,
    convertEol: true,
    allowProposedApi: true,
  });

  private frozen: LogRow[] = [];

  // Table size and index of the first viewport row as last announced.
  private total = 0;

  private live = 0;

  private version = 0;

  private listeners = new Set<(change: Change) => void>();

  constructor() {
    // A terminal clears these away; a log view keeps them. Ignore erase
    // display/scrollback (CSI 2J/3J), full reset (RIS) and the alternate
    // screen (DECSET 47/1047/1049) so history survives the guest clearing
    // its console.
    this.term.parser.registerCsiHandler({ final: 'J' }, (params) => {
      const p = params.length ? params[0] : 0;
      return p === 2 || p === 3;
    });
    this.term.parser.registerEscHandler({ final: 'c' }, () => true);
    const altScreen = (params: (number | number[])[]) =>
      params.some((p) => p === 47 || p === 1047 || p === 1049);
    this.term.parser.registerCsiHandler({ prefix: '?', final: 'h' }, altScreen);
    this.term.parser.registerCsiHandler({ prefix: '?', final: 'l' }, altScreen);

    this.term.onScroll(() => {
      const buf = this.term.buffer.active;
      if (buf.baseY > 0) {
        this.frozen.push(this.row(buf.baseY - 1));
      }
    });
  }

  subscribe = (listener: (change: Change) => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  fetch(index: number, count: number): Promise<Result<LogRow>> {
    const buf = this.term.buffer.active;
    const items: LogRow[] = [];
    for (let i = index; i < Math.min(index + count, this.total); i += 1) {
      items.push(
        i < this.frozen.length
          ? this.frozen[i]
          : this.row(buf.baseY + i - this.frozen.length)
      );
    }
    return Promise.resolve({
      from: index,
      items,
      totalCount: this.total,
      version: this.version,
    });
  }

  ingest(chunk: Uint8Array | string) {
    // term.write only changes the buffer once its callback runs, so the diff
    // against the previous state has to live in the callback. Callbacks run
    // in write order, each comparing to the state its predecessor stored.
    this.term.write(chunk, () => {
      const { total, live } = this;
      this.live = this.frozen.length;
      // The total never goes down: a screen clear blanks rows in place
      // rather than removing them, so the scrollbar stays stable while the
      // guest redraws its console.
      this.total = Math.max(total, this.live + this.viewportRows());

      if (total > live) {
        this.emit({
          kind: 'updated',
          index: live,
          count: total - live,
          version: ++this.version,
        });
      }
      if (this.total > total) {
        this.emit({
          kind: 'inserted',
          index: total,
          count: this.total - total,
          version: ++this.version,
        });
      }
    });
  }

  // A reconnect replays the whole backlog: drop everything and let the
  // replay re-insert it, otherwise every line would appear twice.
  reset() {
    this.term.write('', () => {
      const { total } = this;
      this.term.reset();
      this.frozen = [];
      this.total = 0;
      this.live = 0;
      if (total > 0) {
        this.emit({
          kind: 'removed',
          index: 0,
          count: total,
          version: ++this.version,
        });
      }
    });
  }

  private viewportRows(): number {
    const buf = this.term.buffer.active;
    // The cursor usually sits on the last written row, but a redraw can park
    // it above earlier output, so scan below it for the real end of content.
    let last = buf.baseY + buf.cursorY;
    for (let y = Math.min(buf.length, buf.baseY + ROWS) - 1; y > last; y -= 1) {
      if (buf.getLine(y)?.translateToString(true)) {
        last = y;
        break;
      }
    }
    const rows = last - buf.baseY + 1;
    // An untouched terminal still reports one (empty) row; show none.
    if (
      rows === 1 &&
      buf.cursorX === 0 &&
      !buf.getLine(last)?.translateToString(true)
    ) {
      return 0;
    }
    return rows;
  }

  private row(y: number): LogRow {
    const buf = this.term.buffer.active;
    const line = buf.getLine(y);
    if (!line) {
      return [];
    }
    const cell = buf.getNullCell();
    const spans: LogRow = [];
    for (let x = 0; x < line.length; x += 1) {
      if (!line.getCell(x, cell) || cell.getWidth() === 0) {
        continue;
      }
      let fg = cell.isFgDefault()
        ? undefined
        : css(cell.getFgColor(), Boolean(cell.isFgRGB()));
      let bg = cell.isBgDefault()
        ? undefined
        : css(cell.getBgColor(), Boolean(cell.isBgRGB()));
      if (cell.isInverse()) {
        [fg, bg] = [bg ?? DEFAULT_BG, fg ?? DEFAULT_FG];
      }
      const bold = Boolean(cell.isBold()) || undefined;
      const text = cell.getChars() || ' ';
      const previous = spans[spans.length - 1];
      if (
        previous &&
        previous.fg === fg &&
        previous.bg === bg &&
        previous.bold === bold
      ) {
        previous.text += text;
      } else {
        spans.push({ text, fg, bg, bold });
      }
    }
    // Unstyled trailing blank cells are padding, not content.
    const tail = spans[spans.length - 1];
    if (tail && !tail.fg && !tail.bg && !tail.bold) {
      tail.text = tail.text.replace(/ +$/, '');
      if (tail.text === '') {
        spans.pop();
      }
    }
    return spans;
  }

  private emit(change: Change) {
    this.listeners.forEach((listener) => listener(change));
  }
}
