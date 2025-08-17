// source/js/ux-reactive.js
(() => {
  if (window.__UX_REACTIVE_INITED__) return;
  window.__UX_REACTIVE_INITED__ = true;

  // ============ Canvas 霓虹点击粒子（轻量，PJAX 安全） ============
  const cvs = document.createElement('canvas');
  const ctx = cvs.getContext('2d', { alpha: true });
  Object.assign(cvs.style, {
    position: 'fixed', inset: 0, zIndex: 3, pointerEvents: 'none'
  });
  document.body.appendChild(cvs);

  let W = innerWidth, H = innerHeight;
  const DPR = Math.min(devicePixelRatio || 1, 1.5);
  function resize() { W = innerWidth; H = innerHeight; cvs.width = W * DPR; cvs.height = H * DPR; ctx.setTransform(DPR,0,0,DPR,0,0); }
  resize(); addEventListener('resize', resize);

  const COLORS = ['#00fff0','#ff33cc','#39c5bb','#9a4dff'];
  const particles = [];
  const MAX = 300;

  function burst(x, y) {
    for (let i=0;i<18;i++){
      if (particles.length >= MAX) particles.shift();
      const ang = Math.random()*Math.PI*2;
      const spd = 1.2 + Math.random()*2.2;
      particles.push({
        x, y,
        vx: Math.cos(ang)*spd,
        vy: Math.sin(ang)*spd - 0.6,
        life: 0,
        max: 50 + Math.random()*30,
        size: 1 + Math.random()*2,
        color: COLORS[(Math.random()*COLORS.length)|0]
      });
    }
  }

  // 点击波纹（HUD 感）
  const ripples = [];
  function ripple(x, y) {
    ripples.push({ x, y, r: 0, a: 0.7 });
    if (ripples.length > 8) ripples.shift();
  }

  function tick(){
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';

    // 粒子
    for (let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03; // 重力一点点
      const fade = 1 - p.life / p.max;
      if (fade <= 0) { particles.splice(i,1); continue; }
      ctx.beginPath();
      ctx.fillStyle = p.color + Math.floor(fade*255).toString(16).padStart(2,'0');
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }

    // 波纹
    ctx.globalCompositeOperation = 'screen';
    for (let i=ripples.length-1;i>=0;i--){
      const r = ripples[i];
      r.r += 3.2;
      r.a *= 0.93;
      if (r.a < 0.02) { ripples.splice(i,1); continue; }
      ctx.beginPath();
      ctx.strokeStyle = `rgba(0,255,240,${r.a})`;
      ctx.lineWidth = 2;
      ctx.arc(r.x, r.y, r.r, 0, Math.PI*2);
      ctx.stroke();
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ============ WebAudio：让现有背景音随行为变化 ============
  // 复用你已有的 window.__BG_AUDIO__（在 time-season.js 里创建的 Audio）
  let audioEl = window.__BG_AUDIO__ || document.getElementById('bg-audio');
  let actx, source, gain, filter, panner;
  let audioReady = false;

  function initAudioGraph(){
    if (audioReady) return;
    try{
      actx = new (window.AudioContext || window.webkitAudioContext)();
      if (!audioEl) {
        audioEl = new Audio('/audio/night-city-60s-96k.mp3'); // 兜底
        audioEl.loop = true;
        window.__BG_AUDIO__ = audioEl;
      }
      source = actx.createMediaElementSource(audioEl);
      gain   = actx.createGain();
      filter = actx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 8000; // 初始较开阔
      panner = actx.createStereoPanner ? actx.createStereoPanner() : null;

      // source -> filter -> (panner) -> gain -> destination
      if (panner) {
        source.connect(filter); filter.connect(panner); panner.connect(gain); 
      } else {
        source.connect(filter); filter.connect(gain);
      }
      gain.connect(actx.destination);
      audioReady = true;
    }catch(e){ console.warn('WebAudio init failed', e); }
  }

  // 点击强化：短促滤波扫频 + 微小音量冲击 + 立体声轻摆
  let clickBoost = 0;
  function onClickAudioFX(){
    if (!audioReady) return;
    clickBoost = Math.min(clickBoost + 1, 3);
    // 立体声轻摆
    if (panner) panner.pan.value = (Math.random()*2-1)*0.4;
    // 轻量“sweep”
    const now = actx.currentTime;
    try{
      filter.frequency.cancelScheduledValues(now);
      const start = Math.max(2000, filter.frequency.value*0.8);
      filter.frequency.setValueAtTime(start, now);
      filter.frequency.exponentialRampToValueAtTime(9000, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(6000, now + 0.35);
    }catch(e){}
    // 音量轻推-回落
    gain.gain.cancelScheduledValues(now);
    const g = Math.max(0.4, gain.gain.value || 0.6);
    gain.gain.setValueAtTime(g, now);
    gain.gain.linearRampToValueAtTime(g + 0.08, now + 0.06);
    gain.gain.linearRampToValueAtTime(g, now + 0.28);
  }

  // 滚动调性：阅读越深入，打开高频，略增音量
  function onScrollAudioFX(){
    if (!audioReady) return;
    const doc = document.documentElement;
    const scrolled = (doc.scrollTop) / Math.max(1, (doc.scrollHeight - doc.clientHeight));
    const freq = 3000 + scrolled * 6000; // 3k ~ 9k
    const targetGain = 0.5 + scrolled * 0.15; // 0.5 ~ 0.65
    const now = actx.currentTime;
    try{
      filter.frequency.linearRampToValueAtTime(freq, now + 0.2);
      gain.gain.linearRampToValueAtTime(targetGain, now + 0.2);
    }catch(e){}
  }

  // ============ 统一事件：点击触发视觉 + 听觉 ============
  function onUserInteract(e){
    const x = e.clientX ?? (e.touches && e.touches[0].clientX) ?? W/2;
    const y = e.clientY ?? (e.touches && e.touches[0].clientY) ?? H/2;
    burst(x, y);
    ripple(x, y);

    // 首次交互时解锁 WebAudio，尝试播放现有背景音
    if (!audioReady) initAudioGraph();
    if (audioEl && audioEl.paused) audioEl.play().catch(()=>{});
    onClickAudioFX();

    // 轻微页面“冲击感”：内容轻抖一下
    const content = document.getElementById('content-inner') || document.body;
    content.animate(
      [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,-1.5px,0)' }, { transform: 'translate3d(0,0,0)' }],
      { duration: 120, easing: 'ease-out' }
    );
  }

  addEventListener('click', onUserInteract, { passive: true });
  addEventListener('touchstart', onUserInteract, { passive: true });
  addEventListener('scroll', () => { onScrollAudioFX(); }, { passive: true });

  // PJAX 兼容：切页后保持画布与事件，Adjust 尺寸
  document.addEventListener('pjax:complete', () => { resize(); });

  // 尊重“减少动画”偏好
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    particles.length = 0;
    ripples.length = 0;
    cvs.style.display = 'none';
  }
})();