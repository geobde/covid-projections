import React, { useRef } from 'react';
import { Group } from '@vx/group';
import useSvgBox from './useSvgBox';

export const BoxedAnnotation = ({
  x,
  y,
  children,
  padding = 4,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  padding?: number;
}) => {
  const textRef = useRef<SVGTextElement>(null);
  const { top, left, height, width } = useSvgBox(textRef);
  return (
    <Group left={x} top={y}>
      <rect
        y={top - padding}
        x={left - padding}
        width={width + 2 * padding}
        height={height + 2 * padding}
      />
      <text ref={textRef}>{children}</text>
    </Group>
  );
};

export default BoxedAnnotation;
