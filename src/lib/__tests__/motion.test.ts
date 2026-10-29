import { describe, expect, it } from 'vitest'

import {
  easeOutExpo,
  fadeIn,
  fadeUp,
  listItem,
  pageSwap,
  riseTransition,
  scaleIn,
  springSnappy,
  staggerFast,
  staggerSlow,
} from '#/lib/motion'

describe('motion tokens', () => {
  it('exports cubic ease and transitions', () => {
    expect(easeOutExpo).toEqual([0.22, 1, 0.36, 1])
    expect(riseTransition.duration).toBeGreaterThan(0)
    expect(springSnappy.type).toBe('spring')
  })

  it('defines enter / exit variants', () => {
    expect(fadeUp.hidden).toBeTruthy()
    expect(fadeUp.show).toBeTruthy()
    expect(fadeIn.show).toBeTruthy()
    expect(scaleIn.show).toBeTruthy()
    expect(listItem.show).toBeTruthy()
    expect(pageSwap.hidden).toBeTruthy()
    expect(pageSwap.exit).toBeTruthy()
  })

  it('staggers children with delay', () => {
    expect(staggerFast.show).toMatchObject(
      expect.objectContaining({
        transition: expect.objectContaining({
          staggerChildren: expect.any(Number),
        }),
      }),
    )
    expect(staggerSlow.show).toMatchObject(
      expect.objectContaining({
        transition: expect.objectContaining({
          staggerChildren: expect.any(Number),
        }),
      }),
    )
  })
})
