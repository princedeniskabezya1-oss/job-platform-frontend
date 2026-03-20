/* ================================
   GLOBAL FEED SYSTEM (AIFT)
================================ */

async function loadFeed(token, containerId){

  const container = document.getElementById(containerId);
  container.innerHTML = "<p style='color:#6f6f6f;'>Loading feed...</p>";

  try{

    const res = await fetch(API+"/api/posts",{
      headers:{ Authorization:"Bearer "+token }
    });

    const posts = res.ok ? await res.json() : [];

    if(posts.length === 0){
      container.innerHTML = "<p style='color:#6f6f6f;'>No posts yet.</p>";
      return;
    }

    container.innerHTML = "";

    posts.forEach(post=>{

      const liked = post.likes?.includes(localStorage.getItem("userId"));

      container.innerHTML += `
      <div class="card" id="post-${post._id}">

        <div class="post-header">
          <div class="post-author" onclick="visitProfile('${post.author?._id}')">
            <img src="${post.author?.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
            <div>
              <div style="font-weight:600;">${post.author?.name}</div>
              <div style="font-size:12px;color:#6f6f6f;">
                ${post.author?.headline || ""}
              </div>
            </div>
          </div>
        </div>

        ${post.content ? `<div class="post-content">${post.content}</div>` : ""}

        ${post.mediaUrl ? `
          <div class="post-media">
            ${post.mediaType==="video"
              ? `<video controls src="${post.mediaUrl}"></video>`
              : `<img src="${post.mediaUrl}">`}
          </div>
        ` : ""}

        <div class="post-stats">
          <div id="likes-${post._id}">${post.likes.length} reactions</div>
          <div>${post.comments.length} comments</div>
        </div>

        <div class="post-actions">

          <div class="post-action ${liked ? "liked" : ""}"
               onclick="likePostFeed('${post._id}', this)">
            ❤️ <span>Like</span>
          </div>

          <div class="post-action"
               onclick="toggleComments('${post._id}')">
            💬 <span>Comment</span>
          </div>

          <div class="post-action"
               onclick="sharePost('${post._id}')">
            🔁 <span>Share</span>
          </div>

        </div>

        <div class="comments-wrapper"
             id="comments-wrapper-${post._id}"
             style="display:none;">

          <div class="comment-input-area">
            <input type="text"
                   placeholder="Write a comment..."
                   onkeydown="if(event.key==='Enter'){ submitCommentFeed('${post._id}', this.value); this.value=''; }">
          </div>

          <div id="comments-${post._id}" style="margin-top:10px;"></div>

        </div>

      </div>
      `;
    });

  }catch(err){
    console.error("Feed error:",err);
    container.innerHTML = "<p>Error loading feed</p>";
  }
}

/* ================================
   LIKE SYSTEM
================================ */

async function likePostFeed(postId, element){

  const res = await fetch(API+"/api/posts/"+postId+"/like",{
    method:"PATCH",
    headers:{ Authorization:"Bearer "+token }
  });

  const data = await res.json();

  const likeText = document.getElementById("likes-"+postId);

  if(likeText){
    likeText.innerText = data.likes + " reactions";
  }

  if(element){
    element.classList.toggle("liked", data.liked);
  }
}

/* ================================
   COMMENT TOGGLE
================================ */

function toggleComments(postId){

  const wrapper = document.getElementById("comments-wrapper-"+postId);

  if(wrapper.style.display === "none"){
    wrapper.style.display = "block";
    loadCommentsFeed(postId);
  }else{
    wrapper.style.display = "none";
  }
}

/* ================================
   LOAD COMMENTS
================================ */

async function loadCommentsFeed(postId){

  const res = await fetch(API+"/api/posts/"+postId,{
    headers:{ Authorization:"Bearer "+token }
  });

  const post = await res.json();
  const container = document.getElementById("comments-"+postId);

  container.innerHTML = "";

  post.comments.forEach(c=>{

    container.innerHTML += `
      <div style="display:flex;gap:10px;margin-top:12px;">

        <img src="${c.user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}"
             style="width:32px;height:32px;border-radius:50%;">

        <div style="flex:1;">

          <div style="background:#f3f2ef;padding:8px 12px;border-radius:12px;">
            <strong>${c.user?.name}</strong><br>
            ${c.text}
          </div>

          <div style="font-size:12px;margin-top:4px;color:#0a66c2;cursor:pointer;"
               onclick="showReplyInput('${postId}','${c._id}')">
            Reply
          </div>

          <div id="reply-input-${c._id}"></div>
          <div id="replies-${c._id}" style="margin-left:20px;"></div>

        </div>

      </div>
    `;

    // LOAD REPLIES
    if(c.replies && c.replies.length > 0){

      const repliesContainer = document.getElementById("replies-"+c._id);

      c.replies.forEach(r=>{
        repliesContainer.innerHTML += `
          <div style="display:flex;gap:8px;margin-top:6px;">
            <img src="${r.user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}"
                 style="width:28px;height:28px;border-radius:50%;">
            <div style="background:#f3f2ef;padding:6px 10px;border-radius:10px;">
              <strong>${r.user?.name}</strong><br>
              ${r.text}
            </div>
          </div>
        `;
      });

    }

  });

}

/* ================================
   ADD COMMENT
================================ */

async function submitCommentFeed(postId, text){

  if(!text.trim()) return;

  await fetch(API+"/api/posts/"+postId+"/comment",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:"Bearer "+token
    },
    body:JSON.stringify({ text })
  });

  loadCommentsFeed(postId);
}

/* ================================
   REPLY SYSTEM
================================ */

function showReplyInput(postId, commentId){

  const container = document.getElementById("reply-input-"+commentId);

  if(container.innerHTML !== ""){
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div style="margin-top:8px;display:flex;gap:8px;">
      <input type="text"
             id="replyInput-${commentId}"
             placeholder="Write a reply..."
             style="flex:1;padding:6px 10px;border-radius:20px;border:1px solid #ddd;">
      <button onclick="submitReplyFeed('${postId}','${commentId}')">
        Reply
      </button>
    </div>
  `;
}

async function submitReplyFeed(postId, commentId){

  const input = document.getElementById("replyInput-"+commentId);
  const text = input.value.trim();

  if(!text) return;

  await fetch(API+"/api/posts/"+postId+"/comment/"+commentId+"/reply",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:"Bearer "+token
    },
    body:JSON.stringify({ text })
  });

  loadCommentsFeed(postId);
}
