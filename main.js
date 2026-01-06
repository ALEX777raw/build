// ===== LOADING SCREEN =====
const loaderScreen = document.getElementById('loaderScreen');
const loaderPercent = document.getElementById('loaderPercent');
const loaderBarFill = document.getElementById('loaderBarFill');
const loaderStatus = document.getElementById('loaderStatus');

const loadingStatuses = [
    'Загрузка ресурсов...',
    'Инициализация 3D...',
    'Загрузка моделей...',
    'Подготовка интерфейса...',
    'Калибровка системы...',
    'Финальная проверка...',
    'Готово к запуску'
];

let loadProgress = 0;
const loadDuration = 3500; // 3.5 seconds
const startTime = performance.now();

function updateLoader() {
    const elapsed = performance.now() - startTime;
    loadProgress = Math.min((elapsed / loadDuration) * 100, 100);

    // Update counter with leading zeros
    const displayPercent = Math.floor(loadProgress).toString().padStart(3, '0');
    loaderPercent.textContent = displayPercent;

    // Update progress bar
    loaderBarFill.style.width = loadProgress + '%';

    // Update status text
    const statusIndex = Math.min(Math.floor(loadProgress / 15), loadingStatuses.length - 1);
    loaderStatus.textContent = loadingStatuses[statusIndex];

    // Update coordinates for effect
    const coords = document.querySelectorAll('.loader-coords');
    if (coords.length >= 4) {
        coords[0].textContent = `X: ${(Math.random() * loadProgress / 100).toFixed(3)}`;
        coords[1].textContent = `Y: ${(Math.random() * loadProgress / 100).toFixed(3)}`;
        coords[2].textContent = `Z: ${(loadProgress / 100).toFixed(3)}`;
    }

    if (loadProgress < 100) {
        requestAnimationFrame(updateLoader);
    } else {
        // Loading complete - start dissolve effect
        setTimeout(() => {
            startDissolveEffect();
        }, 300);
    }
}

// ===== DISSOLVE EFFECT =====
function startDissolveEffect() {
    // Add dissolving class to loader
    loaderScreen.classList.add('dissolving');

    // Create visual effects
    createDissolveFragments();
    createScanlines();
    createNoiseOverlay();
    createGlitchBars();

    // Hide loader after animation completes
    setTimeout(() => {
        loaderScreen.classList.add('hidden');
        // Clean up all effects
        document.querySelectorAll('.dissolve-fragments, .dissolve-scanlines, .dissolve-noise, .dissolve-glitch-bar').forEach(el => el.remove());
    }, 1800);
}

function createScanlines() {
    const scanlines = document.createElement('div');
    scanlines.className = 'dissolve-scanlines';
    document.body.appendChild(scanlines);
}

function createNoiseOverlay() {
    const noise = document.createElement('div');
    noise.className = 'dissolve-noise';
    document.body.appendChild(noise);
}

function createGlitchBars() {
    // Create several horizontal glitch bars at random positions
    const barCount = 5;
    for (let i = 0; i < barCount; i++) {
        setTimeout(() => {
            const bar = document.createElement('div');
            bar.className = 'dissolve-glitch-bar';
            bar.style.top = (Math.random() * 100) + '%';
            bar.style.animationDelay = (Math.random() * 0.3) + 's';
            document.body.appendChild(bar);

            // Remove bar after animation
            setTimeout(() => bar.remove(), 1200);
        }, i * 100);
    }
}

