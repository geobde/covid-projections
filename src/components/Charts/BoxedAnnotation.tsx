import React, { useRef } from 'react';
import { Group } from '@vx/group';
import useSvgBox from './useSvgBox';

export const BoxedAnnotation = ({
  x,
  y,
  children,
  xPadding = 4,
  yPadding = 6,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  xPadding?: number;
  yPadding?: number;
}) => {
  const textRef = useRef<SVGTextElement>(null);
  const { top, left, height, width } = useSvgBox(textRef);
  return (
    <Group left={x} top={y}>
      <rect
        y={top - yPadding}
        x={left - xPadding}
        width={width + 2 * xPadding}
        height={height + 2 * yPadding}
      />
      <text ref={textRef}>{children}</text>
    </Group>
  );
};

export default BoxedAnnotation;
