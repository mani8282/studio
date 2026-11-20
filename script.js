(() => {
  'use strict';

  /* ============================================================================
   * 1. GENERACIÓN DE CANALES CH 1–4 (EXACTOS A TU DIBUJO), EQ Y VÚMETROS
   * ============================================================================ */
  const channelsContainer = document.getElementById('mixer-channels');
  for (let ch = 1; ch <= 4; ch++) {
    const strip = document.createElement('div');
    strip.className = 'channel-strip';
    strip.innerHTML = `
      <div class="r-head"><span class="ch-pill">CH ${ch}</span></div>

      <div class="r-mic">
        <div class="jack xlr" data-jack-id="ch${ch}_mic" data-dir="in" data-type="xlr" data-name="CH ${ch} — Entrada Mic XLR">
          <div class="xlr-pins"><span></span><span></span><span></span></div>
        </div>
        <button class="ph48-mini" id="btn-48v-${ch}" title="Alimentación Phantom +48V para micrófono de condensador">48V</button>
      </div>

      <div class="r-line">
        <div class="jack trs" data-jack-id="ch${ch}_line" data-dir="in" data-type="any" data-name="CH ${ch} — Entrada Line TRS (MP3 / Teclado / Generador)"></div>
      </div>

      <div class="r-gain">
        <div class="knob-ring sm color-white" data-knob="ch${ch}_gain" data-min="-10" data-max="36" data-val="4" data-unit="dB">
          <div class="knob-cap"></div>
        </div>
        <div class="peak-stack" title="LED PEAK: se ilumina en rojo cuando la ganancia o el EQ saturan el canal">
          <span class="peak-led" id="peak-led-${ch}"></span>
          <span class="peak-txt">PK</span>
        </div>
      </div>

      <div class="r-eq-box">
        <div class="r-eq-item" title="LP — Graves (110 Hz)"><div class="knob-ring sm color-blue" data-knob="ch${ch}_lp" data-min="-15" data-max="15" data-val="0" data-unit="dB"><div class="knob-cap"></div></div></div>
        <div class="r-eq-item" title="MP — Medios (1.1 kHz)"><div class="knob-ring sm color-blue" data-knob="ch${ch}_mp" data-min="-15" data-max="15" data-val="0" data-unit="dB"><div class="knob-cap"></div></div></div>
        <div class="r-eq-item" title="HP — Agudos (9.5 kHz)"><div class="knob-ring sm color-blue" data-knob="ch${ch}_hp" data-min="-15" data-max="15" data-val="0" data-unit="dB"><div class="knob-cap"></div></div></div>
      </div>

      <div class="r-ins">
        <div class="jack trs ring-amber" data-jack-id="ch${ch}_ins" data-dir="insert" data-type="any" data-name="CH ${ch} — ins (Insert en serie: ins → Expansor/Compresor in y out → ins)"></div>
      </div>

      <div class="r-fx">
        <div class="knob-ring sm color-red" data-knob="ch${ch}_fx" data-min="0" data-max="100" data-val="22" data-unit="%"><div class="knob-cap"></div></div>
      </div>

      <div class="r-send">
        <div class="knob-ring sm color-green" data-knob="ch${ch}_send" data-min="0" data-max="100" data-val="28" data-unit="%"><div class="knob-cap"></div></div>
      </div>

      <div class="r-pan">
        <div class="knob-ring sm" data-knob="ch${ch}_pan" data-min="-100" data-max="100" data-val="0" data-unit="%"><div class="knob-cap"></div></div>
      </div>

      <div class="r-mute">
        <button class="mute-rect" id="btn-mute-${ch}" title="Silenciar canal (Mute)">MUTE</button>
        <button class="mute-rect" id="btn-solo-${ch}" style="padding:0 4px;" title="Escucha pre-fader aislada en Cascos (PFL)">PFL</button>
      </div>

      <div class="r-fader">
        <div class="fader-track-wrap">
          <input type="range" class="v-fader" id="fader-ch-${ch}" min="0" max="100" value="78" />
        </div>
        <div class="vu-meter" id="vu-ch-${ch}"></div>
      </div>
    `;
    channelsContainer.appendChild(strip);
  }

  const EQ_FREQS = [
    { hz: 60, label: '60' },
    { hz: 250, label: '250' },
    { hz: 1000, label: '1k' },
    { hz: 4000, label: '4k' },
    { hz: 12000, label: '12k' }
  ];

  ['l', 'r'].forEach(side => {
    const bank = document.getElementById(`eq-bank-${side}`);
    EQ_FREQS.forEach((f, idx) => {
      const col = document.createElement('div');
      col.className = 'eq-col';
      col.innerHTML = `
        <div class="fader-track-wrap eq-size">
          <input type="range" class="v-fader eq-fader" data-eq-side="${side}" data-eq-idx="${idx}" min="-12" max="12" step="0.5" value="0" />
        </div>
        <span class="eq-freq">${f.label}</span>
      `;
      bank.appendChild(col);
    });
  });

  function populateMeter(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const seg = document.createElement('div');
      seg.className = 'vu-seg';
      el.appendChild(seg);
    }
  }
  for (let i = 1; i <= 4; i++) populateMeter(`vu-ch-${i}`, 12);
  populateMeter('vu-fx', 12);
  populateMeter('vu-master-l', 14);
  populateMeter('vu-master-r', 14);
  populateMeter('vu-spk1', 8);
  populateMeter('vu-spk2', 8);
  populateMeter('vu-phones', 8);
  populateMeter('vu-comp-gr', 12);
  populateMeter('exp-vu', 7);

  /* ============================================================================
   * 2. TOOLTIPS Y NOTIFICACIONES
   * ============================================================================ */
  const tooltipEl = document.getElementById('floating-tooltip');
  function showTooltip(text, x, y) {
    tooltipEl.textContent = text;
    tooltipEl.style.left = `${x}px`;
    tooltipEl.style.top = `${y}px`;
    tooltipEl.style.opacity = '1';
  }
  function hideTooltip() { tooltipEl.style.opacity = '0'; }

  function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.textContent = msg;
    container.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.25s';
      setTimeout(() => div.remove(), 260);
    }, 3400);
  }

  /* ============================================================================
   * 3. MOTOR DE AUDIO REAL (WEB AUDIO API)
   * ============================================================================ */
  let ctx = null;
  let audioStarted = false;
  let listenMode = 'speakers'; // 'speakers' | 'phones'
  let eqMasterActive = true;
  let eqLinked = true;
  let rtaMode = 0;

  const sourcesState = {
    micA: false,
    micALive: false,
    micB: false,
    micC: false,
    mp3Playing: false,
    mp3HasCustomFile: false,
    genMode: 'off'
  };
  let liveMicStream = null;
  let liveMicSourceNode = null;
  let customMp3ObjectUrl = null;

  // Audio HTML5 real para reproducir MP3/WAV desde el módulo "MP3 - TRSH"
  const mp3AudioEl = new Audio();
  mp3AudioEl.loop = true;
  let mp3MediaNode = null;

  const INT_FX_PRESETS = ['01 · HALL', '02 · PLATE', '03 · ROOM', '04 · DELAY', '05 · SLAP ECHO', '06 · CHORUS'];
  let intFxIndex = 0;

  const EXT_FX_PRESETS = ['REVERB CATEDRAL', 'DELAY PING-PONG', 'CHORUS ESTÉREO', 'DISTORSIÓN CÁLIDA'];
  let extFxIndex = 0;

  const bypassState = { exp: false, comp: false, extfx: false };
  const phantom48State = { 1: false, 2: false, 3: false, 4: false };
  const soloState = { 1: false, 2: false, 3: false, 4: false };
  const peakHoldTimers = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const vuPeakHold = { ml: { idx: 0, t: 0 }, mr: { idx: 0, t: 0 } };

  const params = {
    gen_level: -14,
    vol_send: 80,
    vol_return: 80,
    vol_aux3: 82,
    fx_par: 55,
    exp_thresh: -32,
    exp_ratio: 3.5,
    comp_thresh: -22,
    comp_ratio: 6,
    comp_attack: 12,
    comp_makeup: 4,
    extfx_mix: 100,
    extfx_decay: 65
  };

  const audio = {
    sources: {},
    channels: {},
    bus: {},
    units: {},
    outputs: {},
    analysers: {},
    impulses: {},
    gen: {},
    recorder: { dest: null, mediaRecorder: null, chunks: [], recording: false, startTime: 0, timerId: null }
  };

  function dbToGain(db) { return Math.pow(10, db / 20); }
  function faderToGain(val) { return val <= 0 ? 0 : Math.pow(val / 80, 2.1); }

  function createImpulseResponse(audioCtx, duration, decay, bright = 1.0) {
    const rate = audioCtx.sampleRate;
    const len = Math.floor(rate * duration);
    const buf = audioCtx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const data = buf.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        lp += (w - lp) * (0.2 + 0.78 * bright);
        data[i] = lp * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function makeAnalogClipCurve() {
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(x * 1.15);
    }
    return curve;
  }

  function makeDistortionCurve(amount = 45) {
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  async function initAudioEngine() {
    try {
      if (audioStarted && ctx) {
        if (ctx.state !== 'running') await ctx.resume();
        updateAudioDiagnostics();
        return true;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        toast('Tu navegador no soporta Web Audio API.', 'err');
        return false;
      }
      ctx = new AudioCtx({ latencyHint: 'interactive' });
      if (ctx.state !== 'running') {
        try { await ctx.resume(); } catch (_) {}
      }

      audio.impulses.hall = createImpulseResponse(ctx, 2.5, 2.4, 0.7);
      audio.impulses.plate = createImpulseResponse(ctx, 1.5, 1.9, 1.0);
      audio.impulses.room = createImpulseResponse(ctx, 0.8, 2.8, 0.85);
      audio.impulses.cathedral = createImpulseResponse(ctx, 4.2, 2.1, 0.55);

      // 1. Fuentes de la fila superior
      const micAIn = ctx.createGain();
      const micAPhantomGate = ctx.createGain();
      micAPhantomGate.gain.value = 0.0; // Requiere +48V Phantom directo desde el canal XLR
      micAIn.connect(micAPhantomGate);

      // Piso de ruido ambiente realista en Mic A (para comprobar el efecto real del Expansor/Puerta)
      const roomBufLen = ctx.sampleRate * 3;
      const roomBuf = ctx.createBuffer(1, roomBufLen, ctx.sampleRate);
      const rd = roomBuf.getChannelData(0);
      let rlp = 0;
      for (let i = 0; i < roomBufLen; i++) {
        rlp = rlp * 0.72 + (Math.random() * 2 - 1) * 0.28;
        rd[i] = rlp;
      }
      const roomNoiseSrc = ctx.createBufferSource();
      roomNoiseSrc.buffer = roomBuf;
      roomNoiseSrc.loop = true;
      const roomNoiseGain = ctx.createGain();
      roomNoiseGain.gain.value = 0.0;
      roomNoiseSrc.connect(roomNoiseGain);
      roomNoiseGain.connect(micAIn);
      roomNoiseSrc.start();

      audio.sources.micA = { in: micAIn, out: micAPhantomGate, phantomGate: micAPhantomGate, roomNoiseGain };

      audio.sources.micB = { out: ctx.createGain() };
      audio.sources.micC = { out: ctx.createGain() };
      audio.sources.btReceiver = { out: ctx.createGain() };
      audio.sources.micC.out.connect(audio.sources.btReceiver.out);
      audio.sources.mp3 = { in: ctx.createGain(), out: ctx.createGain() };
      audio.sources.mp3.in.connect(audio.sources.mp3.out);

      // Generador de Prueba (1 kHz + Ruido Rosa)
      const genOut = ctx.createGain(); genOut.gain.value = 0;
      const sineOsc = ctx.createOscillator(); sineOsc.type = 'sine'; sineOsc.frequency.value = 1000;
      const sineGain = ctx.createGain(); sineGain.gain.value = 0;
      sineOsc.connect(sineGain); sineGain.connect(genOut); sineOsc.start();

      const pinkLen = ctx.sampleRate * 3;
      const pinkBuf = ctx.createBuffer(1, pinkLen, ctx.sampleRate);
      const pd = pinkBuf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < pinkLen; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
        pd[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.09;
        b6 = w * 0.115926;
      }
      const pinkSrc = ctx.createBufferSource(); pinkSrc.buffer = pinkBuf; pinkSrc.loop = true;
      const pinkGain = ctx.createGain(); pinkGain.gain.value = 0;
      pinkSrc.connect(pinkGain); pinkGain.connect(genOut); pinkSrc.start();
      audio.gen = { out: genOut, sineGain, pinkGain };

      // 2. Buses principales de la mesa
      audio.bus.masterSumL = ctx.createGain();
      audio.bus.masterSumR = ctx.createGain();
      audio.bus.sendSum = ctx.createGain();
      audio.bus.sendMaster = ctx.createGain();
      audio.bus.sendMaster.gain.value = params.vol_send / 100;
      audio.bus.sendSum.connect(audio.bus.sendMaster);
      audio.bus.pflBus = ctx.createGain();

      // Bus Return mono con control de volumen maestro (suma al Master L y R)
      const retIn = ctx.createGain();
      const retMaster = ctx.createGain();
      retMaster.gain.value = params.vol_return / 100;
      retIn.connect(retMaster);
      retMaster.connect(audio.bus.masterSumL);
      retMaster.connect(audio.bus.masterSumR);
      audio.bus.return = { in: retIn, master: retMaster };

      // 3. Módulo FX Interno de la mesa (Bloque Rojo)
      const fxIn = ctx.createGain();
      const fxConv = ctx.createConvolver(); fxConv.buffer = audio.impulses.hall;
      const fxWetConv = ctx.createGain();

      const fxDel = ctx.createDelay(1.2);
      const fxDelFb = ctx.createGain(); fxDelFb.gain.value = 0;
      const fxDelLp = ctx.createBiquadFilter(); fxDelLp.type = 'lowpass'; fxDelLp.frequency.value = 3400;
      fxDel.connect(fxDelLp); fxDelLp.connect(fxDelFb); fxDelFb.connect(fxDel);
      const fxWetDel = ctx.createGain(); fxWetDel.gain.value = 0;

      const fxModDel = ctx.createDelay(0.1); fxModDel.delayTime.value = 0.015;
      const fxModLfo = ctx.createOscillator();
      const fxModDepth = ctx.createGain(); fxModDepth.gain.value = 0;
      fxModLfo.connect(fxModDepth); fxModDepth.connect(fxModDel.delayTime); fxModLfo.start();
      const fxWetMod = ctx.createGain(); fxWetMod.gain.value = 0;

      const fxMaster = ctx.createGain(); fxMaster.gain.value = faderToGain(65);
      const fxAnalyser = ctx.createAnalyser(); fxAnalyser.fftSize = 256;

      fxIn.connect(fxConv); fxConv.connect(fxWetConv); fxWetConv.connect(fxMaster);
      fxIn.connect(fxDel); fxDel.connect(fxWetDel); fxWetDel.connect(fxMaster);
      fxIn.connect(fxModDel); fxModDel.connect(fxWetMod); fxWetMod.connect(fxMaster);
      fxMaster.connect(fxAnalyser);
      fxMaster.connect(audio.bus.masterSumL);
      fxMaster.connect(audio.bus.masterSumR);

      audio.bus.intFx = {
        in: fxIn, conv: fxConv, wetConv: fxWetConv,
        del: fxDel, delFb: fxDelFb, wetDel: fxWetDel,
        modDel: fxModDel, modLfo: fxModLfo, modDepth: fxModDepth, wetMod: fxWetMod,
        master: fxMaster
      };
      audio.analysers.fx = fxAnalyser;

      // 4. Canales CH 1–4: Mic/Line -> Gain -> EQ (LP/MP/HP) -> PEAK/Clip -> ins -> Pan -> Mute/PFL -> Fader
      const clipCurve = makeAnalogClipCurve();
      for (let ch = 1; ch <= 4; ch++) {
        const micIn = ctx.createGain(); micIn.gain.value = 1.65;
        const lineIn = ctx.createGain(); lineIn.gain.value = 1.0;
        const preamp = ctx.createGain(); preamp.gain.value = dbToGain(params[`ch${ch}_gain`] ?? 4);

        const lp = ctx.createBiquadFilter(); lp.type = 'lowshelf'; lp.frequency.value = 110; lp.gain.value = params[`ch${ch}_lp`] ?? 0;
        const mp = ctx.createBiquadFilter(); mp.type = 'peaking'; mp.frequency.value = 1100; mp.Q.value = 1.0; mp.gain.value = params[`ch${ch}_mp`] ?? 0;
        const hp = ctx.createBiquadFilter(); hp.type = 'highshelf'; hp.frequency.value = 9500; hp.gain.value = params[`ch${ch}_hp`] ?? 0;

        const peakAnalyser = ctx.createAnalyser(); peakAnalyser.fftSize = 256;
        const clipper = ctx.createWaveShaper(); clipper.curve = clipCurve;

        const insertSend = ctx.createGain();
        const insertBypass = ctx.createGain(); insertBypass.gain.value = 1;
        const insertReturn = ctx.createGain();

        const pflSend = ctx.createGain(); pflSend.gain.value = soloState[ch] ? 1 : 0;
        const muteNode = ctx.createGain(); muteNode.gain.value = document.getElementById(`btn-mute-${ch}`).classList.contains('muted') ? 0 : 1;
        const faderVal = parseFloat(document.getElementById(`fader-ch-${ch}`).value);
        const faderNode = ctx.createGain(); faderNode.gain.value = faderToGain(faderVal);

        // Balance L/R compatible con todos los navegadores (sin depender de StereoPannerNode)
        const panL = ctx.createGain();
        const panR = ctx.createGain();
        const panInit = (params[`ch${ch}_pan`] ?? 0) / 100;
        const panAng = (panInit + 1) * Math.PI * 0.25;
        panL.gain.value = Math.cos(panAng);
        panR.gain.value = Math.sin(panAng);

        const fxSend = ctx.createGain(); fxSend.gain.value = (params[`ch${ch}_fx`] ?? 22) / 100;
        const auxSend = ctx.createGain(); auxSend.gain.value = (params[`ch${ch}_send`] ?? 28) / 100;
        const vuAnalyser = ctx.createAnalyser(); vuAnalyser.fftSize = 256;

        micIn.connect(preamp);
        lineIn.connect(preamp);
        preamp.connect(lp); lp.connect(mp); mp.connect(hp);
        hp.connect(peakAnalyser);
        hp.connect(clipper);
        clipper.connect(insertSend);
        insertSend.connect(insertBypass);
        insertBypass.connect(insertReturn);

        insertReturn.connect(pflSend); pflSend.connect(audio.bus.pflBus);
        insertReturn.connect(muteNode);
        muteNode.connect(faderNode);
        faderNode.connect(vuAnalyser);
        faderNode.connect(panL);
        faderNode.connect(panR);
        panL.connect(audio.bus.masterSumL);
        panR.connect(audio.bus.masterSumR);

        faderNode.connect(fxSend); fxSend.connect(audio.bus.intFx.in);
        faderNode.connect(auxSend); auxSend.connect(audio.bus.sendSum);

        audio.channels[ch] = {
          micIn, lineIn, preamp, lp, mp, hp,
          peakAnalyser, insertSend, insertBypass, insertReturn,
          pflSend, muteNode, faderNode, panL, panR, fxSend, auxSend
        };
        audio.analysers[`ch${ch}`] = vuAnalyser;
      }

      // 5. EQ Gráfico Dual (Azul) -> Faders Master SPK 1 / SPK 2 -> RTA & Grabador
      audio.bus.eqL = [];
      audio.bus.eqR = [];
      let prevL = audio.bus.masterSumL;
      let prevR = audio.bus.masterSumR;

      EQ_FREQS.forEach((f, idx) => {
        const fL = ctx.createBiquadFilter(); fL.type = 'peaking'; fL.frequency.value = f.hz; fL.Q.value = 1.4;
        const slL = document.querySelector(`.eq-fader[data-eq-side="l"][data-eq-idx="${idx}"]`);
        if (slL) fL.gain.value = parseFloat(slL.value);
        prevL.connect(fL); prevL = fL; audio.bus.eqL.push(fL);

        const fR = ctx.createBiquadFilter(); fR.type = 'peaking'; fR.frequency.value = f.hz; fR.Q.value = 1.4;
        const slR = document.querySelector(`.eq-fader[data-eq-side="r"][data-eq-idx="${idx}"]`);
        if (slR) fR.gain.value = parseFloat(slR.value);
        prevR.connect(fR); prevR = fR; audio.bus.eqR.push(fR);
      });

      const eqWetL = ctx.createGain(); eqWetL.gain.value = eqMasterActive ? 1 : 0;
      const eqDryL = ctx.createGain(); eqDryL.gain.value = eqMasterActive ? 0 : 1;
      const eqWetR = ctx.createGain(); eqWetR.gain.value = eqMasterActive ? 1 : 0;
      const eqDryR = ctx.createGain(); eqDryR.gain.value = eqMasterActive ? 0 : 1;
      prevL.connect(eqWetL); audio.bus.masterSumL.connect(eqDryL);
      prevR.connect(eqWetR); audio.bus.masterSumR.connect(eqDryR);
      audio.bus.eqBypass = { wetL: eqWetL, dryL: eqDryL, wetR: eqWetR, dryR: eqDryR };

      audio.bus.masterFaderL = ctx.createGain();
      audio.bus.masterFaderL.gain.value = faderToGain(parseFloat(document.getElementById('fader-master-l').value));
      audio.bus.masterFaderR = ctx.createGain();
      audio.bus.masterFaderR.gain.value = faderToGain(parseFloat(document.getElementById('fader-master-r').value));
      eqWetL.connect(audio.bus.masterFaderL); eqDryL.connect(audio.bus.masterFaderL);
      eqWetR.connect(audio.bus.masterFaderR); eqDryR.connect(audio.bus.masterFaderR);

      audio.analysers.masterL = ctx.createAnalyser(); audio.analysers.masterL.fftSize = 256;
      audio.analysers.masterR = ctx.createAnalyser(); audio.analysers.masterR.fftSize = 256;
      audio.analysers.rta = ctx.createAnalyser(); audio.analysers.rta.fftSize = 2048; audio.analysers.rta.smoothingTimeConstant = 0.78;

      audio.bus.masterFaderL.connect(audio.analysers.masterL);
      audio.bus.masterFaderR.connect(audio.analysers.masterR);

      const rtaSum = ctx.createGain(); rtaSum.gain.value = 0.5;
      audio.bus.masterFaderL.connect(rtaSum);
      audio.bus.masterFaderR.connect(rtaSum);
      rtaSum.connect(audio.analysers.rta);

      // Grabador Estéreo Master (protegido por si el navegador restringe MediaStreamDestination)
      try {
        if (typeof ctx.createMediaStreamDestination === 'function') {
          const recMerger = ctx.createChannelMerger(2);
          audio.bus.masterFaderL.connect(recMerger, 0, 0);
          audio.bus.masterFaderR.connect(recMerger, 0, 1);
          audio.recorder.dest = ctx.createMediaStreamDestination();
          recMerger.connect(audio.recorder.dest);
        }
      } catch (_) {
        audio.recorder.dest = null;
      }

      // Salida Aux 3 (Cascos / Phones con soporte PFL)
      const aux3MainGateL = ctx.createGain();
      const aux3MainGateR = ctx.createGain();
      audio.bus.masterFaderL.connect(aux3MainGateL);
      audio.bus.masterFaderR.connect(aux3MainGateR);

      const aux3Merger = ctx.createChannelMerger(2);
      aux3MainGateL.connect(aux3Merger, 0, 0);
      aux3MainGateR.connect(aux3Merger, 0, 1);
      audio.bus.pflBus.connect(aux3Merger, 0, 0);
      audio.bus.pflBus.connect(aux3Merger, 0, 1);

      const aux3Vol = ctx.createGain(); aux3Vol.gain.value = params.vol_aux3 / 100;
      aux3Merger.connect(aux3Vol);
      audio.bus.aux3 = { out: aux3Vol, mainGateL: aux3MainGateL, mainGateR: aux3MainGateR };

      // 6. Equipos Externos: Expansor, Compresor y Procesador efectos
      const expIn = ctx.createGain();
      const expAn = ctx.createAnalyser(); expAn.fftSize = 256;
      const expGate = ctx.createGain();
      const expOut = ctx.createGain();
      expIn.connect(expAn); expIn.connect(expGate); expGate.connect(expOut);
      audio.units.exp = { in: expIn, out: expOut, gateGain: expGate, analyser: expAn };

      const compIn = ctx.createGain();
      const compNode = ctx.createDynamicsCompressor();
      compNode.threshold.value = params.comp_thresh;
      compNode.ratio.value = params.comp_ratio;
      compNode.attack.value = params.comp_attack / 1000;
      compNode.release.value = 0.16;
      compNode.knee.value = 6;
      const compMakeup = ctx.createGain(); compMakeup.gain.value = dbToGain(params.comp_makeup);
      const compWet = ctx.createGain(); compWet.gain.value = bypassState.comp ? 0 : 1;
      const compDry = ctx.createGain(); compDry.gain.value = bypassState.comp ? 1 : 0;
      const compOut = ctx.createGain();
      compIn.connect(compNode); compNode.connect(compMakeup); compMakeup.connect(compWet); compWet.connect(compOut);
      compIn.connect(compDry); compDry.connect(compOut);
      audio.units.comp = { in: compIn, out: compOut, comp: compNode, makeup: compMakeup, wet: compWet, dry: compDry };

      // Procesador efectos externo (Entrada in -> Procesamiento DSP -> Salida out)
      const extIn = ctx.createGain();
      const extDry = ctx.createGain();
      const extWet = ctx.createGain();
      const extOut = ctx.createGain();
      const extBypassDry = ctx.createGain(); extBypassDry.gain.value = 0;

      const extRev = ctx.createConvolver(); extRev.buffer = audio.impulses.cathedral;
      const extRevGain = ctx.createGain();
      extIn.connect(extRev); extRev.connect(extRevGain);

      const extDelL = ctx.createDelay(1.5); const extDelR = ctx.createDelay(1.5);
      extDelL.delayTime.value = 0.28; extDelR.delayTime.value = 0.42;
      const extDelFb = ctx.createGain(); extDelFb.gain.value = 0.46;
      extIn.connect(extDelL); extDelL.connect(extDelR); extDelR.connect(extDelFb); extDelFb.connect(extDelL);
      const extDelGain = ctx.createGain();
      extDelL.connect(extDelGain); extDelR.connect(extDelGain);

      const extChDel = ctx.createDelay(0.1); extChDel.delayTime.value = 0.018;
      const extChLfo = ctx.createOscillator(); extChLfo.frequency.value = 1.4;
      const extChDepth = ctx.createGain(); extChDepth.gain.value = 0.007;
      extChLfo.connect(extChDepth); extChDepth.connect(extChDel.delayTime);
      extChLfo.start();
      const extChGain = ctx.createGain();
      extIn.connect(extChDel); extChDel.connect(extChGain);

      const extDist = ctx.createWaveShaper(); extDist.curve = makeDistortionCurve(45);
      const extDistLp = ctx.createBiquadFilter(); extDistLp.type = 'lowpass'; extDistLp.frequency.value = 3200;
      const extDistGain = ctx.createGain();
      extIn.connect(extDist); extDist.connect(extDistLp); extDistLp.connect(extDistGain);

      extRevGain.connect(extWet);
      extDelGain.connect(extWet);
      extChGain.connect(extWet);
      extDistGain.connect(extWet);

      extIn.connect(extDry);
      extDry.connect(extOut);
      extWet.connect(extOut);
      extIn.connect(extBypassDry);
      extBypassDry.connect(extOut);

      audio.units.extfx = {
        in: extIn, out: extOut,
        dry: extDry, wet: extWet, bypassDry: extBypassDry,
        revGain: extRevGain,
        delGain: extDelGain, delL: extDelL, delR: extDelR, delFb: extDelFb,
        chGain: extChGain, chLfo: extChLfo, chDepth: extChDepth,
        distGain: extDistGain, dist: extDist
      };

      // 7. Destinos de escucha: SPK 1, SPK 2 y Cascos
      const spk1In = ctx.createGain();
      const spk2In = ctx.createGain();
      const phonesIn = ctx.createGain();

      audio.analysers.spk1 = ctx.createAnalyser(); audio.analysers.spk1.fftSize = 256;
      audio.analysers.spk2 = ctx.createAnalyser(); audio.analysers.spk2.fftSize = 256;
      audio.analysers.phones = ctx.createAnalyser(); audio.analysers.phones.fftSize = 256;

      spk1In.connect(audio.analysers.spk1);
      spk2In.connect(audio.analysers.spk2);
      phonesIn.connect(audio.analysers.phones);

      const spkMerger = ctx.createChannelMerger(2);
      spk1In.connect(spkMerger, 0, 0);
      spk2In.connect(spkMerger, 0, 1);

      const spkMonitorBus = ctx.createGain(); spkMonitorBus.gain.value = 1;
      const phonesMonitorBus = ctx.createGain(); phonesMonitorBus.gain.value = 0;
      spkMerger.connect(spkMonitorBus);
      phonesIn.connect(phonesMonitorBus);

      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -1.5; limiter.ratio.value = 16; limiter.attack.value = 0.002; limiter.release.value = 0.09;
      spkMonitorBus.connect(limiter);
      phonesMonitorBus.connect(limiter);
      limiter.connect(ctx.destination);

      audio.outputs = { spk1In, spk2In, phonesIn, spkMonitorBus, phonesMonitorBus, limiter };

      applyInternalFxPreset();
      applyExternalFxPreset();
      updateListenRouting();
      updateSoloRouting();
      startSequencer();

      audioStarted = true;
      rebuildAudioGraph();
      syncSourceButtons();
      updateTopbarStatus();

      const pwrBtn = document.getElementById('btn-power');
      pwrBtn.classList.add('active');
      pwrBtn.querySelector('span:last-child').textContent = 'Audio Activo';
      document.getElementById('power-led').classList.add('green-on');
      toast('Motor de audio iniciado', 'ok');
      return true;
    } catch (err) {
      console.error('Error iniciando Web Audio API:', err);
      toast(`Error de audio: ${err.message || err}`, 'err');
      return false;
    }
  }

  async function ensureAudioRunning() {
    if (!audioStarted) {
      return await initAudioEngine();
    }
    if (ctx && ctx.state !== 'running') {
      try { await ctx.resume(); } catch (_) {}
      updateAudioDiagnostics();
    }
    return Boolean(ctx && ctx.state === 'running');
  }

  function playTestChime() {
    if (!ctx || !audio.outputs.limiter) return;
    const now = ctx.currentTime + 0.01;
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.14);
      g.gain.setValueAtTime(0.001, now + i * 0.14);
      g.gain.linearRampToValueAtTime(0.22, now + i * 0.14 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.28);
      osc.connect(g);
      g.connect(audio.outputs.limiter);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.3);
    });
  }

  function ensureMp3MediaNode() {
    if (!ctx || !audio.sources.mp3 || mp3MediaNode) return;
    try {
      mp3MediaNode = ctx.createMediaElementSource(mp3AudioEl);
      mp3MediaNode.connect(audio.sources.mp3.in);
    } catch (err) {
      console.warn('No se pudo enlazar MediaElementSource:', err);
    }
  }

  function applyInternalFxPreset() {
    if (!audio.bus.intFx || !ctx) return;
    const fx = audio.bus.intFx;
    const t = ctx.currentTime;
    const p = (params.fx_par ?? 55) / 100;

    if (intFxIndex === 0) {
      fx.conv.buffer = audio.impulses.hall;
      fx.wetConv.gain.setTargetAtTime(0.25 + p * 0.95, t, 0.02);
      fx.wetDel.gain.setTargetAtTime(0, t, 0.02);
      fx.wetMod.gain.setTargetAtTime(0, t, 0.02);
    } else if (intFxIndex === 1) {
      fx.conv.buffer = audio.impulses.plate;
      fx.wetConv.gain.setTargetAtTime(0.25 + p * 0.95, t, 0.02);
      fx.wetDel.gain.setTargetAtTime(0, t, 0.02);
      fx.wetMod.gain.setTargetAtTime(0, t, 0.02);
    } else if (intFxIndex === 2) {
      fx.conv.buffer = audio.impulses.room;
      fx.wetConv.gain.setTargetAtTime(0.25 + p * 0.95, t, 0.02);
      fx.wetDel.gain.setTargetAtTime(0, t, 0.02);
      fx.wetMod.gain.setTargetAtTime(0, t, 0.02);
    } else if (intFxIndex === 3) {
      fx.wetConv.gain.setTargetAtTime(0, t, 0.02);
      fx.del.delayTime.setTargetAtTime(0.22 + p * 0.42, t, 0.03);
      fx.delFb.gain.setTargetAtTime(0.22 + p * 0.46, t, 0.03);
      fx.wetDel.gain.setTargetAtTime(0.85, t, 0.02);
      fx.wetMod.gain.setTargetAtTime(0, t, 0.02);
    } else if (intFxIndex === 4) {
      fx.wetConv.gain.setTargetAtTime(0, t, 0.02);
      fx.del.delayTime.setTargetAtTime(0.08 + p * 0.10, t, 0.03);
      fx.delFb.gain.setTargetAtTime(0.10 + p * 0.22, t, 0.03);
      fx.wetDel.gain.setTargetAtTime(0.90, t, 0.02);
      fx.wetMod.gain.setTargetAtTime(0, t, 0.02);
    } else {
      fx.wetConv.gain.setTargetAtTime(0, t, 0.02);
      fx.wetDel.gain.setTargetAtTime(0, t, 0.02);
      fx.modLfo.frequency.setTargetAtTime(0.5 + p * 3.5, t, 0.03);
      fx.modDepth.gain.setTargetAtTime(0.002 + p * 0.007, t, 0.03);
      fx.wetMod.gain.setTargetAtTime(0.90, t, 0.02);
    }
  }

  function applyExternalFxPreset() {
    if (!audio.units.extfx || !ctx) return;
    const u = audio.units.extfx;
    const t = ctx.currentTime;
    const byp = bypassState.extfx;
    const mix = params.extfx_mix / 100;
    const dec = params.extfx_decay / 100;

    u.bypassDry.gain.setTargetAtTime(byp ? 1 : 0, t, 0.02);
    u.dry.gain.setTargetAtTime(byp ? 0 : (1 - mix), t, 0.02);
    u.wet.gain.setTargetAtTime(byp ? 0 : (mix * 1.15), t, 0.02);

    u.revGain.gain.setTargetAtTime(extFxIndex === 0 ? 1.1 : 0, t, 0.02);
    u.delGain.gain.setTargetAtTime(extFxIndex === 1 ? 0.78 : 0, t, 0.02);
    u.chGain.gain.setTargetAtTime(extFxIndex === 2 ? 1.0 : 0, t, 0.02);
    u.distGain.gain.setTargetAtTime(extFxIndex === 3 ? 0.72 : 0, t, 0.02);

    if (extFxIndex === 1) {
      u.delL.delayTime.setTargetAtTime(0.14 + dec * 0.36, t, 0.04);
      u.delR.delayTime.setTargetAtTime(0.21 + dec * 0.50, t, 0.04);
      u.delFb.gain.setTargetAtTime(0.2 + dec * 0.55, t, 0.04);
    } else if (extFxIndex === 2) {
      u.chLfo.frequency.setTargetAtTime(0.4 + dec * 3.8, t, 0.04);
      u.chDepth.gain.setTargetAtTime(0.003 + dec * 0.01, t, 0.04);
    } else if (extFxIndex === 3) {
      u.dist.curve = makeDistortionCurve(15 + dec * 110);
    }
  }

  function updateListenRouting() {
    const bSpk = document.getElementById('listen-spk');
    const bPh = document.getElementById('listen-phones');
    const bCard = document.getElementById('btn-phones-listen');
    if (listenMode === 'speakers') {
      bSpk.classList.add('active'); bPh.classList.remove('active', 'phones');
      bCard.classList.remove('active'); bCard.textContent = 'Escuchar Cascos';
    } else {
      bSpk.classList.remove('active'); bPh.classList.add('active', 'phones');
      bCard.classList.add('active'); bCard.textContent = 'Escuchando Cascos';
    }
    if (audio.outputs.spkMonitorBus && ctx) {
      const t = ctx.currentTime;
      audio.outputs.spkMonitorBus.gain.setTargetAtTime(listenMode === 'speakers' ? 1 : 0, t, 0.02);
      audio.outputs.phonesMonitorBus.gain.setTargetAtTime(listenMode === 'phones' ? 1 : 0, t, 0.02);
    }
  }

  function updateSoloRouting() {
    const anySolo = Object.values(soloState).some(Boolean);
    document.getElementById('solo-banner').style.display = anySolo ? 'inline-block' : 'none';
    if (!audioStarted || !ctx || !audio.bus.aux3) return;
    const t = ctx.currentTime;
    audio.bus.aux3.mainGateL.gain.setTargetAtTime(anySolo ? 0 : 1, t, 0.015);
    audio.bus.aux3.mainGateR.gain.setTargetAtTime(anySolo ? 0 : 1, t, 0.015);
    for (let ch = 1; ch <= 4; ch++) {
      audio.channels[ch].pflSend.gain.setTargetAtTime(soloState[ch] ? 1 : 0, t, 0.015);
    }
  }

  /* ============================================================================
   * 4. FUENTES MUSICALES INTEGRADAS (112 BPM)
   * ============================================================================ */
  let seqTimer = null, seqStep = 0, noiseBuf = null;
  function getNoiseBuffer() {
    if (noiseBuf) return noiseBuf;
    const len = ctx.sampleRate * 0.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  function triggerVocal(time, root) {
    const dest = audio.sources.micA.in;
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 3.2;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1380; f2.Q.value = 3.6;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(0.28, time + 0.16);
    env.gain.exponentialRampToValueAtTime(0.15, time + 0.72);
    env.gain.exponentialRampToValueAtTime(0.001, time + 1.0);
    f1.connect(env); f2.connect(env); env.connect(dest);
    [root, root * 1.25, root * 1.5].forEach((fr, idx) => {
      const o = ctx.createOscillator(); o.type = idx === 0 ? 'sawtooth' : 'triangle'; o.frequency.setValueAtTime(fr, time);
      o.connect(f1); o.connect(f2); o.start(time); o.stop(time + 1.04);
    });
  }

  function triggerKick(time) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.setValueAtTime(145, time); o.frequency.exponentialRampToValueAtTime(42, time + 0.08);
    g.gain.setValueAtTime(0.85, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.27);
    o.connect(g); g.connect(audio.sources.micB.out); o.start(time); o.stop(time + 0.29);
  }

  function triggerSnare(time) {
    const n = ctx.createBufferSource(); n.buffer = getNoiseBuffer();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2100; bp.Q.value = 0.9;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.46, time); ng.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    n.connect(bp); bp.connect(ng); ng.connect(audio.sources.micB.out); n.start(time); n.stop(time + 0.17);
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(210, time); o.frequency.exponentialRampToValueAtTime(115, time + 0.09);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.42, time); og.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
    o.connect(og); og.connect(audio.sources.micB.out); o.start(time); o.stop(time + 0.12);
  }

  function triggerHat(time, open = false) {
    const n = ctx.createBufferSource(); n.buffer = getNoiseBuffer();
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7600;
    const g = ctx.createGain(); g.gain.setValueAtTime(open ? 0.17 : 0.13, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.17 : 0.045));
    n.connect(hp); hp.connect(g); g.connect(audio.sources.micB.out); n.start(time); n.stop(time + (open ? 0.19 : 0.055));
  }

  function triggerBass(time, freq, dur = 0.22) {
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.setValueAtTime(freq, time);
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.setValueAtTime(freq * 0.5, time);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3.2;
    lp.frequency.setValueAtTime(1400, time); lp.frequency.exponentialRampToValueAtTime(240, time + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, time); g.gain.linearRampToValueAtTime(0.42, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur + 0.04);
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(audio.sources.micC.out);
    o1.start(time); o2.start(time); o1.stop(time + dur + 0.05); o2.stop(time + dur + 0.05);
  }

  function triggerMp3Demo(time, notes, dur = 0.36) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2600, time); lp.frequency.exponentialRampToValueAtTime(900, time + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, time); g.gain.linearRampToValueAtTime(0.24, time + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    lp.connect(g); g.connect(audio.sources.mp3.in);
    notes.forEach(fr => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(fr, time);
      const ov = ctx.createOscillator(); ov.type = 'triangle'; ov.frequency.setValueAtTime(fr * 2, time);
      const ovG = ctx.createGain(); ovG.gain.value = 0.14;
      o.connect(lp); ov.connect(ovG); ovG.connect(lp);
      o.start(time); ov.start(time); o.stop(time + dur + 0.03); ov.stop(time + dur + 0.03);
    });
  }

  function startSequencer() {
    if (seqTimer) clearInterval(seqTimer);
    const stepMs = (60 / 112 / 4) * 1000;
    const bassPat = [110, 0, 110, 0, 0, 130.81, 146.83, 0, 110, 0, 164.81, 146.83, 130.81, 0, 98, 103.83];
    const vocalRoots = [220, 261.63, 196, 174.61];
    const chords = [
      [220, 261.63, 329.63, 392],
      [261.63, 329.63, 392, 493.88],
      [196, 246.94, 293.66, 349.23],
      [174.61, 220, 261.63, 329.63]
    ];

    seqTimer = setInterval(() => {
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime + 0.025;
      const s = seqStep % 16;
      const bar = Math.floor(seqStep / 16) % 4;
      if (sourcesState.micA && !sourcesState.micALive && (s === 0 || s === 8)) triggerVocal(now, vocalRoots[bar]);
      if (sourcesState.micB) {
        if (s === 0 || s === 6 || s === 10) triggerKick(now);
        if (s === 4 || s === 12) triggerSnare(now);
        if (s % 2 === 0) triggerHat(now, s === 14);
      }
      if (sourcesState.micC && bassPat[s] > 0) triggerBass(now, bassPat[s], s === 10 ? 0.14 : 0.22);
      if (sourcesState.mp3Playing && !sourcesState.mp3HasCustomFile && (s === 0 || s === 3 || s === 10)) {
        triggerMp3Demo(now, chords[bar], s === 0 ? 0.44 : 0.24);
      }
      seqStep++;
    }, stepMs);
  }

  /* ============================================================================
   * 5. MOTOR DE CABLEADO SVG Y GRAFO DE AUDIO
   * ============================================================================ */
  const cables = [];
  let activeCableStart = null;
  let tempLineEl = null;
  let cableIdCounter = 1;
  let cableVisMode = 0;

  const svgLayer = document.getElementById('cable-layer');
  const stageEl = document.getElementById('studio-stage');

  function getJackEl(id) { return document.querySelector(`.jack[data-jack-id="${id}"]`); }
  function getJackInfo(id) {
    const el = getJackEl(id);
    return el ? { id, el, dir: el.dataset.dir, type: el.dataset.type, name: el.dataset.name } : null;
  }

  function areJacksCompatible(idA, idB) {
    return getCompatibilityError(idA, idB) === null;
  }

  function getCompatibilityError(idA, idB) {
    if (idA === idB) return 'No puedes conectar un conector consigo mismo.';
    const a = getJackInfo(idA); const b = getJackInfo(idB);
    if (!a || !b) return 'Conector no válido.';
    if (cables.some(c => (c.from === idA && c.to === idB) || (c.from === idB && c.to === idA))) {
      return 'Estos dos conectores ya están unidos por un cable.';
    }

    // 1. Validación física de dirección (Salida -> Entrada o Insert I/O)
    const dirValid =
      (a.dir === 'out' && b.dir === 'in') || (a.dir === 'in' && b.dir === 'out') ||
      (a.dir === 'insert' && b.dir === 'in') || (a.dir === 'in' && b.dir === 'insert') ||
      (a.dir === 'out' && b.dir === 'insert') || (a.dir === 'insert' && b.dir === 'out');
    if (!dirValid) return 'Debes unir una SALIDA con una ENTRADA (o con un puerto Insert).';

    // 2. Validación real de tipo físico y nivel eléctrico (XLR Mic vs TRS Línea)
    if (a.type !== b.type) {
      const hasMic = a.type === 'xlr' || b.type === 'xlr';
      if (hasMic) {
        return 'Incompatibilidad XLR / TRS: los micrófonos (XLR) van siempre a una entrada Mic de la mesa. Para procesar un micro con el Expansor o Compresor, usa el "ins" (Insert) del canal.';
      }
      return 'Tipos de conector incompatibles.';
    }

    // 3. El conector Insert (ins) solo conecta con procesadores de rack (Expansor, Compresor, Procesador efectos)
    if (a.dir === 'insert' || b.dir === 'insert') {
      const other = a.dir === 'insert' ? b : a;
      if (!(other.id.startsWith('exp_') || other.id.startsWith('comp_') || other.id.startsWith('extfx_'))) {
        return 'El puerto "ins" (Insert) es exclusivamente para intercalar procesadores externos (Expansor, Compresor o Procesador de efectos).';
      }
    }

    // 4. Regla física real: cada jack físico (in/out) admite UN solo cable; un jack Insert admite 1 envío + 1 retorno
    const { from, to } = normalizeEdge(idA, idB);
    if (from === 'bt_rx_out' && to !== 'ch4_line') {
      return 'El adaptador Bluetooth está asignado a CH 4 Line.';
    }
    const fromInfo = getJackInfo(from);
    const toInfo = getJackInfo(to);

    if (fromInfo.dir === 'out' && cables.some(c => c.from === from)) {
      return `${fromInfo.name.split('—')[0].trim()} ya tiene un cable conectado (1 cable por conector físico).`;
    }
    if (toInfo.dir === 'in' && cables.some(c => c.to === to)) {
      return `${toInfo.name.split('—')[0].trim()} ya está ocupado por otro cable.`;
    }
    if (fromInfo.dir === 'insert' && cables.some(c => c.from === from)) {
      return `${fromInfo.name.split('—')[0].trim()} ya tiene conectado el cable de envío (Send del Insert).`;
    }
    if (toInfo.dir === 'insert' && cables.some(c => c.to === to)) {
      return `${toInfo.name.split('—')[0].trim()} ya tiene conectado el cable de retorno (Return del Insert).`;
    }

    // 5. En un canal mono de la mesa, no se conectan Mic y Line a la vez
    const mCh = to.match(/^ch(\d)_(mic|line)$/);
    if (mCh) {
      const otherIn = `ch${mCh[1]}_${mCh[2] === 'mic' ? 'line' : 'mic'}`;
      if (cables.some(c => c.to === otherIn)) {
        return `CH ${mCh[1]} ya está usando su entrada ${mCh[2] === 'mic' ? 'Line' : 'Mic'}. Usa solo una entrada por canal.`;
      }
    }

    return null;
  }

  function normalizeEdge(idA, idB) {
    const a = getJackInfo(idA); const b = getJackInfo(idB);
    if (a.dir === 'out' && (b.dir === 'in' || b.dir === 'insert')) return { from: idA, to: idB };
    if (b.dir === 'out' && (a.dir === 'in' || a.dir === 'insert')) return { from: idB, to: idA };
    if (a.dir === 'insert' && b.dir === 'in') return { from: idA, to: idB };
    if (b.dir === 'insert' && a.dir === 'in') return { from: idB, to: idA };
    return { from: idA, to: idB };
  }

  function pickCableColor(from, to) {
    if (from.includes('spk') || to.includes('spk')) return '#3b82f6';
    if (from.includes('send') || to.includes('return') || from.includes('aux3') || to.includes('phones')) return '#22c55e';
    if (from.includes('_ins') || to.includes('_ins')) return '#f97316';
    if (from.startsWith('bt_') || to.startsWith('bt_')) return '#38bdf8';
    if (from.startsWith('mp3_') || from.startsWith('extfx_')) return '#a855f7';
    if (from.startsWith('gen_') || from.startsWith('exp_')) return '#f59e0b';
    return '#94a3b8';
  }

  function wouldCreateLoop(newFrom, newTo) {
    const allEdges = [...cables, { from: newFrom, to: newTo }];
    const adj = new Map();
    const link = (u, v) => {
      if (!adj.has(u)) adj.set(u, []);
      adj.get(u).push(v);
    };

    // Conexiones internas reales de los procesadores
    link('exp_in', 'exp_out');
    link('comp_in', 'comp_out');
    link('extfx_in', 'extfx_out');

    // Flujo interno real de cada canal
    for (let ch = 1; ch <= 4; ch++) {
      const insId = `ch${ch}_ins`;
      const hasInsPlug = allEdges.some(e => e.from === insId || e.to === insId);
      link(`ch${ch}_mic`, `ch${ch}_ins_out`);
      link(`ch${ch}_line`, `ch${ch}_ins_out`);
      if (!hasInsPlug) link(`ch${ch}_ins_out`, `ch${ch}_ins_in`);
      link(`ch${ch}_ins_in`, 'mix_send');
      link(`ch${ch}_ins_in`, 'mix_spk1');
      link(`ch${ch}_ins_in`, 'mix_spk2');
      link(`ch${ch}_ins_in`, 'mix_aux3');
    }

    // Return suma al Master (SPK 1/2 y Aux 3), NO vuelve a Send
    link('mix_return', 'mix_spk1');
    link('mix_return', 'mix_spk2');
    link('mix_return', 'mix_aux3');

    const mapNode = (id, isFrom) => id.endsWith('_ins') ? `${id}_${isFrom ? 'out' : 'in'}` : id;
    allEdges.forEach(e => {
      link(mapNode(e.from, true), mapNode(e.to, false));
    });

    const state = new Map();
    const hasCycle = (node) => {
      state.set(node, 1);
      for (const next of (adj.get(node) || [])) {
        const st = state.get(next) || 0;
        if (st === 1) return true;
        if (st === 0 && hasCycle(next)) return true;
      }
      state.set(node, 2);
      return false;
    };

    for (const n of adj.keys()) {
      if ((state.get(n) || 0) === 0 && hasCycle(n)) return true;
    }
    return false;
  }

  function addCable(idA, idB, silent = false) {
    const err = getCompatibilityError(idA, idB);
    if (err) {
      if (!silent) toast(err, 'warn');
      return false;
    }
    const { from, to } = normalizeEdge(idA, idB);
    if (wouldCreateLoop(from, to)) {
      if (!silent) toast('Bucle de realimentación (acople) bloqueado: esa salida volvería a entrar a sí misma.', 'err');
      return false;
    }
    cables.push({ id: `cab_${cableIdCounter++}`, from, to, color: pickCableColor(from, to) });
    renderCables();
    if (audioStarted) rebuildAudioGraph();
    updateBluetoothLinkState();
    updateTopbarStatus();
    if (!silent) {
      toast(`Conectado: ${getJackInfo(from).name.split('—')[0].trim()} → ${getJackInfo(to).name.split('—')[0].trim()}`, 'ok');
      const insId = from.endsWith('_ins') ? from : (to.endsWith('_ins') ? to : null);
      if (insId) {
        const hasOut = cables.some(c => c.from === insId);
        const hasIn = cables.some(c => c.to === insId);
        if (hasOut !== hasIn) {
          const chNum = insId.match(/^ch(\d)_ins$/)[1];
          toast(`CH ${chNum} ins abierto: conecta ahora el cable de ${hasOut ? 'vuelta (out → ins)' : 'ida (ins → in)'} para cerrar el circuito.`, 'warn');
        }
      }
    }
    return true;
  }

  function removeCable(cableId) {
    const idx = cables.findIndex(c => c.id === cableId);
    if (idx === -1) return;
    cables.splice(idx, 1);
    renderCables();
    if (audioStarted) rebuildAudioGraph();
    updateBluetoothLinkState();
    updateTopbarStatus();
    toast('Cable desconectado', 'info');
  }

  function updateMicAPhantomPower() {
    let powered = false;
    const directMicCable = cables.find(c => c.from === 'micA_out' && /^ch(\d)_mic$/.test(c.to));
    if (directMicCable) {
      const ch = Number(directMicCable.to.match(/^ch(\d)_mic$/)[1]);
      powered = Boolean(phantom48State[ch]);
    }
    const pill = document.getElementById('mica-phantom-status');
    pill.textContent = powered ? '+48V ACTIVO' : 'SIN +48V';
    pill.classList.toggle('ok', powered);
    if (audioStarted && audio.sources.micA && ctx) {
      audio.sources.micA.phantomGate.gain.setTargetAtTime(powered ? 1.0 : 0.0, ctx.currentTime, 0.03);
    }
  }

  const activeAudioConnections = [];
  function getOutputNode(id) {
    if (id === 'micA_out') return audio.sources.micA.out;
    if (id === 'micB_out') return audio.sources.micB.out;
    if (id === 'bt_rx_out') return audio.sources.btReceiver.out;
    if (id === 'mp3_out') return audio.sources.mp3.out;
    if (id === 'gen_out') return audio.gen.out;
    if (id === 'exp_out') return audio.units.exp.out;
    if (id === 'comp_out') return audio.units.comp.out;
    if (id === 'extfx_out') return audio.units.extfx.out;
    if (id === 'mix_send') return audio.bus.sendMaster;
    if (id === 'mix_aux3') return audio.bus.aux3.out;
    if (id === 'mix_spk1') return audio.bus.masterFaderL;
    if (id === 'mix_spk2') return audio.bus.masterFaderR;
    const m = id.match(/^ch(\d)_ins$/);
    if (m) return audio.channels[Number(m[1])].insertSend;
    return null;
  }

  function getInputNode(id) {
    const mMic = id.match(/^ch(\d)_mic$/); if (mMic) return audio.channels[Number(mMic[1])].micIn;
    const mLine = id.match(/^ch(\d)_line$/); if (mLine) return audio.channels[Number(mLine[1])].lineIn;
    const mIns = id.match(/^ch(\d)_ins$/); if (mIns) return audio.channels[Number(mIns[1])].insertReturn;
    if (id === 'exp_in') return audio.units.exp.in;
    if (id === 'comp_in') return audio.units.comp.in;
    if (id === 'extfx_in') return audio.units.extfx.in;
    if (id === 'mix_return') return audio.bus.return.in;
    if (id === 'spk1_in') return audio.outputs.spk1In;
    if (id === 'spk2_in') return audio.outputs.spk2In;
    if (id === 'phones_in') return audio.outputs.phonesIn;
    return null;
  }

  function rebuildAudioGraph() {
    if (!audioStarted || !ctx) return;
    while (activeAudioConnections.length > 0) {
      const c = activeAudioConnections.pop();
      try { c.src.disconnect(c.dst); } catch (_) {}
    }

    for (let ch = 1; ch <= 4; ch++) {
      const insId = `ch${ch}_ins`;
      const hasOut = cables.some(c => c.from === insId);
      const hasIn = cables.some(c => c.to === insId);
      const anyPlug = hasOut || hasIn;
      audio.channels[ch].insertBypass.gain.setTargetAtTime(anyPlug ? 0 : 1, ctx.currentTime, 0.015);
      const insEl = getJackEl(insId);
      if (insEl) insEl.classList.toggle('ins-open', anyPlug && !(hasOut && hasIn));
    }

    cables.forEach(c => {
      const src = getOutputNode(c.from);
      const dst = getInputNode(c.to);
      if (src && dst) {
        try { src.connect(dst); activeAudioConnections.push({ src, dst }); } catch (_) {}
      }
    });
    document.getElementById('spk1-led').className = `led-dot ${cables.some(c => c.to === 'spk1_in') ? 'blue-on' : ''}`;
    document.getElementById('spk2-led').className = `led-dot ${cables.some(c => c.to === 'spk2_in') ? 'blue-on' : ''}`;
    document.getElementById('phones-led').className = `led-dot ${cables.some(c => c.to === 'phones_in') ? 'green-on' : ''}`;
    updateMicAPhantomPower();
  }

  /* ============================================================================
   * 6. RENDERIZADO DE CABLES SVG
   * ============================================================================ */
  function getJackCenter(id) {
    const el = getJackEl(id);
    if (!el) return { x: 0, y: 0 };
    const sr = stageEl.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top };
  }

  function makeCatenary(p1, p2) {
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const droop = Math.min(125, 28 + dist * 0.22);
    const cx = (p1.x + p2.x) / 2;
    const cy = Math.max(p1.y, p2.y) + droop * 0.52 + Math.abs(p2.y - p1.y) * 0.08;
    return {
      d: `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`,
      midX: 0.25 * p1.x + 0.5 * cx + 0.25 * p2.x,
      midY: 0.25 * p1.y + 0.5 * cy + 0.25 * p2.y
    };
  }

  function renderCables() {
    svgLayer.innerHTML = '';
    if (tempLineEl) svgLayer.appendChild(tempLineEl);
    const NS = 'http://www.w3.org/2000/svg';

    cables.forEach(c => {
      const p1 = getJackCenter(c.from);
      const p2 = getJackCenter(c.to);
      const { d, midX, midY } = makeCatenary(p1, p2);

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'cable-group');

      const sh = document.createElementNS(NS, 'path');
      sh.setAttribute('d', d); sh.setAttribute('class', 'cable-shadow'); sh.setAttribute('transform', 'translate(0,5)');
      const bd = document.createElementNS(NS, 'path');
      bd.setAttribute('d', d); bd.setAttribute('class', 'cable-body'); bd.setAttribute('stroke', c.color);
      const hi = document.createElementNS(NS, 'path');
      hi.setAttribute('d', d); hi.setAttribute('class', 'cable-highlight');
      const hit = document.createElementNS(NS, 'path');
      hit.setAttribute('d', d); hit.setAttribute('class', 'cable-hit');

      [p1, p2].forEach(pt => {
        const pl = document.createElementNS(NS, 'circle');
        pl.setAttribute('cx', pt.x); pl.setAttribute('cy', pt.y); pl.setAttribute('r', '5.8');
        pl.setAttribute('fill', '#181d25'); pl.setAttribute('stroke', c.color); pl.setAttribute('stroke-width', '2.2');
        g.appendChild(pl);
      });

      const badge = document.createElementNS(NS, 'g');
      badge.setAttribute('class', 'cable-delete-badge');
      badge.setAttribute('transform', `translate(${midX}, ${midY})`);
      const bc = document.createElementNS(NS, 'circle');
      bc.setAttribute('r', '9.5'); bc.setAttribute('fill', '#dc2626'); bc.setAttribute('stroke', '#fff'); bc.setAttribute('stroke-width', '1.4');
      const bt = document.createElementNS(NS, 'text');
      bt.setAttribute('text-anchor', 'middle'); bt.setAttribute('dy', '3.5'); bt.setAttribute('fill', '#fff');
      bt.setAttribute('font-size', '12'); bt.setAttribute('font-weight', '800'); bt.textContent = '×';
      badge.appendChild(bc); badge.appendChild(bt);

      const tip = `Cable: ${getJackInfo(c.from).name.split('—')[0].trim()} → ${getJackInfo(c.to).name.split('—')[0].trim()}\n(Clic para desconectar)`;
      const onClick = (e) => { e.stopPropagation(); hideTooltip(); removeCable(c.id); };
      hit.addEventListener('mouseenter', (e) => showTooltip(tip, e.clientX, e.clientY));
      hit.addEventListener('mousemove', (e) => showTooltip(tip, e.clientX, e.clientY));
      hit.addEventListener('mouseleave', hideTooltip);
      hit.addEventListener('click', onClick);
      badge.addEventListener('click', onClick);

      g.appendChild(sh); g.appendChild(bd); g.appendChild(hi); g.appendChild(hit); g.appendChild(badge);
      svgLayer.appendChild(g);
    });
    updateModalFlowList();
  }

  function highlightTargets(srcId) {
    document.querySelectorAll('.jack').forEach(el => {
      const id = el.dataset.jackId;
      el.classList.remove('source-selected', 'compatible-target', 'incompatible-target');
      if (!srcId) return;
      if (id === srcId) el.classList.add('source-selected');
      else if (areJacksCompatible(srcId, id)) el.classList.add('compatible-target');
      else el.classList.add('incompatible-target');
    });
  }

  function startCableDrag(id) {
    activeCableStart = id;
    highlightTargets(id);
    const NS = 'http://www.w3.org/2000/svg';
    if (!tempLineEl) {
      tempLineEl = document.createElementNS(NS, 'path');
      tempLineEl.setAttribute('fill', 'none'); tempLineEl.setAttribute('stroke', '#facc15');
      tempLineEl.setAttribute('stroke-width', '4.2'); tempLineEl.setAttribute('stroke-dasharray', '6 5');
      svgLayer.appendChild(tempLineEl);
    }
    const p1 = getJackCenter(id);
    tempLineEl.setAttribute('d', `M ${p1.x} ${p1.y} L ${p1.x} ${p1.y}`);
  }

  function cancelCableDrag() {
    activeCableStart = null;
    highlightTargets(null);
    if (tempLineEl) { tempLineEl.remove(); tempLineEl = null; }
  }

  document.querySelectorAll('.jack').forEach(el => {
    const id = el.dataset.jackId;
    el.addEventListener('mouseenter', (e) => {
      const dir = el.dataset.dir === 'out' ? 'SALIDA' : (el.dataset.dir === 'in' ? 'ENTRADA' : 'INSERT I/O');
      const hint = activeCableStart ? (areJacksCompatible(activeCableStart, id) ? '✓ Compatible' : '✕ Incompatible') : 'Clic para cablear';
      showTooltip(`${el.dataset.name}\n[${dir}] · ${hint}`, e.clientX, e.clientY);
    });
    el.addEventListener('mousemove', (e) => { tooltipEl.style.left = `${e.clientX}px`; tooltipEl.style.top = `${e.clientY}px`; });
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      await ensureAudioRunning();
      if (!activeCableStart) startCableDrag(id);
      else if (activeCableStart === id) cancelCableDrag();
      else if (addCable(activeCableStart, id)) cancelCableDrag();
    });
  });

  window.addEventListener('pointerdown', () => {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => updateAudioDiagnostics()).catch(() => {});
    }
  }, { capture: true });

  window.addEventListener('pointermove', (e) => {
    if (!activeCableStart || !tempLineEl) return;
    const p1 = getJackCenter(activeCableStart);
    const sr = stageEl.getBoundingClientRect();
    const p2 = { x: e.clientX - sr.left, y: e.clientY - sr.top };
    const { d } = makeCatenary(p1, p2);
    tempLineEl.setAttribute('d', d);
  });

  window.addEventListener('click', () => { if (activeCableStart) cancelCableDrag(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && activeCableStart) cancelCableDrag(); });
  window.addEventListener('resize', () => { renderCables(); resizeRtaCanvas(); });

  /* ============================================================================
   * 7. PERILLAS, FADERS, +48V, MUTE, PFL Y EQ
   * ============================================================================ */
  function updateKnobVisual(ringEl, val) {
    const min = parseFloat(ringEl.dataset.min);
    const max = parseFloat(ringEl.dataset.max);
    const angle = -135 + ((val - min) / (max - min)) * 270;
    const cap = ringEl.querySelector('.knob-cap');
    if (cap) cap.style.transform = `rotate(${angle}deg)`;
    ringEl.dataset.val = val;
  }

  function applyKnob(key, val) {
    params[key] = val;
    if (!audioStarted || !ctx) return;
    const t = ctx.currentTime;

    const m = key.match(/^ch(\d)_(\w+)$/);
    if (m) {
      const ch = audio.channels[Number(m[1])];
      const p = m[2];
      if (p === 'gain') ch.preamp.gain.setTargetAtTime(dbToGain(val), t, 0.015);
      if (p === 'lp') ch.lp.gain.setTargetAtTime(val, t, 0.02);
      if (p === 'mp') ch.mp.gain.setTargetAtTime(val, t, 0.02);
      if (p === 'hp') ch.hp.gain.setTargetAtTime(val, t, 0.02);
      if (p === 'pan') {
        const ang = (val / 100 + 1) * Math.PI * 0.25;
        ch.panL.gain.setTargetAtTime(Math.cos(ang), t, 0.015);
        ch.panR.gain.setTargetAtTime(Math.sin(ang), t, 0.015);
      }
      if (p === 'fx') ch.fxSend.gain.setTargetAtTime(val / 100, t, 0.015);
      if (p === 'send') ch.auxSend.gain.setTargetAtTime(val / 100, t, 0.015);
      return;
    }

    if (key === 'gen_level' && sourcesState.genMode !== 'off') audio.gen.out.gain.setTargetAtTime(dbToGain(val), t, 0.02);
    if (key === 'vol_send') audio.bus.sendMaster.gain.setTargetAtTime(val / 100, t, 0.02);
    if (key === 'vol_return') audio.bus.return.master.gain.setTargetAtTime(val / 100, t, 0.02);
    if (key === 'vol_aux3') audio.bus.aux3.out.gain.setTargetAtTime(val / 100, t, 0.02);
    if (key === 'fx_par') applyInternalFxPreset();
    if (key === 'comp_thresh') audio.units.comp.comp.threshold.setTargetAtTime(val, t, 0.02);
    if (key === 'comp_ratio') audio.units.comp.comp.ratio.setTargetAtTime(val, t, 0.02);
    if (key === 'comp_attack') audio.units.comp.comp.attack.setTargetAtTime(val / 1000, t, 0.02);
    if (key === 'comp_makeup') audio.units.comp.makeup.gain.setTargetAtTime(dbToGain(val), t, 0.02);
    if (key === 'extfx_mix' || key === 'extfx_decay') applyExternalFxPreset();
  }

  document.querySelectorAll('.knob-ring').forEach(ringEl => {
    const key = ringEl.dataset.knob;
    const min = parseFloat(ringEl.dataset.min);
    const max = parseFloat(ringEl.dataset.max);
    const initial = parseFloat(ringEl.dataset.val);
    const unit = ringEl.dataset.unit || '';
    updateKnobVisual(ringEl, initial);
    params[key] = initial;

    const fmtVal = (v) => key.endsWith('_pan')
      ? (Math.abs(v) < 4 ? 'CENTRO' : (v < 0 ? `L ${Math.round(-v)}%` : `R ${Math.round(v)}%`))
      : `${v.toFixed(1)} ${unit}`;

    let drag = false, sy = 0, sv = initial;
    ringEl.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      drag = true; sy = e.clientY; sv = parseFloat(ringEl.dataset.val);
      ringEl.setPointerCapture(e.pointerId);
      showTooltip(fmtVal(sv), e.clientX, e.clientY - 12);
    });
    ringEl.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const next = Math.max(min, Math.min(max, sv + ((sy - e.clientY) / 115) * (max - min)));
      updateKnobVisual(ringEl, next);
      applyKnob(key, next);
      showTooltip(fmtVal(next), e.clientX, e.clientY - 12);
    });
    ringEl.addEventListener('pointerup', (e) => {
      if (!drag) return; drag = false;
      try { ringEl.releasePointerCapture(e.pointerId); } catch (_) {}
      hideTooltip();
    });
    ringEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const step = (max - min) * 0.04;
      const next = Math.max(min, Math.min(max, parseFloat(ringEl.dataset.val) + (e.deltaY < 0 ? step : -step)));
      updateKnobVisual(ringEl, next);
      applyKnob(key, next);
      showTooltip(fmtVal(next), e.clientX, e.clientY - 12);
      clearTimeout(ringEl._tt); ringEl._tt = setTimeout(hideTooltip, 700);
    }, { passive: false });
    ringEl.addEventListener('dblclick', () => {
      updateKnobVisual(ringEl, initial); applyKnob(key, initial);
      toast(`Restablecido: ${fmtVal(initial)}`, 'info');
    });
  });

  // Botones por canal CH 1..4
  for (let ch = 1; ch <= 4; ch++) {
    const b48 = document.getElementById(`btn-48v-${ch}`);
    b48.addEventListener('click', () => {
      phantom48State[ch] = !phantom48State[ch];
      b48.classList.toggle('on', phantom48State[ch]);
      updateMicAPhantomPower();
      toast(`CH ${ch}: +48V Phantom ${phantom48State[ch] ? 'ACTIVADO' : 'apagado'}`, phantom48State[ch] ? 'ok' : 'info');
    });

    const bMute = document.getElementById(`btn-mute-${ch}`);
    bMute.addEventListener('click', () => {
      bMute.classList.toggle('muted');
      const m = bMute.classList.contains('muted');
      if (audioStarted) audio.channels[ch].muteNode.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.012);
    });

    const bSolo = document.getElementById(`btn-solo-${ch}`);
    bSolo.addEventListener('click', () => {
      soloState[ch] = !soloState[ch];
      bSolo.classList.toggle('soloed', soloState[ch]);
      updateSoloRouting();
      if (soloState[ch] && listenMode !== 'phones') {
        toast(`CH ${ch} en PFL: cambia a "Cascos / PFL" arriba para oírlo aislado`, 'warn');
      }
    });

    document.getElementById(`fader-ch-${ch}`).addEventListener('input', (e) => {
      if (audioStarted) audio.channels[ch].faderNode.gain.setTargetAtTime(faderToGain(parseFloat(e.target.value)), ctx.currentTime, 0.015);
    });
  }

  document.getElementById('btn-all-48v').addEventListener('click', () => {
    const anyOff = [1, 2, 3, 4].some(c => !phantom48State[c]);
    for (let ch = 1; ch <= 4; ch++) {
      phantom48State[ch] = anyOff;
      document.getElementById(`btn-48v-${ch}`).classList.toggle('on', anyOff);
    }
    updateMicAPhantomPower();
    toast(`+48V Phantom en todos los canales: ${anyOff ? 'ON' : 'OFF'}`, anyOff ? 'ok' : 'info');
  });

  // Master, FX Master y EQ Gráfico Azul
  document.getElementById('fader-master-l').addEventListener('input', (e) => {
    if (audioStarted) audio.bus.masterFaderL.gain.setTargetAtTime(faderToGain(parseFloat(e.target.value)), ctx.currentTime, 0.015);
    updateAudioDiagnostics();
  });
  document.getElementById('fader-master-r').addEventListener('input', (e) => {
    if (audioStarted) audio.bus.masterFaderR.gain.setTargetAtTime(faderToGain(parseFloat(e.target.value)), ctx.currentTime, 0.015);
    updateAudioDiagnostics();
  });
  document.getElementById('fader-master-r').addEventListener('input', (e) => {
    if (audioStarted) audio.bus.masterFaderR.gain.setTargetAtTime(faderToGain(parseFloat(e.target.value)), ctx.currentTime, 0.015);
  });
  document.getElementById('fader-fx-master').addEventListener('input', (e) => {
    if (audioStarted) audio.bus.intFx.master.gain.setTargetAtTime(faderToGain(parseFloat(e.target.value)), ctx.currentTime, 0.015);
  });

  document.querySelectorAll('.eq-fader').forEach(sl => {
    sl.addEventListener('input', () => {
      const side = sl.dataset.eqSide;
      const idx = Number(sl.dataset.eqIdx);
      const val = parseFloat(sl.value);
      if (eqLinked) {
        const otherSide = side === 'l' ? 'r' : 'l';
        const twin = document.querySelector(`.eq-fader[data-eq-side="${otherSide}"][data-eq-idx="${idx}"]`);
        if (twin && parseFloat(twin.value) !== val) twin.value = val;
      }
      if (!audioStarted) return;
      if (eqLinked) {
        audio.bus.eqL[idx].gain.setTargetAtTime(val, ctx.currentTime, 0.02);
        audio.bus.eqR[idx].gain.setTargetAtTime(val, ctx.currentTime, 0.02);
      } else {
        const bank = side === 'l' ? audio.bus.eqL : audio.bus.eqR;
        bank[idx].gain.setTargetAtTime(val, ctx.currentTime, 0.02);
      }
    });
  });

  document.getElementById('btn-eq-link').addEventListener('click', (e) => {
    eqLinked = !eqLinked;
    e.target.classList.toggle('blue-on', eqLinked);
    e.target.textContent = eqLinked ? 'LINK' : 'L/R IND';
    toast(eqLinked ? 'EQ Gráfico enlazado (L y R se mueven juntos)' : 'EQ Gráfico independiente (L y R por separado)', 'info');
  });

  document.getElementById('btn-eq-flat').addEventListener('click', () => {
    document.querySelectorAll('.eq-fader').forEach(s => { s.value = 0; s.dispatchEvent(new Event('input')); });
    toast('EQ Gráfico Master a 0 dB (Plano)', 'info');
  });

  document.getElementById('btn-eq-bypass').addEventListener('click', (e) => {
    eqMasterActive = !eqMasterActive;
    e.target.textContent = eqMasterActive ? 'ON' : 'BYP';
    e.target.classList.toggle('amber-on', !eqMasterActive);
    if (audioStarted && audio.bus.eqBypass) {
      const t = ctx.currentTime;
      audio.bus.eqBypass.wetL.gain.setTargetAtTime(eqMasterActive ? 1 : 0, t, 0.02);
      audio.bus.eqBypass.wetR.gain.setTargetAtTime(eqMasterActive ? 1 : 0, t, 0.02);
      audio.bus.eqBypass.dryL.gain.setTargetAtTime(eqMasterActive ? 0 : 1, t, 0.02);
      audio.bus.eqBypass.dryR.gain.setTargetAtTime(eqMasterActive ? 0 : 1, t, 0.02);
    }
  });

  // Bypass de unidades externas
  document.getElementById('btn-exp-bypass').addEventListener('click', (e) => {
    bypassState.exp = !bypassState.exp;
    e.target.textContent = bypassState.exp ? 'BYP' : 'ON';
    e.target.classList.toggle('active', !bypassState.exp);
    e.target.classList.toggle('amber-on', bypassState.exp);
  });

  document.getElementById('btn-comp-bypass').addEventListener('click', (e) => {
    bypassState.comp = !bypassState.comp;
    e.target.textContent = bypassState.comp ? 'BYP' : 'ON';
    e.target.classList.toggle('active', !bypassState.comp);
    e.target.classList.toggle('amber-on', bypassState.comp);
    if (audioStarted && audio.units.comp) {
      const t = ctx.currentTime;
      audio.units.comp.wet.gain.setTargetAtTime(bypassState.comp ? 0 : 1, t, 0.02);
      audio.units.comp.dry.gain.setTargetAtTime(bypassState.comp ? 1 : 0, t, 0.02);
    }
  });

  document.getElementById('btn-extfx-bypass').addEventListener('click', (e) => {
    bypassState.extfx = !bypassState.extfx;
    e.target.textContent = bypassState.extfx ? 'BYP' : 'ON';
    e.target.classList.toggle('active', !bypassState.extfx);
    e.target.classList.toggle('amber-on', bypassState.extfx);
    applyExternalFxPreset();
  });

  document.getElementById('int-fx-screen').addEventListener('click', async () => {
    await ensureAudioRunning();
    intFxIndex = (intFxIndex + 1) % INT_FX_PRESETS.length;
    document.getElementById('int-fx-name').textContent = INT_FX_PRESETS[intFxIndex];
    applyInternalFxPreset();
  });

  document.getElementById('ext-fx-screen').addEventListener('click', async () => {
    await ensureAudioRunning();
    extFxIndex = (extFxIndex + 1) % EXT_FX_PRESETS.length;
    document.getElementById('ext-fx-name').textContent = EXT_FX_PRESETS[extFxIndex];
    applyExternalFxPreset();
  });

  /* ============================================================================
   * 8. BOTONES DE FUENTES (MICS, MIC REAL, MP3 REAL, GENERADOR Y GRABADOR)
   * ============================================================================ */
  function stopLiveMic() {
    if (liveMicSourceNode) {
      try { liveMicSourceNode.disconnect(); } catch (_) {}
      liveMicSourceNode = null;
    }
    if (liveMicStream) {
      liveMicStream.getTracks().forEach(tr => tr.stop());
      liveMicStream = null;
    }
    sourcesState.micALive = false;
  }

  function syncSourceButtons() {
    const bA = document.getElementById('btn-src-mica');
    const bAL = document.getElementById('btn-src-mica-live');
    const bB = document.getElementById('btn-src-micb');
    const bC = document.getElementById('btn-src-micc');
    const bM = document.getElementById('btn-src-mp3');

    bA.classList.toggle('active', sourcesState.micA && !sourcesState.micALive);
    bA.textContent = (sourcesState.micA && !sourcesState.micALive) ? '■ Voz' : '▶ Voz';
    bAL.classList.toggle('live-mic', sourcesState.micALive);
    bAL.textContent = sourcesState.micALive ? 'VIVO' : 'Real';
    document.getElementById('svg-mica-led').setAttribute('opacity', (sourcesState.micA || sourcesState.micALive) ? '1' : '0.2');

    bB.classList.toggle('active', sourcesState.micB);
    bB.textContent = sourcesState.micB ? '■ Batería' : '▶ Batería';
    document.getElementById('svg-micb-led').setAttribute('opacity', sourcesState.micB ? '1' : '0.2');

    bC.classList.toggle('active', sourcesState.micC);
    bC.textContent = sourcesState.micC ? '■ Mic' : '▶ Mic';
    document.getElementById('svg-micc-led').setAttribute('opacity', sourcesState.micC ? '1' : '0.2');
    updateBluetoothLinkState();

    bM.classList.toggle('active', sourcesState.mp3Playing);
    bM.textContent = sourcesState.mp3Playing ? '❚❚ Pausa' : '▶ Play';
    if (!sourcesState.mp3HasCustomFile) {
      document.getElementById('mp3-time-txt').textContent = sourcesState.mp3Playing ? 'PLAY · DEMO 112BPM' : 'PAUSA · INTERNO';
    }
    if (audioStarted && audio.sources.micA && ctx) {
      const hissActive = sourcesState.micA && !sourcesState.micALive;
      audio.sources.micA.roomNoiseGain.gain.setTargetAtTime(hissActive ? 0.0045 : 0.0, ctx.currentTime, 0.05);
    }
    updateAudioDiagnostics();
  }

  function updateBluetoothLinkState() {
    const receiverConnected = cables.some(c => c.from === 'bt_rx_out' && c.to === 'ch4_line');
    const transmitting = receiverConnected && sourcesState.micC;
    document.getElementById('bt-mic-indicator').classList.toggle('rf-active', receiverConnected);
    document.getElementById('bt-adapter-indicator').classList.toggle('rf-active', receiverConnected);
    document.getElementById('bt-mic-status').textContent = !receiverConnected ? 'SIN ENLACE' : (transmitting ? 'TRANSMITIENDO' : 'EMPAREJADO');
    document.getElementById('bt-adapter-status').textContent = transmitting ? 'SEÑAL RECIBIDA' : (receiverConnected ? 'ESPERANDO SEÑAL' : 'SIN ENLACE');
  }

  document.getElementById('btn-src-mica').addEventListener('click', async () => {
    await ensureAudioRunning();
    if (sourcesState.micALive) stopLiveMic();
    sourcesState.micA = !sourcesState.micA;
    syncSourceButtons();
    if (sourcesState.micA && !document.getElementById('mica-phantom-status').classList.contains('ok')) {
      toast('Mic A es de condensador: conéctalo a un canal Mic XLR y activa su botón 48V para escucharlo.', 'warn');
    }
  });

  document.getElementById('btn-src-mica-live').addEventListener('click', async () => {
    await ensureAudioRunning();
    if (sourcesState.micALive) {
      stopLiveMic();
      syncSourceButtons();
      toast('Micrófono real desactivado', 'info');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast('Tu navegador no permite acceso al micrófono real en este contexto.', 'err');
      return;
    }
    try {
      liveMicStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false }
      });
      liveMicSourceNode = ctx.createMediaStreamSource(liveMicStream);
      liveMicSourceNode.connect(audio.sources.micA.in);
      sourcesState.micA = false;
      sourcesState.micALive = true;
      syncSourceButtons();
      toast('Micrófono real activo en Mic A (asegúrate de tener +48V activado en su canal)', 'ok');
    } catch (err) {
      toast('No se pudo acceder al micrófono real (permiso denegado o sin dispositivo).', 'err');
    }
  });

  document.getElementById('btn-src-micb').addEventListener('click', async () => {
    await ensureAudioRunning();
    sourcesState.micB = !sourcesState.micB;
    syncSourceButtons();
  });

  document.getElementById('btn-src-micc').addEventListener('click', async () => {
    await ensureAudioRunning();
    sourcesState.micC = !sourcesState.micC;
    syncSourceButtons();
  });

  document.getElementById('btn-src-mp3').addEventListener('click', async () => {
    await ensureAudioRunning();
    sourcesState.mp3Playing = !sourcesState.mp3Playing;
    if (sourcesState.mp3HasCustomFile) {
      ensureMp3MediaNode();
      if (sourcesState.mp3Playing) {
        mp3AudioEl.play().catch(() => toast('No se pudo reproducir el archivo cargado.', 'err'));
      } else {
        mp3AudioEl.pause();
      }
    }
    syncSourceButtons();
  });

  document.getElementById('file-mp3-input').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await ensureAudioRunning();
    ensureMp3MediaNode();
    if (customMp3ObjectUrl) URL.revokeObjectURL(customMp3ObjectUrl);
    customMp3ObjectUrl = URL.createObjectURL(file);
    mp3AudioEl.src = customMp3ObjectUrl;
    sourcesState.mp3HasCustomFile = true;
    sourcesState.mp3Playing = true;
    document.getElementById('mp3-track-name').textContent = file.name.toUpperCase();
    try {
      await mp3AudioEl.play();
      toast(`Archivo cargado en MP3 - TRSH: ${file.name}`, 'ok');
    } catch (_) {
      sourcesState.mp3Playing = false;
      toast('Archivo cargado. Pulsa Play para iniciar la reproducción.', 'info');
    }
    syncSourceButtons();
  });

  async function setGenMode(mode) {
    await ensureAudioRunning();
    sourcesState.genMode = (sourcesState.genMode === mode) ? 'off' : mode;
    const t = ctx.currentTime;
    const on = sourcesState.genMode !== 'off';
    audio.gen.sineGain.gain.setTargetAtTime(sourcesState.genMode === 'sine' ? 1 : 0, t, 0.015);
    audio.gen.pinkGain.gain.setTargetAtTime(sourcesState.genMode === 'pink' ? 1 : 0, t, 0.015);
    audio.gen.out.gain.setTargetAtTime(on ? dbToGain(params.gen_level) : 0, t, 0.015);

    document.getElementById('btn-gen-sine').classList.toggle('amber-on', sourcesState.genMode === 'sine');
    document.getElementById('btn-gen-pink').classList.toggle('amber-on', sourcesState.genMode === 'pink');

    if (on && !cables.some(c => c.from === 'gen_out')) {
      toast('Generador encendido: conecta su salida OUT a cualquier entrada Line de la mesa.', 'warn');
    }
  }

  document.getElementById('btn-gen-sine').addEventListener('click', () => setGenMode('sine'));
  document.getElementById('btn-gen-pink').addEventListener('click', () => setGenMode('pink'));

  // Grabador de Mezcla Master
  const btnRec = document.getElementById('btn-rec-toggle');
  const recLabel = document.getElementById('rec-btn-label');
  const recTimer = document.getElementById('rec-timer');
  const recDownload = document.getElementById('btn-rec-download');

  btnRec.addEventListener('click', async () => {
    await ensureAudioRunning();
    const rec = audio.recorder;
    if (!rec.dest) { toast('Tu navegador no permite grabar la mezcla en este modo.', 'err'); return; }
    if (!rec.recording) {
      if (typeof MediaRecorder === 'undefined') { toast('Tu navegador no soporta MediaRecorder.', 'err'); return; }
      rec.chunks = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      rec.mediaRecorder = new MediaRecorder(rec.dest.stream, { mimeType: mime });
      rec.mediaRecorder.ondataavailable = (ev) => { if (ev.data.size > 0) rec.chunks.push(ev.data); };
      rec.mediaRecorder.onstop = () => {
        const blob = new Blob(rec.chunks, { type: mime });
        recDownload.href = URL.createObjectURL(blob);
        recDownload.style.display = 'inline-flex';
        toast('Grabación terminada. Pulsa "Guardar" para descargar el audio.', 'ok');
      };
      rec.mediaRecorder.start();
      rec.recording = true; rec.startTime = Date.now();
      btnRec.classList.add('recording'); recLabel.textContent = '■ DETENER'; recDownload.style.display = 'none';
      rec.timerId = setInterval(() => {
        const s = Math.floor((Date.now() - rec.startTime) / 1000);
        recTimer.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      }, 250);
    } else {
      rec.mediaRecorder.stop(); rec.recording = false; clearInterval(rec.timerId);
      btnRec.classList.remove('recording'); recLabel.textContent = '● REC MEZCLA';
    }
  });

  /* ============================================================================
   * 9. BARRA SUPERIOR, MODO CLARO/OSCURO Y AUTO-CONECTAR
   * ============================================================================ */
  document.getElementById('btn-power').addEventListener('click', async () => {
    const ok = await ensureAudioRunning();
    if (ok && cables.length === 0) {
      playTestChime();
      toast('Audio encendido (tono de prueba OK). Pulsa "Auto-conectar" o cablea tus equipos para escuchar la mezcla.', 'info');
    }
  });

  document.getElementById('btn-audio-test').addEventListener('click', async () => {
    const ok = await ensureAudioRunning();
    if (ok) {
      playTestChime();
      toast('Tono de prueba enviado a tus altavoces. Si no lo oyes, revisa el volumen del equipo o la pestaña silenciada.', 'ok');
    }
  });

  document.getElementById('audio-diag').addEventListener('click', async () => {
    if (!audioStarted || (ctx && ctx.state !== 'running')) {
      await ensureAudioRunning();
      playTestChime();
      return;
    }
    if (cables.length === 0) {
      document.getElementById('btn-autoconnect').click();
    }
  });

  document.getElementById('btn-clear-cables').addEventListener('click', () => {
    cables.length = 0; cancelCableDrag(); renderCables();
    if (audioStarted) rebuildAudioGraph();
    updateBluetoothLinkState();
    updateTopbarStatus(); toast('Todos los cables retirados', 'info');
  });

  document.getElementById('btn-cable-vis').addEventListener('click', (e) => {
    cableVisMode = (cableVisMode + 1) % 3;
    svgLayer.classList.remove('dimmed', 'hidden-cables');
    if (cableVisMode === 1) svgLayer.classList.add('dimmed');
    if (cableVisMode === 2) svgLayer.classList.add('hidden-cables');
    e.currentTarget.querySelector('span').textContent = ['Cables: 100%', 'Cables: 25%', 'Cables: Mín'][cableVisMode];
  });

  document.getElementById('btn-theme').addEventListener('click', (e) => {
    document.body.classList.toggle('light-board');
    const light = document.body.classList.contains('light-board');
    e.currentTarget.querySelector('span').textContent = light ? 'Modo Oscuro' : 'Modo Claro';
  });

  const labDrawer = document.getElementById('lab-drawer');
  document.getElementById('lab-toggle').addEventListener('click', () => {
    labDrawer.classList.toggle('collapsed');
    const c = labDrawer.classList.contains('collapsed');
    document.getElementById('lab-state-tag').textContent = c ? 'OCULTO' : 'ABIERTO';
    document.getElementById('lab-chevron').textContent = c ? '▶ Mostrar Laboratorio (RTA / Gen / Rec)' : '▼ Ocultar para vista limpia';
    requestAnimationFrame(() => { renderCables(); resizeRtaCanvas(); });
  });

  document.getElementById('listen-spk').addEventListener('click', () => { listenMode = 'speakers'; updateListenRouting(); updateAudioDiagnostics(); });
  document.getElementById('listen-phones').addEventListener('click', () => {
    listenMode = 'phones'; updateListenRouting(); updateAudioDiagnostics();
    if (!cables.some(c => c.to === 'phones_in')) {
      toast('Conecta un cable desde Aux 3 hasta Cascos (in) para oír por auriculares.', 'warn');
    }
  });
  document.getElementById('btn-phones-listen').addEventListener('click', () => {
    listenMode = listenMode === 'phones' ? 'speakers' : 'phones'; updateListenRouting(); updateAudioDiagnostics();
    if (listenMode === 'phones' && !cables.some(c => c.to === 'phones_in')) {
      toast('Conecta un cable desde Aux 3 hasta Cascos (in) para oír por auriculares.', 'warn');
    }
  });

  document.getElementById('btn-rta-mode').addEventListener('click', (e) => {
    rtaMode = (rtaMode + 1) % 3;
    e.target.textContent = ['RTA+OSC', 'SOLO RTA', 'SOLO OSC'][rtaMode];
  });

  // Auto-conectar 100% fiel a la realidad de un estudio analógico
  document.getElementById('btn-autoconnect').addEventListener('click', async () => {
    const ok = await ensureAudioRunning();
    if (!ok) return;
    cables.length = 0;

    for (let ch = 1; ch <= 4; ch++) {
      phantom48State[ch] = false;
      document.getElementById(`btn-48v-${ch}`).classList.remove('on');
    }
    phantom48State[1] = true;
    document.getElementById('btn-48v-1').classList.add('on');
    addCable('micA_out', 'ch1_mic', true);
    addCable('ch1_ins', 'exp_in', true);
    addCable('exp_out', 'ch1_ins', true);

    addCable('micB_out', 'ch2_mic', true);
    addCable('ch2_ins', 'comp_in', true);
    addCable('comp_out', 'ch2_ins', true);
    addCable('mp3_out', 'ch3_line', true);
    addCable('bt_rx_out', 'ch4_line', true);

    // Envío paralelo Send -> Procesador efectos -> Return (100% Wet)
    addCable('mix_send', 'extfx_in', true);
    addCable('extfx_out', 'mix_return', true);

    // 6. Salidas SPK 1 y SPK 2 -> Altavoces SPK 1 y SPK 2
    addCable('mix_spk1', 'spk1_in', true);
    addCable('mix_spk2', 'spk2_in', true);

    // 7. Aux 3 -> Cascos
    addCable('mix_aux3', 'phones_in', true);

    sourcesState.micA = true;
    sourcesState.micB = true;
    sourcesState.micC = true;
    sourcesState.mp3Playing = true;
    if (sourcesState.mp3HasCustomFile) {
      ensureMp3MediaNode();
      mp3AudioEl.play().catch(() => {});
    }
    syncSourceButtons();

    renderCables();
    rebuildAudioGraph();
    updateTopbarStatus();
    updateAudioDiagnostics();
    toast('Conectado: Mic BT → Adaptador BT → CH 4, micrófonos a preamps, dinámica en Inserts y FX en Send/Return.', 'ok');
  });

  const guideModal = document.getElementById('guide-modal');
  document.getElementById('btn-guide').addEventListener('click', () => { updateModalFlowList(); guideModal.classList.add('open'); });
  document.getElementById('btn-close-guide').addEventListener('click', () => guideModal.classList.remove('open'));
  guideModal.addEventListener('click', (e) => { if (e.target === guideModal) guideModal.classList.remove('open'); });

  const diagramModal = document.getElementById('diagram-modal');
  document.getElementById('btn-diagram').addEventListener('click', () => diagramModal.classList.add('open'));
  document.getElementById('btn-close-diagram').addEventListener('click', () => diagramModal.classList.remove('open'));
  diagramModal.addEventListener('click', (e) => { if (e.target === diagramModal) diagramModal.classList.remove('open'); });

  function updateTopbarStatus() {
    document.getElementById('engine-status').textContent =
      `WEB AUDIO API · ${audioStarted ? (ctx && ctx.state === 'running' ? 'ACTIVO' : 'SUSPENDIDO') : 'EN ESPERA'} · ${cables.length} ${cables.length === 1 ? 'CABLE' : 'CABLES'}`;
    updateAudioDiagnostics();
  }

  function updateAudioDiagnostics() {
    const el = document.getElementById('audio-diag');
    if (!el) return;
    el.classList.remove('ok', 'err');

    if (!audioStarted || !ctx) {
      el.textContent = 'Pulsa "Auto-conectar" para cablear y escuchar';
      return;
    }
    if (ctx.state !== 'running') {
      el.classList.add('err');
      el.textContent = 'Audio bloqueado por el navegador · Haz clic aquí para activar';
      return;
    }
    if (cables.length === 0) {
      el.textContent = 'Sin cables: conecta fuentes y SPK 1/2 (o clic aquí para Auto-conectar)';
      return;
    }
    const anySource = sourcesState.micA || sourcesState.micALive || sourcesState.micB || sourcesState.micC || sourcesState.mp3Playing || sourcesState.genMode !== 'off';
    if (!anySource) {
      el.textContent = 'Todas las fuentes en pausa: pulsa Play en Mic A/B/C o MP3';
      return;
    }
    if (listenMode === 'speakers' && !cables.some(c => c.to === 'spk1_in' || c.to === 'spk2_in')) {
      el.textContent = 'Conecta Salidas SPK 1 / SPK 2 hacia los altavoces SPK 1 / SPK 2';
      return;
    }
    if (listenMode === 'phones' && !cables.some(c => c.to === 'phones_in')) {
      el.textContent = 'Conecta Aux 3 → Cascos (in) o cambia la escucha a SPK 1/2';
      return;
    }
    const mLVal = parseFloat(document.getElementById('fader-master-l').value);
    const mRVal = parseFloat(document.getElementById('fader-master-r').value);
    if (listenMode === 'speakers' && mLVal <= 0 && mRVal <= 0) {
      el.textContent = 'Sube los faders azules SPK 1 / SPK 2 para oír el Master';
      return;
    }
    el.classList.add('ok');
    el.textContent = listenMode === 'phones' ? 'SONANDO POR CASCOS (Aux 3)' : 'SONANDO POR SPK 1 / SPK 2';
  }

  function updateModalFlowList() {
    document.getElementById('modal-cable-count').textContent = cables.length;
    const list = document.getElementById('modal-flow-list');
    if (cables.length === 0) {
      list.innerHTML = `<div style="font-size:12px; color:#64748b;">No hay cables conectados todavía.</div>`;
      return;
    }
    list.innerHTML = '';
    cables.forEach(c => {
      const row = document.createElement('div');
      row.className = 'flow-item';
      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="width:9px; height:9px; border-radius:50%; background:${c.color}; display:inline-block;"></span>
          <span>${getJackInfo(c.from).name.split('—')[0].trim()} <strong>→</strong> ${getJackInfo(c.to).name.split('—')[0].trim()}</span>
        </div>
        <button class="mini-btn" style="padding:2px 7px;">Quitar</button>
      `;
      row.querySelector('button').addEventListener('click', () => removeCable(c.id));
      list.appendChild(row);
    });
  }

  /* ============================================================================
   * 10. BUCLE 60 FPS: PEAK LEDs, VÚMETROS, EXPANSOR REAL Y RTA/OSCILOSCOPIO
   * ============================================================================ */
  const rtaCanvas = document.getElementById('rta-canvas');
  const rtaCtx = rtaCanvas.getContext('2d');
  let rtaW = 300, rtaH = 112;

  function resizeRtaCanvas() {
    if (!rtaCanvas.parentElement) return;
    const rect = rtaCanvas.parentElement.getBoundingClientRect();
    if (rect.width < 10) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    rtaW = Math.floor(rect.width);
    rtaH = Math.floor(rect.height);
    rtaCanvas.width = rtaW * dpr;
    rtaCanvas.height = rtaH * dpr;
    rtaCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const timeBuf = new Float32Array(256);
  const rtaFreqBuf = new Uint8Array(1024);
  const rtaWaveBuf = new Float32Array(2048);

  function getLevelStats(analyser) {
    if (!analyser) return { rms: 0, peak: 0 };
    analyser.getFloatTimeDomainData(timeBuf);
    let sum = 0, peak = 0;
    for (let i = 0; i < timeBuf.length; i++) {
      const v = timeBuf[i];
      sum += v * v;
      const a = Math.abs(v);
      if (a > peak) peak = a;
    }
    return { rms: Math.sqrt(sum / timeBuf.length), peak };
  }

  function levelTo01(rms) {
    if (rms <= 0.0004) return 0;
    return Math.min(1, Math.max(0, (20 * Math.log10(rms) + 50) / 50));
  }

  function renderMeter(id, lvl, style = 'vu', holdObj = null, nowMs = 0) {
    const el = document.getElementById(id);
    if (!el) return;
    const segs = el.children;
    const n = segs.length;
    const active = Math.round(Math.min(1, Math.max(0, lvl)) * n);

    let holdIdx = -1;
    if (holdObj) {
      if (active >= holdObj.idx) { holdObj.idx = active; holdObj.t = nowMs; }
      else if (nowMs - holdObj.t > 750) { holdObj.idx = Math.max(active, holdObj.idx - 1); holdObj.t = nowMs - 650; }
      if (holdObj.idx > 0) holdIdx = holdObj.idx - 1;
    }

    for (let i = 0; i < n; i++) {
      let cls = 'vu-seg';
      if (i < active) {
        if (style === 'gr') cls += (i > n * 0.65 ? ' on-red' : ' on-amber');
        else if (style === 'cyan') cls += (i >= n - 1 ? ' on-red' : ' on-cyan');
        else {
          const p = (i + 1) / n;
          cls += p > 0.85 ? ' on-red' : (p > 0.65 ? ' on-amber' : ' on-green');
        }
      }
      if (holdIdx === i && active < n) cls += ' peak-hold';
      segs[i].className = cls;
    }
  }

  function drawRtaAndOsc() {
    if (labDrawer.classList.contains('collapsed')) return;
    rtaCtx.fillStyle = '#070b10';
    rtaCtx.fillRect(0, 0, rtaW, rtaH);

    rtaCtx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    rtaCtx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (rtaH / 4) * i;
      rtaCtx.beginPath(); rtaCtx.moveTo(0, y); rtaCtx.lineTo(rtaW, y); rtaCtx.stroke();
    }

    if (!audioStarted || !audio.analysers.rta) return;

    if (rtaMode === 0 || rtaMode === 1) {
      audio.analysers.rta.getByteFrequencyData(rtaFreqBuf);
      const bars = 36;
      const bw = rtaW / bars;
      for (let i = 0; i < bars; i++) {
        const bin = Math.min(rtaFreqBuf.length - 1, Math.max(1, Math.floor(Math.pow(i / bars, 2.05) * 520)));
        const val = rtaFreqBuf[bin] / 255;
        const bh = val * (rtaH - 12);
        const grad = rtaCtx.createLinearGradient(0, rtaH, 0, rtaH - bh);
        grad.addColorStop(0, '#1d4ed8'); grad.addColorStop(0.65, '#06b6d4');
        grad.addColorStop(1, val > 0.85 ? '#ef4444' : '#38bdf8');
        rtaCtx.fillStyle = grad;
        rtaCtx.fillRect(i * bw + 1, rtaH - bh, Math.max(2, bw - 2), bh);
      }
    }

    if (rtaMode === 0 || rtaMode === 2) {
      audio.analysers.rta.getFloatTimeDomainData(rtaWaveBuf);
      rtaCtx.beginPath();
      rtaCtx.strokeStyle = rtaMode === 0 ? 'rgba(134, 239, 172, 0.82)' : '#4ade80';
      rtaCtx.lineWidth = 1.6;
      const step = Math.floor(rtaWaveBuf.length / rtaW);
      for (let x = 0; x < rtaW; x++) {
        const s = rtaWaveBuf[x * step] || 0;
        const y = rtaH * 0.5 - s * (rtaH * 0.44);
        if (x === 0) rtaCtx.moveTo(x, y); else rtaCtx.lineTo(x, y);
      }
      rtaCtx.stroke();
    }
  }

  function animationLoop(nowMs) {
    if (audioStarted && ctx && ctx.state === 'running') {
      for (let ch = 1; ch <= 4; ch++) {
        const vu = getLevelStats(audio.analysers[`ch${ch}`]);
        renderMeter(`vu-ch-${ch}`, levelTo01(vu.rms));
        const pk = getLevelStats(audio.channels[ch].peakAnalyser);
        if (pk.peak >= 0.84) peakHoldTimers[ch] = nowMs + 260;
        document.getElementById(`peak-led-${ch}`).classList.toggle('clip', nowMs < peakHoldTimers[ch]);
      }

      if (sourcesState.mp3HasCustomFile && mp3AudioEl.duration > 0) {
        const pct = (mp3AudioEl.currentTime / mp3AudioEl.duration) * 100;
        document.getElementById('mp3-progress-bar').style.width = `${pct.toFixed(1)}%`;
        const curM = Math.floor(mp3AudioEl.currentTime / 60);
        const curS = String(Math.floor(mp3AudioEl.currentTime % 60)).padStart(2, '0');
        document.getElementById('mp3-time-txt').textContent = `${sourcesState.mp3Playing ? 'PLAY' : 'PAUSA'} · ${curM}:${curS}`;
      } else {
        document.getElementById('mp3-progress-bar').style.width = sourcesState.mp3Playing ? `${((seqStep % 64) / 64) * 100}%` : '0%';
      }

      const mL = getLevelStats(audio.analysers.masterL);
      const mR = getLevelStats(audio.analysers.masterR);
      renderMeter('vu-master-l', levelTo01(mL.rms), 'vu', vuPeakHold.ml, nowMs);
      renderMeter('vu-master-r', levelTo01(mR.rms), 'vu', vuPeakHold.mr, nowMs);
      renderMeter('vu-fx', levelTo01(getLevelStats(audio.analysers.fx).rms));

      const maxPeak = Math.max(mL.peak, mR.peak);
      const dbStr = maxPeak > 0.0005 ? `${(20 * Math.log10(maxPeak)).toFixed(1)} dBFS` : '-∞ dBFS';
      document.getElementById('master-db-readout').textContent = dbStr;
      document.getElementById('rta-peak-txt').textContent = `PEAK: ${dbStr}`;

      const s1 = getLevelStats(audio.analysers.spk1).rms;
      const s2 = getLevelStats(audio.analysers.spk2).rms;
      renderMeter('vu-spk1', levelTo01(s1), 'cyan');
      renderMeter('vu-spk2', levelTo01(s2), 'cyan');
      document.getElementById('woofer-1').style.transform = `scale(${(1 + Math.min(0.14, s1 * 0.5)).toFixed(3)})`;
      document.getElementById('woofer-2').style.transform = `scale(${(1 + Math.min(0.14, s2 * 0.5)).toFixed(3)})`;

      renderMeter('vu-phones', levelTo01(getLevelStats(audio.analysers.phones).rms));

      const grDb = bypassState.comp ? 0 : Math.abs(audio.units.comp.comp.reduction || 0);
      renderMeter('vu-comp-gr', Math.min(1, grDb / 20), 'gr');

      const expRms = getLevelStats(audio.units.exp.analyser).rms;
      const expDb = expRms > 0.00001 ? 20 * Math.log10(expRms) : -90;
      let targetExp = 1.0, gating = false;
      if (!bypassState.exp && expDb < params.exp_thresh) {
        const atten = Math.min(60, (params.exp_thresh - expDb) * (params.exp_ratio - 1) * 0.45);
        targetExp = dbToGain(-atten);
        gating = atten > 2.5;
      }
      audio.units.exp.gateGain.gain.setTargetAtTime(targetExp, ctx.currentTime, gating ? 0.08 : 0.006);
      document.getElementById('exp-gate-led').className =
        `led-dot ${bypassState.exp ? '' : (gating ? 'amber-on' : (expRms > 0.002 ? 'green-on' : ''))}`;
      renderMeter('exp-vu', targetExp, 'vu');
    }

    drawRtaAndOsc();
    requestAnimationFrame(animationLoop);
  }

  function startApp() {
    resizeRtaCanvas();
    renderCables();
    updateTopbarStatus();
    requestAnimationFrame(animationLoop);
  }

  if (document.readyState === 'complete') startApp();
  else window.addEventListener('load', startApp);
})();
