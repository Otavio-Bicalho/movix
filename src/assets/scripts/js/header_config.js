
const sideMenu = document.getElementById('side-menu');
const sideOverlay = document.getElementById('side-overlay');
const sideToggleBtn = document.getElementById('topbar-menu');

function openSide() {
    sideMenu.classList.add('visible');
    sideOverlay.classList.add('visible');
    sideMenu.setAttribute('aria-hidden', 'false');
}

function closeSide() {
    sideMenu.classList.remove('visible');
    sideOverlay.classList.remove('visible');
    sideMenu.setAttribute('aria-hidden', 'true');
}

if (sideToggleBtn) sideToggleBtn.addEventListener('click', openSide);

if (sideOverlay) sideOverlay.addEventListener('click', closeSide);

document.querySelectorAll('.side-group-head[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => btn.parentElement.classList.toggle('open'));
});