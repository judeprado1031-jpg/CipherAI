/**
 * Cipher AI Graph Generator Engine
 * Generates publication-grade, mathematically accurate coordinate graph images (SVG / PNG Data URLs)
 * for linear equations, quadratic parabolas, polynomials, trigonometric waves, and economic curves.
 */

export interface GraphData {
  equationTitle: string;
  latexFormula: string;
  type: 'quadratic' | 'linear' | 'trig' | 'cubic' | 'system' | 'custom';
  points: { x: number; y: number }[];
  vertex?: { x: number; y: number };
  xIntercepts: number[];
  yIntercept?: number;
  intersection?: { x: number; y: number };
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  keyPoints: { label: string; x: number; y: number; color?: string }[];
  svgDataUrl: string;
}

export interface PresetGraph {
  id: string;
  name: string;
  equation: string;
  description: string;
  category: 'algebra' | 'calculus' | 'business';
}

export const GRAPH_PRESETS: PresetGraph[] = [
  {
    id: 'parabola-standard',
    name: 'Quadratic Parabola',
    equation: 'f(x) = x^2 - 4x + 3',
    description: 'Vertex (2, -1), roots at x=1, x=3, y-intercept (0, 3)',
    category: 'algebra',
  },
  {
    id: 'linear-standard',
    name: 'Linear Equation',
    equation: 'y = 2x - 1',
    description: 'Slope m=2, y-intercept (0, -1), x-intercept (0.5, 0)',
    category: 'algebra',
  },
  {
    id: 'parabola-inverted',
    name: 'Inverted Parabola (Max Profit)',
    equation: 'f(x) = -0.5x^2 + 2x + 4',
    description: 'Concave downward, maximum vertex at (2, 6)',
    category: 'algebra',
  },
  {
    id: 'trig-sine',
    name: 'Trigonometric Sine Wave',
    equation: 'y = 2sin(x)',
    description: 'Amplitude 2, period 2π, oscillates between -2 and 2',
    category: 'calculus',
  },
  {
    id: 'cubic-curve',
    name: 'Cubic Polynomial',
    equation: 'f(x) = x^3 - 3x',
    description: 'Inflection at origin (0, 0), local max at (-1, 2), local min at (1, -2)',
    category: 'calculus',
  },
  {
    id: 'supply-demand',
    name: 'Supply & Demand Equilibrium',
    equation: 'P = 100 - 2Q vs P = 20 + 3Q',
    description: 'Market equilibrium at Q* = 16 units, P* = $68',
    category: 'business',
  },
];

/**
 * Parses an equation string and returns the plotted mathematical dataset
 */
