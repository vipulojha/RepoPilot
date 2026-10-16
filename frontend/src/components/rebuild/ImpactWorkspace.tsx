import { useEffect, useState } from 'react'
import { GitBranch } from 'lucide-react'
import { api, type ImpactItem } from '../../lib/api/client'
import { WorkspaceHeader, WorkspacePanel, WorkspaceState } from './WorkspaceStates'
export interface ImpactWorkspaceProps { repositoryId: number | null; fileId: number | null }
export function ImpactWorkspace({ repositoryId, fileId }: ImpactWorkspaceProps) { const [items,setItems]=useState<ImpactItem[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(false)
 useEffect(()=>{setItems([]);setError('');if(!repositoryId||!fileId)return;setLoading(true);api.impact(repositoryId,[fileId]).then(r=>setItems(r.affected_files)).catch(e=>setError(e instanceof Error?e.message:'Impact analysis unavailable')).finally(()=>setLoading(false))},[repositoryId,fileId])
 return <><WorkspaceHeader eyebrow="Analyze / impact" title="Impact analysis" detail="Trace direct and transitive consumers from a real indexed file." /><WorkspacePanel title="Affected files"><div className="impact-results">{!repositoryId||!fileId&&<WorkspaceState kind="empty"><GitBranch size={20}/>Select a file to calculate impact.</WorkspaceState>}{loading&&<WorkspaceState kind="loading">Tracing dependency paths…</WorkspaceState>}{error&&<WorkspaceState kind="error">{error}</WorkspaceState>}{repositoryId&&fileId&&!loading&&!error&&!items.length&&<WorkspaceState kind="empty">No affected files were found.</WorkspaceState>}{items.map(item=><div className="impact-row" key={`${item.file_id}-${item.depth}`}><strong>{item.path}</strong><span className="impact-tag">depth {item.depth}</span><small>{item.dependency_path.map(path=>path.path).join(' → ')}</small></div>)}</div></WorkspacePanel></>
}