function createDissolveFragments() {
    const fragmentContainer = document.createElement('div');
    fragmentContainer.className = 'dissolve-fragments';
    document.body.appendChild(fragmentContainer);

    const fragmentCount = 25;

    for (let i = 0; i < fragmentCount; i++) {
        const fragment = document.createElement('div');
        fragment.className = 'dissolve-fragment';

        // Random size
        const size = Math.random() * 60 + 20;
        fragment.style.width = size + 'px';
        fragment.style.height = size * (0.3 + Math.random() * 0.7) + 'px';

        // Random starting position
        fragment.style.left = Math.random() * 100 + '%';
        fragment.style.top = Math.random() * 100 + '%';

        // Random fly direction
        const tx = (Math.random() - 0.5) * 400;
        const ty = -100 - Math.random() * 300;
        const rot = (Math.random() - 0.5) * 720;

        fragment.style.setProperty('--tx', tx + 'px');
        fragment.style.setProperty('--ty', ty + 'px');
        fragment.style.setProperty('--rot', rot + 'deg');

        // Random delay
        fragment.style.animationDelay = (Math.random() * 0.5) + 's';

        fragmentContainer.appendChild(fragment);
    }
}

// Start loading animation
updateLoader();

// ===== 3D SNAP SCROLL =====
const world3d = document.getElementById('world3d');
const sections3d = document.querySelectorAll('.section-3d');
const scrollBar = document.getElementById('scrollBar');
const depthValue = document.getElementById('depthValue');
const viewport3d = document.querySelector('.viewport-3d');

// Section Z positions (extracted from HTML transforms)
const sectionPositions = [0, 1200, 2400, 3600, 4800];
let currentSectionIndex = 0;
let currentZ = 0;
let targetZ = 0;
const snapEase = 0.08;
let isScrolling = false;
let scrollCooldown = false;

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Handle wheel scroll for section snapping
window.addEventListener('wheel', (e) => {
    if (scrollCooldown) return;

    const direction = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(0, Math.min(sectionPositions.length - 1, currentSectionIndex + direction));

    if (newIndex !== currentSectionIndex) {
        currentSectionIndex = newIndex;
        targetZ = sectionPositions[currentSectionIndex];

        // Cooldown to prevent rapid scrolling
        scrollCooldown = true;
        setTimeout(() => {
            scrollCooldown = false;
        }, 800);
    }
}, { passive: true });

// Touch support for mobile - improved swipe detection
let touchStartY = 0;
let touchStartX = 0;
let touchStartTime = 0;
let isSwiping = false;

window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();
    isSwiping = true;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;

    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].clientX;
    const diffY = touchStartY - touchY;
    const diffX = touchStartX - touchX;

    // If horizontal swipe is dominant, don't trigger vertical navigation
    if (Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        isSwiping = false;
    }
}, { passive: true });

window.addEventListener('touchend', (e) => {
    if (scrollCooldown || !isSwiping) {
        isSwiping = false;
        return;
    }

    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;
    const timeDiff = Date.now() - touchStartTime;

    // Detect swipe: more sensitive thresholds for easier navigation
    const isQuickSwipe = Math.abs(diff) > 20 && timeDiff < 400;
    const isLongSwipe = Math.abs(diff) > 50;

    if (isQuickSwipe || isLongSwipe) {
        const direction = diff > 0 ? 1 : -1;
        const newIndex = Math.max(0, Math.min(sectionPositions.length - 1, currentSectionIndex + direction));

        if (newIndex !== currentSectionIndex) {
            currentSectionIndex = newIndex;
            targetZ = sectionPositions[currentSectionIndex];

            // Haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }

            scrollCooldown = true;
            setTimeout(() => {
                scrollCooldown = false;
            }, 500); // Faster cooldown for mobile
        }
    }

    isSwiping = false;
}, { passive: true });

// Keyboard navigation
window.addEventListener('keydown', (e) => {
    if (scrollCooldown) return;

    let direction = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        direction = 1;
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        direction = -1;
    }

    if (direction !== 0) {
        e.preventDefault();
        const newIndex = Math.max(0, Math.min(sectionPositions.length - 1, currentSectionIndex + direction));

        if (newIndex !== currentSectionIndex) {
            currentSectionIndex = newIndex;
            targetZ = sectionPositions[currentSectionIndex];

            scrollCooldown = true;
            setTimeout(() => {
                scrollCooldown = false;
            }, 800);
        }
    }
});

