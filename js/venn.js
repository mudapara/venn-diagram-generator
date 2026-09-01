const COLORS = [
  { fill: "#ff6b8a", stroke: "#e04d6d" },
  { fill: "#6c8cff", stroke: "#4a6de0" },
  { fill: "#4dd9a8", stroke: "#2db88a" },
  { fill: "#ffb84d", stroke: "#e09a2d" },
  { fill: "#b07cff", stroke: "#8f5ce0" },
  { fill: "#ff7eb3", stroke: "#e05a96" },
  { fill: "#5ce1e6", stroke: "#3bb8bd" },
  { fill: "#f4d35e", stroke: "#d4b340" },
  { fill: "#ee6c4d", stroke: "#cc5038" },
  { fill: "#7ec8e3", stroke: "#5ea8c3" },
  { fill: "#c9b1ff", stroke: "#a991df" },
  { fill: "#ff9f68", stroke: "#df7f48" },
];

const VIEW_SIZE = 500;
const CENTER = VIEW_SIZE / 2;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function maxChordFactor(count) {
  const maxK = Math.floor(count / 2);
  return 2 * Math.sin((maxK * Math.PI) / count);
}

function ringLayout(count, radius, overlapFactor) {
  const padding = 24;
  const maxChord = maxChordFactor(count);
  const touchRingRadius = (2 * radius) / maxChord;
  const overlapScale = 0.48 + ((100 - overlapFactor) / 100) * 0.44;
  let ringRadius = touchRingRadius * overlapScale;

  const maxRingRadius = CENTER - padding - radius;
  ringRadius = Math.min(ringRadius, maxRingRadius);

  const centers = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    centers.push({
      x: CENTER + Math.cos(angle) * ringRadius,
      y: CENTER + Math.sin(angle) * ringRadius,
    });
  }

  return centers;
}

function getLayout(count, radius, overlapFactor) {
  const spread = (overlapFactor / 100) * radius;

  if (count === 1) {
    return [{ x: CENTER, y: CENTER }];
  }

  if (count === 2) {
    const offset = radius - spread * 0.55;
    return [
      { x: CENTER - offset, y: CENTER },
      { x: CENTER + offset, y: CENTER },
    ];
  }

  if (count === 3) {
    const offset = radius * 0.95 - spread * 0.35;
    return [
      { x: CENTER, y: CENTER - offset * 0.75 },
      { x: CENTER - offset * 0.87, y: CENTER + offset * 0.5 },
      { x: CENTER + offset * 0.87, y: CENTER + offset * 0.5 },
    ];
  }

  if (count === 4) {
    const offset = radius * 0.82 - spread * 0.25;
    return [
      { x: CENTER, y: CENTER - offset },
      { x: CENTER - offset, y: CENTER },
      { x: CENTER + offset, y: CENTER },
      { x: CENTER, y: CENTER + offset },
    ];
  }

  return ringLayout(count, radius, overlapFactor);
}

function labelPosition(center, index, count, circleRadius) {
  const dx = center.x - CENTER;
  const dy = center.y - CENTER;
  const length = Math.hypot(dx, dy) || 1;
  const angle = Math.atan2(dy, dx);

  if (count <= 4) {
    const push = count <= 2 ? 42 : count === 3 ? 38 : 34;
    return {
      x: center.x + (dx / length) * push,
      y: center.y + (dy / length) * push,
    };
  }

  const baseOffset = circleRadius * 0.35 + 18 + Math.max(0, count - 10) * 1.5;
  const labelRadius = Math.max(length + baseOffset, circleRadius + 24 + Math.max(0, count - 12) * 2);

  return {
    x: CENTER + Math.cos(angle) * labelRadius,
    y: CENTER + Math.sin(angle) * labelRadius,
  };
}

function regionCount(circleCount) {
  return 2 ** circleCount;
}

function renderVenn({ count, labels, radius, overlap }) {
  const safeCount = clamp(Math.round(count), 1, 30);
  const safeRadius = clamp(radius, 60, 160);
  const safeOverlap = clamp(overlap, 20, 80);
  const centers = getLayout(safeCount, safeRadius, safeOverlap);

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${VIEW_SIZE} ${VIEW_SIZE}`);
  svg.setAttribute("xmlns", svgNS);

  const defs = document.createElementNS(svgNS, "defs");
  const style = document.createElementNS(svgNS, "style");
  const labelSize =
    safeCount <= 7 ? 15 : safeCount <= 12 ? 13 : safeCount <= 20 ? 11 : 9;
  style.textContent = `
    .venn-circle { mix-blend-mode: multiply; }
    .venn-label {
      font-family: "Noto Sans JP", sans-serif;
      font-size: ${labelSize}px;
      font-weight: 600;
      fill: #1a1d27;
      text-anchor: middle;
      dominant-baseline: middle;
      pointer-events: none;
    }
  `;
  defs.appendChild(style);
  svg.appendChild(defs);

  const group = document.createElementNS(svgNS, "g");

  centers.forEach((center, index) => {
    const circle = document.createElementNS(svgNS, "circle");
    const color = COLORS[index % COLORS.length];
    circle.setAttribute("cx", center.x.toFixed(2));
    circle.setAttribute("cy", center.y.toFixed(2));
    circle.setAttribute("r", safeRadius.toFixed(2));
    circle.setAttribute("fill", color.fill);
    circle.setAttribute("fill-opacity", "0.55");
    circle.setAttribute("stroke", color.stroke);
    circle.setAttribute("stroke-width", "2.5");
    circle.setAttribute("class", "venn-circle");
    group.appendChild(circle);
  });

  svg.appendChild(group);

  centers.forEach((center, index) => {
    const labelPoint = labelPosition(center, index, safeCount, safeRadius);
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", labelPoint.x.toFixed(2));
    text.setAttribute("y", labelPoint.y.toFixed(2));
    text.setAttribute("class", "venn-label");
    text.textContent = labels[index] || String.fromCharCode(65 + index);
    svg.appendChild(text);
  });

  return {
    svg,
    count: safeCount,
    regions: regionCount(safeCount),
  };
}

function getColor(index) {
  return COLORS[index % COLORS.length].fill;
}
