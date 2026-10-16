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

// The circle opens a full-screen photo collage of the house. Motion hooks are filled in below when available.
const gallery = document.querySelector('#gallery');
const galleryTrigger = document.querySelector('.big-link__link');
const galleryHooks = {open() {}, close(done) { done(); }};
galleryTrigger.addEventListener('click', () => {
  gallery.showModal();
  document.documentElement.classList.add('gallery-open');
  gallery.scrollTop = 0;
  galleryHooks.open();
});
function closeGallery() { galleryHooks.close(() => gallery.close()); }
gallery.querySelector('.gallery__close').addEventListener('click', closeGallery);
gallery.addEventListener('cancel', event => { event.preventDefault(); closeGallery(); });
gallery.addEventListener('close', () => document.documentElement.classList.remove('gallery-open'));

// Recipes: plate, title and card change together; thumbnails, arrows and keys pick the dish.
const recipesEl = document.querySelector('.recipes');
const dish = index => ({
  plate: recipesEl.querySelectorAll('.dish__plate')[index],
  title: recipesEl.querySelectorAll('.dish__title')[index],
  card: recipesEl.querySelectorAll('.dish__card-body')[index],
});
const dishThumbs = [...recipesEl.querySelectorAll('.dish__thumb')];
const recipeHooks = {
  change(from, to) {
    from.plate.classList.remove('is-active'); to.plate.classList.add('is-active');
    from.title.hidden = true; to.title.hidden = false;
    from.card.hidden = true; to.card.hidden = false;
    return Promise.resolve();
  },
};
let currentRecipe = 0;
let recipeBusy = false;
function showRecipe(index, direction) {
  const n = dishThumbs.length;
  index = (index + n) % n;
  if (index === currentRecipe || recipeBusy) return;
  direction = direction || (index > currentRecipe ? 1 : -1);
  dishThumbs.forEach((thumb, k) => {
    thumb.classList.toggle('is-active', k === index);
    k === index ? thumb.setAttribute('aria-current', 'true') : thumb.removeAttribute('aria-current');
  });
  recipeBusy = true;
  const from = dish(currentRecipe);
  currentRecipe = index;
  recipeHooks.change(from, dish(index), direction).then(() => { recipeBusy = false; });
}
function showRecipeTab(name) {
  recipesEl.querySelectorAll('.dish__tabs button').forEach(tab => {
    const on = tab.dataset.tab === name;
    tab.classList.toggle('is-active', on);
    tab.setAttribute('aria-selected', String(on));
  });
  recipesEl.querySelectorAll('.dish__panel').forEach(panel => { panel.hidden = panel.dataset.panel !== name; });
}
recipesEl.querySelector('.dish__arrow--prev').addEventListener('click', () => showRecipe(currentRecipe - 1, -1));
recipesEl.querySelector('.dish__arrow--next').addEventListener('click', () => showRecipe(currentRecipe + 1, 1));
dishThumbs.forEach((thumb, k) => thumb.addEventListener('click', () => showRecipe(k)));
recipesEl.querySelectorAll('.dish__tabs button').forEach(tab => tab.addEventListener('click', () => showRecipeTab(tab.dataset.tab)));
recipesEl.querySelector('.dish__show-ingredients').addEventListener('click', () => showRecipeTab('ingredientes'));
recipesEl.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') showRecipe(currentRecipe - 1, -1);
  if (event.key === 'ArrowRight') showRecipe(currentRecipe + 1, 1);
});

// Videos only play while on screen. Once the circle is near, the collage photos start loading so they are ready to open.
const bigLinkVideo = document.querySelector('.big-link__video');
new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;
  gallery.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
}, {rootMargin:'600px 0px'}).observe(bigLinkVideo);
new IntersectionObserver(([entry]) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  entry.isIntersecting ? bigLinkVideo.play().catch(() => {}) : bigLinkVideo.pause();
}).observe(bigLinkVideo);