// ===== SECTION DOTS NAVIGATION =====
const sectionDots = document.querySelectorAll('.section-dot');

sectionDots.forEach(dot => {
    dot.addEventListener('click', () => {
        const sectionIndex = parseInt(dot.dataset.section);
        if (sectionIndex !== currentSectionIndex) {
            currentSectionIndex = sectionIndex;
            targetZ = sectionPositions[currentSectionIndex];
        }
    });
});

function updateActiveDot() {
    sectionDots.forEach((dot, index) => {
        if (index === currentSectionIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Single animation loop
function update3DScroll() {
    // Smooth lerp to target Z
    currentZ = lerp(currentZ, targetZ, snapEase);

    const xRotation = Math.sin(currentZ * 0.0005) * 1.5;
    const yRotation = Math.cos(currentZ * 0.0004) * 1.5;

    world3d.style.transform = `translate3d(0, 0, ${currentZ}px) rotateX(${xRotation}deg) rotateY(${yRotation}deg)`;

    // Update scroll bar
    const scrollPercent = (currentSectionIndex / (sectionPositions.length - 1)) * 100;
    scrollBar.style.width = `${scrollPercent}%`;

    depthValue.textContent = Math.floor(currentZ).toString().padStart(4, '0');

    // Update active dots
    updateActiveDot();

    // Update active sections
    sections3d.forEach((section, index) => {
        const sectionZ = -sectionPositions[index];
        const effectiveZ = sectionZ + currentZ;

        if (effectiveZ > -800 && effectiveZ < 600) {
            const wasActive = section.classList.contains('active');
            section.classList.add('active');

            // Trigger reveal effect only once per section
            if (!wasActive && !section.dataset.revealed) {
                section.dataset.revealed = 'true';
                triggerSectionReveal(section);
            }

            if (section.classList.contains('counters-section') && !section.dataset.countersAnimated) {
                section.dataset.countersAnimated = 'true';
                section.querySelectorAll('.counter-card').forEach((card, cardIndex) => {
                    if (!card.dataset.animated) {
                        card.dataset.animated = 'true';
                        setTimeout(() => {
                            card.classList.add('revealed');
                        }, cardIndex * 150);
                        setTimeout(() => {
                            animateCounter(card);
                        }, cardIndex * 150 + 800);
                    }
                });
            }
        } else {
            section.classList.remove('active');
        }
    });

    requestAnimationFrame(update3DScroll);
}

// Start animation loop
update3DScroll();

// ===== SECTION REVEAL EFFECT =====
function triggerSectionReveal(section) {
    // Skip hero section (it's visible from start)
    if (section.classList.contains('hero-section')) return;

    // Add screen flash
    createScreenFlash();

    // Add scan line animation
    section.classList.add('scan-revealing');

    // Add edge glow
    const edgeGlow = document.createElement('div');
    edgeGlow.className = 'section-edge-glow';
    section.appendChild(edgeGlow);

    // Add noise overlay
    const noise = document.createElement('div');
    noise.className = 'section-noise';
    section.appendChild(noise);

    // Add flying data fragments
    createDataFragments(section);

    // Remove classes after animation
    setTimeout(() => {
        section.classList.remove('scan-revealing');
        noise.remove();
        edgeGlow.remove();
    }, 1200);
}

function createScreenFlash() {
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    document.body.appendChild(flash);

    setTimeout(() => flash.remove(), 600);
}

function createSectionGlitchLines(section) {
    const lineCount = 3;
    for (let i = 0; i < lineCount; i++) {
        setTimeout(() => {
            const line = document.createElement('div');
            line.className = 'section-glitch-line';
            line.style.top = (20 + Math.random() * 60) + '%';
            line.style.animationDelay = (Math.random() * 0.2) + 's';
            section.appendChild(line);

            // Remove after animation
            setTimeout(() => line.remove(), 800);
        }, i * 100);
    }
}

function createDataFragments(section) {
    const fragments = [
        'INIT: OK', 'LOAD: 100%', 'SCAN: DONE', 'DATA: READY',
        'SYS: ACTIVE', 'Z: LOCKED', 'RENDER: ON', 'STATUS: OK'
    ];

    const fragmentCount = 5;
    for (let i = 0; i < fragmentCount; i++) {
        setTimeout(() => {
            const fragment = document.createElement('div');
            fragment.className = 'section-data-fragment';
            fragment.textContent = fragments[Math.floor(Math.random() * fragments.length)];

            // Random position
            fragment.style.left = (10 + Math.random() * 80) + '%';
            fragment.style.top = (10 + Math.random() * 80) + '%';

            // Random fly direction
            const tx = (Math.random() - 0.5) * 200;
            const ty = -50 - Math.random() * 100;
            fragment.style.setProperty('--tx', tx + 'px');
            fragment.style.setProperty('--ty', ty + 'px');

            section.appendChild(fragment);

            // Remove after animation
            setTimeout(() => fragment.remove(), 1200);
        }, i * 80);
    }
}

// Mouse parallax
let parallaxX = 0, parallaxY = 0;
window.addEventListener('mousemove', (e) => {
    parallaxX = (e.clientX / window.innerWidth - 0.5) * 15;
    parallaxY = (e.clientY / window.innerHeight - 0.5) * 15;
    viewport3d.style.perspectiveOrigin = `${50 + parallaxX}% ${50 + parallaxY}%`;
});

// ===== X-RAY LENS EFFECT =====
const xrayLens = document.getElementById('xrayLens');
const dim1 = document.getElementById('dim1');
const dim2 = document.getElementById('dim2');
const dim3 = document.getElementById('dim3');

// ===== CUSTOM CURSOR =====
const cursor = document.getElementById('cursor');
const cursorRing = cursor.querySelector('.cursor-ring');

document.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;

    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';

    xrayLens.style.setProperty('--lens-x', x + 'px');
    xrayLens.style.setProperty('--lens-y', y + 'px');

    dim1.style.left = (x + 60) + 'px';
    dim1.style.top = (y - 80) + 'px';
    dim2.style.left = (x + 60) + 'px';
    dim2.style.top = (y - 50) + 'px';
    dim3.style.left = (x + 60) + 'px';
    dim3.style.top = (y - 20) + 'px';

    dim1.classList.add('visible');
    dim2.classList.add('visible');
    dim3.classList.add('visible');
});

document.addEventListener('mouseleave', () => {
    dim1.classList.remove('visible');
    dim2.classList.remove('visible');
    dim3.classList.remove('visible');
});

document.addEventListener('mousedown', () => {
    cursor.classList.add('clicking');
    cursorRing.classList.remove('animate');
    void cursorRing.offsetWidth;
    cursorRing.classList.add('animate');
});

document.addEventListener('mouseup', () => {
    cursor.classList.remove('clicking');
});

const interactiveElements = document.querySelectorAll('a, button, .xray-card, .counter-card, .file-upload, input, textarea');
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// ===== COUNTER ANIMATION =====
function animateCounter(element) {
    const target = parseInt(element.dataset.count);
    const numberEl = element.querySelector('.counter-number');
    const barFill = element.querySelector('.counter-bar-fill');
    const duration = 2000;
    const startTime = performance.now();

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);

        const currentValue = Math.floor(easedProgress * target);
        numberEl.textContent = currentValue.toLocaleString('ru-RU');

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            numberEl.textContent = target.toLocaleString('ru-RU');
        }
    }

    requestAnimationFrame(updateCounter);

    setTimeout(() => {
        barFill.style.width = '100%';
    }, 100);
}

