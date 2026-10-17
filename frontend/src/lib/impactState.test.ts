import { describe, expect, it } from 'vitest'
import { impactRequestReducer, type ImpactRequestState } from './impactState'

describe('impactRequestReducer', () => {
  it('clears a failed request before the next file request and accepts the new result', () => {
    const initial: ImpactRequestState<{ fileId: number }> = { requestId: 0, loading: false, error: '', result: null }
    const failed = impactRequestReducer(initial, { type: 'start', requestId: 1 })
    const afterFailure = impactRequestReducer(failed, { type: 'error', requestId: 1, error: 'File A failed' })
    const next = impactRequestReducer(afterFailure, { type: 'start', requestId: 2 })
    const recovered = impactRequestReducer(next, { type: 'success', requestId: 2, result: { fileId: 2 } })

    expect(next).toMatchObject({ loading: true, error: '', result: null, requestId: 2 })
    expect(recovered).toMatchObject({ loading: false, error: '', result: { fileId: 2 } })
  })

  it('ignores a stale response from the previous file', () => {
    const state: ImpactRequestState<{ fileId: number }> = { requestId: 2, loading: true, error: '', result: null }
    const stale = impactRequestReducer(state, { type: 'success', requestId: 1, result: { fileId: 1 } })
    expect(stale).toBe(state)
  })

  it('clears data and invalidates in-flight work when no file is selected', () => {
    const state: ImpactRequestState<{ fileId: number }> = { requestId: 2, loading: true, error: 'old error', result: { fileId: 1 } }
    expect(impactRequestReducer(state, { type: 'clear' })).toEqual({ requestId: 3, loading: false, error: '', result: null })
  })
})
