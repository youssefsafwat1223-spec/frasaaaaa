// Tawafuq site — nav scroll, mobile menu, reveal, how-it-works, FAQ, pricing toggle
(function(){
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const body = document.body;

  // Nav scrolled state
  const onScroll = () => {
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  burger?.addEventListener('click', () => body.classList.toggle('menu-open'));
  document.querySelectorAll('.mobile-menu a').forEach(a =>
    a.addEventListener('click', () => body.classList.remove('menu-open'))
  );

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // How it works — step tracker tied to scroll position of step list
  const steps = document.querySelectorAll('.how-step');
  const visuals = document.querySelectorAll('.how-visual');
  function setActive(idx){
    steps.forEach((s,i) => s.classList.toggle('active', i === idx));
    visuals.forEach((v,i) => v.classList.toggle('active', i === idx));
  }
  steps.forEach((step, i) => {
    step.addEventListener('mouseenter', () => setActive(i));
    step.addEventListener('click', () => setActive(i));
  });
  // Auto-cycle if user hasn't interacted
  let autoIdx = 0, autoTimer;
  const startAuto = () => {
    autoTimer = setInterval(() => {
      autoIdx = (autoIdx + 1) % steps.length;
      setActive(autoIdx);
    }, 4000);
  };
  const stopAuto = () => clearInterval(autoTimer);
  const howSection = document.querySelector('.how');
  if (howSection){
    const howIo = new IntersectionObserver((entries) => {
      entries.forEach(e => e.isIntersecting ? startAuto() : stopAuto());
    }, { threshold: 0.3 });
    howIo.observe(howSection);
    howSection.addEventListener('mouseenter', stopAuto);
  }

  // FAQ
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q').addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(o => o.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Pricing toggle
  const prices = {
    monthly: { starter: '49', pro: '99', premium: '199' },
    annual:  { starter: '39', pro: '79', premium: '159' }
  };
  document.querySelectorAll('.toggle button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.toggle button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      const mode = b.dataset.mode;
      Object.entries(prices[mode]).forEach(([k, v]) => {
        const el = document.querySelector(`[data-price="${k}"]`);
        if (el) el.textContent = v;
      });
    });
  });

  // Hero subtle parallax on visuals (cheap, transform-only)
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    window.addEventListener('scroll', () => {
      const y = Math.min(window.scrollY, 600);
      heroVisual.style.transform = `translateY(${y * 0.08}px)`;
    }, { passive: true });
  }
})();
