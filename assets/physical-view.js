// ===== 外转子 PMSM 物理剖面绘制 =====
(function () {
  function pol(cx, cy, r, mathAngDeg) {
    const a = mathAngDeg * Math.PI / 180;
    return { x: cx + Math.cos(a) * r, y: cy - Math.sin(a) * r };
  }

  // ★ 修正 38：箭头头部长度按线长自适应
  function arrow(ctx, x1, y1, x2, y2, color, width, headLen) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    // 头长 = min(传入值, 线长的 30%)，且不小于 4px
    const hl = Math.max(4, Math.min(headLen, len * 0.3));
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(ang - 0.4), y2 - hl * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - hl * Math.cos(ang + 0.4), y2 - hl * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
  }

  function currentSymbol(ctx, x, y, sign, color, size) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, size, 0, 2 * Math.PI); ctx.stroke();
    if (sign >= 0) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, size * 0.35, 0, 2 * Math.PI); ctx.fill();
    } else {
      const d = size * 0.7;
      ctx.beginPath();
      ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
      ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d);
      ctx.stroke();
    }
  }

  const PHASE_COLORS = ['#f85149', '#3fb950', '#d29922'];
  const PHASE_RGB = [ [248,81,73], [63,185,80], [210,153,34] ];
  const GRAY_RGB = [90, 96, 106];
  // 三相绕组的"理想中心方位"
  const PHASE_ANGLES = [90, 210, 330];

  function rgbCss(rgb, alpha) {
    if (alpha === undefined) alpha = 1;
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
  }
  function mixRgb(a, b, t) {
    return [
      Math.round(a[0]*(1-t) + b[0]*t),
      Math.round(a[1]*(1-t) + b[1]*t),
      Math.round(a[2]*(1-t) + b[2]*t),
    ];
  }

  function slotColor(phaseIdx, i, I, powered) {
    if (!powered) return mixRgb(GRAY_RGB, PHASE_RGB[phaseIdx], 0.2);
    const mag = Math.min(1, Math.abs(i) / Math.max(0.001, I));
    const t = 0.3 + 0.7 * mag;
    if (i >= 0) {
      return mixRgb([60, 60, 65], PHASE_RGB[phaseIdx], t);
    } else {
      const deep = mixRgb(PHASE_RGB[phaseIdx], [0,0,0], 0.45);
      return mixRgb([60, 60, 65], deep, t);
    }
  }

  function slotCountFor(polePairs) {
    return 12 * polePairs;
  }

  function buildSlotPhase(nSlots, distributed) {
    const arr = new Array(nSlots);
    if (distributed) {
      for (let k = 0; k < nSlots; k++) {
        const unitPos = k % 6;
        arr[k] = Math.floor(unitPos / 2);
      }
    } else {
      for (let k = 0; k < nSlots; k++) arr[k] = k % 3;
    }
    return arr;
  }

  // ★ 修正 6：根据实际槽位反推"起始偏移角"，让 A/B/C 三相的加权中心精确对齐 90/210/330
  // 返回各相的加权中心角度，用于合成矢量计算和验证
  function computePhaseCenters(nSlots, distributed) {
    const slotArc = 360 / nSlots;
    const slotPhase = buildSlotPhase(nSlots, distributed);
    // 先算未偏移时的原始槽中心
    const centers = [0, 0, 0];    // 矢量和 (cos, sin 分别累加)
    const counts  = [0, 0, 0];
    const rawCenters = [[], [], []];
    for (let k = 0; k < nSlots; k++) {
      const midRawDeg = k * slotArc + slotArc / 2;
      rawCenters[slotPhase[k]].push(midRawDeg);
    }
    // 每相取平均角（用矢量和，避免跨 0 度问题）
    const phaseCenterDeg = [0, 0, 0];
    for (let p = 0; p < 3; p++) {
      let cx = 0, cy = 0;
      rawCenters[p].forEach(d => {
        cx += Math.cos(d * Math.PI / 180);
        cy += Math.sin(d * Math.PI / 180);
      });
      phaseCenterDeg[p] = Math.atan2(cy, cx) * 180 / Math.PI;
      if (phaseCenterDeg[p] < 0) phaseCenterDeg[p] += 360;
    }
    return phaseCenterDeg;
  }

  window.drawPhysicalView = function (ctx, cx, cy, R, state) {
    const polePairs = state.polePairs || 2;
    const poles = polePairs * 2;
    const windingStyle = state.windingStyle || 'c';
    const showTeeth = state.showTeeth !== false;
    const distributed = state.distributed !== false;
    const rotorAngleDeg = state.rotorAngleDeg || 0;
    const powered = state.powered !== false;
    const I = state.I || 1;
    const showLabels = state.showLabels !== false;   // ★ 修正 5

    const rRotorOuter = R * 0.98;
    const rRotorInner = R * 0.78;
    const rStatorOuter = R * 0.76;
    const rStatorInner = R * 0.30;
    const rShaft = R * 0.12;

    // ===== 1. 外转子永磁体 =====
    const poleArc = 360 / poles;
    for (let k = 0; k < poles; k++) {
      const startDeg = k * poleArc + rotorAngleDeg;
      const endDeg = startDeg + poleArc;
      const isNorth = (k % 2 === 0);
      const startRad = -startDeg * Math.PI / 180;
      const endRad = -endDeg * Math.PI / 180;
      ctx.beginPath();
      ctx.arc(cx, cy, rRotorOuter, startRad, endRad, true);
      ctx.arc(cx, cy, rRotorInner, endRad, startRad, false);
      ctx.closePath();
      if (powered) {
        // ★ 修正 31：S 极颜色调亮，对比度更好
        ctx.fillStyle = isNorth ? '#f85149' : '#388bfd';
      } else {
        ctx.fillStyle = isNorth ? '#5a5f6a' : '#3d4550';
      }
      ctx.fill();
      ctx.strokeStyle = '#0f1720'; ctx.lineWidth = 1.5;
      ctx.stroke();

      const midDeg = startDeg + poleArc / 2;
      const labelPos = pol(cx, cy, (rRotorOuter + rRotorInner) / 2, midDeg);
      ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(R * 0.09) + 'px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(isNorth ? 'N' : 'S', labelPos.x, labelPos.y);
    }
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';

    // ===== ★ 吸引/排斥箭头（贴在每个永磁体中心）=====
    // 遍历每个永磁体，在它的中心画箭头（跟着转子转）
    for (let k = 0; k < poles; k++) {
      const isNorthMagnet = (k % 2 === 0);

      // 永磁体中心角（随转子转）
      const magnetCenterDeg = (k + 0.5) * poleArc + rotorAngleDeg;
      const rad = magnetCenterDeg * Math.PI / 180;

      // 找"正对"这个永磁体的定子槽
      // 槽的数学角范围：[slotStartOffsetDeg, slotStartOffsetDeg + nSlots*slotArc]
      // 这里 nSlots 还没定义（下面才定义），所以先跳过
      // 改用"用槽号反推"的方式：直接用 midDeg 来判断该永磁体对应的电流

      // 简化：对每个永磁体，找最接近它中心角的槽
      // 但 nSlots / slotArc / slotStartOffsetDeg 还没定义
      // 所以先只画"永磁体极性标记"，等主循环里再补吸引/排斥
      // —— 这里暂时跳过
    }

    // ===== 2. 定子硅钢片 =====
    const nSlots = slotCountFor(polePairs);
    const slotArc = 360 / nSlots;

    // ★ 修正 10：让三相绕组中心精确对齐 90/210/330
    // 分布式：A 相占"连续 2 个槽" × 2 段（正反），需要用矢量合成算法求精确中心
    // 集中式：A 相分散在多个槽，也用矢量合成求中心
    // 简化处理：先按"槽 0 起始"算，再用"槽位矢量重心"反推所需偏移
    let slotStartOffsetDeg;
    if (distributed) {
      // 分布式：A 相第一段占槽 0、1，其原始中心角 = (slotArc/2 + 3*slotArc/2)/2 = slotArc
      // 想要中心 = 90°，所以 offset = 90 - slotArc
      slotStartOffsetDeg = 90 - slotArc;
    } else {
      // 集中式：A 相占槽 0,3,6,9...，重心需要数值求解
      // 先按常规 offset（槽 0 中心在 90°），再用后续修正
      slotStartOffsetDeg = 90 - slotArc / 2;
    }

    const slotPhase = buildSlotPhase(nSlots, distributed);

    if (showTeeth) {
      for (let k = 0; k < nSlots; k++) {
        const startDeg = slotStartOffsetDeg + k * slotArc;
        const endDeg = startDeg + slotArc;

        const toothStartDeg = startDeg + slotArc * 0.2;
        const toothEndDeg = startDeg + slotArc * 0.8;
        const tS = -toothStartDeg * Math.PI / 180;
        const tE = -toothEndDeg * Math.PI / 180;
        ctx.beginPath();
        ctx.arc(cx, cy, rStatorOuter, tS, tE, true);
        ctx.arc(cx, cy, rStatorInner, tE, tS, false);
        ctx.closePath();
        ctx.fillStyle = '#30363d'; ctx.fill();
        ctx.strokeStyle = '#484f58'; ctx.lineWidth = 0.5; ctx.stroke();

        const sStartDeg = toothEndDeg;
        const sEndDeg = slotStartOffsetDeg + (k+1) * slotArc + slotArc * 0.2;
        const sS = -sStartDeg * Math.PI / 180;
        const sE = -sEndDeg * Math.PI / 180;
        ctx.beginPath();
        ctx.arc(cx, cy, rStatorOuter, sS, sE, true);
        ctx.arc(cx, cy, rStatorInner, sE, sS, false);
        ctx.closePath();
        ctx.fillStyle = '#0f1720'; ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, rStatorOuter, 0, 2 * Math.PI);
      ctx.arc(cx, cy, rStatorInner, 0, 2 * Math.PI, true);
      ctx.closePath();
      ctx.fillStyle = '#30363d'; ctx.fill();
    }

    ctx.beginPath(); ctx.arc(cx, cy, rShaft, 0, 2 * Math.PI);
    ctx.fillStyle = '#484f58'; ctx.fill();

    // ===== 3. 三相绕组 =====
    const phaseCurrents = [state.ia || 0, state.ib || 0, state.ic || 0];

    for (let k = 0; k < nSlots; k++) {
      const startDeg = slotStartOffsetDeg + k * slotArc;
      const midDeg = startDeg + slotArc / 2;
      const phaseIdx = slotPhase[k];
      const curr = phaseCurrents[phaseIdx];
      const colRgb = slotColor(phaseIdx, curr, I, powered);
      const strokeCss = rgbCss(colRgb);

      const rMid = (rStatorOuter + rStatorInner) / 2;
      const pos = pol(cx, cy, rMid, midDeg);

      if (windingStyle === 'a') {
        ctx.beginPath();
        const a0 = -(startDeg + slotArc * 0.15) * Math.PI / 180;
        const a1 = -(startDeg + slotArc * 0.85) * Math.PI / 180;
        ctx.arc(cx, cy, rStatorOuter * 0.97, a0, a1, true);
        ctx.arc(cx, cy, rStatorInner * 1.05, a1, a0, false);
        ctx.closePath();
        ctx.fillStyle = strokeCss;
        ctx.fill();
      } else if (windingStyle === 'b') {
        const turns = 3;
        for (let j = 0; j < turns; j++) {
          const rr = rStatorInner * 1.15 + (rStatorOuter * 0.9 - rStatorInner * 1.15) * (j + 0.5) / turns;
          ctx.strokeStyle = strokeCss;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const a0 = -(startDeg + slotArc * 0.2) * Math.PI / 180;
          const a1 = -(startDeg + slotArc * 0.8) * Math.PI / 180;
          ctx.arc(cx, cy, rr, a0, a1, true);
          ctx.stroke();
        }
      } else {
        const rInner = rStatorInner * 1.1;
        const rOuter = rStatorOuter * 0.95;
        ctx.strokeStyle = strokeCss;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const a0 = -(startDeg + slotArc * 0.25) * Math.PI / 180;
        const a1 = -(startDeg + slotArc * 0.75) * Math.PI / 180;
        ctx.arc(cx, cy, rInner + (rOuter - rInner) * 0.25, a0, a1, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, rInner + (rOuter - rInner) * 0.75, a0, a1, true);
        ctx.stroke();
      }

      if (nSlots <= 24) {
        const symColor = powered ? '#e6edf3' : '#484f58';
        currentSymbol(ctx, pos.x, pos.y, curr, symColor, Math.max(3, R * 0.024));
      }
    }

    // ===== 4. 气隙 =====
    ctx.strokeStyle = '#0f1720'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, rRotorInner, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, rStatorOuter, 0, 2 * Math.PI); ctx.stroke();

        // ===== 5. 合成磁动势矢量（按理想相轴 90/210/330 计算，稳定不抖）=====
    if (state.showResult) {
      const windings = [
        { mathAng: 90,  i: state.ia || 0 },
        { mathAng: 210, i: state.ib || 0 },
        { mathAng: 330, i: state.ic || 0 },
      ];
      let sx = 0, sy = 0;
      windings.forEach(w => {
        const rad = w.mathAng * Math.PI / 180;
        sx += Math.cos(rad) * w.i;
        sy += Math.sin(rad) * w.i;
      });
      const th_screen = Math.atan2(sy, sx);
      const ex = cx + Math.cos(th_screen) * rStatorOuter * 0.9;
      const ey = cy - Math.sin(th_screen) * rStatorOuter * 0.9;
      const arrowColor = powered ? '#58a6ff' : '#484f58';
      arrow(ctx, cx, cy, ex, ey, arrowColor, 3, 10);
    }
