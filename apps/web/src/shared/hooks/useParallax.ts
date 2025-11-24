'use client';

import { useState, useEffect } from 'react';

export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return offset;
}

export function useParallaxMultiple(speeds: number[]) {
  const [offsets, setOffsets] = useState<number[]>(Array(speeds.length).fill(0));

  useEffect(() => {
    const handleScroll = () => {
      const newOffsets = speeds.map(speed => window.scrollY * speed);
      setOffsets(newOffsets);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speeds]);

  return offsets;
}
