/* ================================
   GLOBAL FEED SYSTEM (AIFT)
================================ */
const API = "https://backend-1-9b6f.onrender.com";
let noMorePosts = false;

console.log("TOKEN NOW:", 
  localStorage.getItem("employerToken")
);

async function loadFeed(page = 1){

  if(noMorePosts) return;

  const container = document.getElementById("posts");

  if(!container){
    console.error("❌ POSTS DIV NOT FOUND");
    return;
  }



  const res = await fetch(API+"/api/posts?page="+page,{
    headers:{
  Authorization:"Bearer " + (
    localStorage.getItem("employerToken") ||
    localStorage.getItem("talentToken")
  )
}
  });

if(!res.ok){
  console.error("❌ FEED ERROR:", res.status);

 if(res.status === 401){
  alert("Session expired. Please login again.");
  localStorage.clear();
  window.location.href = "login.html"; // ✅ ADD THIS
}

  return; // ⛔ STOP EVERYTHING
}

const posts = await res.json();


 if(page === 1 && container){
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
       onclick="likePostFeed('${post._id}', this)">

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
            onclick="submitCommentFeed('${post._id}')">
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

  function prependPost(post){

  const container = document.getElementById("posts");

if(!container){
  console.error("Posts container not found");
  return;
}

  const liked = post.likes?.some(
  id => id.toString() === localStorage.getItem("userId")
);

  container.innerHTML = `
    <div class="card" id="post-${post._id}">
      <div class="post-header">
        <div class="post-author">

  <img src="${post.author?.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">

  <div onclick="visitProfile('${post.author?._id}')">

    <div style="font-weight:600;">
      ${post.author?.name}
    </div>

    <div class="post-meta">
      ${post.author?.headline || ""}
    </div>

    <div style="font-size:12px;color:#6f6f6f;">
      ${(post.author?.followers?.length || 0)} followers • Just now
    </div>

  </div>

</div>

${
post.author?._id !== localStorage.getItem("userId")
? `<button class="follow-btn"
     onclick="followFromFeed('${post.author._id}', this)">
     Follow
   </button>`
: ""
}
        <div class="dropdown">
  <div onclick="toggleDropdown('${post._id}', event)">•••</div>

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

      ${post.content ? `<div class="post-content">${post.content}</div>` : ""}

      ${post.mediaUrl ? `
        <div class="post-media">
          ${post.mediaType==="video"
            ? `<video controls src="${post.mediaUrl}"></video>`
            : `<img src="${post.mediaUrl}">`}
        </div>
      ` : ""}

      <div class="post-stats">
        <div>${post.likes?.length || 0} reactions</div>
        <div style="cursor:pointer;"
     onclick="toggleCommentBox('${post._id}')">
  ${post.comments?.reduce((t,c)=> t + 1 + (c.replies?.length || 0),0) || 0} comments
</div>
      </div>

     <div class="post-actions">

  <div class="post-action ${liked ? "liked" : ""}"
       onclick="likePostFeed('${post._id}', this)">

    <svg viewBox="0 0 24 24" fill="${liked ? '#0a66c2' : 'none'}" stroke="currentColor" stroke-width="2">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
      2 6 4 4 6.5 4 8.24 4 9.91 5 10.54 6.36h.92C12.09
      5 13.76 4 15.5 4 18 4 20 6 20 8.5c0
      3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>

    <span>Like</span>
  </div>

  <div class="post-action"
       onclick="toggleCommentBox('${post._id}')">

    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
    </svg>

    <span>Comment</span>
  </div>

  <div class="post-action"
       onclick="openShareModal('${post._id}')">

    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            onclick="submitCommentFeed('${post._id}')">
      Send
    </button>
  </div>

  <div class="comments-container" id="comments-${post._id}"></div>

  <div id="load-more-${post._id}" style="text-align:center;margin-top:10px;"></div>

</div>

      

    </div>
  ` + container.innerHTML;
}
/* ================================
   LIKE SYSTEM
================================ */

async function likePostFeed(id, element){

  const icon = element.querySelector("svg");
  const stat = document.querySelector("#post-"+id+" .post-stats div");

  try {

    const res = await fetch(API+"/api/posts/"+id+"/like",{
      method:"PATCH",
      headers:{
  Authorization:"Bearer " + (
    localStorage.getItem("employerToken") ||
    localStorage.getItem("talentToken")
  )
}
    });

    const data = await res.json();

    // 🔥 USE SERVER RESPONSE
    if(data.liked){
      element.classList.add("liked");
      icon.setAttribute("fill","#0a66c2");
    }else{
      element.classList.remove("liked");
      icon.setAttribute("fill","none");
    }

    stat.innerText = data.likes + " reactions";

  } catch(err){
    console.error("Like failed", err);
  }

}
function toggleCommentBox(postId){

  const wrapper = document.getElementById("comments-wrapper-"+postId);

  if(wrapper.style.display === "none"){
    wrapper.style.display = "block";
    loadCommentsFeed(postId);
  } else {
    wrapper.style.display = "none";
  }
}

async function submitCommentFeed(postId){

  const input = document.getElementById("comment-input-"+postId);
  const text = input.value.trim();
  if(!text) return;


  input.value="";

  try {
    const res = await fetch(API+"/api/posts/"+postId+"/comment",{
  method:"POST",
  headers:{
    "Content-Type":"application/json",
    Authorization:"Bearer " + (
      localStorage.getItem("employerToken") ||
      localStorage.getItem("talentToken")
    )
  },
  body:JSON.stringify({text})
});

    await res.json();

  } catch(err){
    alert("Failed to post comment");
  }
}
 
  async function loadCommentsFeed(postId){

  const res = await fetch(API+"/api/posts/"+postId,{
    headers:{
  Authorization:"Bearer " + (
    localStorage.getItem("employerToken") ||
    localStorage.getItem("talentToken")
  )
}
  });

  const post = await res.json();
  const container = document.getElementById("comments-"+postId);
  const loadMoreContainer = document.getElementById("load-more-"+postId);

  container.innerHTML = "";
  loadMoreContainer.innerHTML = "";

  let visibleCount = 10;

  function renderBatch(){
    container.innerHTML = "";

    post.comments
      .slice(0, visibleCount)
      .forEach(comment=>{
        renderComment(postId, comment, container);
      });

    if(post.comments.length > visibleCount){
      loadMoreContainer.innerHTML = `
        <button onclick="loadMoreComments('${postId}')">
          Load more comments
        </button>
      `;
    } else {
      loadMoreContainer.innerHTML = "";
    }
  }

  window.loadMoreComments = function(id){
    visibleCount += 10;
    renderBatch();
  };

  renderBatch();
}
 function renderComment(postId, comment, parentContainer){

  const div = document.createElement("div");
  div.className = "comment-item";
  div.dataset.commentId = comment._id;
div.setAttribute("data-comment-id", comment._id);

  div.innerHTML = `
    <img src="${comment.user.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}"
         class="comment-avatar">

    <div class="comment-body">

      <div class="comment-bubble">
        <strong>${comment.user.name}</strong><br>
        ${comment.text}
      </div>

      <div class="comment-meta">

        <button class="comment-like-btn post-style-btn"
        data-post="${postId}"
        data-comment="${comment._id}">
  <svg viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2"
       style="width:16px;height:16px;">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
    2 6 4 4 6.5 4 8.24 4 9.91 5 10.54 6.36h.92C12.09
    5 13.76 4 15.5 4 18 4 20 6 20 8.5c0
    3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
  <span class="like-count">${comment.likes?.length || 0}</span>
</button>

        <button class="comment-reply-btn"
                data-post="${postId}"
                data-comment="${comment._id}">
          Reply
        </button>

      </div>

      <div class="reply-input-area" id="reply-input-${comment._id}"></div>
    ${
  comment.replies && comment.replies.length > 0
  ? `<div style="margin-top:6px;font-size:13px;color:#0a66c2;cursor:pointer;"
        onclick="toggleReplies('${comment._id}')">
        View replies (${comment.replies.length})
     </div>`
  : ""
}

<div class="reply-line"
     id="replies-${comment._id}"
     data-loaded="false"
     style="display:none;">
</div>

    </div>
  `;

  parentContainer.appendChild(div);
}
function toggleReplies(commentId){

  const container = document.getElementById("replies-"+commentId);

  if(container.style.display === "block"){
    container.style.display = "none";
    return;
  }

  if(container.dataset.loaded === "true"){
    container.style.display = "block";
    return;
  }

  const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
  if(!commentElement) return;

  const postId = commentElement.querySelector(".comment-like-btn").dataset.post;

  fetch(API+"/api/posts/"+postId,{
    headers:{
  Authorization:"Bearer " + (
    localStorage.getItem("employerToken") ||
    localStorage.getItem("talentToken")
  )
}
  })
  .then(res=>res.json())
  .then(post=>{

    const comment = post.comments.find(c=>c._id === commentId);

    if(!comment) return;

    container.innerHTML = comment.replies.map(reply=>`
      <div data-reply-id="${reply._id}" style="
        margin-top:8px;
        padding-left:12px;
        border-left:2px solid #e6e6e6;
      ">
        <strong>${reply.user?.name || "User"}</strong><br>
        ${reply.text}
      </div>
    `).join("");

    container.dataset.loaded = "true";
    container.style.display = "block";

  });

}
