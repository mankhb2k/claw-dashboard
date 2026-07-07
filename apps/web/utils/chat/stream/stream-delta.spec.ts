import { accumulateStreamDelta } from './stream-delta'

describe('accumulateStreamDelta', () => {
  it('returns chunk when previous is empty', () => {
    expect(accumulateStreamDelta('', 'pong')).toBe('pong')
  })

  it('appends incremental chunks', () => {
    expect(accumulateStreamDelta('p', 'ong')).toBe('pong')
  })

  it('replaces with cumulative snapshot', () => {
    expect(accumulateStreamDelta('p', 'pong only')).toBe('pong only')
  })

  it('keeps longer previous when chunk is a prefix', () => {
    expect(accumulateStreamDelta('pong only', 'pong')).toBe('pong only')
  })
})
