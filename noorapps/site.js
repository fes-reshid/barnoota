// Shared by every Noorsoft page. Each page defines, before loading this file:
//   const T = {ar: {...}, om: {...}};   its translations (English is the text already in the page)
//   const DOWNLOAD_URL = "...";          where the installer is (empty: buttons say "Coming soon")
typeof DOWNLOAD_URL !== "undefined" && document.querySelectorAll("[data-download]").forEach(link => {
  const label = link.querySelector("[data-i18n]");
  if (DOWNLOAD_URL) {
    link.href = DOWNLOAD_URL;
  } else {
    link.setAttribute("aria-disabled", "true");
    label.dataset.i18n = label.dataset.i18n === "cta_download" ? "cta_soon" : "download_soon";
    label.textContent = label.dataset.i18n === "cta_soon" ? "Coming soon for Windows" : "The installer is coming soon";
  }
});

const english = {};
document.querySelectorAll("[data-i18n]").forEach(el => { english[el.dataset.i18n] = el.textContent; });

function setLanguage(lang) {
  if (!T[lang] && lang !== "en") lang = "en";
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = (lang !== "en" && T[lang][key]) || english[key];
  });
  document.querySelectorAll(".langs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  try { localStorage.setItem("noorsoft-lang", lang); } catch (e) {}
}
document.querySelectorAll(".langs button").forEach(b => b.addEventListener("click", () => setLanguage(b.dataset.lang)));
let start = "en";
try { start = localStorage.getItem("noorsoft-lang") || ""; } catch (e) {}
if (!start) {
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  start = nav === "ar" ? "ar" : nav === "om" ? "om" : "en";
}
setLanguage(start);

// Screenshot switchers under each feature
document.querySelectorAll(".shots").forEach(fig => {
  const img = fig.querySelector("img.shot");
  fig.querySelectorAll(".tabs button").forEach(tab => tab.addEventListener("click", () => {
    img.src = tab.dataset.src;
    fig.querySelectorAll(".tabs button").forEach(t => t.setAttribute("aria-selected", String(t === tab)));
  }));
});

// Full-size view
const box = document.getElementById("lightbox"), boxImg = box && box.querySelector("img");
function zoom(src) { boxImg.src = src; box.showModal(); }
document.querySelectorAll("img[data-zoom]").forEach(img => img.addEventListener("click", () => zoom(img.currentSrc || img.src)));
document.querySelectorAll("[data-zoom-src]").forEach(b => b.addEventListener("click", () => zoom(b.dataset.zoomSrc)));
if (box) box.addEventListener("click", () => box.close());

// Gentle fade-in as sections scroll into view
const seen = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => seen.observe(el));


