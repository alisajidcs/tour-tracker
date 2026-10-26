import { describe, expect, it, vi } from 'vitest'
import { resolveChecklistConflict } from '@/features/checklist/conflicts'

describe('resolveChecklistConflict', () => {
  it('merges unique guest and account progress before clearing guest data', async () => {
    const saveCloud = vi.fn(async () => {})
    const clearLocal = vi.fn(async () => {})

    const result = await resolveChecklistConflict(
      'merge',
      ['a', 'b', 'a'],
      ['b', 'c'],
      saveCloud,
      clearLocal,
    )

    expect(result).toEqual(['a', 'b', 'c'])
    expect(saveCloud).toHaveBeenCalledWith(['a', 'b', 'c'])
    expect(clearLocal).toHaveBeenCalledOnce()
    expect(saveCloud.mock.invocationCallOrder[0]).toBeLessThan(
      clearLocal.mock.invocationCallOrder[0],
    )
  })

  it('replaces cloud progress with guest progress when keeping local', async () => {
    const saveCloud = vi.fn(async () => {})
    const clearLocal = vi.fn(async () => {})

    await resolveChecklistConflict(
      'keep-local',
      ['guest-a'],
      ['cloud-a'],
      saveCloud,
      clearLocal,
    )

    expect(saveCloud).toHaveBeenCalledWith(['guest-a'])
    expect(clearLocal).toHaveBeenCalledOnce()
  })

  it('keeps cloud progress and clears guest data without a cloud write', async () => {
    const saveCloud = vi.fn(async () => {})
    const clearLocal = vi.fn(async () => {})

    const result = await resolveChecklistConflict(
      'keep-cloud',
      ['guest-a'],
      ['cloud-a'],
      saveCloud,
      clearLocal,
    )

    expect(result).toEqual(['cloud-a'])
    expect(saveCloud).not.toHaveBeenCalled()
    expect(clearLocal).toHaveBeenCalledOnce()
  })

  it('retains guest data if syncing the selected result fails', async () => {
    const saveCloud = vi.fn(async () => {
      throw new Error('network unavailable')
    })
    const clearLocal = vi.fn(async () => {})

    await expect(
      resolveChecklistConflict(
        'merge',
        ['guest-a'],
        ['cloud-a'],
        saveCloud,
        clearLocal,
      ),
    ).rejects.toThrow('network unavailable')
    expect(clearLocal).not.toHaveBeenCalled()
  })
})
