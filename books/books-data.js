/* Diin Islaam books: one list used by the Books page and the online reader.
   AMAZON LINKS: when a book goes live on Amazon, paste its link between the quotes after  amazon:
   and the buttons change from "Coming soon on Amazon" to "Buy on Amazon" everywhere. */
window.DI_BOOKS = {
  "house": {
    title: "A House in Paradise", sub: "Stories of Good Wives and Bad Wives from the Qur'an, the Sunnah and Islamic History",
    cover: "a-house-in-paradise.webp", shape: "tall", preview: { pages: 12, total: 124 }, amazon: ""
  },
  "steady-heart": {
    title: "Stories for a Steady Heart", sub: "23 Lessons from the Prophets, the Sahabah and the Tabi'in",
    cover: "stories-for-a-steady-heart.webp", shape: "tall", preview: { pages: 13, total: 171 }, amazon: ""
  },
  "seeraa-1": {
    title: "Seeraa Quest, Book One", sub: "From Arabia Before Islam to the First Revelation",
    cover: "seeraa-quest-book-1.webp", shape: "tall", amazon: ""
  },
  "moonlight-1": { title: "From Adam to Ibrahim", series: "Moonlight Stories of the Prophets · Book 1", cover: "moonlight-stories-book-1.webp", shape: "square", preview: { pages: 7, total: 26 }, amazon: "" },
  "moonlight-2": { title: "Ibrahim's Family", series: "Moonlight Stories of the Prophets · Book 2", cover: "moonlight-stories-book-2.webp", shape: "square", preview: { pages: 7, total: 26 }, amazon: "" },
  "moonlight-3": { title: "Yusuf and His Dream", series: "Moonlight Stories of the Prophets · Book 3", cover: "moonlight-stories-book-3.webp", shape: "square", preview: { pages: 7, total: 26 }, amazon: "" },
  "moonlight-4": { title: "Musa and the Sea", series: "Moonlight Stories of the Prophets · Book 4", cover: "moonlight-stories-book-4.webp", shape: "square", preview: { pages: 7, total: 26 }, amazon: "" },
  "moonlight-5": { title: "Kings, Whales and Wise Men", series: "Moonlight Stories of the Prophets · Book 5", cover: "moonlight-stories-book-5.webp", shape: "square", preview: { pages: 7, total: 26 }, amazon: "" },
  "moonlight-6": { title: "Maryam and 'Isa", series: "Moonlight Stories of the Prophets · Book 6", cover: "moonlight-stories-book-6.webp", shape: "square", preview: { pages: 7, total: 26 }, amazon: "" },
  "moonlight-7": { title: "Our Prophet Muhammad ﷺ", series: "Moonlight Stories of the Prophets · Book 7", cover: "moonlight-stories-book-7.webp", shape: "square", preview: { pages: 7, total: 26 }, amazon: "" },
  "sahabah-1": { title: "Friends of the Prophet ﷺ", series: "Moonlight Stories of the Sahabah · Book 1", cover: "moonlight-sahabah-book-1.webp", shape: "square", preview: { pages: 7, total: 56 }, amazon: "" }
};

/* Turn every  <a class="buy" data-book="...">  into a live Amazon button, or a quiet "coming soon" one. */
window.DI_wireBuyButtons = function (root) {
  (root || document).querySelectorAll('a.buy').forEach(function (a) {
    var b = window.DI_BOOKS[a.dataset.book], url = b && b.amazon;
    if (url) {
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Buy on Amazon'; a.classList.remove('is-soon'); a.removeAttribute('aria-disabled');
    } else {
      a.classList.add('is-soon'); a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true');
      a.textContent = 'Coming soon on Amazon';
    }
  });
};
