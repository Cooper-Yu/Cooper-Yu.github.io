// source/js/rand-header.js
(function () {
    // 只在有 #page-header 且没有首页视频横幅时执行
    const header = document.getElementById('page-header');
    if (!header) return;
    if (header.querySelector('video.banner-video')) return; // 首页：跳过
  
    // 你的三张图（可以继续加）
    const imgs = [
      '/img/cyber-night-1.jpeg',
      '/img/cyber-night-2.jpg',
      '/img/cyber-night-3.jpeg'
    ];
  
    // 随机挑一张（尽量避免与当前相同）
    const current = header.style.backgroundImage || '';
    let pick = imgs[Math.floor(Math.random() * imgs.length)];
    if (current.includes(pick) && imgs.length > 1) {
      const others = imgs.filter(i => !current.includes(i));
      pick = others[Math.floor(Math.random() * others.length)];
    }
  
    // 预加载，加载完再切图，避免闪烁
    const img = new Image();
    img.onload = () => {
      // 淡入动画：先添加 class，再设置背景
      header.classList.remove('rand-fade-in');
      void header.offsetWidth; // 强制重排，确保重复触发动画
      header.classList.add('rand-fade-in');
  
      // 覆盖内联样式（有些主题会写 inline style）
      header.style.setProperty('background-image', `url("${pick}")`, 'important');
      header.style.setProperty('background-size', 'cover');
      header.style.setProperty('background-position', 'center');
      header.style.setProperty('background-repeat', 'no-repeat');
  
      // 动画结束后移除 class，避免影响后续样式
      const once = () => {
        header.classList.remove('rand-fade-in');
        header.removeEventListener('animationend', once);
      };
      header.addEventListener('animationend', once);
    };
    img.src = pick;
  })();