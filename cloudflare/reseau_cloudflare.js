/* chasm. sur Cloudflare : imite dans la page la base de données partagée des pages Claude
 * (window.claude.use('db') / use('user')), en parlant au Worker (/api/...).
 * La logique du jeu et du classement reste identique à la version Claude. */
(function(){
  const API='/api';
  const CF={state:{tour:1,res:[]},subs:[],err:'',ok:false};
  const code=()=>{try{return localStorage.getItem('chasm_admin')||''}catch(e){return ''}};
  async function call(method,path,body){
    const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json','X-Admin':code()},body:body?JSON.stringify(body):undefined,cache:'no-store'});
    if(r.status===401){CF.err='Code animateur manquant ou incorrect.';redraw();throw new Error('code')}
    if(!r.ok)throw new Error('http '+r.status);
    CF.err='';return r.json();
  }
  function redraw(){try{if(typeof drawDash==='function'&&location.hash==='#classement')drawDash()}catch(e){}}
  async function poll(){
    try{const s=await call('GET','/etat');const j=JSON.stringify(s);if(j===CF.last&&CF.ok)return;CF.last=j;CF.state=s;CF.ok=true;CF.subs.forEach(f=>{try{f()}catch(e){}})}catch(e){}
  }
  setInterval(poll,2000);poll();
  const snapDoc=v=>({exists:true,data:()=>v,metadata:{fromCache:false}});
  const db={
    doc(path){
      if(path!=='tournoi/config')throw new TypeError('chemin non géré');
      return{
        onSnapshot(cb){const f=()=>cb(snapDoc({tour:CF.state.tour}));CF.subs.push(f);if(CF.ok)f();return()=>{CF.subs=CF.subs.filter(x=>x!==f)}},
        async set(v){const s=await call('POST','/tour',{tour:v.tour});CF.state=s;CF.subs.forEach(f=>f())}
      };
    },
    collection(path){
      if(path!=='resultats')throw new TypeError('chemin non géré');
      const col={
        limit(){return col},
        onSnapshot(cb){const f=()=>cb({docs:CF.state.res.map(r=>({id:r.id,exists:true,data:()=>r})),metadata:{fromCache:false}});CF.subs.push(f);if(CF.ok)f();return()=>{CF.subs=CF.subs.filter(x=>x!==f)}},
        async add(v){const s=await call('POST','/resultats',v);CF.state=s;CF.subs.forEach(f=>f());return{id:''}},
        doc(id){return{async delete(){const s=await call('DELETE','/resultats/'+encodeURIComponent(id));CF.state=s;CF.subs.forEach(f=>f())}}}
      };
      return col;
    }
  };
  const user={async isOwner(){return true},async id(){return 'cf'}};
  window.claude={use:async n=>n==='db'?db:n==='user'?user:null};
  // champ « code animateur » dans le panneau ⚙️ du classement
  window.__cfType=v=>{CF.typed=v};
  window.CHASM_ADMIN_UI=()=>`<div class="arow"><span>🔑 Code animateur</span><input id="admCode" type="password" value="${(CF.typed!=null?CF.typed:code()).replace(/"/g,'')}" oninput="window.__cfType(this.value)" placeholder="code" style="width:140px;font-size:16px;padding:8px"><button class="abtn" onclick="try{localStorage.setItem('chasm_admin',document.getElementById('admCode').value.trim())}catch(e){};this.textContent='✓ Enregistré'">Enregistrer</button>${CF.err?`<b style="color:#e63946">${CF.err}</b>`:''}</div>`;
})();
