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
    const revealTargets = document.querySelectorAll('[data-reveal], .grid-item, .block, .intro, .project-meta, .about-hero, .about-grid > *');
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
