// Simple WebAudio SFX (no external files required).
// If you prefer mp3 files, replace play() to use <audio> tags with click.mp3 / correct.mp3 / incorrect.mp3
const SFX = (() => {
  let ctx;
  function ensure(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function tone(freq=440, dur=0.08, type='sine', gain=0.2){
    ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); }, dur*1000);
  }
  const playMap = {
    click(){ tone(600, 0.05, 'square', 0.15) },
    correct(){ tone(880, 0.08, 'sine', 0.22); setTimeout(()=>tone(1200,0.08,'sine',0.18), 80) },
    incorrect(){ tone(220, 0.12, 'sawtooth', 0.2); setTimeout(()=>tone(180,0.14,'sawtooth',0.18), 140) },
  };
  function enabled(){ try{ return JSON.parse(localStorage.getItem('100s_sfx')) ?? true }catch{return true} }
  return {
    play(which){ if(!enabled()) return; (playMap[which]||playMap.click)(); },
    enabled,
  };
})();