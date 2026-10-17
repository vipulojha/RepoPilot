export type ImpactRequestState<T> = {
  requestId: number
  loading: boolean
  error: string
  result: T | null
}

export type ImpactRequestAction<T> =
  | { type: 'start'; requestId: number }
  | { type: 'success'; requestId: number; result: T }
  | { type: 'error'; requestId: number; error: string }
  | { type: 'clear' }

export function impactRequestReducer<T>(state: ImpactRequestState<T>, action: ImpactRequestAction<T>): ImpactRequestState<T> {
  if (action.type === 'clear') return { requestId: state.requestId + 1, loading: false, error: '', result: null }
  if (action.requestId !== state.requestId && action.type !== 'start') return state
  if (action.type === 'start') return { requestId: action.requestId, loading: true, error: '', result: null }
  if (action.type === 'success') return { ...state, loading: false, error: '', result: action.result }
  return { ...state, loading: false, error: action.error, result: null }
}
