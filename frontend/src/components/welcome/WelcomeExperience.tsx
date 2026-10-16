import { RepositoryLandscape } from './RepositoryLandscape'
import './welcome.css'

type EntryMode = 'local' | 'github' | 'file'
type Props = { onStart: (mode: EntryMode) => void; onExplore: () => void }

export function WelcomeExperience({ onStart, onExplore }: Props) {
  return <main className="welcome-experience">
    <section className="welcome-hero" aria-labelledby="welcome-title">
      <div className="welcome-copy"><p className="welcome-eyebrow">Local-first code intelligence</p><h1 id="welcome-title">Understand the code.<br /><span>See the connections.</span></h1><p className="welcome-lede">Explore unfamiliar repositories, trace dependencies, find risky changes, and understand where your next edit will have an impact.</p><div className="welcome-actions"><button className="button button-primary" onClick={() => onStart('local')}>Add a repository <span aria-hidden="true">↗</span></button><button className="button button-quiet" onClick={onExplore}>Explore how it works</button></div><p className="welcome-note">Start with a local project, a GitHub repository, or one source file.</p></div>
      <div className="welcome-scene"><RepositoryLandscape /><div className="scene-caption"><span>RELATIONSHIP FIELD</span><b>Structure becomes visible.</b></div></div>
    </section>
    <section className="welcome-entries" aria-label="Ways to start"><button onClick={() => onStart('local')}><strong>Local Project</strong><span>Open a folder on this computer.</span><b>Choose folder ↗</b></button><button onClick={() => onStart('github')}><strong>GitHub Repository</strong><span>Clone a repository and inspect its structure.</span><b>Clone repository ↗</b></button><button onClick={() => onStart('file')}><strong>Open File</strong><span>Start from the source file you care about.</span><b>Choose file ↗</b></button></section>
    <section className="welcome-how" id="welcome-how"><div><p className="welcome-eyebrow">A clearer way in</p><h2>From source to system.</h2></div><div className="welcome-steps"><article><strong>Add</strong><span>Bring in a local folder, GitHub repository, or file.</span></article><article><strong>Understand</strong><span>Explore files, symbols, dependencies, and search.</span></article><article><strong>Assess</strong><span>Trace impact, inspect tests, and understand risky changes.</span></article></div></section>
  </main>
}
