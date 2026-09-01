const countInput = document.getElementById("circle-count");
const decreaseBtn = document.getElementById("count-decrease");
const increaseBtn = document.getElementById("count-increase");
const labelInputsContainer = document.getElementById("label-inputs");
const resetLabelsBtn = document.getElementById("reset-labels");
const sizeInput = document.getElementById("circle-size");
const overlapInput = document.getElementById("overlap");
const generateBtn = document.getElementById("generate-btn");
const downloadSvgBtn = document.getElementById("download-svg");
const downloadPngBtn = document.getElementById("download-png");
const vennContainer = document.getElementById("venn-container");
const regionInfo = document.getElementById("region-info");

let currentSvg = null;

function getCount() {
  return Number.parseInt(countInput.value, 10) || 1;
}

function setCount(value) {
  const next = Math.min(30, Math.max(1, value));
  countInput.value = String(next);
  rebuildLabelInputs();
}

function defaultLabel(index) {
  return String.fromCharCode(65 + index);
}

function rebuildLabelInputs() {
  const count = getCount();
  const previous = [...labelInputsContainer.querySelectorAll(".label-input")].map(
    (input) => input.value
  );

  labelInputsContainer.replaceChildren();

  for (let i = 0; i < count; i += 1) {
    const row = document.createElement("div");
    row.className = "label-row";

    const swatch = document.createElement("span");
    swatch.className = "label-swatch";
    swatch.style.background = getColor(i);

    const input = document.createElement("input");
    input.type = "text";
    input.className = "label-input";
    input.placeholder = `集合 ${defaultLabel(i)}`;
    input.value = previous[i] ?? defaultLabel(i);
    input.dataset.index = String(i);
    input.addEventListener("input", generate);

    row.append(swatch, input);
    labelInputsContainer.appendChild(row);
  }
}

function getLabels() {
  return [...labelInputsContainer.querySelectorAll(".label-input")].map(
    (input) => input.value.trim() || defaultLabel(Number(input.dataset.index))
  );
}

function generate() {
  const result = renderVenn({
    count: getCount(),
    labels: getLabels(),
    radius: Number(sizeInput.value),
    overlap: Number(overlapInput.value),
  });

  vennContainer.replaceChildren(result.svg);
  currentSvg = result.svg;

  const regions = regionCount(result.count);
  const note =
    result.count <= 4
      ? `理論上 ${regions} 領域`
      : `参考レイアウト（${result.count}円以上は完全なベン図にはなりません）`;
  regionInfo.textContent = `${result.count}個の円 → ${note}`;
}

function downloadSvg() {
  if (!currentSvg) return;

  const clone = currentSvg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const source = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, `venn-${getCount()}.svg`);
}

function downloadPng() {
  if (!currentSvg) return;

  const clone = currentSvg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const source = new XMLSerializer().serializeToString(clone);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fafbfd";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, `venn-${getCount()}.png`);
    });
  };
  image.src = url;
}

function triggerDownload(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

decreaseBtn.addEventListener("click", () => {
  setCount(getCount() - 1);
  generate();
});

increaseBtn.addEventListener("click", () => {
  setCount(getCount() + 1);
  generate();
});

countInput.addEventListener("change", () => {
  setCount(getCount());
  generate();
});

resetLabelsBtn.addEventListener("click", () => {
  labelInputsContainer.querySelectorAll(".label-input").forEach((input, index) => {
    input.value = defaultLabel(index);
  });
  generate();
});

sizeInput.addEventListener("input", generate);
overlapInput.addEventListener("input", generate);
generateBtn.addEventListener("click", generate);
downloadSvgBtn.addEventListener("click", downloadSvg);
downloadPngBtn.addEventListener("click", downloadPng);

rebuildLabelInputs();
generate();
