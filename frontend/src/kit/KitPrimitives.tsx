import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export type Tone = 'cyan' | 'violet' | 'amber' | 'emerald' | 'crimson'

const toneClass: Record<Tone, string> = {
  cyan: 'kit-badge kit-badge-cyan',
  violet: 'kit-badge kit-badge-violet',
  amber: 'kit-badge kit-badge-amber',
  emerald: 'kit-badge kit-badge-emerald',
  crimson: 'kit-badge kit-badge-crimson',
}

export function KitButton({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'icon'; className?: string }) {
  return <button className={`kit-button kit-button-${variant} ${className}`} {...props} />
}

export function KitBadge({ tone = 'cyan', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={toneClass[tone]}>{children}</span>
}

export function KitPanel({ title, action, children, className = '' }: { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`kit-panel ${className}`}><header className="kit-panel-head"><h2>{title}</h2>{action}</header><div className="kit-panel-body">{children}</div></section>
}

export function KitMetric({ label, value, tone = 'cyan', icon }: { label: string; value: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return <div className={`kit-metric kit-metric-${tone}`}><div className="kit-metric-label">{icon}<span>{label}</span></div><strong>{value}</strong></div>
}

export function KitSearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`kit-search-input ${props.className ?? ''}`} />
}

export function KitEmpty({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="kit-empty"><strong>{title}</strong>{detail && <span>{detail}</span>}{action}</div>
}

export function KitPageHeader({ eyebrow, title, detail, actions }: { eyebrow?: string; title: string; detail?: string; actions?: ReactNode }) {
  return <header className="kit-page-header"><div>{eyebrow && <div className="kit-eyebrow">{eyebrow}</div>}<h1>{title}</h1>{detail && <p>{detail}</p>}</div>{actions && <div className="kit-page-actions">{actions}</div>}</header>
}

export function KitTreeRow({ depth = 0, selected = false, children, meta, onClick }: { depth?: number; selected?: boolean; children: ReactNode; meta?: ReactNode; onClick?: () => void }) {
  return <button type="button" className={`kit-tree-row ${selected ? 'is-selected' : ''}`} style={{ paddingLeft: `${8 + depth * 18}px` }} onClick={onClick}><span className="kit-tree-guide" />{children}<span className="kit-tree-meta">{meta}</span></button>
}
