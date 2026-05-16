export function renderSyncScaleLogo2(containerId, color1 = '#3399ff', color2 = '#0056b3', size = 100) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);

  // 感覚（主観）の円
  const circle1 = document.createElementNS(svgNS, "circle");
  circle1.setAttribute("cx", "40");
  circle1.setAttribute("cy", "50");
  circle1.setAttribute("r", "25");
  circle1.setAttribute("fill", color1);
  circle1.setAttribute("fill-opacity", "0.7");

  // 現実（客観）の円
  const circle2 = document.createElementNS(svgNS, "circle");
  circle2.setAttribute("cx", "60");
  circle2.setAttribute("cy", "50");
  circle2.setAttribute("r", "25");
  circle2.setAttribute("fill", color2);
  circle2.setAttribute("fill-opacity", "0.7");

  // 重なり部分に現れる目盛り（Scale）の線
  const scaleLine = document.createElementNS(svgNS, "path");
  scaleLine.setAttribute("d", "M 45 42 H 55 M 45 50 H 55 M 45 58 H 55");
  scaleLine.setAttribute("stroke", "white");
  scaleLine.setAttribute("stroke-width", "3");
  scaleLine.setAttribute("stroke-linecap", "round");

  svg.appendChild(circle1);
  svg.appendChild(circle2);
  svg.appendChild(scaleLine);
  
  const container = document.getElementById(containerId);
  if(container) {
    container.innerHTML = '';
    container.appendChild(svg);
  }
}
