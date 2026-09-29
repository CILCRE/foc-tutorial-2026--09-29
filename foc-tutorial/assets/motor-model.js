// ===== PMSM 电机模型 + 开环/闭环控制 + PI 控制器 =====
(function () {

  const DEFAULT_PARAMS = {
    polePairs: 4,
    Rs: 0.5,
    Ld: 0.02,
    Lq: 0.02,
    Ke: 0.05,
    J: 0.005,
    B: 0.0005,
    Vdc: 1.0,
    Imax: 2.0,
  };

  function createState() {
    return {
      id: 0, iq: 0,
      omega_m: 0,
      theta_e: 0,
      time: 0,
      Te: 0,
    };
  }

  function stepStandard(st, vd, vq, TL, dt, P) {
    const p = P.polePairs;
    const omega_e = st.omega_m * p;

    const did = (vd - P.Rs * st.id + omega_e * P.Lq * st.iq) / P.Ld;
    const diq = (vq - P.Rs * st.iq - omega_e * P.Ld * st.id - omega_e * P.Ke) / P.Lq;

    let id_new = st.id + did * dt;
    let iq_new = st.iq + diq * dt;
    id_new = Math.max(-P.Imax, Math.min(P.Imax, id_new));
    iq_new = Math.max(-P.Imax, Math.min(P.Imax, iq_new));

    const Te = 1.5 * p * P.Ke * iq_new;

    const domega = (Te - TL - P.B * st.omega_m) / P.J;
    let omega_new = st.omega_m + domega * dt;
    omega_new = Math.max(-200, Math.min(200, omega_new));

    const theta_new = st.theta_e + omega_new * p * dt;

    return {
      id: id_new, iq: iq_new,
      omega_m: omega_new, theta_e: theta_new,
      time: st.time + dt, Te: Te,
    };
  }

  function openLoopVF(t, f_ref, V0, Kvf) {
    const V = Math.min(1.0, V0 + Kvf * f_ref);
    const theta_cmd = 2 * Math.PI * f_ref * t;
    return { vd: 0, vq: V, theta_cmd };
  }

  function openLoopVoltage(t, vd_const, vq_const, f_ref) {
    const theta_cmd = 2 * Math.PI * f_ref * t;
    return { vd: vd_const, vq: vq_const, theta_cmd };
  }

  function openLoopCurrent(t, id_ref, iq_ref, f_ref) {
    const theta_cmd = 2 * Math.PI * f_ref * t;
    return { id_ref, iq_ref, theta_cmd };
  }

  function createPIController(kp, ki) {
    return { kp: kp, ki: ki, integral: 0, prevErr: 0 };
  }

  function stepPI(ctrl, err, dt, outMax) {
    ctrl.integral += err * dt;
    if (outMax !== undefined) {
      const maxInt = outMax / Math.max(0.001, ctrl.ki);
      ctrl.integral = Math.max(-maxInt, Math.min(maxInt, ctrl.integral));
    }
    const out = ctrl.kp * err + ctrl.ki * ctrl.integral;
    if (outMax !== undefined) {
      return Math.max(-outMax, Math.min(outMax, out));
    }
    return out;
  }

  function resetPI(ctrl) {
    ctrl.integral = 0;
    ctrl.prevErr = 0;
  }

  window.FOC_MOTOR = {
    DEFAULT_PARAMS,
    createState,
    stepStandard,
    openLoopVF,
    openLoopVoltage,
    openLoopCurrent,
    createPIController,
    stepPI,
    resetPI,
  };
})();
