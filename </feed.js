/* ================================
   GLOBAL FEED SYSTEM (AIFT)
================================ */
const token = localStorage.getItem("token");
async function loadFeed(page = 1){

  if(noMorePosts) return;

  const res = await fetch(API+"/api/posts?page="+page,{
    headers:{ Authorization:"Bearer "+token }
  });

  const posts = res.ok ? await res.json() : [];
  const container = document.getElementById("posts");

  if(page === 1){
    container.innerHTML = "";
    noMorePosts = false;
  }

  if(posts.length < 5){
    noMorePosts = true;
  }

  posts.forEach(post=>{
const isFollowing = (post.author?.followers || []).some(
  id => String(id) === String(localStorage.getItem("userId"))
);
    const liked = post.likes?.some(
  id => id.toString() === localStorage.getItem("userId")
);

    container.innerHTML += `
      <div class="card" id="post-${post._id}">

       <div class="post-header">

<div class="post-author" onclick="visitProfile('${post.author?._id}')">

<img src="${post.author?.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">

<div>
  <div style="font-weight:600;">${post.author?.name}</div>

  <div class="post-meta">
    ${post.author?.headline || ""}
  </div>

  <div style="font-size:12px;color:#6f6f6f;">
    ${(post.author?.followers?.length || 0)} followers • ${formatTime(post.createdAt)}
  </div>
</div>

</div>

<div style="display:flex;align-items:center;gap:10px;">

${
String(post.author?._id) !== String(localStorage.getItem("userId"))
? `<button class="follow-btn"
onclick="followFromFeed('${post.author._id}', this)"
data-user="${post.author._id}">
${isFollowing ? "Following" : "Follow"}
</button>`
: ""
}

<div class="dropdown">

<div onclick="toggleDropdown('${post._id}', event)" style="cursor:pointer;">•••</div>

<div class="dropdown-menu" id="dropdown-${post._id}">
${
post.author?._id === localStorage.getItem("userId")
? `
<div onclick="editPost('${post._id}')">Edit</div>
<div onclick="deletePost('${post._id}')">Delete</div>
<div onclick="savePost('${post._id}')">Save</div>
<div onclick="hidePost('${post._id}')">Hide</div>
<div onclick="reportPost('${post._id}')">Report</div>
`
: `
<div onclick="savePost('${post._id}')">Save</div>
<div onclick="openShareModal('${post._id}')">Share</div>
<div onclick="markInterested('${post._id}')">Interested</div>
<div onclick="hidePost('${post._id}')">Hide</div>
<div onclick="reportPost('${post._id}')">Report</div>
`
}
</div>
</div>

</div>
</div>  <!-- CLOSE post-header -->

${post.content ? `<div class="post-content">${post.content}</div>` : ""}

        ${post.mediaUrl ? `
          <div class="post-media">
            ${post.mediaType==="video"
              ? `<video controls src="${post.mediaUrl}"></video>`
              : `<img src="${post.mediaUrl}">`}
          </div>
        ` : ""}

        <div class="post-stats">
  <div>${post.likes.length} reactions</div>
  <div style="cursor:pointer;"
     onclick="toggleCommentBox('${post._id}')">
  ${post.comments.reduce((total,c)=> total + 1 + (c.replies?.length || 0),0)} comments
</div>
</div>

<div class="post-actions">

  <div class="post-action ${liked ? "liked" : ""}"
       onclick="toggleLike('${post._id}', this)">

    <svg viewBox="0 0 24 24" fill="${liked ? '#0a66c2' : 'none'}"
         stroke="currentColor" stroke-width="2">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
      2 6 4 4 6.5 4 8.24 4 9.91 5 10.54 6.36h.92C12.09
      5 13.76 4 15.5 4 18 4 20 6 20 8.5c0
      3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>

    <span>Like</span>
  </div>

  <div class="post-action"
       onclick="toggleCommentBox('${post._id}')">

    <svg viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2">
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
    </svg>

    <span>Comment</span>
  </div>

  <div class="post-action"
       onclick="openShareModal('${post._id}')">

    <svg viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>

    <span>Share</span>
  </div>

</div>

<div class="comments-wrapper" id="comments-wrapper-${post._id}" style="display:none;">

  <div class="comment-input-area">
    <img src="${localStorage.getItem("profileImage") || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}"
         class="comment-avatar">

    <input type="text"
           placeholder="Write a comment..."
           id="comment-input-${post._id}" />

    <button id="send-btn-${post._id}"
            onclick="submitComment('${post._id}')">
      Send
    </button>
  </div>

  <div class="comments-container" id="comments-${post._id}"></div>

  <div id="load-more-${post._id}" style="text-align:center;margin-top:10px;"></div>

</div>

</div>

        

      </div>
    `;
  });
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
