import { VirtualTable } from '@krjakbrjak/virtualtable';

import { LogSource, type LogRow } from '@/common/log-source';
import { fontWeight } from '@/theme';

// The source outlives this component, so closing and reopening the tab loses
// nothing.
export function LogView({
  source,
  label,
}: {
  source: LogSource;
  label: string;
}) {
  return (
    <div className="log-view">
      <VirtualTable<LogRow>
        fetcher={source}
        selectable={false}
        aria-label={label}
        renderer={(row) => (
          <div className="log-line">
            {row?.length
              ? row.map((span, i) => (
                  <span
                    key={i}
                    style={{
                      color: span.fg,
                      backgroundColor: span.bg,
                      fontWeight: span.bold ? fontWeight.semibold : undefined,
                    }}
                  >
                    {span.text}
                  </span>
                ))
              : '\u00a0'}
          </div>
        )}
      />
    </div>
  );
}
