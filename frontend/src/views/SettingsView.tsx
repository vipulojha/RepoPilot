import React, { useEffect, useState } from 'react'
import { ArrowLeft, Check, CircleHelp, HardDrive, Monitor, RotateCcw, ScanLine, SlidersHorizontal, Sparkles } from 'lucide-react'

type Preferences = {
  landingView: string
  rememberRepository: boolean
  autoRescan: boolean
  fitGraph: boolean
  density: 'comfortable' | 'compact'
}

const defaults: Preferences = { landingView: 'Dashboard', rememberRepository: true, autoRescan: false, fitGraph: true, density: 'comfortable' }

function loadPreferences(): Preferences {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem('repopilot.preferences') || '{}') } } catch { return defaults }
}

export const SettingsView: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)
  const [saved, setSaved] = useState(false)

  useEffect(() => { localStorage.setItem('repopilot.preferences', JSON.stringify(preferences)); if (!preferences.rememberRepository) localStorage.removeItem('repopilot.repositoryId'); setSaved(true); const timer = window.setTimeout(() => setSaved(false), 1400); return () => window.clearTimeout(timer) }, [preferences])
  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => setPreferences(current => ({ ...current, [key]: value }))

  return <div className="content-wrap">
    <header className="page-header"><div><div className="eyebrow">WORKSPACE / SETTINGS</div><h1>Settings</h1><p>Keep RepoPilot tuned to the way you inspect repositories. Preferences are stored locally in this browser.</p></div><div className="flex items-center gap-3"><div className="status"><i />{saved ? 'Saved locally' : 'Ready'}</div>{onBack && <button className="button button-quiet" onClick={onBack}><ArrowLeft size={13} />Back</button>}</div></header>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
      <section className="panel"><div className="panel-head"><h2 className="flex items-center gap-2"><SlidersHorizontal size={14} />Working preferences</h2><span className="status"><i />Actionable</span></div><div className="p-4 space-y-5">
        <label className="grid gap-2 text-[11px] text-[#b8c8cb]">Default landing view<select value={preferences.landingView} onChange={e => update('landingView', e.target.value)}><option>Dashboard</option><option>Files</option><option>Dependency Graph</option><option>History</option></select><small className="muted">Used the next time RepoPilot opens a repository.</small></label>
        <PreferenceToggle icon={<HardDrive size={14} />} label="Remember selected repository" description="Restore the last repository after a restart." checked={preferences.rememberRepository} onChange={value => update('rememberRepository', value)} />
        <PreferenceToggle icon={<ScanLine size={14} />} label="Auto-rescan after repository changes" description="Coming later — scans are currently started explicitly from the top bar." checked={preferences.autoRescan} onChange={value => update('autoRescan', value)} disabled />
        <PreferenceToggle icon={<Sparkles size={14} />} label="Fit dependency graph on open" description="Frame the complete graph when entering the graph view." checked={preferences.fitGraph} onChange={value => update('fitGraph', value)} />
        <div><div className="text-[11px] text-[#b8c8cb] mb-2">UI density</div><div className="flex gap-2"><button className={`button ${preferences.density === 'comfortable' ? 'button-primary' : ''}`} onClick={() => update('density', 'comfortable')}>Comfortable</button><button className={`button ${preferences.density === 'compact' ? 'button-primary' : ''}`} onClick={() => update('density', 'compact')}>Compact</button></div></div>
      </div></section>
      <section className="panel"><div className="panel-head"><h2 className="flex items-center gap-2"><Monitor size={14} />About this workspace</h2><span className="status medium"><i />Informational</span></div><div className="p-4 space-y-3 text-[11px] leading-relaxed muted"><InfoRow title="Repository access" text="Repositories are discovered through the active workspace connection. Access and scan operations remain explicit." /><InfoRow title="Local storage" text="Only the preferences above and the selected repository identifier are kept in browser storage." /><InfoRow title="Coming later" text="Accounts, team policy, remote sync, theme packs, and server-side preferences are not available in this build." /><div className="flex items-start gap-2 border-t border-[#1d2a32] pt-4 text-[#91a0a7]"><CircleHelp size={14} className="text-[#61e1dc] shrink-0 mt-0.5" />Need a setting that is not listed? Check Help & Shortcuts for the current product boundary.</div></div></section>
    </div>
    <div className="mt-[14px] flex items-center justify-between border border-[#263740] rounded-[8px] bg-[#10171e] px-4 py-3"><div><strong className="text-[11px]">Reset local preferences</strong><p className="muted text-[10px] mt-1">Return this screen to its safe defaults.</p></div><button className="button" onClick={() => setPreferences(defaults)}><RotateCcw size={13} />Reset</button></div>
  </div>
}

function PreferenceToggle({ icon, label, description, checked, onChange, disabled = false }: { icon: React.ReactNode; label: string; description: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) { return <label className={`flex items-start gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}><span className="text-[#61e1dc] mt-0.5">{icon}</span><span className="flex-1"><strong className="block text-[11px] text-[#edf4f5]">{label}</strong><small className="block muted text-[10px] mt-1">{description}</small></span><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} className="accent-[#61e1dc] mt-1" /></label> }
function InfoRow({ title, text }: { title: string; text: string }) { return <div className="border-b border-[#1d2a32] pb-3"><strong className="block text-[#edf4f5] text-[11px]">{title}</strong><span className="block mt-1">{text}</span></div> }
