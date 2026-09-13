/* Deen Sprouts — shared small behaviors used across pages. */

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  const dropdown = document.getElementById('signup-dropdown');
  const signupBtn = document.getElementById('signup-btn');
  if(dropdown && signupBtn){
    signupBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  document.querySelectorAll('[data-coming-soon]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      comingSoon();
    });
  });
});

function comingSoon(){
  alert("Deen Sprouts hasn't launched yet — there's nothing to sign up for just yet! Check back soon. 🌱");
}
