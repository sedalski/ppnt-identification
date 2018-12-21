function drawer() {
    const page = document.getElementById("page");
    const hamburgers = document.querySelectorAll(".hamburger");

    hamburgers.forEach(hamburger => {
        hamburger.addEventListener('click', function () {
            page.classList.toggle('drawer-open');
        })
    })

}

export default drawer;