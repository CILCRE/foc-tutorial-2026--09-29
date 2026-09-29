// ===== SVPWM 核心算法 + 绘制 =====
(function () {

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // 逆 Park：d-q → α-β
  function invPark(vd, vq, theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    return {
      valpha: vd * c - vq * s,
      vbeta:  vd * s + vq * c,
    };
  }

  // 逆 Clarke：α-β → a-b-c（等幅值形式）
  function invClarke(valpha, vbeta) {
    return {
      va: valpha,
      vb: -0.5 * valpha + Math.sqrt(3)/2 * vbeta,
      vc: -0.5 * valpha - Math.sqrt(3)/2 * vbeta,
    };
  }

  // SVPWM 扇区与作用时间
  function svpwm(valpha, vbeta, Vdc, Ts) {
    Ts = Ts || 1;
    const u1 = vbeta;
    const u2 = (Math.sqrt(3)*valpha - vbeta) / 2;
    const u3 = (-Math.sqrt(3)*valpha - vbeta) / 2;
    const A = u1 > 0 ? 1 : 0;
    const B = u2 > 0 ? 1 : 0;
    const C = u3 > 0 ? 1 : 0;
    const N = A + 2*B + 4*C;
    const sectorMap = [0, 3, 1, 5, 4, 6, 2];
    const sector = sectorMap[N];

    const X = Math.sqrt(3) * vbeta * Ts / Vdc;
    const Y = (0.5*(Math.sqrt(3)*vbeta + 3*valpha)) * Ts / Vdc;
    const Z = (0.5*(Math.sqrt(3)*vbeta - 3*valpha)) * Ts / Vdc;

    let T1, T2;
    switch (sector) {
      case 1: T1 = -Z; T2 =  X; break;
      case 2: T1 =  Z; T2 =  Y; break;
      case 3: T1 =  X; T2 = -Y; break;
      case 4: T1 = -X; T2 =  Z; break;
      case 5: T1 = -Y; T2 = -Z; break;
      case 6: T1 =  Y; T2 = -X; break;
      default: T1 = 0; T2 = 0;
    }
    let T1c = Math.max(0, T1), T2c = Math.max(0, T2);
    if (T1c + T2c > Ts) {
      const k = Ts / (T1c + T2c);
      T1c *= k; T2c *= k;
    }
    const T0 = Math.max(0, Ts - T1c - T2c);

    const ta = (Ts - T1c - T2c) / 2;
    const tb = ta + T1c;
    const tc = tb + T2c;
    let Ta, Tb, Tc;
    switch (sector) {
      case 1: Ta = tb; Tb = ta; Tc = tc; break;
      case 2: Ta = ta; Tb = tc; Tc = tb; break;
      case 3: Ta = ta; Tb = tb; Tc = tc; break;
      case 4: Ta = tc; Tb = tb; Tc = ta; break;
      case 5: Ta = tc; Tb = ta; Tc = tb; break;
      case 6: Ta = tb; Tb = tc; Tc = ta; break;
      default: Ta = Tb = Tc = Ts/2;
    }
    return {
      sector, T1: T1c, T2: T2c, T0,
      Ta, Tb, Tc, Ts, Vdc,
      Vref: Math.hypot(valpha, vbeta),
      thetaRef: Math.atan2(vbeta, valpha),
    };
  }

  const BASE_VECTORS = [
    { id: 1, angDeg:   0, bits: '100' },
    { id: 2, angDeg:  60, bits: '110' },
    { id: 3, angDeg: 120, bits: '010' },
    { id: 4, angDeg: 180, bits: '011' },
    { id: 5, angDeg: 240, bits: '001' },
    { id: 6, angDeg: 300, bits: '101' },
  ];

  const SECTOR_NEIGHBORS = {
    1: [1, 2], 2: [2, 3], 3: [3, 4],
    4: [4, 5], 5: [5, 6], 6: [6, 1],
  };

  // ===== 自动模式：生成 vd/vq =====
  function autoVd(t, f, th, mode) {
    const amp = 0.6;
    switch (mode) {
      case 'a':
        // vd 恒定，vq 正弦
        return { vd: 0.3, vq: amp * Math.sin(2*Math.PI*f*t) };

      case 'b':
        // vd 频率 f，vq 频率 f/2 → 拍频效果
        return {
          vd: amp * Math.sin(2*Math.PI*f*t),
          vq: 0.5 * amp * Math.sin(2*Math.PI*(f/2)*t),
        };

      case 'c': {
        // c1：不循环，只做一次启动过程
        // t = 0 时阶跃上升，之后保持稳定
        const phase = t;   // 不再循环
        const step = 1 - Math.exp(-8 * phase);
        const overshoot = 1 + 0.15 * Math.sin(12 * phase) * Math.exp(-5 * phase);
        const vqC = 0.7 * step * overshoot;
        return { vd: 0.25, vq: clamp(vqC, -1, 1) };
      }

      case 'd':
        // dq 平面内以 f/2 旋转 → 逆Park 后 α-β 里 1 倍频旋转
        return {
          vd: amp * Math.cos(2*Math.PI*(f/2)*t),
          vq: amp * Math.sin(2*Math.PI*(f/2)*t),
        };

      default:
        return { vd: 0.3, vq: 0.6 };
    }
  }

  window.FOC_SVPWM = {
    invPark,
    invClarke,
    svpwm,
    autoVd,
    BASE_VECTORS,
    SECTOR_NEIGHBORS,
  };
})();
