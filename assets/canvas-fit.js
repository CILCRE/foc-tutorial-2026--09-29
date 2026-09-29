// ===== Canvas 自适应：根据容器实际显示宽度调整分辨率 =====
// 用法：给 canvas 加 data-fit 属性即可，例如 <canvas id="cv" data-fit="420">
// data-fit 值表示"逻辑高度"（CSS 显示高度），宽度自动跟随容器
(function () {
  function fitOne(cv) {
    // ★ 修正 17：用更高倍率渲染，抗锯齿更好
    const dpr = window.devicePixelRatio || 1;
    const ratio = Math.max(dpr, 2);   // 至少 2 倍
    const cssW = cv.clientWidth;
    const cssH = parseInt(cv.dataset.fit || cv.getAttribute('height') || '300', 10);
    if (cssW <= 0) return;
    cv.width  = Math.round(cssW * ratio);
    cv.height = Math.round(cssH * ratio);
    cv.style.height = cssH + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // 提高抗锯齿质量
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // 通知页面 canvas 尺寸已变（页面可监听重绘）
    cv.dispatchEvent(new CustomEvent('canvasfit', { detail: { w: cssW, h: cssH } }));
  }

  function fitAll() {
    document.querySelectorAll('canvas[data-fit]').forEach(fitOne);
  }

  // 页面加载完成后适配一次
  window.addEventListener('load', fitAll);
  // DOMContentLoaded 提前适配（更早触发）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fitAll);
  } else {
    fitAll();
  }
  // 窗口大小变化时重新适配（防抖）
  let tid = null;
  window.addEventListener('resize', function () {
    clearTimeout(tid);
    tid = setTimeout(fitAll, 100);
  });
  // 暴露给页面手动调用
  window.fitCanvases = fitAll;
})();