// ===== PHONE MASK =====
const phoneInput = document.querySelector('input[type="tel"]');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value[0] === '7' || value[0] === '8') {
                value = value.substring(1);
            }
            let formatted = '+7';
            if (value.length > 0) formatted += ' (' + value.substring(0, 3);
            if (value.length >= 3) formatted += ') ' + value.substring(3, 6);
            if (value.length >= 6) formatted += '-' + value.substring(6, 8);
            if (value.length >= 8) formatted += '-' + value.substring(8, 10);
            e.target.value = formatted;
        }
    });
}

// ===== FILE UPLOAD =====
const fileUpload = document.querySelector('.file-upload');
const fileInput = document.querySelector('.file-input');

if (fileInput && fileUpload) {
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            fileUpload.querySelector('.file-upload-text').textContent = `Выбрано: ${files.length} файл(ов)`;
            fileUpload.querySelector('.file-upload-hint').textContent = Array.from(files).map(f => f.name).join(', ');
            fileUpload.style.borderColor = 'var(--color-accent-light)';
            fileUpload.style.background = 'rgba(74, 124, 155, 0.15)';
        }
    });

    fileUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUpload.style.borderColor = 'var(--color-accent-light)';
        fileUpload.style.background = 'rgba(74, 124, 155, 0.15)';
    });

    fileUpload.addEventListener('dragleave', () => {
        fileUpload.style.borderColor = '';
        fileUpload.style.background = '';
    });
}

