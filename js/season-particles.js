// source/js/season-particles.js
(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
  
    const canvas = document.createElement('canvas');
    canvas.className = 'season-particles';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
  
    let W = 0, H = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    function resize() {
      W = Math.floor(window.innerWidth);
      H = Math.floor(window.innerHeight);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
  
    // 读取当前季节
    function season() {
      const c = document.body.classList;
      if (c.contains('season-spring')) return 'spring';
      if (c.contains('season-summer')) return 'summer';
      if (c.contains('season-autumn')) return 'autumn';
      if (c.contains('season-winter')) return 'winter';
      return 'none';
    }
  
    // 粒子池
    let particles = [];
    const MAX = 120; // 上限（会按设备宽度自适配）
  
    function spawnForSeason(s) {
      particles.length = 0;
      const density = Math.min(MAX, Math.round(W / 12)); // 自适配屏幕
      for (let i = 0; i < density; i++) {
        particles.push(makeParticle(s));
      }
    }
  
    function rand(a, b) { return a + Math.random() * (b - a); }
  
    function makeParticle(s) {
      const base = { x: Math.random() * W, y: Math.random() * -H, r: 2, a: Math.random() * Math.PI * 2, v: 0, vx: 0, vy: 0, rot: rand(-0.02, 0.02) };
      switch (s) {
        case 'spring': // 花瓣
          return { ...base, type: 'petal', r: rand(4, 8), vy: rand(0.6, 1.2), vx: rand(-0.3, 0.3), hue: 320, sat: 70, light: 75, wobble: rand(0.8, 1.4) };
        case 'summer': // 细雨
          return { ...base, type: 'rain', r: rand(0.8, 1.4), vy: rand(3.5, 5.5), vx: rand(-0.4, 0.2), hue: 190, sat: 90, light: 70, len: rand(8, 14) };
        case 'autumn': // 落叶
          return { ...base, type: 'leaf', r: rand(5, 9), vy: rand(0.8, 1.6), vx: rand(-0.6, 0.4), hue: rand(25, 40), sat: 85, light: 60, wobble: rand(0.5, 1.2) };
        case 'winter': // 飘雪
          return { ...base, type: 'snow', r: rand(2, 4), vy: rand(0.5, 1.2), vx: rand(-0.3, 0.3), hue: 200, sat: 20, light: 98, wobble: rand(0.6, 1.0) };
        default:
          return { ...base, type: 'none', vy: 0, vx: 0 };
      }
    }
  
    let lastSeason = season();
    spawnForSeason(lastSeason);
  
    // 监听季节切换（你已有的 time-season.js 会切 body class）
    const mo = new MutationObserver(() => {
      const s = season();
      if (s !== lastSeason) {
        lastSeason = s;
        spawnForSeason(s);
      }
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  
    function step(p, s, t) {
      // 轻微风偏移（随时间变化）
      const wind = Math.sin(t * 0.0007) * 0.25;
  
      p.x += p.vx + wind;
      p.y += p.vy;
  
      // 摆动
      if (p.type === 'petal' || p.type === 'leaf' || p.type === 'snow') {
        p.a += p.rot;
        p.x += Math.cos(p.a) * (p.wobble || 1);
      }
  
      // 出界重生
      if (p.y > H + 20 || p.x < -20 || p.x > W + 20) {
        const idx = particles.indexOf(p);
        particles[idx] = makeParticle(s);
        particles[idx].y = -10;
        particles[idx].x = Math.random() * W;
      }
    }
  
    function draw(p) {
      switch (p.type) {
        case 'rain': {
          ctx.strokeStyle = `hsla(${p.hue} ${p.sat}% ${p.light}% / 0.65)`;
          ctx.lineWidth = p.r;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 1, p.y + (p.len || 10));
          ctx.stroke();
          break;
        }
        case 'petal': {
          ctx.fillStyle = `hsla(${p.hue} ${p.sat}% ${p.light}% / 0.85)`;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r * 0.7, p.r, p.a, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'leaf': {
          ctx.fillStyle = `hsla(${p.hue} ${p.sat}% ${p.light}% / 0.9)`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.quadraticCurveTo(p.x + p.r, p.y + p.r, p.x, p.y + p.r * 2);
          ctx.quadraticCurveTo(p.x - p.r, p.y + p.r, p.x, p.y);
          ctx.fill();
          break;
        }
        case 'snow': {
          ctx.fillStyle = `hsla(${p.hue} ${p.sat}% ${p.light}% / 0.95)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
    }
  
    function loop(t) {
      ctx.clearRect(0, 0, W, H);
      const s = lastSeason;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        step(p, s, t);
        draw(p);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();