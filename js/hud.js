// source/js/hud.js  — HUD 增强版：发光圈 + 扫描扇形 + 雷达光点 + 鼠标聚光

(function () {
    const SHOW_CROSSHAIR = true;
    const header = document.getElementById('page-header');
    const video = header && header.querySelector('.banner-video');
    if (!header || !video) return; // 只在有视频的页头运行（通常是首页）
  
    // 画布
    const canvas = document.createElement('canvas');
    canvas.className = 'hud-canvas';
    header.appendChild(canvas);
  
    const ctx = canvas.getContext('2d');
    let w, h, cx, cy, mx = -9999, my = -9999, t = 0; // 初始隐藏十字
  
    function resize() {
      const rect = header.getBoundingClientRect();
      w = canvas.width  = Math.floor(rect.width  * devicePixelRatio);
      h = canvas.height = Math.floor(rect.height * devicePixelRatio);
      canvas.style.width  = rect.width  + 'px';
      canvas.style.height = rect.height + 'px';
      cx = w / 2; 
      cy = h * 0.60; // 稍偏下
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

  // 触摸端也能跟随（移动端）
  header.addEventListener('touchmove', (e) => {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const r = header.getBoundingClientRect();
    mx = (touch.clientX - r.left) * devicePixelRatio;
    my = (touch.clientY - r.top)  * devicePixelRatio;
  }, { passive: true });

  // 无障碍：如果用户偏好减少动效，直接停用 HUD
  const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduce) {
    canvas.style.display = 'none';
    return;
  }

  // 滚动时 HUD 渐隐（防止干扰正文）
  const fadeOnScroll = () => {
    const rect = header.getBoundingClientRect();
    const vh = Math.max(1, window.innerHeight || document.documentElement.clientHeight);
    // 计算页头离视口顶部的滚动比例，0~1
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
    const opacity = 1 - progress * 0.9; // 最低约 0.1
    canvas.style.opacity = String(Math.max(0.1, opacity));
  };
  window.addEventListener('scroll', fadeOnScroll, { passive: true });
  fadeOnScroll();
  
    header.addEventListener('mousemove', e => {
      const r = header.getBoundingClientRect();
      mx = (e.clientX - r.left) * devicePixelRatio;
      my = (e.clientY - r.top)  * devicePixelRatio;
    });
  
    // 生成一些雷达光点
    const BLIPS = Array.from({ length: 16 }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.18 + Math.random() * 0.28, // 相对 R 的倍数
      speed: 0.003 + Math.random() * 0.006,
      hue: Math.random() < 0.5 ? 'rgba(0,255,247,' : 'rgba(255,0,230,'
    }));
  
    function drawGrid() {
      ctx.save();
      ctx.globalAlpha = 0.09;
      const grid = 40 * devicePixelRatio;
      ctx.strokeStyle = '#00fff7';
      ctx.lineWidth = 1;
      for (let x = (t % grid); x < w; x += grid) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = (t % grid); y < h; y += grid) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.restore();
    }
  
    function drawRadar() {
      // 半径与脉冲
      const R = Math.min(w, h) * 0.28;
      const pulse = (Math.sin(t * 0.05) + 1) * 0.5;          // 0..1
      const r = R * (0.85 + 0.15 * pulse);
  
      // 外圈发光
      ctx.save();
      ctx.strokeStyle = 'rgba(0,255,247,0.95)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0,255,247,0.6)';
      ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
  
      // 扫描扇形（更亮）
      const sweep = (t * 0.02) % (Math.PI * 2);
      const span  = Math.PI / 5.5;
      const grad  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(18,183,255,0.45)');
      grad.addColorStop(1, 'rgba(18,183,255,0.00)');
  
      ctx.save();
      ctx.fillStyle = grad;
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, sweep - span, sweep + span);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
  
      // 雷达光点（围绕中心缓慢旋转）
      BLIPS.forEach(b => {
        b.angle += b.speed;
        const rr = r * b.radius;
        const x = cx + Math.cos(b.angle) * rr;
        const y = cy + Math.sin(b.angle) * rr;
        const a = 0.35 + 0.35 * Math.sin(t * 0.05 + b.angle * 3);
  
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = b.hue + a + ')';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(x, y, 4 * devicePixelRatio, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    }
  
    function drawCrosshair() {
      if (!SHOW_CROSSHAIR) return;
      if (mx < 0 || my < 0) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,0,230,0.95)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(255,0,230,0.6)';
      ctx.shadowBlur = 10;
  
      ctx.beginPath();
      ctx.moveTo(mx - 10, my); ctx.lineTo(mx + 10, my);
      ctx.moveTo(mx, my - 10); ctx.lineTo(mx, my + 10);
      ctx.stroke();
  
      // 鼠标聚光（淡淡提亮）
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, 140 * devicePixelRatio);
      g.addColorStop(0, 'rgba(255,255,255,0.10)');
      g.addColorStop(1, 'rgba(255,255,255,0.00)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(mx, my, 140 * devicePixelRatio, 0, Math.PI * 2); ctx.fill();
  
      ctx.restore();
    }
  
    function tick() {
      t++;
      ctx.clearRect(0, 0, w, h);
      drawGrid();
      drawRadar();
      drawCrosshair();
      // 每帧也更新一次滚动渐隐，避免某些场景下未触发 scroll 事件
      if (typeof fadeOnScroll === 'function') fadeOnScroll();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();