// ===== FORM SUBMIT =====
const specForm = document.querySelector('.spec-form');
if (specForm) {
    specForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Заявка отправлена! (демо)');
    });
}

// ===== MAGNETIC BUTTONS =====
document.querySelectorAll('.submit-btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
    });
});

// ===== SCANNER BAR FLICKERING =====
const scannerBar = document.getElementById('scannerBar');
const scanStatus = document.querySelector('.scan-status');
const scanDepth = document.querySelector('.scan-depth');
const scanMaterial = document.querySelector('.scan-material');

setInterval(() => {
    if (scannerBar) {
        scannerBar.style.opacity = Math.random() * 0.3 + 0.7;
    }
}, 50);

const materials = ['STEEL: C345', 'STEEL: C255', 'STEEL: C390', 'ALLOY: AL-6061'];
const statuses = ['SCAN: ACTIVE', 'ANALYZING...', 'PROCESSING', 'DATA READY'];

setInterval(() => {
    if (scanDepth) {
        const depth = Math.floor(Math.random() * 800 + 100);
        scanDepth.textContent = `DEPTH: ${depth}mm`;
    }
    if (scanMaterial) {
        scanMaterial.textContent = materials[Math.floor(Math.random() * materials.length)];
    }
    if (scanStatus) {
        scanStatus.textContent = statuses[Math.floor(Math.random() * statuses.length)];
    }
}, 2000);

const scannerReveal = document.querySelector('.scanner-reveal');
function updateScannerReveal() {
    const bar = document.querySelector('.scanner-bar');
    if (bar && scannerReveal) {
        const style = window.getComputedStyle(bar);
        const left = style.left;
        scannerReveal.style.setProperty('--scan-pos', left);
    }
    requestAnimationFrame(updateScannerReveal);
}
updateScannerReveal();

// ===== KINETIC CARD REVEAL =====
const xrayCards = document.querySelectorAll('.xray-card');

// Trigger reveal when section becomes active
function checkCardReveal() {
    const xraySection = document.querySelector('.xray-section');
    if (xraySection && xraySection.classList.contains('active')) {
        xrayCards.forEach((card, index) => {
            if (!card.classList.contains('revealed')) {
                setTimeout(() => {
                    card.classList.add('revealed');
                }, index * 200);
            }
        });
    }
}

// Observer for section activation
const sectionObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
            checkCardReveal();
        }
    });
});

const xraySection = document.querySelector('.xray-section');
if (xraySection) {
    sectionObserver.observe(xraySection, { attributes: true });
}

// ===== CARD PARALLAX TILT =====
const allKineticCards = document.querySelectorAll('.xray-card, .counter-card');

allKineticCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
});
