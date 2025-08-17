(function () {
  // 只找全局容器里的 <video>
  const video = document.querySelector('#web_bg_video video');
  if (!video) return;

  // 根据月份/时间选择视频源（示例：只演示冬季，按需扩展）
  function pickSeasonSource() {
    const m = new Date().getMonth() + 1;
    // 你可以在这里按 m 判断 spring/summer/autumn/winter
    // 下面示例：冬季
    return {
      mp4: '/video/winter_25s.mp4',
      webm: '/video/winter_25s.webm'
    };
  }

  function setVideoSources({ mp4, webm }) {
    // 清空旧 <source>
    while (video.firstChild) video.removeChild(video.firstChild);

    if (webm) {
      const s1 = document.createElement('source');
      s1.src = webm + '?v=' + Date.now(); // 破缓存
      s1.type = 'video/webm';
      video.appendChild(s1);
    }
    if (mp4) {
      const s2 = document.createElement('source');
      s2.src = mp4 + '?v=' + Date.now();
      s2.type = 'video/mp4';
      video.appendChild(s2);
    }
    try {
      video.load();
      video.play().catch(() => {});
    } catch (e) {}
  }

  // 首次加载
  setVideoSources(pickSeasonSource());

  // 如需按白天/夜晚动态切换，可在这里监听时段或可见性
  // document.addEventListener('visibilitychange', () => { ... });
})();