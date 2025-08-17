// 懒加载首页横幅视频 + 准备就绪后淡入（增强版：带兼容与回退）
(function () {
  const header = document.getElementById('page-header');
  if (!header) return;
  const video = header.querySelector('video.banner-video');
  if (!video) return;

  // 确保必要属性存在（iOS/Safari 自动播放需要）
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');

  const makeReady = () => video.classList.add('is-ready');

  // 万一 IO 没触发，视频解码完成时也淡入
  video.addEventListener('loadeddata', () => {
    makeReady();
  }, { once: true });

  async function loadAndPlay() {
    try {
      video.load();
      await video.play();
      makeReady();
    } catch (e) {
      // 某些浏览器可能阻止自动播放，尝试再次静音播放
      try {
        video.muted = true;
        await video.play();
        makeReady();
      } catch (_) {
        // 仍失败则保持静态 poster，用户交互后再播放
      }
    }
  }

  // 使用 IntersectionObserver 进入视口再加载；不支持则直接加载
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        loadAndPlay();
        io.disconnect();
        break;
      }
    }, { threshold: 0.1 });
    io.observe(video);
  } else {
    // 老浏览器回退：直接加载播放
    loadAndPlay();
  }
})();
