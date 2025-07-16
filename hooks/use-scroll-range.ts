'use client'

import { useEffect, useState, useMemo } from 'react'

export function useScrollRange(
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const value = useMemo(() => {
    const newValue =
      ((scrollY - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
    const largest = Math.max(outMin, outMax)
    const smallest = Math.min(outMin, outMax)
    return Math.min(Math.max(newValue, smallest), largest)
  }, [scrollY, inMin, inMax, outMin, outMax])

  return value
}