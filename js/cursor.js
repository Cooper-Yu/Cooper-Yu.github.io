(function () {
    if (window.matchMedia && !window.matchMedia('(pointer: fine)').matches) return;
  
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);
  
    let x = innerWidth/2, y = innerHeight/2, tx=x, ty=y;
    const ease = 0.18;
  
    addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate3d(${tx}px,${ty}px,0)`;
    }, { passive: true });
  
    function loop(){ x += (tx-x)*ease; y += (ty-y)*ease;
      ring.style.transform = `translate3d(${x}px,${y}px,0)`; requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
  
    const hoverable = el => !!el && el.closest('a,button,[role="button"],.btn,input,textarea,select,.card,.recent-post-item');
    addEventListener('mouseover', e => document.documentElement.classList.toggle('cursor-hover', !!hoverable(e.target)));
    addEventListener('mousedown', () => document.documentElement.classList.add('cursor-active'));
    addEventListener('mouseup',   () => document.documentElement.classList.remove('cursor-active'));
    addEventListener('mouseleave', () => { dot.style.opacity = ring.style.opacity = '0'; });
    addEventListener('mouseenter', () => { dot.style.opacity = ring.style.opacity = '1'; });
  })();