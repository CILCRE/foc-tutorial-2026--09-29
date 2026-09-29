// ===== FOC 公共导航栏 + 左侧目录侧栏（五部分颜色区分）=====
(function () {
  // 五部分 + 颜色
  const PARTS = {
    coord:   { name: '坐标变换', color: '#58a6ff' },   // 蓝
    svpwm:   { name: 'SVPWM',    color: '#f0b429' },   // 黄
    control: { name: '控制',     color: '#3fb950' },   // 绿
    pi:      { name: 'PI 调参',  color: '#d2a8ff' },   // 紫
    misc:    { name: '综合与硬件',color: '#f85149' },   // 红
  };

  const PAGES = [
    { file: 'index.html',          name: '目录',        part: null },
    { file: '01-three-phase.html', name: '01 三相电流',  part: 'coord' },
    { file: '02-synth-vector.html',name: '02 合成矢量',  part: 'coord' },
    { file: '03-clarke.html',      name: '03 Clarke',   part: 'coord' },
    { file: '04-park.html',        name: '04 Park',     part: 'coord' },
    { file: '05-inv-park.html',    name: '05 逆 Park',  part: 'coord' },
    { file: '06-inv-clarke.html',  name: '06 逆 Clarke',part: 'coord' },
    { file: '07-coord-summary.html',name:'07 变换总结',  part: 'coord' },
    { file: '08-svpwm-intro.html', name: '08 SVPWM 概念',part: 'svpwm' },
    { file: '09-base-vectors.html',name: '09 基本矢量',  part: 'svpwm' },
    { file: '10-sector.html',      name: '10 扇区判断',  part: 'svpwm' },
    { file: '11-synthesis.html',   name: '11 矢量合成',  part: 'svpwm' },
    { file: '12-pwm-wave.html',    name: '12 PWM 波形',  part: 'svpwm' },
    { file: '13-overmod.html',     name: '13 过调制',    part: 'svpwm' },
    { file: '14-block-diagram.html',name:'14 控制框图',  part: 'control' },
    { file: '15-openloop.html',    name: '15 开环控制',  part: 'control' },
    { file: '16-current-loop.html',name: '16 电流环',    part: 'control' },
    { file: '17-speed-loop.html',  name: '17 速度环',    part: 'control' },
    { file: '18-dual-loop.html',   name: '18 双闭环',    part: 'control' },
    { file: '19-pi-principle.html',name: '19 PI 原理',   part: 'pi' },
    { file: '20-speed-tuning.html',name: '20 速度环调参',part: 'pi' },
    { file: '21-current-tuning.html',name:'21 电流环调参',part: 'pi' },
    { file: '22-encoder.html',     name: '22 编码器',    part: 'misc' },
    { file: '23-overview.html',    name: '23 综合演示',  part: 'misc' },
    { file: '24-hardware.html',    name: '24 硬件系统',  part: 'misc' },
    { file: '25-formulas.html',    name: '25 公式汇总',  part: 'misc' },
    { file: '26-legacy.html',      name: '26 旧版资料库', part: 'misc' },
  ];

  const el = document.getElementById('nav');
  if (!el) return;

  const cur = location.pathname.split('/').pop() || 'index.html';
  const idx = PAGES.findIndex(p => p.file === cur);
  const prev = idx > 0 ? PAGES[idx - 1] : null;
  const next = idx >= 0 && idx < PAGES.length - 1 ? PAGES[idx + 1] : null;

  el.className = 'nav';
  el.innerHTML = `
    <span class="title">FOC 可视化教程</span>
    ${prev ? `<a href="${prev.file}">← ${prev.name}</a>` : `<a class="disabled">← 上一课</a>`}
    <a href="index.html">目录</a>
    ${next ? `<a href="${next.file}">${next.name} →</a>` : `<a class="disabled">下一课 →</a>`}
  `;

  // 注入侧栏样式
  if (!document.getElementById('foc-sidebar-style')) {
    const style = document.createElement('style');
    style.id = 'foc-sidebar-style';
    style.textContent = `
      #foc-sidebar {
        position: fixed; top: 0; left: 0; width: 190px; bottom: 0;
        background: #161b22; border-right: 1px solid #30363d;
        overflow-y: auto; z-index: 9; padding: 72px 0 12px;
        transition: transform 0.25s ease;
      }
      #foc-sidebar .sb-title {
        font-size: 11px; color: #7d8590; text-transform: uppercase;
        letter-spacing: 1.5px; padding: 0 14px 8px; font-weight: 600;
      }
      #foc-sidebar .sb-divider { height: 1px; background: #21262d; margin: 6px 12px 8px; }
      #foc-sidebar .sb-part {
        font-size: 10px; padding: 8px 14px 4px; letter-spacing: 1px;
        font-weight: 600; text-transform: uppercase; opacity: 0.7;
      }
      #foc-sidebar a {
        display: block; padding: 6px 14px 6px 20px;
        color: #7d8590; text-decoration: none; font-size: 12px;
        transition: all 0.15s ease; border-left: 3px solid transparent;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        position: relative;
      }
      #foc-sidebar a:hover { background: #1c2128; color: #e6edf3; }
      #foc-sidebar a.active {
        color: #58a6ff; background: #1f6feb22;
        border-left-color: #58a6ff; font-weight: 600;
      }
      #foc-sidebar a .dot {
        display: inline-block; width: 6px; height: 6px; border-radius: 50%;
        margin-right: 8px; vertical-align: middle;
      }
      @media (max-width: 1100px) {
        #foc-sidebar { transform: translateX(-100%); }
        body { padding-left: 0 !important; }
        .nav { margin-left: 0 !important; }
      }
      body { padding-left: 190px; }
      .nav { margin-left: 190px; }
    `;
    document.head.appendChild(style);
  }

  // 侧栏
  const sb = document.createElement('div');
  sb.id = 'foc-sidebar';

  let html = '<div class="sb-title">📖 目录</div><div class="sb-divider"></div>';

  // 按 part 分组输出
  let lastPart = null;
  PAGES.forEach(p => {
    // 遇到新 part，输出 part 标题
    if (p.part && p.part !== lastPart) {
      const part = PARTS[p.part];
      html += `<div class="sb-part" style="color:${part.color};">${part.name}</div>`;
      lastPart = p.part;
    }
    // 输出页
    const isActive = (p.file === cur);
    const dotColor = p.part ? PARTS[p.part].color : '#484f58';
    const dotHtml = p.part ? `<span class="dot" style="background:${dotColor};"></span>` : '';
    html += `<a href="${p.file}" class="${isActive ? 'active' : ''}">${dotHtml}${p.name}</a>`;
  });
  sb.innerHTML = html;
  document.body.appendChild(sb);

  // 键盘快捷键
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const playBtn = document.getElementById('btn-play');
    const resetBtn = document.getElementById('btn-reset');
    const sT = document.getElementById('s-t');
    if (e.code === 'Space') { e.preventDefault(); if (playBtn) playBtn.click(); return; }
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); if (resetBtn) resetBtn.click(); return; }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      if (!sT) return;
      e.preventDefault();
      const step = 0.1;
      const curV = parseFloat(sT.value);
      const nextV = curV + (e.code === 'ArrowRight' ? step : -step);
      sT.value = Math.max(parseFloat(sT.min), Math.min(parseFloat(sT.max), nextV));
      sT.dispatchEvent(new Event('input'));
    }
  });

  // ===== 自动播放：页面加载后自动点一次"播放"按钮 =====
  window.addEventListener('load', function () {
    setTimeout(function () {
      var playBtn = document.getElementById('btn-play');
      if (playBtn) {
        // 检查按钮文字，如果是"播放"状态才点（避免重复触发）
        var txt = playBtn.textContent || '';
        if (txt.indexOf('▶') >= 0 || txt.indexOf('开始') >= 0 || txt.indexOf('播放') >= 0) {
          playBtn.click();
        }
      }
    }, 600);   // 延迟 600ms 等页面稳定
  });

  // ===== 导出整页文本 =====
  function exportPageText() {
    var lines = [];
    var pageTitle = document.title || 'FOC 教程';
    lines.push('===== ' + pageTitle + ' =====');
    lines.push('时间：' + new Date().toLocaleString());
    lines.push('');

    // 1. 提取侧栏所有 label（滑块标签 + 当前值）
    var labels = document.querySelectorAll('.panel .ctrl label, .panel .section-title');
    if (labels.length > 0) {
      lines.push('--- 参数 ---');
      labels.forEach(function (el) {
        var text = el.textContent.trim().replace(/\s+/g, ' ');
        if (text) lines.push(text);
      });
      lines.push('');
    }

    // 2. 提取实时数值区（.info-box / .value-grid）
    var boxes = document.querySelectorAll('.info-box, .value-grid, .live-box');
    if (boxes.length > 0) {
      lines.push('--- 实时数值 ---');
      boxes.forEach(function (box) {
        var text = box.textContent.trim().replace(/\s+/g, ' ');
        if (text) lines.push(text);
      });
      lines.push('');
    }

    // 3. 提取页面底部说明（.note）
    var notes = document.querySelectorAll('.note');
    if (notes.length > 0) {
      lines.push('--- 说明 ---');
      notes.forEach(function (note) {
        var text = note.textContent.trim().replace(/\s+/g, ' ');
        if (text) lines.push(text);
      });
      lines.push('');
    }

    // 4. 页面自定义导出（如果页面挂了 window.__exportData）
    if (window.__exportData) {
      lines.push('--- Canvas 数据 ---');
      try {
        var custom = window.__exportData();
        if (custom) lines.push(custom);
      } catch (e) {
        lines.push('（自定义数据获取失败：' + e.message + '）');
      }
      lines.push('');
    }

    // 5. 页面 h1 标题
    var h1 = document.querySelector('h1');
    if (h1) {
      lines.splice(1, 0, '标题：' + h1.textContent.trim());
    }

    return lines.join('\n');
  }

  function showExportDialog() {
    var text = exportPageText();

    // 弹窗
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';

    var dialog = document.createElement('div');
    dialog.style.cssText = 'background:#161b22;border:1px solid #30363d;border-radius:8px;padding:20px;max-width:700px;width:90%;max-height:80vh;display:flex;flex-direction:column;';

    var title = document.createElement('div');
    title.style.cssText = 'font-size:16px;font-weight:600;color:#e6edf3;margin-bottom:12px;';
    title.textContent = '📋 导出文本（已复制到剪贴板）';

    var textarea = document.createElement('textarea');
    textarea.style.cssText = 'flex:1;min-height:300px;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:10px;color:#e6edf3;font-family:monospace;font-size:12px;resize:none;';
    textarea.value = text;

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;margin-top:12px;justify-content:flex-end;';

    var copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 再次复制';
    copyBtn.style.cssText = 'padding:6px 14px;background:#238636;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;';
    copyBtn.onclick = function () {
      textarea.select();
      document.execCommand('copy');
      copyBtn.textContent = '✅ 已复制';
      setTimeout(function () { copyBtn.textContent = '📋 再次复制'; }, 1500);
    };

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = 'padding:6px 14px;background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;cursor:pointer;font-size:13px;';
    closeBtn.onclick = function () { document.body.removeChild(overlay); };

    btnRow.appendChild(copyBtn);
    btnRow.appendChild(closeBtn);
    dialog.appendChild(title);
    dialog.appendChild(textarea);
    dialog.appendChild(btnRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 自动复制
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.warn('自动复制失败，请手动复制');
    }
  }

  // 添加"导出文本"按钮到侧栏顶部（panel 里）
  window.addEventListener('load', function () {
    setTimeout(function () {
      var panel = document.querySelector('.panel');
      if (!panel) return;

      var btn = document.createElement('button');
      btn.textContent = '📋 导出文本';
      btn.style.cssText = 'width:100%;padding:8px;margin-bottom:12px;background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;cursor:pointer;font-size:13px;';
      btn.onmouseover = function () { btn.style.background = '#30363d'; };
      btn.onmouseout = function () { btn.style.background = '#21262d'; };
      btn.onclick = showExportDialog;

      // 插到 panel 的第一个 h3 之前
      var firstH3 = panel.querySelector('h3');
      if (firstH3) {
        panel.insertBefore(btn, firstH3);
      } else {
        panel.insertBefore(btn, panel.firstChild);
      }
    }, 800);
  });
})();
