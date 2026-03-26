const JIKAN='https://api.jikan.moe/v4';
const ANIWATCH="https://hi-api.vercel.app/api/v2/hianime";
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function jikanFetch(e){const r=await fetch(`${JIKAN}${e}`);if(!r.ok)throw new Error(r.status);return r.json();}
async function aniwatchFetch(e){const url=encodeURIComponent(`${ANIWATCH}${e}`);const r=await fetch(`/api/proxy?url=${url}`);if(!r.ok)throw new Error(r.status);return r.json();}
let allTrending=[],currentAnime=null;
const navbar=document.getElementById('navbar');
window.addEventListener('scroll',()=>navbar.classList.toggle('scrolled',window.scrollY>50));
const hamburger=document.getElementById('hamburger');
const navLinks=document.getElementById('navLinks');
hamburger.addEventListener('click',()=>{hamburger.classList.toggle('open');navLinks.classList.toggle('mobile-open');});
document.addEventListener('click',e=>{if(!navbar.contains(e.target)){hamburger.classList.remove('open');navLinks.classList.remove('mobile-open');}});
const searchToggle=document.getElementById('searchToggle');
const searchOverlay=document.getElementById('searchOverlay');
const searchInput=document.getElementById('searchInput');
searchToggle.addEventListener('click',()=>{searchOverlay.classList.add('open');setTimeout(()=>searchInput.focus(),100);});
document.getElementById('searchClear').addEventListener('click',()=>{searchInput.value='';document.getElementById('searchResults').innerHTML='';searchOverlay.classList.remove('open');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){searchOverlay.classList.remove('open');closeModal();}});
let searchTimer;
searchInput.addEventListener('input',()=>{
  clearTimeout(searchTimer);
  const q=searchInput.value.trim();
  if(!q){document.getElementById('searchResults').innerHTML='';return;}
  searchTimer=setTimeout(async()=>{
    document.getElementById('searchResults').innerHTML='<p class="search-no-results">Searching...</p>';
    try{
      const data=await jikanFetch(`/anime?q=${encodeURIComponent(q)}&limit=8&sfw=true`);
      if(!data.data?.length){document.getElementById('searchResults').innerHTML='<p class="search-no-results">No results found</p>';return;}
      document.getElementById('searchResults').innerHTML=data.data.map(a=>`<div class="search-result-item" data-id="${a.mal_id}"><img src="${a.images?.jpg?.image_url||''}" alt="${a.title}"><div class="search-result-info"><h4>${a.title}</h4><p>${a.year||'N/A'} • ⭐ ${a.score?.toFixed(1)||'N/A'}</p></div></div>`).join('');
      document.querySelectorAll('.search-result-item').forEach(el=>{el.addEventListener('click',()=>{const a=data.data.find(x=>x.mal_id==el.dataset.id);if(a){openModal(a);searchOverlay.classList.remove('open');}});});
    }catch(e){document.getElementById('searchResults').innerHTML='<p class="search-no-results">Search failed.</p>';}
  },400);
});
function createCard(anime,badge=''){
  const img=anime.images?.jpg?.large_image_url||anime.images?.jpg?.image_url||'';
  const title=anime.title_english||anime.title||'Unknown';
  const score=anime.score?`⭐ ${anime.score.toFixed(1)}`:'';
  const eps=anime.episodes?`${anime.episodes} eps`:anime.status||'';
  const card=document.createElement('div');
  card.className='anime-card';
  card.innerHTML=`${badge?`<div class="anime-card-badge">${badge}</div>`:''}<img src="${img}" alt="${title}" loading="lazy"><div class="anime-card-overlay"></div><div class="anime-card-play"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div><div class="anime-card-info"><div class="anime-card-title">${title}</div><div class="anime-card-meta"><span class="anime-card-rating">${score}</span><span>${eps}</span></div></div>`;
  card.addEventListener('click',()=>openModal(anime));
  return card;
}
function createCardH(anime){
  const img=anime.images?.jpg?.image_url||'';
  const title=anime.title_english||anime.title||'Unknown';
  const genres=(anime.genres||[]).slice(0,3).map(g=>`<span class="genre-tag">${g.name}</span>`).join('');
  const card=document.createElement('div');
  card.className='anime-card-h';
  card.innerHTML=`<img src="${img}" alt="${title}" loading="lazy"><div class="anime-card-h-info"><div class="anime-card-h-title">${title}</div><div class="anime-card-h-genres">${genres}</div><div class="anime-card-h-meta">⭐ ${anime.score?.toFixed(1)||'N/A'}</div></div>`;
  card.addEventListener('click',()=>openModal(anime));
  return card;
}
function setHero(anime){
  const img=anime.images?.jpg?.large_image_url||anime.images?.jpg?.image_url||'';
  document.getElementById('heroBg').style.backgroundImage=`url('${img}')`;
  document.getElementById('heroTitle').textContent=anime.title_english||anime.title;
  document.getElementById('heroDesc').textContent=(anime.synopsis||'').replace(/\[Written by MAL Rewrite\]/g,'').trim();
  document.getElementById('heroMeta').innerHTML=`<span class="rating">⭐ ${anime.score?.toFixed(1)||'N/A'}</span><span>📺 ${anime.episodes||'?'} eps</span><span>📅 ${anime.year||'N/A'}</span>`;
  document.getElementById('heroWatchBtn').onclick=()=>openModal(anime);
  document.getElementById('heroInfoBtn').onclick=()=>openModal(anime);
}
document.getElementById('categories').addEventListener('click',e=>{
  const btn=e.target.closest('.category-btn');
  if(!btn)return;
  document.querySelectorAll('.category-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const filter=btn.dataset.genre;
  const grid=document.getElementById('trendingGrid');
  grid.innerHTML='';
  const filtered=filter==='all'?allTrending:allTrending.filter(a=>(a.genres||[]).some(g=>g.name===filter));
  if(!filtered.length){grid.innerHTML='<div class="error-state"><div class="icon">🔍</div><p>No anime for this genre</p></div>';return;}
  filtered.forEach((a,i)=>grid.appendChild(createCard(a,i<3?`#${i+1}`:'')));
});
document.querySelectorAll('.genre-card').forEach(card=>{
  card.addEventListener('click',()=>{
    document.getElementById('trending').scrollIntoView({behavior:'smooth'});
    setTimeout(()=>{const btn=document.querySelector(`.category-btn[data-genre="${card.dataset.genre}"]`);if(btn){document.querySelectorAll('.category-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');btn.click();}},500);
  });
});
function openModal(anime){
  currentAnime=anime;
  const img=anime.images?.jpg?.large_image_url||anime.images?.jpg?.image_url||'';
  const title=anime.title_english||anime.title||'Unknown';
  document.getElementById('modalImage').src=img;
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalMeta').innerHTML=`<span class="rating">⭐ ${anime.score?.toFixed(1)||'N/A'}</span><span>📺 ${anime.episodes||'?'} eps</span><span>📅 ${anime.year||'N/A'}</span><span>${anime.status||''}</span>`;
  document.getElementById('modalGenres').innerHTML=(anime.genres||[]).map(g=>`<span class="genre-tag">${g.name}</span>`).join('');
  document.getElementById('modalDesc').textContent=(anime.synopsis||'No description.').replace(/\[Written by MAL Rewrite\]/g,'').trim();
  document.getElementById('animeModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){document.getElementById('animeModal').classList.remove('open');document.body.style.overflow='';}
document.getElementById('modalClose').addEventListener('click',closeModal);
document.getElementById('animeModal').addEventListener('click',e=>{if(e.target===document.getElementById('animeModal'))closeModal();});
document.getElementById('modalWatchLink').addEventListener('click',()=>{closeModal();openWatchPage(currentAnime);});
async function findAniwatchId(anime){
  const titles=[anime.title_english,anime.title,anime.title_japanese].filter(Boolean);
  for(const q of titles){
    try{
      const data=await aniwatchFetch(`/search?q=${encodeURIComponent(q)}`);
      const results=data.data?.animes||[];
      let match=results.find(a=>a.name.toLowerCase()===q.toLowerCase());
      if(!match)match=results.find(a=>a.name.toLowerCase().includes(q.toLowerCase().substring(0,12)));
      if(!match&&results.length)match=results[0];
      if(match)return match.id;
    }catch(e){}
  }
  return null;
}
async function openWatchPage(anime){
  const title=anime.title_english||anime.title||'';
  const watchPage=document.createElement('div');
  watchPage.id='watchPage';
  watchPage.innerHTML=`<div class="watch-header"><button class="watch-back" id="watchBack">← Back</button><span class="watch-title">${title}</span></div><div class="watch-layout"><div class="watch-main"><div class="watch-player-wrap"><div id="playerContainer" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000;color:#888;font-size:.9rem;">🔍 Finding anime...</div></div><div class="watch-controls"><div class="watch-settings"><label class="watch-toggle"><input type="checkbox" id="autoPlay" checked> Auto Play</label><label class="watch-toggle"><input type="checkbox" id="autoNext" checked> Auto Next</label></div><div class="watch-nav"><button class="watch-nav-btn" id="prevEp">⏮ Prev</button><span class="watch-ep-label">Episode <span id="currentEpLabel">1</span></span><button class="watch-nav-btn" id="nextEp">Next ⏭</button></div></div><div class="watch-servers" id="watchServers"><div style="color:#888;font-size:.85rem;">Loading servers...</div></div></div><div class="watch-sidebar"><div class="sidebar-title">Episodes</div><div class="ep-list" id="epList"><div style="color:#888;font-size:.85rem;padding:1rem;">Loading...</div></div></div></div>`;
  document.body.appendChild(watchPage);
  document.body.style.overflow='hidden';
  document.getElementById('watchBack').addEventListener('click',()=>{watchPage.remove();document.body.style.overflow='';if(window._hls){window._hls.destroy();window._hls=null;}});
  let episodes=[],currentEp=1,currentEpId=null,currentCategory='sub',currentServer='hd-1';
  try{
    const aniwatchId=await findAniwatchId(anime);
    if(!aniwatchId)throw new Error('Not found');
    const epData=await aniwatchFetch(`/anime/${aniwatchId}/episodes`);
    episodes=epData.data?.episodes||[];
    if(!episodes.length)throw new Error('No episodes');
    const epList=document.getElementById('epList');
    epList.innerHTML=episodes.map(ep=>`<button class="ep-btn ${ep.number===1?'active':''}" data-ep="${ep.number}" data-epid="${ep.episodeId}">Ep ${ep.number}</button>`).join('');
    epList.addEventListener('click',e=>{const btn=e.target.closest('.ep-btn');if(btn)loadEpisode(parseInt(btn.dataset.ep),btn.dataset.epid);});
    document.getElementById('watchServers').innerHTML=`<div class="server-group"><div class="server-label"><span class="server-type sub-type">CC</span> SUB:</div><div class="server-btns"><button class="server-btn active" data-server="hd-1" data-cat="sub">MegaCloud</button><button class="server-btn" data-server="hd-2" data-cat="sub">StreamSB</button><button class="server-btn" data-server="vidstreaming" data-cat="sub">Vidstreaming</button></div></div><div class="server-group"><div class="server-label"><span class="server-type dub-type">🎙</span> DUB:</div><div class="server-btns"><button class="server-btn" data-server="hd-1" data-cat="dub">MegaCloud</button><button class="server-btn" data-server="hd-2" data-cat="dub">StreamSB</button><button class="server-btn" data-server="vidstreaming" data-cat="dub">Vidstreaming</button></div></div>`;
    document.getElementById('watchServers').addEventListener('click',e=>{const btn=e.target.closest('.server-btn');if(btn){document.querySelectorAll('.server-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentServer=btn.dataset.server;currentCategory=btn.dataset.cat;loadEpisode(currentEp,currentEpId);}});
    currentEpId=episodes[0]?.episodeId;
    loadEpisode(1,currentEpId);
  }catch(e){
    document.getElementById('playerContainer').innerHTML=`<div style="text-align:center;padding:2rem;color:#888;"><div style="font-size:2rem;">😔</div><p>Could not find on HiAnime</p></div>`;
    document.getElementById('epList').innerHTML='<div style="color:#888;padding:1rem;">Not available</div>';
    document.getElementById('watchServers').innerHTML='';
  }
  async function loadEpisode(epNum,epId){
    currentEp=epNum;currentEpId=epId;
    document.getElementById('currentEpLabel').textContent=epNum;
    document.querySelectorAll('.ep-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.ep)===epNum));
    const activeBtn=document.querySelector('.ep-btn.active');
    if(activeBtn)activeBtn.scrollIntoView({block:'nearest',behavior:'smooth'});
    const container=document.getElementById('playerContainer');
    container.innerHTML=`<div style="color:#888;font-size:.9rem;">⏳ Loading stream...</div>`;
    try{
      const srcData=await aniwatchFetch(`/episode/sources?animeEpisodeId=${encodeURIComponent(epId)}&server=${currentServer}&category=${currentCategory}`);
      const sources=srcData.data?.sources||[];
      const subtitles=srcData.data?.subtitles||[];
      const intro=srcData.data?.intro;
      if(!sources.length)throw new Error('No sources');
      const m3u8="/api/streamm3u8?url="+encodeURIComponent(sources[0].url);
      container.innerHTML=`<video id="animeVideo" style="width:100%;height:100%;background:#000;" controls playsinline></video>`;
      const video=document.getElementById('animeVideo');
      if(!window.Hls){await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/hls.js@latest';s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
      if(window._hls){window._hls.destroy();window._hls=null;}
      if(Hls.isSupported()){
        const hls=new Hls();window._hls=hls;
        hls.loadSource(m3u8);hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED,()=>{if(document.getElementById('autoPlay')?.checked)video.play().catch(()=>{});});
        hls.on(Hls.Events.ERROR,(e,data)=>{if(data.fatal)container.innerHTML=`<div style="text-align:center;padding:2rem;color:#888;"><p>Stream failed. Try another server.</p></div>`;});
      }else if(video.canPlayType('application/vnd.apple.mpegurl')){video.src=m3u8;if(document.getElementById('autoPlay')?.checked)video.play().catch(()=>{});}
      const engSub=subtitles.find(s=>s.lang==='English');
      if(engSub){const track=document.createElement('track');track.kind='subtitles';track.label='English';track.srclang='en';track.src=engSub.url;track.default=true;video.appendChild(track);}
      video.addEventListener('ended',()=>{if(document.getElementById('autoNext')?.checked&&currentEp<episodes.length){const next=episodes[currentEp];if(next)loadEpisode(next.number,next.episodeId);}});
      if(intro&&intro.end>0){
        const skipBtn=document.createElement('button');
        skipBtn.textContent='Skip Intro';
        skipBtn.style.cssText='position:absolute;bottom:60px;right:16px;background:rgba(124,92,191,.9);color:#fff;border:none;padding:.5rem 1rem;border-radius:8px;font-weight:700;font-size:.85rem;cursor:pointer;display:none;z-index:10;font-family:inherit;';
        container.appendChild(skipBtn);
        video.addEventListener('timeupdate',()=>{skipBtn.style.display=(video.currentTime>=intro.start&&video.currentTime<=intro.end)?'block':'none';});
        skipBtn.addEventListener('click',()=>{video.currentTime=intro.end;});
      }
    }catch(e){container.innerHTML=`<div style="text-align:center;padding:2rem;color:#888;"><div style="font-size:2rem;">😔</div><p>Stream unavailable. Try another server.</p></div>`;}
  }
  document.getElementById('prevEp').addEventListener('click',()=>{if(currentEp>1){const ep=episodes[currentEp-2];if(ep)loadEpisode(ep.number,ep.episodeId);}});
  document.getElementById('nextEp').addEventListener('click',()=>{if(currentEp<episodes.length){const ep=episodes[currentEp];if(ep)loadEpisode(ep.number,ep.episodeId);}});
}
async function init(){
  try{const data=await jikanFetch('/top/anime?filter=airing&limit=18');allTrending=data.data||[];const grid=document.getElementById('trendingGrid');grid.innerHTML='';if(allTrending.length){setHero(allTrending[0]);allTrending.forEach((a,i)=>grid.appendChild(createCard(a,i<3?`#${i+1}`:'')));}}catch(e){document.getElementById('trendingGrid').innerHTML='<div class="error-state"><div class="icon">📡</div><p>Could not load anime.</p></div>';}
  await delay(700);
  try{const data=await jikanFetch('/top/anime?filter=bypopularity&limit=12');const grid=document.getElementById('topRatedGrid');grid.innerHTML='';(data.data||[]).forEach(a=>grid.appendChild(createCard(a)));}catch(e){document.getElementById('topRatedGrid').innerHTML='<div class="error-state"><p>Could not load.</p></div>';}
  await delay(700);
  try{const data=await jikanFetch('/seasons/upcoming?limit=12');const grid=document.getElementById('upcomingGrid');grid.innerHTML='';(data.data||[]).slice(0,10).forEach(a=>grid.appendChild(createCardH(a)));}catch(e){document.getElementById('upcomingGrid').innerHTML='<div class="error-state"><p>Could not load.</p></div>';}
}
init();
