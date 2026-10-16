import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

function seeded(seed: number) { const value = Math.sin(seed * 12.9898) * 43758.5453; return value - Math.floor(value) }

export function RepositoryLandscape() {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const element = host.current
    if (!element) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }) } catch { setFailed(true); return }
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(34, 1, .1, 100)
    camera.position.set(0, 0, 12)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); renderer.setClearColor(0x000000, 0); element.appendChild(renderer.domElement)
    const group = new THREE.Group(); scene.add(group)
    const points = Array.from({ length: 18 }, (_, index) => new THREE.Vector3((seeded(index + 3) - .5) * 6, (seeded(index + 13) - .5) * 3.8, (seeded(index + 31) - .5) * 2.8))
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.42, 1), new THREE.MeshBasicMaterial({ color: 0x63e2dc, wireframe: true, transparent: true, opacity: .9 })); core.position.set(0, 0, .4); group.add(core)
    const nodes: THREE.Mesh[] = []
    points.forEach((point, index) => { const size = .08 + seeded(index + 73) * .16; const material = new THREE.MeshBasicMaterial({ color: index % 5 === 0 ? 0xf2b56b : index % 3 === 0 ? 0xb8a7ff : 0x63e2dc, transparent: true, opacity: .8 }); const node = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), material); node.position.copy(point); group.add(node); nodes.push(node) })
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x4b9ea0, transparent: true, opacity: .28 }); points.forEach((point, index) => { const target = points[(index * 5 + 3) % points.length]; const geometry = new THREE.BufferGeometry().setFromPoints([point, target]); group.add(new THREE.Line(geometry, lineMaterial)) })
    const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0xf2b56b }); const pulses = points.slice(0, 5).map((point, index) => { const pulse = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 8), pulseMaterial); pulse.userData = { from: point, to: points[(index * 5 + 3) % points.length], phase: seeded(index + 90) }; group.add(pulse); return pulse })
    const resize = () => { const width = element.clientWidth || 1; const height = element.clientHeight || 1; camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false) }; const observer = new ResizeObserver(resize); observer.observe(element); resize()
    const onContextLost = (event: Event) => { event.preventDefault(); setFailed(true) }; renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; let frame = 0; let raf = 0; let last = 0
    const animate = (time: number) => { if (document.hidden) { raf = requestAnimationFrame(animate); return }; const delta = Math.min((time - last) / 1000, .05); last = time; if (!reduced) { group.rotation.y += delta * .035; group.rotation.x = Math.sin(time * .00025) * .08; pulses.forEach((pulse, index) => { const progress = (time * .00012 + pulse.userData.phase + index * .07) % 1; pulse.position.lerpVectors(pulse.userData.from, pulse.userData.to, progress) }) } renderer.render(scene, camera); raf = requestAnimationFrame(animate) }; raf = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(raf); observer.disconnect(); renderer.domElement.removeEventListener('webglcontextlost', onContextLost); group.traverse(object => { const disposable = object as THREE.Mesh; disposable.geometry?.dispose(); const material = disposable.material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(material)) material.forEach(item => item.dispose()); else material?.dispose() }); renderer.dispose(); renderer.domElement.remove() }
  }, [])
  return <div ref={host} className="repository-landscape" aria-hidden="true">{failed && <div className="landscape-fallback"><span>●</span><span>╲</span><span>●</span><span>╱</span><span>●</span></div>}</div>
}