// The hero video lives outside the SVG and follows the paper cover's box every frame (intro scale, hover expansion).
(() => {
  const arch = document.querySelector('.hero .arch');
  const video = arch?.querySelector('.house-video');
  const box = arch?.querySelector('.house-cover');
  if (!video || !box) return;
  let last = '', onScreen = true;
  // Reading layout every frame is only worth it while the hero is visible.
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; }).observe(arch);
  (function sync() {
    if (!onScreen) return requestAnimationFrame(sync);
    const a = arch.getBoundingClientRect(), b = box.getBoundingClientRect();
    const next = `${b.left - a.left},${b.top - a.top},${b.width},${b.height}`;
    if (next !== last) {
      last = next;
      // Inset by 1px so no sub-pixel sliver of video peeks past the cover's anti-aliased edge.
      Object.assign(video.style, {left:`${b.left - a.left + 1}px`, top:`${b.top - a.top + 1}px`, width:`${b.width - 2}px`, height:`${b.height - 2}px`});
    }
    requestAnimationFrame(sync);
  })();
})();

// Motion replicates gucciosteria.com: same GSAP timings, eases and offsets. Content stays usable without it.
(() => {
  const cover = document.querySelector('.intro-cover');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The hero video is ambient motion: keep it still for people who ask for reduced motion.
  if (reduced) document.querySelectorAll('.house-video, .big-link__video').forEach(video => { video.removeAttribute('autoplay'); video.pause(); });
  if (reduced || !window.gsap || !window.SplitText || !window.MorphSVGPlugin || !window.CustomEase) { cover?.remove(); document.querySelector('.hero .arch')?.classList.add('is-ready'); return; }
  gsap.registerPlugin(SplitText, MorphSVGPlugin, CustomEase);

  const ease = 'power3.out';
  const coverColor = getComputedStyle(document.documentElement).getPropertyValue('--cover').trim();
  const INTRO_HOLD = 5; // Gucci keeps the cover for 5s on first entry.
  const root = document.documentElement;
  const header = document.querySelector('header');
  const hero = document.querySelector('.hero');
  const title = hero.querySelector('h1');
  const arch = hero.querySelector('.arch');

  // House photo gets the same figure structure as the hero arch, plus an animated divider line.
  const houseImage = document.querySelector('.house-photo img');
  const photoWindow = document.createElement('div');
  photoWindow.className = 'photo-window';
  houseImage.before(photoWindow);
  photoWindow.append(houseImage, Object.assign(document.createElement('span'), {className:'border-overlay'}));
  const vline = Object.assign(document.createElement('span'), {className:'motion-vline'});
  document.querySelector('.house-photo').append(vline);

  // "set" states (initial) and "enter" timelines, one pair per animation name, as in the original.
  const setters = {
    translate(el) { gsap.set(el, {y:125, autoAlpha:el.getBoundingClientRect().top < innerHeight ? 0 : 1}); },
    fadeFromBottom(el) { gsap.set(el, {autoAlpha:0, y:75}); },
    picture(el) {
      gsap.set(el.querySelector('.border-overlay'), {borderWidth:100, borderColor:coverColor});
      gsap.set(el.querySelector('img, video'), {scale:1.4});
      gsap.set(el, {scale:.6});
    },
    line(el) { gsap.set(el, {scaleY:0, transformOrigin:'50% 0'}); },
    arrow(el) {
      gsap.set(el.querySelector('line'), {scaleX:0, transformOrigin:'0 50%'});
      gsap.set(el.querySelector('path'), {scale:0, transformOrigin:'80% 50%'});
    },
    scaleDown(el) { gsap.set(el, {scale:1.6}); },
    scaleCircle(el) {
      setters.picture(el.querySelector('figure'));
      gsap.set(el.querySelector('.big-link__circle'), {scale:.55, rotation:-15});
    },
    quote(el) {
      el._split = new SplitText(el, {type:'lines, words'});
      gsap.set(el, {opacity:0});
      gsap.set(el._split.lines, {autoAlpha:0, yPercent:150});
    },
  };
  const enters = {
    translate: el => gsap.timeline().to(el, {y:0, autoAlpha:1, duration:1.2, ease, clearProps:'all'}),
    fadeFromBottom: el => gsap.timeline().to(el, {autoAlpha:1, y:0, duration:1.2, ease, clearProps:'all'}),
    picture(el, delay = 0) {
      return gsap.timeline({delay}).addLabel('start')
        .to(el, {scale:1, duration:1.45, ease}, 'start')
        .to(el.querySelector('.border-overlay'), {borderWidth:0, duration:1.2, ease, clearProps:'all'}, 'start+=0.25')
        .to(el.querySelector('img, video'), {scale:1, duration:1.2, ease, clearProps:'all'}, 'start+=0.25');
    },
    line: el => gsap.timeline({delay:.5}).to(el, {scaleY:1, duration:2, ease, clearProps:'all'}),
    arrow(el) {
      return gsap.timeline().addLabel('start')
        .to(el.querySelector('line'), {scaleX:1, duration:1.2, ease, clearProps:'all'}, 'start')
        .to(el.querySelector('path'), {scale:1, duration:1.2, ease, clearProps:'all'}, 'start+=0.2');
    },
    scaleDown: el => gsap.timeline().to(el, {scale:1, duration:1.2, ease, clearProps:'all'}),
    scaleCircle(el) {
      return gsap.timeline({delay:.2}).addLabel('start')
        .to(el.querySelector('.big-link__circle'), {scale:1, rotation:0, duration:1.05, ease}, 'start')
        .add(enters.picture(el.querySelector('figure')), 'start');
    },
    quote(el) {
      return gsap.timeline({delay:.2}).addLabel('start').set(el, {opacity:1}, 'start')
        .to(el._split.lines, {autoAlpha:1, yPercent:0, duration:1.2, stagger:.2, ease}, 'start');
    },
  };

  // Recipes. Entrance: the plate spins in and grows, the title is revealed, then card and thumbnails rise.
  // Change: the plate leaves spinning along an arc while the next one arrives along the opposite arc,
  // the title wipes out and back in (first line from the right, second from the left) and the card swaps.
  const titleParts = title => ({
    l1: title.querySelector('.dish__l1'), l2: title.querySelector('.dish__l2'),
    rest: title.querySelectorAll('.dish__eyebrow, .dish__sub'),
  });
  const revealTitle = (title, delay = 0) => {
    const t = titleParts(title);
    return gsap.timeline({delay}).addLabel('start')
      .fromTo(t.l1, {clipPath:'inset(0% 0% 0% 100%)'}, {clipPath:'inset(0% 0% 0% 0%)', duration:.9, ease:'power3.inOut', clearProps:'clipPath'}, 'start')
      .fromTo(t.l2, {clipPath:'inset(0% 100% 0% 0%)'}, {clipPath:'inset(0% 0% 0% 0%)', duration:.9, ease:'power3.inOut', clearProps:'clipPath'}, 'start+=0.1')
      .fromTo(t.rest, {autoAlpha:0, y:16}, {autoAlpha:1, y:0, duration:.8, ease, stagger:.1, clearProps:'all'}, 'start+=0.3');
  };
  setters.dish = el => {
    const first = dish(0);
    gsap.set(first.plate, {scale:.6, rotation:-90, autoAlpha:0});
    const t = titleParts(first.title);
    gsap.set(t.l1, {clipPath:'inset(0% 0% 0% 100%)'});
    gsap.set(t.l2, {clipPath:'inset(0% 100% 0% 0%)'});
    gsap.set(t.rest, {autoAlpha:0});
    [el.querySelector('.dish__actions'), el.querySelector('.dish__card'), ...el.querySelectorAll('.dish__thumbs>*')].forEach(setters.fadeFromBottom);
  };
  enters.dish = el => {
    const first = dish(0);
    return gsap.timeline().addLabel('start')
      .to(first.plate, {scale:1, rotation:0, autoAlpha:1, duration:1.45, ease, clearProps:'all'}, 'start')
      .add(revealTitle(first.title), 'start+=0.35')
      .add(enters.fadeFromBottom(el.querySelector('.dish__actions')), 'start+=0.7')
      .add(enters.fadeFromBottom(el.querySelector('.dish__card')), 'start+=0.5')
      .add(() => el.querySelectorAll('.dish__thumbs>*').forEach((item, i) => gsap.delayedCall(i * .08, () => enters.fadeFromBottom(item))), 'start+=0.8');
  };
  recipeHooks.change = (from, to, direction) => new Promise(resolve => {
    // Arc ends: "high" is up and to the right of the plate, "low" is down and to the left.
    const high = {xPercent:190, yPercent:-150, rotation:170};
    const low = {xPercent:-150, yPercent:110, rotation:-150};
    const exit = direction > 0 ? low : high;
    const entry = direction > 0 ? high : low;
    const out = titleParts(from.title);
    to.plate.classList.add('is-active');
    gsap.set(to.plate, {...entry, zIndex:2});
    gsap.timeline({onComplete:resolve}).addLabel('start')
      .to(out.l1, {clipPath:'inset(0% 100% 0% 0%)', duration:.5, ease:'power3.in'}, 'start')
      .to(out.l2, {clipPath:'inset(0% 0% 0% 100%)', duration:.5, ease:'power3.in'}, 'start+=0.05')
      .to(out.rest, {autoAlpha:0, duration:.3}, 'start')
      .to(from.card, {autoAlpha:0, y:-14, duration:.35, ease:'power2.in'}, 'start')
      .to(from.plate, {xPercent:exit.xPercent, duration:.9, ease:'power2.in'}, 'start')
      .to(from.plate, {yPercent:exit.yPercent, rotation:exit.rotation, duration:.9, ease:'power1.in'}, 'start')
      .to(recipesEl.querySelector('.dish__ring'), {rotation:`+=${direction * 90}`, duration:1.6, ease:'power3.inOut'}, 'start')
      .add(() => {
        from.title.hidden = true; to.title.hidden = false;
        gsap.set([out.l1, out.l2, out.rest], {clearProps:'all'});
        from.card.hidden = true; gsap.set(from.card, {clearProps:'all'});
        to.card.hidden = false;
      }, 'start+=0.5')
      .fromTo(to.card, {autoAlpha:0, y:24}, {autoAlpha:1, y:0, duration:.8, ease, clearProps:'all'}, 'start+=0.55')
      .fromTo(to.card.querySelector('.dish__rating'), {scale:.6}, {scale:1, duration:.7, ease:'back.out(2)', clearProps:'transform'}, 'start+=0.6')
      .to(to.plate, {xPercent:0, duration:1.15, ease:'power2.inOut'}, 'start+=0.25')
      .to(to.plate, {yPercent:0, rotation:0, duration:1.15, ease:'power3.out'}, 'start+=0.25')
      .add(() => { from.plate.classList.remove('is-active'); gsap.set([from.plate, to.plate], {clearProps:'all'}); }, 'start+=1.4')
      .add(revealTitle(to.title), 'start+=0.95');
  });

  const scrollTargets = [
    ['fadeFromBottom', '.manifesto p'],
    ['translate', '.intro .eyebrow, .section-heading h2, .section-heading>p, .experiences article'],
    ['picture', '.photo-window'],
    ['line', '.motion-vline'],
    ['translate', '.house-copy .eyebrow, .house-copy h2, .house-copy>p:not(.eyebrow)'],
    ['fadeFromBottom', '.house-copy .cta'],
    ['arrow', '.house-copy .cta-arrow'],
    ['translate', '.pt-copy .eyebrow, .pt-copy h2, .pt-copy>p:not(.eyebrow)'],
    ['fadeFromBottom', '.pt-copy .cta'],
    ['arrow', '.pt-copy .cta-arrow'],
    ['scaleCircle', '.big-link__link'],
    ['scaleDown', '.big-link__text'],
    ['translate', '.philosophy .eyebrow, .philosophy>p:not(.eyebrow)'],
    ['translate', '.recipes__head .eyebrow, .recipes__head h2'],
    ['dish', '.dish'],
    ['quote', '.philosophy h2'],
    ['fadeFromBottom', '.signature'],
    ['translate', '.planning>div>*:not(.planning-note), #event-form>label, #event-form>.form-row'],
    ['fadeFromBottom', '.planning-note, #event-form>.button, #event-form>.form-note'],
    ['translate', '.closing>*'],
    ['fadeFromBottom', 'footer>*'],
  ].flatMap(([name, selector]) => [...document.querySelectorAll(selector)].map(el => {
    if (innerWidth < 768 && name === 'line') return null;
    el.dataset.animation = name;
    return el;
  })).filter(Boolean);

  // Hero + intro cover. The cover starts over the page so no content flashes before the intro.
  // Like the original, every load starts at the top: no restored scroll and no jump to a leftover #hash.
  history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  scrollTo({top:0, behavior:'instant'});
  addEventListener('load', () => { if (root.classList.contains('is-loading')) scrollTo({top:0, behavior:'instant'}); }, {once:true});
  root.classList.add('is-loading');
  scrollTargets.forEach(el => setters[el.dataset.animation](el));
  const asides = [...hero.querySelectorAll('.hero-aside')];
  const heroCta = hero.querySelector('.cta-arrow');
  const house = {
    mark: arch.querySelector('.house-mark'),
    lines: arch.querySelectorAll('#house-strokes path'),
    photo: arch.querySelector('.house-photo-img'),
    overlay: arch.querySelector('.house-overlay-lines'),
    maskLines: arch.querySelector('.house-mask-lines'),
    silhouette: arch.querySelector('.house-silhouette'),
  };
  // The Gucci "picture" entrance, adapted to the fingerprint house: the lines draw in,
  // the figure grows from .6, the photo settles from 1.4 and the green recedes to reveal it.
  // Finally the photo fills the smooth house silhouette and the separate lines dissolve into it.
  gsap.set(house.lines, {strokeDasharray:1, strokeDashoffset:1});
  gsap.set(house.maskLines, {opacity:1});
  gsap.set(house.silhouette, {opacity:0});
  gsap.set(house.overlay, {opacity:1});
  gsap.set(house.photo, {scale:1.4, transformOrigin:'50% 50%'});
  gsap.set(house.mark, {scale:.6, transformOrigin:'50% 100%'});
  asides.forEach(setters.fadeFromBottom);
  setters.arrow(heroCta);

  function pageHero() {
    gsap.set(title, {scale:.75, transformOrigin:'50% 100%'});
    return gsap.timeline().addLabel('start')
      .fromTo(hero, {y:400}, {y:0, duration:1, ease, clearProps:'all'}, 'start')
      .to(title, {scale:1, duration:1.2, ease, clearProps:'all'}, 'start')
      .addLabel('house', 'start+=0.2')
      .to(house.mark, {scale:1, duration:1.45, ease, clearProps:'all'}, 'house')
      .to(house.lines, {strokeDashoffset:0, duration:1.3, stagger:.025, ease}, 'house')
      .to(house.overlay, {opacity:0, duration:1.2, ease}, 'house+=0.45')
      .to(house.photo, {scale:1, duration:1.2, ease, clearProps:'all', onComplete:() => arch.classList.add('is-ready')}, 'house+=0.25')
      .to(house.silhouette, {opacity:1, duration:1.2, ease:'power3.inOut', clearProps:'opacity'}, 'house+=1.3')
      .to(house.maskLines, {opacity:0, duration:1.2, ease:'power3.inOut', clearProps:'opacity'}, 'house+=1.3')
      .add(() => asides.forEach(enters.fadeFromBottom), 'start+=0.8')
      .add(() => enters.arrow(heroCta), 'start+=1.6');
  }

  // Gallery: the page gives way (Gucci's modal fade), then each photo opens with the picture effect, one after another.
  const galleryItems = [...gallery.querySelector('.gallery__grid').children];
  const isWord = el => el.classList.contains('gallery__word');
  galleryHooks.open = () => {
    gsap.killTweensOf(gallery);
    galleryItems.forEach(el => (isWord(el) ? setters.fadeFromBottom : setters.picture)(el));
    setters.translate(gallery.querySelector('.gallery__head'));
    const tl = gsap.timeline().addLabel('start')
      .fromTo(gallery, {autoAlpha:0}, {autoAlpha:1, duration:.6, ease}, 'start')
      .add(enters.translate(gallery.querySelector('.gallery__head')), 'start+=0.2');
    galleryItems.forEach((item, i) => tl.add((isWord(item) ? enters.fadeFromBottom : enters.picture)(item), `start+=${0.35 + i * 0.12}`));
  };
  galleryHooks.close = done => {
    gsap.to(gallery, {autoAlpha:0, duration:.5, ease, onComplete:() => { done(); gsap.set(gallery, {clearProps:'all'}); }});
  };

  // Hovering the house lets the photo break out of the silhouette and fill the hero, inside its margins.
  function heroExpand() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const svg = house.mark;
    const shape = house.silhouette;
    const houseD = shape.getAttribute('d');
    const photoBox = ['x', 'y', 'width', 'height'].map(k => +house.photo.getAttribute(k));
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hit.setAttribute('class', 'house-hit');
    hit.setAttribute('d', houseD);
    svg.append(hit);
    let expanded = false;
    const curve = 'power3.inOut';
    function heroRectInSvg() {
      const r = hero.getBoundingClientRect();
      const m = svg.getScreenCTM().inverse();
      const p = (x, y) => new DOMPoint(x, y).matrixTransform(m);
      const a = p(r.left, r.top), b = p(r.right, r.bottom);
      return {x:a.x, y:a.y, w:b.x - a.x, h:b.y - a.y};
    }
    hit.addEventListener('mouseenter', () => {
      if (expanded || !arch.classList.contains('is-ready')) return;
      expanded = true;
      const box = heroRectInSvg();
      hero.classList.add('is-expanded');
      gsap.to(shape, {morphSVG:`M${box.x},${box.y}H${box.x + box.w}V${box.y + box.h}H${box.x}Z`, duration:1, ease:curve, overwrite:true});
      // The typography only steps aside once the video fills the whole frame.
      gsap.to(house.photo, {attr:{x:box.x, y:box.y, width:box.w, height:box.h}, duration:1, ease:curve, overwrite:true, onComplete:() => { if (expanded) hero.classList.add('is-full'); }});
      gsap.set(hit, {attr:{d:`M${box.x},${box.y}H${box.x + box.w}V${box.y + box.h}H${box.x}Z`}});
    });
    hero.addEventListener('mouseleave', () => {
      if (!expanded) return;
      expanded = false;
      hero.classList.remove('is-expanded', 'is-full');
      gsap.to(shape, {morphSVG:houseD, duration:1, ease:curve, overwrite:true});
      gsap.to(house.photo, {attr:{x:photoBox[0], y:photoBox[1], width:photoBox[2], height:photoBox[3]}, duration:1, ease:curve, overwrite:true});
      hit.setAttribute('d', houseD);
    });
  }
  heroExpand();

  function introText(el) {
    const split = new SplitText(el, {type:'lines, words'});
    gsap.set(el, {autoAlpha:0});
    gsap.set(split.words, {autoAlpha:0, yPercent:70});
    return {
      enter: () => gsap.timeline().addLabel('start').set(el, {autoAlpha:1}, 'start')
        .to(split.words, {yPercent:0, duration:.9, stagger:.08, ease:'power3.inOut'}, 'start')
        .to(split.words, {autoAlpha:1, duration:1.25, stagger:.09, ease:'power3.inOut'}, 'start'),
      leave: () => gsap.timeline().to(split.lines, {yPercent:-150, autoAlpha:0, duration:1, stagger:.08}),
    };
  }

  function coverLeave() {
    const curve = CustomEase.create('coverLeave', '0.65, 0, 0.25, 1');
    return gsap.timeline({delay:.5, onComplete:() => cover.remove()}).addLabel('start')
      .to(cover.querySelector('.cover-bg'), {morphSVG:cover.querySelector('.cover-leave'), ease:curve, duration:.4, yoyo:true, repeat:1}, 'start')
      .to(cover, {yPercent:-100.2, ease:curve, duration:1}, 'start');
  }

  function intro() {
    const text = introText(cover.querySelector('.cover-text'));
    gsap.timeline().addLabel('start')
      .add(() => text.enter(), 'start+=0.2')
      .add(coverLeave(), `start+=${INTRO_HOLD}`)
      .add(() => text.leave(), `start+=${INTRO_HOLD + .5}`)
      .add(pageHero(), `start+=${INTRO_HOLD + .5}`)
      .add(ready, `start+=${INTRO_HOLD + 1.5}`);
  }

  // Scroll-triggered entries: fire once, as soon as any pixel enters the viewport.
  function ready() {
    root.classList.remove('is-loading');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      enters[entry.target.dataset.animation](entry.target);
    }), {threshold:0});
    scrollTargets.forEach(el => observer.observe(el));
    startParallax();
  }

  // The rotating circle text only runs while its section is on screen.
  const bigLink = document.querySelector('.big-link');
  new IntersectionObserver(([entry]) => bigLink.classList.toggle('is-offscreen', !entry.isIntersecting), {rootMargin:'20px 0px 20px 0px'}).observe(bigLink);

  // Parallax on hero columns (desktop only): offset = scrollY * factor while in view.
  function startParallax() {
    if (innerWidth <= 768) return;
    const items = [[title, -.2], [hero.querySelector('.ornament'), -.2], ...asides.map(el => [el, .1])];
    // Visibility is read from the untransformed section, so a moved item can never strand itself offscreen.
    gsap.ticker.add(() => {
      const rect = hero.getBoundingClientRect();
      if (rect.bottom < -20 || rect.top > innerHeight + 20) return;
      items.forEach(([el, factor]) => { el.style.translate = `0 ${(scrollY * factor).toFixed(2)}px`; });
    });
  }

  // Smooth wheel scrolling: each wheel step eases to the new target over 1000ms (cubic).
  // Only for mouse wheels: trackpads already scroll smoothly with their own inertia, and easing on top of it
  // made laptops keep scrolling ~1s after the fingers stopped (and blocked horizontal swipe gestures).
  let target = scrollY, from = scrollY, startTime = 0, raf = 0, trackpad = false;
  const isTrackpad = event => event.deltaX !== 0 || (event.wheelDeltaY ? event.wheelDeltaY === -3 * event.deltaY : event.deltaMode === 0 && Math.abs(event.deltaY) < 50);
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  function step(now) {
    const t = Math.min(1, (now - startTime) / 1000);
    scrollTo({top:from + (target - from) * easeOutCubic(t), behavior:'instant'});
    raf = t < 1 ? requestAnimationFrame(step) : 0;
  }
  addEventListener('wheel', event => {
    if (event.ctrlKey || root.classList.contains('is-loading')) return;
    if (event.target.closest?.('textarea, select, dialog')) return;
    if (trackpad || (trackpad = isTrackpad(event))) { stopSmooth(); return; }
    event.preventDefault();
    const delta = event.deltaMode === 1 ? event.deltaY * 40 : event.deltaMode === 2 ? event.deltaY * innerHeight : event.deltaY;
    if (!raf) target = scrollY;
    target = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, target + delta));
    from = scrollY;
    startTime = performance.now();
    if (!raf) raf = requestAnimationFrame(step);
  }, {passive:false});
  const stopSmooth = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  ['keydown', 'mousedown', 'touchstart'].forEach(type => addEventListener(type, stopSmooth, {passive:true}));
  document.querySelectorAll('a[href^="#"], .select-experience').forEach(el => el.addEventListener('click', stopSmooth));

  // Header slides away while scrolling down and returns when scrolling up.
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (Math.abs(y - lastY) < 4) return;
    header.classList.toggle('is-hidden', y > lastY && y > header.offsetHeight && mobileNav.hidden);
    lastY = y;
  }, {passive:true});

  menuToggle.addEventListener('click', () => {
    if (mobileNav.hidden) return;
    gsap.from(mobileNav.querySelectorAll('a'), {y:125, autoAlpha:0, duration:1.2, stagger:.08, ease, clearProps:'all'});
  });
  form.addEventListener('submit', () => { setters.fadeFromBottom(document.querySelector('#result')); enters.fadeFromBottom(document.querySelector('#result')); });

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(intro);
})();


matchMedia('(min-width: 641px)').addEventListener('change',event=>{if(event.matches){mobileNav.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.textContent='Menú';}});
