import React from 'react';

interface CipherLogoProps {
  className?: string;
  size?: number;
  color?: string; // If omitted, defaults to currentColor or dynamic theme
}

export const CipherLogo: React.FC<CipherLogoProps> = ({
  className = 'w-8 h-8',
  size,
  color,
}) => {
  const strokeColor = color || 'currentColor';
  const fillColor = color || 'currentColor';

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Outer circular arc with opening for arrow */}
      <path
        d="M 68 25 A 38 38 0 1 0 78 68"
        stroke={strokeColor}
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* Inner concentric circular arc */}
      <path
        d="M 60 38 A 27 27 0 1 0 72 58"
        stroke={strokeColor}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Horizontal spur forming the monogram inner baseline (aligned at Y=58) */}
      <path
        d="M 72 58 L 56 58"
        stroke={strokeColor}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Growth zigzag line */}
      <path
        d="M 32 68 L 50 48 L 58 56 L 76 30"
        stroke={strokeColor}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arrowhead pointing up-right, perfectly aligned with the zigzag endpoint */}
      <path
        d="M 86 18 L 86 38 L 76 30 L 68 40 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};
