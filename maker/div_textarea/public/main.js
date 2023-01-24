const target = document.getElementById('test');

target.addEventListener('paste', (event) => {
    //event.preventDefault();

    let paste = (event.clipboardData || window.clipboardData).getData('text');
    paste = paste.toUpperCase();
    console.log(paste)
});