"use client";
import { useEffect, useRef, useState } from "react";

interface MasonryGridProps {
  children: React.ReactNode[];
  columns?: number;
  spacing?: number;
}

export function MasonryGrid({
  children,
  columns = 3,
  spacing = 16,
}: MasonryGridProps) {
  const [columnHeights, setColumnHeights] = useState<number[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const calculateLayout = () => {
      if (!gridRef.current || children.length === 0) return;

      const gridWidth = gridRef.current.offsetWidth;
      const columnWidth = (gridWidth - (columns - 1) * spacing) / columns;
      const heights = new Array(columns).fill(0);

      itemRefs.current.forEach((item, i) => {
        if (!item) {
          console.warn(`Missing ref for item at index ${i}`);
          return;
        }

        // Find the shortest column
        const shortestColumn = heights.indexOf(Math.min(...heights));

        // Position the item
        item.style.width = `${columnWidth}px`;
        item.style.position = "absolute";
        item.style.left = `${shortestColumn * (columnWidth + spacing)}px`;
        item.style.top = `${heights[shortestColumn]}px`;

        // Update the column height
        heights[shortestColumn] += item.offsetHeight + spacing;
      });

      // Update grid container height
      setColumnHeights(heights);
    };

    // Initial calculation
    calculateLayout();

    // Recalculate on window resize
    window.addEventListener("resize", calculateLayout);
    return () => window.removeEventListener("resize", calculateLayout);
  }, [children, columns, spacing]);

  return (
    <div
      ref={gridRef}
      className="relative w-full"
      style={{ height: Math.max(...columnHeights, 0) + "px" }}
    >
      {children.map((child, index) => (
        <div
          key={index}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          className="absolute transition-all duration-300"
        >
          {child}
        </div>
      ))}
    </div>
  );
}
