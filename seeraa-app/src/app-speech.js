/* Seeraa Quest app only: Android's in-app browser has no text-to-speech, so "Listen",
   the Arabic and Meaning buttons and memorising would be silent. This gives the page the
   same speechSynthesis it uses on the web, spoken by the phone's own voice
   (@capacitor-community/text-to-speech). iPhones and the website keep their built-in speech. */
(function () {
  var C = window.Capacitor, TTS = C && C.Plugins && C.Plugins.TextToSpeech;
  if (!TTS) return;
  /* on Android always use the phone's voice: the in-app browser may show speechSynthesis but never speaks */
  var android = typeof C.getPlatform === 'function' && C.getPlatform() === 'android';
  if (!android && window.speechSynthesis && window.SpeechSynthesisUtterance) return;
  function Utterance(text) {
    this.text = text == null ? '' : String(text);
    this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null;
    this.onstart = null; this.onend = null; this.onerror = null; this.onboundary = null; this.onpause = null; this.onresume = null; this.onmark = null;
  }
  Utterance.prototype.addEventListener = function (type, fn) { this['on' + type] = fn; };
  Utterance.prototype.removeEventListener = function (type) { this['on' + type] = null; };
  var queue = [], current = null, run = 0;
  function fire(u, type, extra) { var f = u && u['on' + type]; if (typeof f === 'function') { try { f.call(u, Object.assign({ type: type, utterance: u }, extra || {})); } catch (e) { setTimeout(function () { throw e; }); } } }
  function next() {
    if (current || !queue.length) return;
    var u = current = queue.shift(), mine = ++run;
    fire(u, 'start');
    TTS.speak({ text: u.text, lang: u.lang || 'en-US', rate: Math.max(0.1, Math.min(2, Number(u.rate) || 1)), pitch: Number(u.pitch) || 1, volume: u.volume == null ? 1 : Number(u.volume), category: 'playback' })
      .then(function () { if (mine !== run) return; current = null; fire(u, 'end'); next(); },
            function (err) { if (mine !== run) return; current = null; fire(u, 'error', { error: String(err && err.message || err) }); next(); });
  }
  var synth = {
    speak: function (u) { queue.push(u); next(); },
    cancel: function () {
      var u = current; queue.length = 0; current = null; run++;
      TTS.stop().catch(function () {});
      if (u) fire(u, 'error', { error: 'interrupted' });
    },
    pause: function () {}, resume: function () {},
    getVoices: function () { return []; },
    get speaking() { return !!current; }, get pending() { return queue.length > 0; }, get paused() { return false; },
    onvoiceschanged: null, addEventListener: function () {}, removeEventListener: function () {}
  };
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: Utterance, configurable: true, writable: true });
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
})();
