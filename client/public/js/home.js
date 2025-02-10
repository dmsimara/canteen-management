
function selectCard(element) {
    const checkIcon = element.querySelector('.check');
    checkIcon.textContent = 'task_alt'; 

    const allCards = document.querySelectorAll('.user-choice a');
    allCards.forEach(card => {
        if (card !== element) {
            const otherCheckIcon = card.querySelector('.check');
            otherCheckIcon.textContent = 'check_circle'; 
        }
    });
}