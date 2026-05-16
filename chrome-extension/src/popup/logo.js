import logoUrl from '@shared/assets/logo.svg';

export function renderSyncScaleLogo2(containerId, color1 = '#3399ff', color2 = '#0056b3', size = 100) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
    const img = document.createElement('img');
    img.src = logoUrl;
    img.width = size;
    img.height = size;
    container.appendChild(img);
  }
}
