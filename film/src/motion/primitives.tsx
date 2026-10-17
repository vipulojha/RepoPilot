import React, {CSSProperties, ReactNode} from 'react';
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type Range = {from: number; to: number};
type Point = {x: number; y: number};

const progress = (frame: number, range: Range, easing = Easing.inOut(Easing.cubic)) =>
  interpolate(frame, [range.from, range.to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

const animatedStyle = (opacity: number, scale = 1, x = 0, y = 0): CSSProperties => ({
  opacity,
  scale,
  translate: `${x}px ${y}px`,
});

type CameraViewportProps = {children: ReactNode; range?: Range; scale?: number; x?: number; y?: number; className?: string; style?: CSSProperties};
const CameraViewport: React.FC<CameraViewportProps> = ({children, range = {from: 0, to: 30}, scale = 1.08, x = 0, y = 0, className, style}) => {
  const frame = useCurrentFrame();
  const amount = progress(frame, range);
  return <div className={className} style={{...style, ...animatedStyle(1, interpolate(amount, [0, 1], [1, scale]), x * amount, y * amount)}}>{children}</div>;
};

export type SignalPulseProps = {children: ReactNode; range?: Range; maxScale?: number; className?: string; style?: CSSProperties};
export const SignalPulse: React.FC<SignalPulseProps> = ({children, range = {from: 0, to: 18}, maxScale = 1.12, className, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pulse = spring({frame: frame - range.from, fps, config: {damping: 14, stiffness: 180, mass: 0.6}});
  const visible = frame >= range.from && frame <= range.to;
  return <div className={className} style={{...style, ...animatedStyle(visible ? 1 : 0, 1 + Math.min(pulse, 1) * (maxScale - 1))}}>{children}</div>;
};

export type ProgressiveGraphEdgeProps = {d: string; range?: Range; color?: string; width?: number; dashArray?: string; className?: string};
export const ProgressiveGraphEdge: React.FC<ProgressiveGraphEdgeProps> = ({d, range = {from: 0, to: 24}, color = 'currentColor', width = 2, dashArray, className}) => {
  const frame = useCurrentFrame();
  const amount = progress(frame, range);
  return <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashArray ?? "1"} strokeDashoffset={dashArray ? undefined : 1 - amount} className={className} />;
};

export type GraphNodeActivationProps = {children: ReactNode; range?: Range; className?: string; style?: CSSProperties};
export const GraphNodeActivation: React.FC<GraphNodeActivationProps> = ({children, range = {from: 0, to: 16}, className, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const value = spring({frame: frame - range.from, fps, config: {damping: 12, stiffness: 220, mass: 0.45}});
  return <div className={className} style={{...style, ...animatedStyle(interpolate(value, [0, 1], [0, 1]), interpolate(value, [0, 1], [0.72, 1]))}}>{children}</div>;
};

export type CodeScanBeamProps = {children?: ReactNode; range?: Range; color?: string; width?: number; className?: string; style?: CSSProperties};
export const CodeScanBeam: React.FC<CodeScanBeamProps> = ({children, range = {from: 0, to: 30}, color = '#68e0b2', width = 2, className, style}) => {
  const frame = useCurrentFrame();
  const amount = progress(frame, range, Easing.inOut(Easing.quad));
  return <div className={className} style={{...style, position: 'relative'}}>{children}<div style={{position: 'absolute', inset: 0, pointerEvents: 'none', backgroundColor: color, width, opacity: amount > 0 && amount < 1 ? 0.9 : 0, scale: 1, translate: `${amount * 100}% 0`}} /></div>;
};

export type TelemetryMetricProps = {value: string | number; resolvedValue?: string | number; range?: Range; className?: string; style?: CSSProperties};
export const TelemetryMetric: React.FC<TelemetryMetricProps> = ({value, resolvedValue = value, range = {from: 0, to: 20}, className, style}) => {
  const frame = useCurrentFrame();
  const amount = progress(frame, range, Easing.out(Easing.quad));
  return <span className={className} style={{...style, ...animatedStyle(1)}}>{typeof value === 'number' && typeof resolvedValue === 'number' ? Math.round(interpolate(amount, [0, 1], [value, resolvedValue])).toLocaleString() : amount < 1 ? value : resolvedValue}</span>;
};

export type CascadeStageProps = {children: ReactNode; index?: number; startFrame?: number; stagger?: number; duration?: number; className?: string; style?: CSSProperties};
export const CascadeStage: React.FC<CascadeStageProps> = ({children, index = 0, startFrame = 0, stagger = 6, duration = 18, className, style}) => {
  const frame = useCurrentFrame();
  const amount = progress(frame, {from: startFrame + index * stagger, to: startFrame + index * stagger + duration});
  return <div className={className} style={{...style, ...animatedStyle(amount, interpolate(amount, [0, 1], [0.96, 1]), 0, interpolate(amount, [0, 1], [10, 0]))}}>{children}</div>;
};

export type SemanticLinePathProps = {children: ReactNode; range?: Range; className?: string; style?: CSSProperties};
export const SemanticLinePath: React.FC<SemanticLinePathProps> = ({children, range = {from: 0, to: 20}, className, style}) => {
  const frame = useCurrentFrame();
  const amount = progress(frame, range);
  return <div className={className} style={{...style, ...animatedStyle(amount, 1, interpolate(amount, [0, 1], [-8, 0]), 0)}}>{children}</div>;
};