// ===== 6. 标注（★ 修正 5：可开关）=====
    if (showLabels) {
      ctx.fillStyle = '#7d8590'; ctx.font = '12px sans-serif';
      ctx.fillText('外转子永磁体 (' + poles + '极)', cx - R * 0.9, cy - R * 1.12);
      ctx.fillText('定子 ' + nSlots + ' 槽 · 每极每相 q=2', cx - R * 0.9, cy + R * 1.18);
      ctx.fillText(distributed ? '分布式绕组 (AA BB CC)' : '集中式绕组 (ABC ABC)', cx - R * 0.9, cy + R * 1.32);
    }

    // 相标签（★ 修正 7：加半透明背景圆）
    const labelR = rStatorInner * 0.75;
    ['A', 'B', 'C'].forEach((name, idx) => {
      const p = pol(cx, cy, labelR, PHASE_ANGLES[idx]);
      // 背景圆
      ctx.fillStyle = 'rgba(15, 23, 32, 0.75)';
      ctx.beginPath(); ctx.arc(p.x, p.y, R * 0.06, 0, 2 * Math.PI); ctx.fill();
      // 文字
      ctx.fillStyle = powered ? PHASE_COLORS[idx] : '#5a5f6a';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(name, p.x, p.y);
    });
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';

    // ===== 7. 断电遮罩（★ 修正 9）=====
    if (!powered) {
      // 半透明暗色遮罩覆盖整个图
      ctx.fillStyle = 'rgba(15, 23, 32, 0.35)';
      ctx.beginPath(); ctx.arc(cx, cy, rRotorOuter + 4, 0, 2 * Math.PI); ctx.fill();

      // 提示
      ctx.fillStyle = '#f0b429'; ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ 未通电', cx, cy - rStatorInner - 8);
      ctx.textAlign = 'start';
    }
  };
})();
