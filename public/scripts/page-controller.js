export default () => {
    const buttons = document.querySelectorAll('nav button');
    const sections = document.querySelectorAll('main section');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons et sections
            buttons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            // Ajouter la classe active sur le bouton et la section correspondante
            button.classList.add('active');
            const target = button.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
        });
    });
}
