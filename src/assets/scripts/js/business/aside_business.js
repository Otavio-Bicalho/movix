function toggleMenu() {
    document
        .getElementById('sidebar')
        .classList
        .toggle('open');
}

document.addEventListener('click', function (e) {

    const sidebar =
        document.getElementById('sidebar');

    const burger =
        document.querySelector('.hamburger');

    if (
        window.innerWidth <= 1024 &&
        !sidebar.contains(e.target) &&
        !burger.contains(e.target)
    ) {
        sidebar.classList.remove('open');
    }

});

function oficinaLogada(){
    

}