let connectionsValid = false;
let isPlaying = false;
let animationId = null;
let index = 0;
let currentMode = "";
const signal = [];

window.addEventListener("DOMContentLoaded", () => {
  const sensorImg = document.getElementById("sensor-img");

  sensorImg.onload = () => {
    setupJsPlumb(); // Initialize jsPlumb only after image is loaded
  };

  if (sensorImg.complete) {
    sensorImg.onload();
  }
});

function setupJsPlumb() {
  const instance = jsPlumb.getInstance({
    Connector: ["Bezier", { curviness: 60 }],
    Endpoint: ["Dot", { radius: 6 }],
    EndpointStyle: { fill: "#222", stroke: "#ccc", strokeWidth: 1.8 },
    Container: "image-bar"
  });

  ["sensor-img", "aurdino-img",].forEach(id => {
    instance.draggable(id, { containment: true });
  });

  instance.addEndpoint("sensor-img", {
    uuid: "sensor-in",
    anchor: [.31, 0.68, 1, 0],
    isTarget: true,
    maxConnections: -1,
    overlays: [["Label", { label: "C", location: [-.5, 1.2], cssClass: "endpoint-label" }]]
  });

  instance.addEndpoint("sensor-img", {
    uuid: "sensor-out1",
    anchor: [.7, 0.37, 1, 0],
    isSource: true,
    overlays: [["Label", { label: "G", location: [1.5, .5], cssClass: "endpoint-label" }]]
  });

  instance.addEndpoint("sensor-img", {
    uuid: "sensor-out2",
    anchor: [.7, 0.46, 1, 0],
    isSource: true,
    overlays: [["Label", { label: "S", location: [1.5, .6], cssClass: "endpoint-label" }]]
  });

  instance.addEndpoint("box", {
    uuid: "box-elec1",
    anchor: [.73, 0.26, 1, 0],
    isSource: true,
    overlays: [["Label", { label: "E1", location: [1.85, .3], cssClass: "endpoint-label" }]]
  });

  instance.addEndpoint("box", {
    uuid: "box-elec2",
    anchor: [0.77, .31, 1, 0],
    isSource: true,
    overlays: [["Label", { label: "E2", location: [1.9, .46], cssClass: "endpoint-label" }]]
  });

  instance.addEndpoint("box", {
    uuid: "box-elec3",
    anchor: [0.84, 0.42, 1, 0],
    isSource: true,
    overlays: [["Label", { label: "E3", location: [-0.6, .8], cssClass: "endpoint-label" }]]
  });

  instance.addEndpoint("aurdino-img", {
    uuid: "arduino-in1",
    anchor: [.196, 0.64, -1, 0],
    isTarget: true,
    overlays: [["Label", { label: "V", location: [-.6, .7], cssClass: "endpoint-label" }]]
  });

  instance.addEndpoint("aurdino-img", {
    uuid: "arduino-in2",
    anchor: [.196, 0.895, -1, 0],
    isTarget: true,
    overlays: [["Label", { label: "Ao", location: [-0.6, .65], cssClass: "endpoint-label" }]]
  });

  instance.addEndpoint("aurdino-img", {
    uuid: "arduino-out",
    anchor: [.61, -0.23, -1, 0],
    isSource: true,
    overlays: [["Label", { label: "U", location: [0.6, -.6], cssClass: "endpoint-label" }]]
  });

  instance.addEndpoint("graph", { uuid: "graph-in", anchor: "LeftMiddle", isTarget: true });

  document.getElementById("check-btn").addEventListener("click", () => {
    connectionsValid = checkConnections(instance);
  });

  document.getElementById("restart-btn").addEventListener("click", () => location.reload());
  document.getElementById("print-btn").addEventListener("click", () => window.print());

  document.getElementById("waveform-btn").addEventListener("click", () => {
    if (!connectionsValid) {
      showPopup("❗ Please check connections first.");
      return;
    }

    const waveformOptions = document.getElementById("waveform-options");
    waveformOptions.classList.remove("hidden");
    waveformOptions.innerHTML = "";

    const contractionBtn = document.createElement("button");
    contractionBtn.textContent = "CONTRACTION";
    contractionBtn.className = "round-btn";
    contractionBtn.onclick = () => {
      if (!isPlaying || currentMode !== "contraction") {
        isPlaying = true;
        currentMode = "contraction";
        index = 0;
        signal.length = 0;
        drawContraction();
      }
    };

    waveformOptions.appendChild(contractionBtn);
  });
}