// Live scan demo (NoorGuard page only)
if (document.getElementById("termBody")) {
(function () {
  const body = document.getElementById("termBody"), filesEl = document.getElementById("termFiles"), foundEl = document.getElementById("termFound");
  const soundBtn = document.getElementById("demoSound"), replayBtn = document.getElementById("demoReplay");
  const dirs = ["C:\\Users\\Sample\\Documents", "C:\\Users\\Sample\\Pictures\\Trip", "C:\\Users\\Sample\\Downloads", "C:\\Windows\\System32",
    "C:\\Program Files\\Sample App", "C:\\Users\\Sample\\AppData\\Local\\Temp", "D:\\Videos", "D:\\Music\\Nasheeds"];
  const names = ["report-2024.docx", "IMG_4821.jpg", "setup.exe", "kernel32.dll", "notes.txt", "lecture-03.mp4", "budget.xlsx", "cache_0001.tmp",
    "quran-recitation.mp3", "photo-0912.png", "config.json", "driver.sys", "slides.pptx", "backup.zip", "readme.md", "font.ttf"];
  const pick = (list, n) => list[n % list.length];
  let audio = null, soundOn = false, timer = 0, run = 0;

  function ctx() { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); return audio; }
  // One synthetic blip: a square/saw wave that slides from one pitch to another, like a data burst.
  function blip(f1, f2, ms, vol, type, delay) {
    if (!soundOn) return;
    try {
      const a = ctx(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (delay || 0) / 1000;
      o.type = type || "square"; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + ms / 1000);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + ms / 1000 + 0.01);
    } catch (e) { soundOn = false; }
  }
  // A short burst of noise: a keyboard click.
  function click(vol) {
    if (!soundOn) return;
    try {
      const a = ctx(), n = Math.floor(a.sampleRate * 0.012), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
      f.type = "highpass"; f.frequency.value = 1800; g.gain.value = vol;
      src.buffer = buf; src.connect(f); f.connect(g); g.connect(a.destination); src.start();
    } catch (e) { soundOn = false; }
  }
  function dataTick(step) {  // typing click plus a quick two-note digital chirp
    click(0.12);
    const base = 700 + ((step * 337) % 1500);
    blip(base, base * 1.6, 35, 0.045, "square");
    if (step % 3 === 0) blip(base * 2, base * 2.6, 22, 0.03, "square", 40);
  }
  const alarm = () => { blip(900, 300, 220, 0.12, "sawtooth"); blip(900, 300, 220, 0.12, "sawtooth", 260); };
  const complete = () => { blip(500, 1000, 120, 0.1, "square"); blip(800, 1600, 120, 0.1, "square", 130); blip(1200, 2400, 260, 0.1, "square", 260); };

  function add(text, cls) {
    const row = document.createElement("div");
    row.textContent = text; if (cls) row.className = cls;
    body.querySelectorAll(".cursor").forEach(c => c.classList.remove("cursor"));
    row.classList.add("cursor");
    body.appendChild(row);
    while (body.children.length > 30) body.removeChild(body.firstChild);
  }

  function play() {
    clearInterval(timer); body.textContent = ""; run++;
    let files = 0, threats = 0, step = 0;
    filesEl.textContent = "files checked: 0"; foundEl.textContent = "threats: 0";
    blip(200, 1800, 450, 0.08, "sawtooth");  // boot-up sweep
    add("> INITIALISING SCAN ENGINE ...");
    add("> TARGETS: C:\\  D:\\", "dim");
    add("> READ-ONLY MODE: nothing is changed or deleted", "dim");
    const total = 70, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function tick() {
      step++; files += 137 + (step * 53) % 211;
      const path = pick(dirs, step * 3) + "\\" + pick(names, step * 7);
      if (step === 24 || step === 51) {
        threats++; add("[ !! ] THREAT: " + path.replace(/[^\\]+$/, "invoice_scan.exe") + "  (known malware sample)", "bad");
        alarm();
      } else if (step === 38) {
        add("[ !! ] DAMAGED: " + path.replace(/[^\\]+$/, "holiday.mp4") + "  (file is cut off)", "warn");
      } else { add("[ OK ] " + path); dataTick(step); }
      filesEl.textContent = "files checked: " + files.toLocaleString("en-US"); foundEl.textContent = "threats: " + threats;
      if (step >= total) {
        clearInterval(timer);
        add("> SCAN COMPLETE"); add("> files checked: " + files.toLocaleString("en-US") + "   threats: " + threats + "   corrupted: 1", "dim");
        complete();
      }
    }
    if (reduce) { for (let i = 0; i < total; i++) tick(); } else { timer = setInterval(tick, 90); }
  }

  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn; soundBtn.setAttribute("aria-pressed", String(soundOn));
    if (soundOn) { blip(600, 2000, 160, 0.1, "square"); }
  });
  replayBtn.addEventListener("click", play);
  let started = false;
  new IntersectionObserver((entries, obs) => entries.forEach(e => {
    if (e.isIntersecting && !started) { started = true; play(); obs.disconnect(); }
  }), { threshold: 0.35 }).observe(document.getElementById("term"));
})();
}
