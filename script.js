const scene=document.querySelector('.scene');
const greeting=document.querySelector('#greeting');
const replay=document.querySelector('#replay');
const musicToggle=document.querySelector('#music-toggle');
const giftIntro=document.querySelector('#gift-intro');
const giftTrigger=document.querySelector('#gift-trigger');
const giftInstruction=document.querySelector('.gift-instruction');
let audio;
let musicGain;
let musicMuted=false;
let timers=[];
let musicLoopTimer;
let musicStarted=false;
let musicPausedForPage=false;
const activeTones=new Set();
function animate(){
  timers.forEach(clearTimeout);timers=[];
  scene.classList.remove('approaching','moving','speaking','kissing','done');
  scene.classList.add('resetting');
  greeting.classList.remove('visible');replay.classList.remove('visible');
  void scene.offsetWidth;
  requestAnimationFrame(()=>{
    scene.classList.remove('resetting');
    void scene.offsetWidth;
    requestAnimationFrame(()=>{
      scene.classList.add('approaching','moving');
      timers.push(setTimeout(()=>scene.classList.add('speaking'),4200));
      timers.push(setTimeout(()=>{scene.classList.remove('moving','speaking');scene.classList.add('kissing')},6200));
      timers.push(setTimeout(()=>{scene.classList.add('done');greeting.classList.add('visible');replay.classList.add('visible')},9000));
    });
  });
}
const phraseA=[523,659,784,659,523,659,880,784,698,784,880,1047,880,784,698,659,523,659,784,1047,880,784,659,523,587,698,880,698,659,587,523,392];
const phraseB=[523,659,784,988,880,784,659,523,587,698,880,1047,988,880,698,587,659,784,988,784,698,659,523,659,698,880,1047,880,784,659,523,523];
const phraseC=[392,523,659,784,698,659,523,392,440,587,698,880,784,698,587,440,523,659,784,880,1047,880,784,659,698,784,880,698,659,587,523,523];
const melody=[...phraseA,...phraseB,...phraseC];
const beat=.28;
const loopLength=melody.length*beat;
function scheduleLoop(startAt){
  if(!audio||audio.state!=='running')return;
  melody.forEach((frequency,index)=>{
    const start=startAt+index*beat;
    const oscillator=audio.createOscillator(),gain=audio.createGain();
    activeTones.add(oscillator);oscillator.addEventListener('ended',()=>activeTones.delete(oscillator),{once:true});
    oscillator.type='square';oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(.022,start);
    gain.gain.exponentialRampToValueAtTime(.001,start+.23);
    oscillator.connect(gain).connect(musicGain);
    oscillator.start(start);oscillator.stop(start+.24);
    if(index%4===0){
      const bass=audio.createOscillator(),bassGain=audio.createGain();
      activeTones.add(bass);bass.addEventListener('ended',()=>activeTones.delete(bass),{once:true});
      bass.type='triangle';bass.frequency.value=frequency/2;
      bassGain.gain.setValueAtTime(.012,start);
      bassGain.gain.exponentialRampToValueAtTime(.001,start+.32);
      bass.connect(bassGain).connect(musicGain);
      bass.start(start);bass.stop(start+.33);
    }
  });
  musicLoopTimer=setTimeout(()=>scheduleLoop(Math.max(startAt+loopLength,audio.currentTime+.08)),Math.max(250,(loopLength-1)*1000));
}
async function startMusic(){
  if(musicStarted)return;
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass){giftInstruction.textContent='este navegador nao reproduz a musiquinha';return;}
  try{
    if(!audio)audio=new AudioContextClass();
    if(audio.state==='suspended')await audio.resume();
    if(musicStarted)return;
    if(audio.state!=='running')return;
    musicGain=audio.createGain();
    musicGain.gain.value=musicMuted?0:1;
    musicGain.connect(audio.destination);
    musicStarted=true;
    scheduleLoop(audio.currentTime+.08);
  }catch(error){giftInstruction.textContent='nao foi possivel iniciar a musica';}
}
function pauseMusicForPage(){
  if(!audio||!musicStarted||musicPausedForPage)return;
  musicPausedForPage=true;
  clearTimeout(musicLoopTimer);musicLoopTimer=undefined;
  activeTones.forEach(tone=>{try{tone.stop()}catch(error){}});
  activeTones.clear();
  void audio.suspend().catch(()=>{});
}
async function resumeMusicForPage(){
  if(!musicPausedForPage||!musicStarted||!audio||document.hidden)return;
  musicPausedForPage=false;
  try{
    await audio.resume();
    if(document.hidden){musicPausedForPage=true;return;}
    scheduleLoop(audio.currentTime+.08);
  }catch(error){musicPausedForPage=true;}
}
document.addEventListener('visibilitychange',()=>document.hidden?pauseMusicForPage():void resumeMusicForPage());
window.addEventListener('pagehide',pauseMusicForPage);
window.addEventListener('pageshow',()=>void resumeMusicForPage());
musicToggle.addEventListener('click',()=>{
  musicMuted=!musicMuted;
  if(audio&&musicGain)musicGain.gain.setTargetAtTime(musicMuted?0:1,audio.currentTime,.04);
  musicToggle.textContent=musicMuted?'♫ ativar som':'♫ silenciar';
  musicToggle.setAttribute('aria-label',musicMuted?'Ativar música':'Silenciar música');
});
giftTrigger.addEventListener('click',()=>{
  giftTrigger.disabled=true;
  giftTrigger.blur();
  void startMusic();
  giftIntro.classList.add('opening');
  giftInstruction.textContent='abrindo sua surpresa...';
  setTimeout(()=>{
    giftIntro.classList.add('dismissed');
    animate();
  },1000);
});
replay.addEventListener('click',animate);