function checkConnections(instance) {
  const actual = instance.getAllConnections().map(conn => [
    conn.endpoints[0].getUuid(),
    conn.endpoints[1].getUuid()
  ]);
  const expected = [
    ["box-elec1", "sensor-in"],
    ["box-elec2", "sensor-in"],
    ["box-elec3", "sensor-in"],
    ["sensor-out1", "arduino-in1"],
    ["sensor-out2", "arduino-in2"],
    ["arduino-out", "graph-in"]
  ];
  const allValid = expected.every(pair => actual.some(a => a[0] === pair[0] && a[1] === pair[1]));
  const isExactLength = actual.length === expected.length;
  const result = allValid && isExactLength;
  showPopup(result ? "✅ Correct Connections!" : "❌ Incorrect Connections.");
  return result;
}

function showPopup(message) {
  const popup = document.getElementById("popup");
  const msg = document.getElementById("popupMessage");
  msg.textContent = message;
  popup.classList.remove("hidden");
  setTimeout(() => popup.classList.add("hidden"), 3000);
}

// ========== Contraction Graph ==========
function generateEMGValue(i) {
  const burst = Math.random() * (Math.random() > 0.8 ? 80 : 20);
  return Math.sin(i * 0.1) * burst * (Math.random() > 0.3 ? 1 : -1);
}

const canvas = document.getElementById("emgCanvas");
const ctx = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;
const centerY = height / 2;

function generateEMGValue(i) {
  const burst = Math.random() * (Math.random() > 0.8 ? 80 : 20);
  return Math.sin(i * 0.1) * burst * (Math.random() > 0.3 ? 1 : -1);
}

function drawContraction() {
  if (!isPlaying) return;

  const nextValue = generateEMGValue(index++);
  signal.push(nextValue);

  const maxSamples = 120 * 60;
  if (signal.length > maxSamples) signal.shift();

  ctx.clearRect(0, 0, width, height);

  const yLabels = [-0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5];
  ctx.fillStyle = "black";
  ctx.font = "10px Arial";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  // === Y-axis Labels and Grid Lines ===
  yLabels.forEach(value => {
    const y = centerY - (value / 0.5) * (centerY - 10);
    ctx.fillText(value.toFixed(1), 30, y);
    
    // Tick mark
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(38, y);
    ctx.strokeStyle = "#000";
    ctx.stroke();

    // Horizontal grid line
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 20, y);
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // === X-axis Labels and Grid Lines ===
  const duration = 60;
  const visibleSeconds = 10;
  const samplesPerSecond = 60;
  const visibleSamples = visibleSeconds * samplesPerSecond;
  const offset = Math.max(0, signal.length - visibleSamples);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const xTickCount = 10;
  for (let i = 0; i <= xTickCount; i++) {
    const labelSec = (offset + i * visibleSamples / xTickCount) / samplesPerSecond;
    const x = 40 + (i / xTickCount) * (width - 60);
    ctx.fillText(labelSec.toFixed(0), x, height - 10);

    // Tick mark
    ctx.beginPath();
    ctx.moveTo(x, height - 20);
    ctx.lineTo(x, height - 25);
    ctx.strokeStyle = "#000";
    ctx.stroke();

    // Vertical grid line
    ctx.beginPath();
    ctx.moveTo(x, 10);
    ctx.lineTo(x, height - 30);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillText("Time (s)", width / 2, height - 2);

  // Y Axis Label
  ctx.save();
  ctx.translate(8, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("EMG (mV)", 0, 0);
  ctx.restore();

  // === Draw EMG waveform ===
  const maxVal = Math.max(1, ...signal.map(Math.abs));
  ctx.beginPath();
  for (let i = 0; i < visibleSamples; i++) {
    const value = signal[offset + i];
    const x = 40 + (i / visibleSamples) * (width - 60);
    const y = centerY - (value / maxVal) * (centerY - 10);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#1f3c88";
  ctx.lineWidth = 1;
  ctx.stroke();

  animationId = requestAnimationFrame(drawContraction);
}

