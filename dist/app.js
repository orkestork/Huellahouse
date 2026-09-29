const form=document.querySelector('#event-form');
const date=document.querySelector('#date');
const today=new Date();
date.min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
document.querySelector('#year').textContent=today.getFullYear();
document.querySelectorAll('.select-experience').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#experience').value=button.dataset.experience;document.querySelector('#evento').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));
let summary='';
form.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(form);summary=`HUELLA HOUSE — MI EVENTO\n\nExperiencia: ${data.get('experiencia')}\nEmpresa: ${data.get('empresa')}\nPersonas: ${data.get('personas')}\nFecha tentativa: ${new Date(data.get('fecha')+'T12:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})}\nObjetivo: ${data.get('objetivo')||'Por definir'}\n\nResumen de planeación. No constituye una reserva ni confirma disponibilidad.`;document.querySelector('#summary').textContent=summary;document.querySelector('#result').hidden=false;document.querySelector('#result').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
document.querySelector('#download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([summary],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='mi-evento-huella-house.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
const menuToggle=document.querySelector('.menu-toggle');
const mobileNav=document.querySelector('#mobile-nav');
menuToggle.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')==='true';menuToggle.setAttribute('aria-expanded',String(!open));mobileNav.hidden=open;menuToggle.textContent=open?'Menú':'Cerrar';});
mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{mobileNav.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.textContent='Menú';}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobileNav.hidden){mobileNav.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.textContent='Menú';menuToggle.focus();}});

// Progressive enhancement: content remains readable when motion is unavailable.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(.22,1,.36,1)';
  const animations = new Set();
  let observer;
  let frame = 0;
  const hero = document.querySelector('.hero');
  const header = document.querySelector('header');
  const houseImage = document.querySelector('.house-photo img');
  const windowEl = document.createElement('div');
  windowEl.className = 'photo-window';
  houseImage.before(windowEl);
  windowEl.append(houseImage);
  const images = [document.querySelector('.arch img'), houseImage];
  const heading = document.querySelector('.hero h1');
  const lines = heading.innerHTML.split(/<br\s*\/?\s*>/i);
  heading.innerHTML = lines.map(line => `<span class="motion-line"><span class="motion-line-inner">${line.replace('<span>', '<span class="title-underline">')}</span></span>`).join('');

  function animate(element, keyframes, options = {}) {
    if (preference.matches || !element.animate) return;
    const animation = element.animate(keyframes, {duration:1100,easing:ease,fill:'backwards',...options});
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    return animation;
  }
  function reveal(element, delay = 0) {
    const image = element.matches('.photo-window');
    animate(element, image
      ? [{opacity:0,clipPath:'inset(18% 0 0 0)'},{opacity:1,clipPath:'inset(0% 0 0 0)'}]
      : [{opacity:0,transform:`translate3d(0,${element.matches('h2') ? 85 : 42}px,0)`},{opacity:1,transform:'translate3d(0,0,0)'}],
      {delay,duration:image ? 1500 : 1150});
    element.dataset.revealed = 'true';
  }
  const selectors = '.manifesto p,.section-heading>div,.section-heading>p,.experiences article,.photo-window,.house-copy>*,'+
    '.philosophy>*,.planning>div>*,#event-form>label,#event-form>.form-row,#event-form>.button,#event-form>.form-note,.closing>*,footer>*';
  const targets = [...document.querySelectorAll(selectors)];
  const staggerGroups = ['.experiences','.house-copy','.philosophy','.planning>div','#event-form','.closing','footer'];
  staggerGroups.forEach(selector => {
    [...document.querySelector(selector).children].filter(el => targets.includes(el)).forEach((el,index) => {
      el.dataset.motionDelay = Math.min(index * 100, 300);
    });
  });
  function updateScroll() {
    frame = 0;
    header.classList.toggle('is-scrolled', scrollY > 30);
    if (preference.matches) return;
    const viewport = innerHeight;
    // Two geometry reads, followed by writes; no continuous idle animation loop.
    const positions = images.map(image => image.parentElement.getBoundingClientRect());
    images.forEach((image,index) => {
      const rect = positions[index];
      if(rect.bottom < 0 || rect.top > viewport) return;
      const travel = Math.max(-1,Math.min(1,(viewport / 2 - rect.top - rect.height / 2) / viewport));
      image.style.transform = `translate3d(0,${travel * 30}px,0) scale(1.09)`;
    });
  }
  function onScroll() { if (!frame) frame = requestAnimationFrame(updateScroll); }
  function start() {
    if (preference.matches) return;
    heading.querySelectorAll('.motion-line-inner').forEach((line,index) => {
      animate(line,[{opacity:0,transform:'translateY(115%)'},{opacity:1,transform:'translateY(0)'}],{duration:1450,delay:100 + index * 160});
    });
    animate(document.querySelector('.arch'),[{opacity:0,clipPath:'inset(18% 0 0 0)',transform:'translateY(45px)'},{opacity:1,clipPath:'inset(0% 0 0 0)',transform:'translateY(0)'}],{duration:1750,delay:180});
    animate(document.querySelector('.ornament'),[{opacity:0,transform:'rotate(-90deg) scale(.65)'},{opacity:1,transform:'rotate(0) scale(1)'}],{duration:1400});
    document.querySelectorAll('.hero-aside').forEach((el,i)=>reveal(el,550+i*130));
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          reveal(entry.target,Number(entry.target.dataset.motionDelay || 0));
          observer.unobserve(entry.target);
        });
      },{threshold:0,rootMargin:'0px 0px -5% 0px'});
      targets.forEach(element=>observer.observe(element));
    }
    updateScroll();
  }
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onScroll,{passive:true});
  preference.addEventListener('change',() => {
    if (preference.matches) {
      observer?.disconnect();
      animations.forEach(animation=>animation.cancel());
      images.forEach(image=>image.style.removeProperty('transform'));
      if(frame) cancelAnimationFrame(frame);
      frame=0;
    } else start();
  });
  document.addEventListener('focusin',event=>{
    const animatedParent = targets.find(el=>el.contains(event.target));
    if (animatedParent) animatedParent.getAnimations().forEach(animation=>animation.finish());
  });
  menuToggle.addEventListener('click',()=>{
    if (mobileNav.hidden) return;
    animate(mobileNav,[{opacity:0,transform:'translateY(-12px)'},{opacity:1,transform:'translateY(0)'}],{duration:400});
    mobileNav.querySelectorAll('a').forEach((link,i)=>animate(link,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,delay:i*65}));
  });
  form.addEventListener('submit',()=>reveal(document.querySelector('#result')));
  start();
})();

matchMedia('(min-width: 641px)').addEventListener('change',event=>{if(event.matches){mobileNav.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.textContent='Menú';}});
