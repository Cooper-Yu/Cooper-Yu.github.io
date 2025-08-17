// source/js/video-control.js
(() => {
    const header = document.getElementById('page-header');
    if (!header) return;
    const video = header.querySelector('video.banner-video');
    if (!video) return;
  
    // 优化加载策略：仅取元数据，避免首屏卡顿
    video.preload = 'metadata'; // 也可以改成 'none'
    video.muted = true;         // 保证可自动播放
    video.playsInline = true;
  
    // 进入视口才播放，离开就暂停
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.15 });
    io.observe(video);
  
    // 网络慢时先用 poster，能播放后再淡入
    const onCanPlay = () => {
      video.classList.add('is-ready'); // 你 CSS 里已有 .banner-video.is-ready { opacity:1 }
    };
    video.addEventListener('canplay', onCanPlay, { once: true });
  
    // 移动端省电：若开启低电量模式或省流，可进一步降低亮度/不自动播放（可按需开启）
    if (navigator.connection) {
      const conn = navigator.connection;
      if (conn.saveData || (conn.effectiveType && /2g/.test(conn.effectiveType))) {
        // 省流：不自动播放，用户滚到并点击才播
        io.disconnect();
        video.preload = 'none';
      }
    }
  })();