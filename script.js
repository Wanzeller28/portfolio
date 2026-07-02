(function () {
    const body = document.body;

    function updateDeviceClass() {
        body.classList.remove('phone', 'tablet', 'desktop');
        const width = window.innerWidth;
        if (width <= 768) body.classList.add('phone');
        else if (width <= 1024) body.classList.add('tablet');
        else body.classList.add('desktop');
    }

    updateDeviceClass();
    window.addEventListener('resize', updateDeviceClass);

    // Reveal-on-scroll: fade + rise for elements with [data-reveal] or .reveal
    const revealTargets = document.querySelectorAll('[data-reveal], .grid-item, .block, .intro, .project-meta');
    revealTargets.forEach((el) => el.classList.add('reveal'));

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const delay = el.dataset.revealDelay || 0;
                        setTimeout(() => el.classList.add('is-visible'), Number(delay));
                        io.unobserve(el);
                    }
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        );

        revealTargets.forEach((el, idx) => {
            // Stagger siblings in the same grid
            const parent = el.parentElement;
            if (parent && parent.classList.contains('grid-container')) {
                const siblings = Array.from(parent.children);
                const i = siblings.indexOf(el);
                el.style.transitionDelay = `${Math.min(i, 6) * 60}ms`;
            }
            io.observe(el);
        });
    } else {
        revealTargets.forEach((el) => el.classList.add('is-visible'));
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Image carousels on the home work sections
    document.querySelectorAll('.work-entry').forEach((entry) => {
        const carousel = entry.querySelector('[data-carousel]');
        if (!carousel) return;
        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(carousel.querySelectorAll('.slide'));
        const dotsWrap = entry.querySelector('.carousel-dots');
        const prev = carousel.querySelector('.carousel-arrow--prev');
        const next = carousel.querySelector('.carousel-arrow--next');
        if (!track || slides.length === 0) return;

        // Single image: nothing to paginate
        if (slides.length < 2) {
            carousel.setAttribute('data-single', '');
            return;
        }

        let index = 0;
        let timer = null;
        const AUTOPLAY = 4500;

        const render = () => {
            track.style.transform = `translateX(-${index * 100}%)`;
            if (dotsWrap) {
                Array.from(dotsWrap.children).forEach((d, di) =>
                    d.classList.toggle('active', di === index));
            }
        };

        const go = (i) => {
            index = (i + slides.length) % slides.length;
            render();
        };

        const stop = () => {
            if (timer) { clearInterval(timer); timer = null; }
        };
        const start = () => {
            if (prefersReducedMotion) return;
            stop();
            timer = setInterval(() => go(index + 1), AUTOPLAY);
        };

        // Build pagination dashes
        if (dotsWrap) {
            slides.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('aria-label', `Go to image ${i + 1}`);
                dot.addEventListener('click', () => { go(i); start(); });
                dotsWrap.appendChild(dot);
            });
        }

        if (prev) prev.addEventListener('click', (e) => { e.preventDefault(); go(index - 1); start(); });
        if (next) next.addEventListener('click', (e) => { e.preventDefault(); go(index + 1); start(); });

        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);

        // Touch swipe (mobile)
        let startX = 0, dx = 0, swiping = false;
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX; dx = 0; swiping = true; stop();
        }, { passive: true });
        carousel.addEventListener('touchmove', (e) => {
            if (swiping) dx = e.touches[0].clientX - startX;
        }, { passive: true });
        carousel.addEventListener('touchend', () => {
            if (swiping && Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
            swiping = false;
            start();
        });

        render();
        start();
    });

    // Typewriter hero — types a phrase, deletes it, types the next, and loops
    const tw = document.querySelector('.home .typewriter');
    if (tw) {
        const textEl = tw.querySelector('.tw-text');
        const caret = tw.querySelector('.tw-caret');
        const phrases = [
            { text: 'Hi, I am Francisco\nWanzeller', accent: false },
            { text: 'I am a Senior Product\nDesigner', accent: true }
        ];

        if (textEl && caret) {
            if (prefersReducedMotion) {
                // No motion: show the role statically, no caret blink
                textEl.textContent = phrases[1].text;
                textEl.classList.add('tw-text--accent');
            } else {
                const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                const HOLD_FULL = 1700; // pause once a phrase is fully typed
                const HOLD_EMPTY = 350; // pause after deleting, before next phrase

                (async () => {
                    await wait(300);
                    let p = 0;

                    /* eslint-disable no-constant-condition */
                    while (true) {
                        const phrase = phrases[p];
                        textEl.classList.toggle('tw-text--accent', phrase.accent);

                        // Type in
                        tw.classList.add('is-typing');
                        for (let i = 1; i <= phrase.text.length; i++) {
                            textEl.textContent = phrase.text.slice(0, i);
                            const ch = phrase.text[i - 1];
                            await wait((ch === ' ' ? 28 : 38) + Math.random() * 34);
                        }
                        tw.classList.remove('is-typing'); // blink while holding
                        await wait(HOLD_FULL);

                        // Delete (faster, steadier)
                        tw.classList.add('is-typing');
                        for (let i = phrase.text.length; i >= 0; i--) {
                            textEl.textContent = phrase.text.slice(0, i);
                            await wait(28 + Math.random() * 18);
                        }
                        tw.classList.remove('is-typing');
                        await wait(HOLD_EMPTY);

                        p = (p + 1) % phrases.length;
                    }
                })();
            }
        }
    }

    // Statement — scroll-linked word reveal
    const statement = document.querySelector('.home .statement');
    if (statement) {
        const textEl = statement.querySelector('[data-statement]');

        if (textEl) {
            // Split into word spans, preserving <em> as accent words
            const words = [];
            const walk = (node, accent) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const parts = node.textContent.split(/(\s+)/);
                    const frag = document.createDocumentFragment();
                    parts.forEach((part) => {
                        if (part === '' ) return;
                        if (/^\s+$/.test(part)) {
                            frag.appendChild(document.createTextNode(part));
                        } else {
                            const span = document.createElement('span');
                            span.className = accent ? 'w accent' : 'w';
                            span.textContent = part;
                            frag.appendChild(span);
                            words.push(span);
                        }
                    });
                    node.replaceWith(frag);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const isAccent = accent || node.tagName === 'EM';
                    Array.from(node.childNodes).forEach((child) => walk(child, isAccent));
                }
            };
            Array.from(textEl.childNodes).forEach((n) => walk(n, false));

            if (prefersReducedMotion) {
                words.forEach((w) => w.classList.add('lit'));
            } else {
                let ticking = false;
                const update = () => {
                    const rect = textEl.getBoundingClientRect();
                    const vh = window.innerHeight;
                    // Fill as the text travels from 85% of the viewport up to 35%,
                    // so it completes around mid-screen; scrolling up reverses it
                    const start = vh * 0.85;
                    const end = vh * 0.35;
                    const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);
                    const lit = Math.round(progress * words.length);
                    words.forEach((w, i) => w.classList.toggle('lit', i < lit));
                    ticking = false;
                };
                const onScrollStatement = () => {
                    if (!ticking) {
                        window.requestAnimationFrame(update);
                        ticking = true;
                    }
                };
                update();
                window.addEventListener('scroll', onScrollStatement, { passive: true });
                window.addEventListener('resize', onScrollStatement, { passive: true });
            }
        }
    }

    // Subtle header shadow when scrolled
    const header = document.querySelector('header');
    if (header) {
        const onScroll = () => {
            if (window.scrollY > 8) {
                header.style.borderBottomColor = 'var(--border)';
            } else {
                header.style.borderBottomColor = 'transparent';
            }
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Lightbox — enlarge project detail images on click
    if (body.classList.contains('project')) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.setAttribute('aria-label', 'Enlarged image');
        lightbox.innerHTML =
            '<button class="lightbox-close" aria-label="Close">\u2715</button>' +
            '<img src="" alt="">';
        document.body.appendChild(lightbox);

        const lbImg = lightbox.querySelector('img');
        const lbClose = lightbox.querySelector('.lightbox-close');

        const openLightbox = (src, alt) => {
            lbImg.src = src;
            lbImg.alt = alt || '';
            lightbox.classList.add('is-open');
            document.body.classList.add('body-lock');
            lbClose.focus({ preventScroll: true });
        };

        const closeLightbox = () => {
            lightbox.classList.remove('is-open');
            document.body.classList.remove('body-lock');
        };

        const selector = '.thumbnail img, .image-callout img, .zoofy-split img';
        document.querySelectorAll(selector).forEach((img) => {
            img.addEventListener('click', (e) => {
                e.preventDefault();
                openLightbox(img.currentSrc || img.src, img.alt);
            });
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target === lbImg) closeLightbox();
        });
        lbClose.addEventListener('click', closeLightbox);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
                closeLightbox();
            }
        });
    }
})();