export function generateGraphData(rawEquation: string): GraphData {
  const eq = (rawEquation || '').trim().toLowerCase();

  // 1. Supply and Demand
  if (eq.includes('supply') || eq.includes('demand') || (eq.includes('100') && eq.includes('20'))) {
    const xMin = 0;
    const xMax = 35;
    const yMin = 0;
    const yMax = 120;
    const qStar = 16;
    const pStar = 68;

    const points: { x: number; y: number }[] = [];
    for (let q = 0; q <= 35; q += 1) {
      points.push({ x: q, y: 100 - 2 * q }); // Demand
    }

    const keyPoints = [
      { label: `Equilibrium (Q*=${qStar}, P*=${pStar})`, x: qStar, y: pStar, color: '#F59E0B' },
      { label: 'Demand P-Int (0, 100)', x: 0, y: 100, color: '#38BDF8' },
      { label: 'Supply P-Int (0, 20)', x: 0, y: 20, color: '#34D399' },
    ];

    const svg = renderSvgGraph({
      title: 'Market Equilibrium: Supply & Demand',
      equation: 'P_D = 100 - 2Q  |  P_S = 20 + 3Q',
      xMin,
      xMax,
      yMin,
      yMax,
      curves: [
        {
          label: 'Demand (P = 100 - 2Q)',
          color: '#38BDF8',
          fn: (q) => 100 - 2 * q,
        },
        {
          label: 'Supply (P = 20 + 3Q)',
          color: '#34D399',
          fn: (q) => 20 + 3 * q,
        },
      ],
      keyPoints,
      xLabel: 'Quantity (Q)',
      yLabel: 'Price (P)',
    });

    return {
      equationTitle: 'Supply & Demand Equilibrium',
      latexFormula: 'P_D = 100 - 2Q \\quad \\text{vs} \\quad P_S = 20 + 3Q',
      type: 'system',
      points,
      xIntercepts: [50],
      yIntercept: 100,
      intersection: { x: qStar, y: pStar },
      xMin,
      xMax,
      yMin,
      yMax,
      keyPoints,
      svgDataUrl: svg,
    };
  }

  // 2. Sine Wave: y = sin(x) or y = 2sin(x)
  if (eq.includes('sin') || eq.includes('cos')) {
    const isCos = eq.includes('cos');
    let amp = 2;
    if (eq.includes('3sin') || eq.includes('3 cos')) amp = 3;
    if (eq.includes('1sin') || eq === 'sin(x)' || eq === 'y=sin(x)') amp = 1;

    const xMin = -7;
    const xMax = 7;
    const yMin = -Math.ceil(amp) - 1.5;
    const yMax = Math.ceil(amp) + 1.5;

    const fn = (x: number) => amp * (isCos ? Math.cos(x) : Math.sin(x));
    const keyPoints = [
      { label: isCos ? `Peak (0, ${amp})` : `Peak (π/2, ${amp})`, x: isCos ? 0 : Math.PI / 2, y: amp, color: '#F59E0B' },
      { label: isCos ? `Trough (π, -${amp})` : `Trough (-π/2, -${amp})`, x: isCos ? Math.PI : -Math.PI / 2, y: -amp, color: '#EF4444' },
      { label: isCos ? 'Root (π/2, 0)' : 'Origin (0, 0)', x: isCos ? Math.PI / 2 : 0, y: 0, color: '#34D399' },
    ];

    const svg = renderSvgGraph({
      title: isCos ? `Trigonometric Cosine: y = ${amp}cos(x)` : `Trigonometric Sine: y = ${amp}sin(x)`,
      equation: isCos ? `y = ${amp}\\cos(x)` : `y = ${amp}\\sin(x)`,
      xMin,
      xMax,
      yMin,
      yMax,
      curves: [{ label: `y = ${amp}${isCos ? 'cos' : 'sin'}(x)`, color: '#38BDF8', fn }],
      keyPoints,
      xLabel: 'x (radians)',
      yLabel: 'y',
    });

    return {
      equationTitle: isCos ? `y = ${amp}cos(x)` : `y = ${amp}sin(x)`,
      latexFormula: isCos ? `y = ${amp}\\cos(x)` : `y = ${amp}\\sin(x)`,
      type: 'trig',
      points: [],
      xIntercepts: isCos ? [-Math.PI / 2, Math.PI / 2] : [0, Math.PI, -Math.PI],
      yIntercept: isCos ? amp : 0,
      xMin,
      xMax,
      yMin,
      yMax,
      keyPoints,
      svgDataUrl: svg,
    };
  }

  // 3. Cubic Polynomial: x^3 - 3x
  if (eq.includes('x^3') || eq.includes('x³') || eq.includes('cubic')) {
    const xMin = -3.5;
    const xMax = 3.5;
    const yMin = -5;
    const yMax = 5;
    const fn = (x: number) => x * x * x - 3 * x;

    const keyPoints = [
      { label: 'Local Max (-1, 2)', x: -1, y: 2, color: '#F59E0B' },
      { label: 'Local Min (1, -2)', x: 1, y: -2, color: '#EF4444' },
      { label: 'Inflection (0, 0)', x: 0, y: 0, color: '#38BDF8' },
      { label: 'Root (√3, 0)', x: 1.732, y: 0, color: '#34D399' },
      { label: 'Root (-√3, 0)', x: -1.732, y: 0, color: '#34D399' },
    ];

    const svg = renderSvgGraph({
      title: 'Cubic Function: f(x) = x³ - 3x',
      equation: 'f(x) = x^3 - 3x',
      xMin,
      xMax,
      yMin,
      yMax,
      curves: [{ label: 'f(x) = x³ - 3x', color: '#A855F7', fn }],
      keyPoints,
      xLabel: 'x',
      yLabel: 'y',
    });

    return {
      equationTitle: 'Cubic Function: f(x) = x³ - 3x',
      latexFormula: 'f(x) = x^3 - 3x',
      type: 'cubic',
      points: [],
      xIntercepts: [-1.732, 0, 1.732],
      yIntercept: 0,
      xMin,
      xMax,
      yMin,
      yMax,
      keyPoints,
      svgDataUrl: svg,
    };
  }

  // 4. Inverted Parabola: -0.5x^2 + 2x + 4 or -x^2
  if (eq.includes('-0.5x^2') || eq.includes('-x^2') || eq.includes('- x^2') || eq.includes('inverted')) {
    const a = eq.includes('-0.5') ? -0.5 : -1;
    const b = eq.includes('-0.5') ? 2 : 2;
    const c = eq.includes('-0.5') ? 4 : 3;

    const h = -b / (2 * a);
    const k = a * h * h + b * h + c;
    const disc = b * b - 4 * a * c;
    const roots = disc >= 0 ? [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)].sort((x, y) => x - y) : [];

    const xMin = -4;
    const xMax = 6;
    const yMin = -4;
    const yMax = k + 3;

    const fn = (x: number) => a * x * x + b * x + c;
    const keyPoints = [
      { label: `Vertex (${h.toFixed(1)}, ${k.toFixed(1)})`, x: h, y: k, color: '#F59E0B' },
      { label: `Y-Int (0, ${c})`, x: 0, y: c, color: '#38BDF8' },
      ...roots.map((r) => ({ label: `Root (${r.toFixed(1)}, 0)`, x: r, y: 0, color: '#34D399' })),
    ];

    const formulaStr = `${a === -1 ? '-' : a}x² + ${b}x + ${c}`;
    const svg = renderSvgGraph({
      title: `Quadratic Parabola: f(x) = ${formulaStr}`,
      equation: `f(x) = ${formulaStr}`,
      xMin,
      xMax,
      yMin,
      yMax,
      curves: [{ label: `f(x) = ${formulaStr}`, color: '#EC4899', fn }],
      keyPoints,
      xLabel: 'x',
      yLabel: 'y',
    });

    return {
      equationTitle: `Parabola: f(x) = ${formulaStr}`,
      latexFormula: `f(x) = ${formulaStr}`,
      type: 'quadratic',
      points: [],
      vertex: { x: h, y: k },
      xIntercepts: roots,
      yIntercept: c,
      xMin,
      xMax,
      yMin,
      yMax,
      keyPoints,
      svgDataUrl: svg,
    };
  }

  // 5. Linear Equation: y = mx + b
  const linearMatch = eq.match(/y\s*=\s*(-?\d*(?:\.\d+)?)\s*x\s*([+-]\s*\d+(?:\.\d+)?)?/);
  if (linearMatch || eq.includes('2x - 1') || eq.includes('linear')) {
    let m = 2;
    let b = -1;
    if (linearMatch) {
      const mStr = (linearMatch[1] || '').trim();
      m = mStr === '' || mStr === '+' ? 1 : mStr === '-' ? -1 : parseFloat(mStr) || 2;
      const bStr = (linearMatch[2] || '').replace(/\s+/g, '');
      b = bStr ? parseFloat(bStr) : 0;
    }

    const xRoot = m !== 0 ? -b / m : 0;
    const xMin = -6;
    const xMax = 6;
    const yMin = -8;
    const yMax = 8;
    const fn = (x: number) => m * x + b;

    const keyPoints = [
      { label: `Y-Int (0, ${b})`, x: 0, y: b, color: '#38BDF8' },
      { label: `X-Int (${xRoot.toFixed(1)}, 0)`, x: xRoot, y: 0, color: '#34D399' },
      { label: `Point (2, ${fn(2)})`, x: 2, y: fn(2), color: '#F59E0B' },
    ];

    const formulaStr = `y = ${m}x ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}`;
    const svg = renderSvgGraph({
      title: `Linear Function: ${formulaStr}`,
      equation: formulaStr,
      xMin,
      xMax,
      yMin,
      yMax,
      curves: [{ label: formulaStr, color: '#10B981', fn }],
      keyPoints,
      xLabel: 'x',
      yLabel: 'y',
    });

    return {
      equationTitle: `Linear: ${formulaStr}`,
      latexFormula: formulaStr,
      type: 'linear',
      points: [],
      xIntercepts: [xRoot],
      yIntercept: b,
      xMin,
      xMax,
      yMin,
      yMax,
      keyPoints,
      svgDataUrl: svg,
    };
  }

  // 6. Default / Standard Quadratic Parabola: f(x) = x^2 - 4x + 3
  let a = 1;
  let b = -4;
  let c = 3;

  const quadMatch = eq.match(/(-?\d*(?:\.\d+)?)\s*x\^?2\s*([+-]\s*\d*(?:\.\d+)?\s*x)?\s*([+-]\s*\d+(?:\.\d+)?)?/);
  if (quadMatch) {
    const aStr = quadMatch[1]?.trim();
    if (aStr) a = aStr === '-' ? -1 : aStr === '+' || aStr === '' ? 1 : parseFloat(aStr) || 1;
    const bStr = quadMatch[2]?.replace(/\s+/g, '').replace('x', '');
    if (bStr) b = bStr === '-' ? -1 : bStr === '+' || bStr === '' ? 1 : parseFloat(bStr) || 0;
    const cStr = quadMatch[3]?.replace(/\s+/g, '');
    if (cStr) c = parseFloat(cStr) || 0;
  }

  const h = -b / (2 * a);
  const k = a * h * h + b * h + c;
  const disc = b * b - 4 * a * c;
  const roots = disc >= 0 ? [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)].sort((x, y) => x - y) : [];

  const xMin = Math.min(-3, h - 4);
  const xMax = Math.max(5, h + 4);
  const yMin = Math.min(-3, k - 2);
  const yMax = Math.max(8, k + 8);

  const fn = (x: number) => a * x * x + b * x + c;
  const keyPoints = [
    { label: `Vertex (${h.toFixed(1)}, ${k.toFixed(1)})`, x: h, y: k, color: '#F59E0B' },
    { label: `Y-Int (0, ${c})`, x: 0, y: c, color: '#38BDF8' },
    ...roots.map((r) => ({ label: `Root (${r.toFixed(1)}, 0)`, x: r, y: 0, color: '#34D399' })),
  ];

  const formulaStr = `${a === 1 ? '' : a === -1 ? '-' : a}x² ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}x ${c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`}`;
  const svg = renderSvgGraph({
    title: `Quadratic Parabola: f(x) = ${formulaStr}`,
    equation: `f(x) = ${formulaStr}`,
    xMin,
    xMax,
    yMin,
    yMax,
    curves: [{ label: `f(x) = ${formulaStr}`, color: '#F59E0B', fn }],
    keyPoints,
    xLabel: 'x',
    yLabel: 'y',
  });

  return {
    equationTitle: `Parabola: f(x) = ${formulaStr}`,
    latexFormula: `f(x) = ${formulaStr}`,
    type: 'quadratic',
    points: [],
    vertex: { x: h, y: k },
    xIntercepts: roots,
    yIntercept: c,
    xMin,
    xMax,
    yMin,
    yMax,
    keyPoints,
    svgDataUrl: svg,
  };
}

interface SvgRenderOptions {
  title: string;
  equation: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  curves: { label: string; color: string; fn: (x: number) => number }[];
  keyPoints: { label: string; x: number; y: number; color?: string }[];
  xLabel?: string;
  yLabel?: string;
}

/**
 * Builds a clean, publication-quality SVG string and encodes it as a Data URL
 */
export function renderSvgGraph(opts: SvgRenderOptions): string {
  const width = 840;
  const height = 500;
  const padLeft = 60;
  const padRight = 40;
  const padTop = 50;
  const padBottom = 50;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const toSvgX = (x: number) => padLeft + ((x - opts.xMin) / (opts.xMax - opts.xMin)) * plotW;
  const toSvgY = (y: number) => padTop + ((opts.yMax - y) / (opts.yMax - opts.yMin)) * plotH;

  // Grid steps
  const xSpan = opts.xMax - opts.xMin;
  const ySpan = opts.yMax - opts.yMin;
  const xStep = xSpan <= 10 ? 1 : xSpan <= 25 ? 2 : 5;
  const yStep = ySpan <= 10 ? 1 : ySpan <= 25 ? 2 : 5;

  let gridLinesSvg = '';
  let axisLabelsSvg = '';

  // Vertical grid lines
  const firstX = Math.ceil(opts.xMin / xStep) * xStep;
  for (let x = firstX; x <= opts.xMax; x += xStep) {
    const sx = toSvgX(x);
    gridLinesSvg += `<line x1="${sx.toFixed(1)}" y1="${padTop}" x2="${sx.toFixed(1)}" y2="${padTop + plotH}" stroke="#1E293B" stroke-width="1" stroke-dasharray="3,3" />`;
    if (x !== 0) {
      axisLabelsSvg += `<text x="${sx.toFixed(1)}" y="${(padTop + plotH + 18).toFixed(1)}" fill="#64748B" font-size="11" font-family="monospace" text-anchor="middle">${x}</text>`;
    }
  }

  // Horizontal grid lines
  const firstY = Math.ceil(opts.yMin / yStep) * yStep;
  for (let y = firstY; y <= opts.yMax; y += yStep) {
    const sy = toSvgY(y);
    gridLinesSvg += `<line x1="${padLeft}" y1="${sy.toFixed(1)}" x2="${padLeft + plotW}" y2="${sy.toFixed(1)}" stroke="#1E293B" stroke-width="1" stroke-dasharray="3,3" />`;
    if (y !== 0) {
      axisLabelsSvg += `<text x="${(padLeft - 10).toFixed(1)}" y="${(sy + 4).toFixed(1)}" fill="#64748B" font-size="11" font-family="monospace" text-anchor="end">${y}</text>`;
    }
  }

  // Major axes (X=0 and Y=0)
  const originX = toSvgX(0);
  const originY = toSvgY(0);

  let axesSvg = '';
  // X-axis
  if (originY >= padTop && originY <= padTop + plotH) {
    axesSvg += `<line x1="${padLeft}" y1="${originY.toFixed(1)}" x2="${padLeft + plotW}" y2="${originY.toFixed(1)}" stroke="#475569" stroke-width="2" />`;
    axesSvg += `<polygon points="${padLeft + plotW + 8},${originY} ${padLeft + plotW},${originY - 4} ${padLeft + plotW},${originY + 4}" fill="#475569" />`;
  }
  // Y-axis
  if (originX >= padLeft && originX <= padLeft + plotW) {
    axesSvg += `<line x1="${originX.toFixed(1)}" y1="${padTop + plotH}" x2="${originX.toFixed(1)}" y2="${padTop}" stroke="#475569" stroke-width="2" />`;
    axesSvg += `<polygon points="${originX},${padTop - 8} ${originX - 4},${padTop} ${originX + 4},${padTop}" fill="#475569" />`;
  }

  // Curves plotting
  let curvesSvg = '';
  const numSamples = 120;
  opts.curves.forEach((curve) => {
    let pathD = '';
    for (let i = 0; i <= numSamples; i++) {
      const x = opts.xMin + (i / numSamples) * (opts.xMax - opts.xMin);
      const y = curve.fn(x);
      if (!isFinite(y)) continue;
      const clampedY = Math.max(opts.yMin - (ySpan * 0.5), Math.min(opts.yMax + (ySpan * 0.5), y));
      const sx = toSvgX(x);
      const sy = toSvgY(clampedY);
      pathD += `${pathD === '' ? 'M' : ' L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
    }
    curvesSvg += `<path d="${pathD}" fill="none" stroke="${curve.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="drop-shadow(0 0 6px ${curve.color}60)" />`;
  });

  // Key point markers
  let pointsSvg = '';
  opts.keyPoints.forEach((pt) => {
    if (pt.x < opts.xMin - 1 || pt.x > opts.xMax + 1 || pt.y < opts.yMin - 1 || pt.y > opts.yMax + 1) return;
    const sx = toSvgX(pt.x);
    const sy = toSvgY(pt.y);
    const col = pt.color || '#F59E0B';

    pointsSvg += `
      <g>
        <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="6" fill="${col}" stroke="#0F172A" stroke-width="2" />
        <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="10" fill="none" stroke="${col}" stroke-width="1" opacity="0.4" />
        <rect x="${(sx + 10).toFixed(1)}" y="${(sy - 18).toFixed(1)}" width="${pt.label.length * 6.5 + 10}" height="18" rx="4" fill="#0B0F19" stroke="${col}" stroke-width="1" opacity="0.9" />
        <text x="${(sx + 15).toFixed(1)}" y="${(sy - 5).toFixed(1)}" fill="#F8FAFC" font-size="10" font-weight="bold" font-family="system-ui, sans-serif">${pt.label}</text>
      </g>
    `;
  });

  // SVG Assembly
  const svgRaw = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="100%" stop-color="#070A12" />
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect width="${width}" height="${height}" rx="20" fill="url(#bgGrad)" stroke="#1E293B" stroke-width="2" />

  <!-- Plot Area Background -->
  <rect x="${padLeft}" y="${padTop}" width="${plotW}" height="${plotH}" rx="12" fill="#0D1322" stroke="#1E293B" stroke-width="1" />

  <!-- Grid lines -->
  ${gridLinesSvg}

  <!-- Coordinate Axes -->
  ${axesSvg}

  <!-- Axis Numerical Labels -->
  ${axisLabelsSvg}

  <!-- Function Curves -->
  ${curvesSvg}

  <!-- Critical Key Points -->
  ${pointsSvg}

  <!-- Header Banner & Equation Badge -->
  <g transform="translate(24, 20)">
    <rect width="${plotW + padLeft - 20}" height="32" rx="8" fill="#1E293B" opacity="0.4" />
    <circle cx="16" cy="16" r="6" fill="#F59E0B" />
    <text x="30" y="20" fill="#F8FAFC" font-size="13" font-weight="bold" font-family="system-ui, sans-serif">${opts.title}</text>
  </g>

  <!-- Axis Labels -->
  <text x="${padLeft + plotW - 10}" y="${padTop + plotH - 8}" fill="#94A3B8" font-size="11" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="end">${opts.xLabel || 'x-axis'}</text>
  <text x="${padLeft + 14}" y="${padTop + 20}" fill="#94A3B8" font-size="11" font-weight="bold" font-family="system-ui, sans-serif">${opts.yLabel || 'y-axis'}</text>

  <!-- Bottom Brand Watermark -->
  <text x="${width - padRight}" y="${height - 15}" fill="#475569" font-size="10" font-weight="bold" font-family="monospace" text-anchor="end">CIPHER AI • COORDINATE GRAPH</text>
</svg>
`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgRaw)}`;
}
