(() => {
  'use strict';
  if(document.getElementById('kabezya-chat')) return;
  const API='https://backend-1-9b6f.onrender.com/api/support/public';
  const host=document.createElement('div'); host.id='kabezya-chat';
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>
    :host{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:1000;font:14px/1.5 Arial,sans-serif;color:#102341}
    *{box-sizing:border-box}[hidden]{display:none!important}button,input,textarea{font:inherit}button,a,input,textarea{outline-offset:3px}button{cursor:pointer}button:disabled{opacity:.6;cursor:wait}
    .launcher{border:0;border-radius:40px;background:#155ee9;color:white;box-shadow:0 6px 24px #071a3d30;display:flex;align-items:center;gap:9px;padding:7px 17px 7px 7px;font-weight:700}.launcher img{width:42px;height:42px;border-radius:50%}
    .panel{width:min(380px,calc(100vw - 32px));height:min(620px,calc(100dvh - 100px));display:flex;flex-direction:column;background:white;border:1px solid #dce5ef;border-radius:22px;box-shadow:0 12px 55px #071a3d30;overflow:hidden;margin-bottom:10px}
    header{display:flex;align-items:center;gap:10px;padding:14px;background:#eef8ff;border-bottom:1px solid #e1e9f1}header img{width:40px;height:40px;border-radius:50%}header strong,header small{display:block}header small{font-size:11px;color:#56657b}.close{margin-left:auto;border:0;background:none;font-size:25px;color:#102341;min-width:38px;min-height:38px}
    .body{flex:1;min-height:0;overflow:auto;padding:14px;overscroll-behavior:contain}.message{white-space:pre-wrap;overflow-wrap:anywhere;padding:11px 13px;border-radius:15px;background:#f1f5fa;margin:0 0 10px}.user{background:#155ee9;color:white;margin-left:25px}.notice{font-size:12px;color:#526176;margin:9px 0}nav{display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px;border-top:1px solid #edf1f5}nav a,nav button{font-size:12px;color:#1556b6;background:none;border:0;padding:0;text-decoration:underline}
    .composer{display:flex;align-items:flex-end;gap:8px;border:1px solid #d5dfeb;border-radius:22px;margin:0 12px 12px;padding:7px}.composer textarea{resize:none;border:0;background:none;min-width:0;width:100%;max-height:110px;padding:8px;color:#102341}.send{border:0;background:#155ee9;color:white;border-radius:50%;width:38px;height:38px;flex:none;font-size:23px}
    label{display:block;margin-bottom:11px;font-size:13px}input:not([type=checkbox]),.ticket textarea{display:block;width:100%;border:1px solid #c9d5e3;border-radius:9px;padding:9px;margin-top:4px}.ticket textarea{min-height:90px;resize:vertical}.primary{border:0;border-radius:10px;background:#155ee9;color:white;padding:10px 14px}.secondary{border:1px solid #c9d5e3;background:white;color:#102341;border-radius:10px;padding:10px}.trap{display:none}.receipt{overflow-wrap:anywhere}.status{white-space:pre-wrap;overflow-wrap:anywhere;color:#465971;font-size:12px;padding:0 14px 8px;margin:0}
  </style>
  <section class="panel" id="panel" role="dialog" aria-label="Kabezya AI chat" hidden>
    <header><img src="images/kabezya-prince.webp" alt=""><div><strong>Kabezya AI</strong><small>AIFT virtual assistant</small></div><button class="close" aria-label="Close chat">×</button></header>
    <div class="body"><div id="messages" role="log" aria-live="polite"></div>
      <form class="ticket" id="ticket" hidden><h3>Create a support ticket</h3><p class="notice">Your details and issue go to AIFT Admin. Do not include passwords or sensitive documents.</p>
      <label>Name<input name="name" autocomplete="name" maxlength="120" required></label><label>Email<input name="email" type="email" autocomplete="email" maxlength="180" required></label>
      <label>Your issue<textarea name="message" minlength="10" maxlength="5000" required></textarea></label>
      <label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
      <label><input type="checkbox" name="includeConversation"> Include this chat to help explain the issue</label>
      <button class="primary" type="submit">Submit ticket</button> <button class="secondary" type="button" id="cancel">Back to chat</button></form>
      <div class="receipt" id="receipt" hidden aria-live="polite"></div>
    </div>
    <nav aria-label="Chat help"><a href="founder.html">Meet the founder</a><a href="kabezya-ai.html">Travel guide</a><button id="create">Create a ticket</button><button id="check" hidden>Check ticket</button><button id="new">New chat</button></nav>
    <p id="status" class="status" role="status"></p>
    <form class="composer"><textarea aria-label="Your question" rows="1" maxlength="2000" placeholder="Ask about AIFT…" required></textarea><button class="send" type="submit" aria-label="Send question">↑</button></form>
  </section><button class="launcher" aria-expanded="false" aria-controls="panel"><img src="images/kabezya-prince.webp" alt="">Ask Kabezya</button>`;
  document.body.append(host);
  const $=s=>root.querySelector(s), history=[];
  let receipt=null, busy=false;
  try { const saved=JSON.parse(sessionStorage.getItem('aiftPublicTicket') || 'null'); if(saved?.id && /^[a-f0-9]{64}$/.test(saved.accessToken)) receipt=saved; } catch {}
  $('#check').hidden=!receipt;
  function message(text,role='assistant'){const p=document.createElement('p');p.className='message '+role;p.textContent=text;$('#messages').append(p);$('.body').scrollTop=$('.body').scrollHeight;}
  function greeting(){message('Hi, I’m Kabezya, AIFT’s AI assistant. Ask me about AIFT, its founder, learning or travel. If something is not working, I can help you submit a support ticket.');}
  function view(which){$('#messages').hidden=which!=='chat';$('#ticket').hidden=which!=='ticket';$('#receipt').hidden=which!=='receipt';$('.composer').hidden=which!=='chat';$('#status').textContent='';}
  function open(value){$('#panel').hidden=!value;$('.launcher').setAttribute('aria-expanded',String(value));if(value) (root.querySelector('#ticket:not([hidden]) input') || root.querySelector('.composer:not([hidden]) textarea') || $('.close')).focus();else $('.launcher').focus();}
  $('.launcher').onclick=()=>open($('#panel').hidden);$('.close').onclick=()=>open(false);
  root.addEventListener('keydown',e=>{if(e.key==='Escape')open(false);});
  async function request(path,options={}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),40000);
    try {const response=await fetch(API+path,{...options,signal:controller.signal});const data=await response.json().catch(()=>({}));if(!response.ok || data.success===false)throw Error(data.message || 'Unable to connect. Please try again.');return data;}
    catch(error){if(error.name==='AbortError')throw Error('The request took too long. Please try again.');throw error;}
    finally{clearTimeout(timer);}
  }
  $('.composer').onsubmit=async e=>{
    e.preventDefault();const input=$('.composer textarea'),text=input.value.trim();if(!text || busy)return;
    busy=true;$('.send').disabled=true;message(text,'user');input.value='';$('#status').textContent='Kabezya is thinking…';
    try {const data=await request('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:history.slice(-12)})});if(typeof data.reply!=='string'||!data.reply.trim())throw Error('No response received. Please try again.');history.push({role:'user',content:text},{role:'assistant',content:data.reply});message(data.reply);$('#status').textContent='';}
    catch(error){$('#status').textContent=error.message;input.value=text;}
    finally{busy=false;$('.send').disabled=false;}
  };
  $('.composer textarea').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('.composer').requestSubmit();}});
  $('#create').onclick=()=>{view('ticket');$('#ticket input').focus();};$('#cancel').onclick=()=>view('chat');
  $('#new').onclick=()=>{if(busy)return;history.length=0;$('#messages').replaceChildren();view('chat');greeting();};
  $('#ticket').onsubmit=async e=>{
    e.preventDefault();const form=e.currentTarget,button=form.querySelector('[type=submit]');if(button.disabled)return;button.disabled=true;$('#status').textContent='Saving your ticket…';
    const fields=new FormData(form);
    try {const data=await request('/tickets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:fields.get('name'),email:fields.get('email'),message:fields.get('message'),website:fields.get('website'),page:location.pathname,includeConversation:fields.has('includeConversation'),conversation:history.slice(-12)})});
      if(!data.ticket?.id || !data.accessToken)throw Error('A ticket confirmation was not received. Please check before submitting again.');
      receipt={...data.ticket,accessToken:data.accessToken};try{sessionStorage.setItem('aiftPublicTicket',JSON.stringify(receipt));}catch{}
      $('#check').hidden=false;view('receipt');$('#receipt').textContent='Ticket '+receipt.ticketNumber+' was saved for AIFT Admin. Use Check ticket here to read replies. Keep this browser tab open; closing it may remove your private receipt. Email notifications are not sent automatically.';form.reset();
    }catch(error){$('#status').textContent=error.message;}
    finally{button.disabled=false;}
  };
  $('#check').onclick=async()=>{if(!receipt)return;view('receipt');$('#receipt').textContent='Checking your ticket…';try{const data=await request('/tickets/'+encodeURIComponent(receipt.id),{headers:{Authorization:'Bearer '+receipt.accessToken}});$('#receipt').textContent=data.ticket.ticketNumber+' · '+data.ticket.status.replaceAll('_',' ')+'\n\n'+(data.ticket.replies.length?data.ticket.replies.map(r=>'AIFT support: '+r.message).join('\n\n'):'No reply yet. Please check again later.');}catch(error){$('#receipt').textContent=error.message;}};
  greeting();
})();
