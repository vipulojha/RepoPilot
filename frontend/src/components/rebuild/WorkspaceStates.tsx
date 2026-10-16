import type { ReactNode } from 'react'

export function WorkspaceState({ kind, children }: { kind: 'loading' | 'empty' | 'error'; children: ReactNode }) {
  return <div className={`panel empty-files rebuild-state rebuild-${kind}`} role={kind === 'error' ? 'alert' : undefined}>{children}</div>
}

export function WorkspaceHeader({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail?: string; action?: ReactNode }) {
  return <header className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{detail && <p>{detail}</p>}</div>{action}</header>
}

export function WorkspacePanel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="panel rebuild-panel"><div className="panel-head"><h2>{title}</h2>{action}</div>{children}</section>
}
