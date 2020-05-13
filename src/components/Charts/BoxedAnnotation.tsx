import React, { useRef } from 'react';
import { Group } from '@vx/group';
import useSvgBox from './useSvgBox';

export const BoxedAnnotation = ({
  x,
  y,
  text,
  padding = 4,
}: {
  x: number;
  y: number;
  text: string;
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
      <text ref={textRef}>{text}</text>
    </Group>
  );
};

export default BoxedAnnotation;
