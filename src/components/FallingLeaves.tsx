'use client';

import { useEffect, useState } from 'react';

interface Leaf {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
  rotation: number;
}

const LEAF_COLORS = [
  '#4CAF50',
  '#66BB6A',
  '#81C784',
  '#A5D6A7',
  '#8ECDA8',
  '#2E7D32',
];

const LEAF_SHAPES = [
  // Simple leaf
  'M25 5C25 5 10 15 8 28C6 41 16 48 25 48C34 48 44 41 42 28C40 15 25 5 25 5Z',
  // Rounder leaf
  'M25 8C25 8 12 18 10 30C8 42 18 50 25 50C32 50 42 42 40 30C38 18 25 8 25 8Z',
  // Pointed leaf (birch-like)
  'M25 2C25 2 8 16 6 32C4 48 18 55 25 55C32 55 46 48 44 32C42 16 25 2 25 2Z',
];

export default function FallingLeaves() {
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  useEffect(() => {
    const count = 18;
    const generated: Leaf[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 16 + Math.random() * 20,
      duration: 10 + Math.random() * 8,
      delay: Math.random() * 10,
      opacity: 0.35 + Math.random() * 0.45,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      rotation: Math.random() * 360,
    }));
    setLeaves(generated);
  }, []);

  if (leaves.length === 0) return null;

  return (
    <div className="leaf-container" aria-hidden="true">
      {leaves.map((leaf) => {
        const shapeIndex = leaf.id % LEAF_SHAPES.length;
        return (
          <div
            key={leaf.id}
            className="leaf"
            style={{
              left: `${leaf.left}%`,
              width: `${leaf.size}px`,
              height: `${leaf.size}px`,
              opacity: leaf.opacity,
              animationDuration: `${leaf.duration}s`,
              animationDelay: `${leaf.delay}s`,
              transform: `rotate(${leaf.rotation}deg)`,
            }}
          >
            <svg
              viewBox="0 0 50 55"
              width={leaf.size}
              height={leaf.size}
              fill={leaf.color}
            >
              <path d={LEAF_SHAPES[shapeIndex]} />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
