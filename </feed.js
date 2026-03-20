const API = "https://backend-1-9b6f.onrender.com";

async function loadFeed(token, containerId){

  const res = await fetch(API + "/api/posts", {
    headers:{ Authorization:"Bearer " + token }
  });

  const posts = res.ok ? await res.json() : [];
  const container = document.getElementById(containerId);

  container.innerHTML = "";

  posts.forEach(post => {

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
          <div>${post.likes.length} reactions</div>
          <div onclick="toggleCommentBox('${post._id}')"
               style="cursor:pointer;">
            ${post.comments.length} comments
          </div>
        </div>

        <div class="post-actions">

          <div class="post-action ${liked ? "liked" : ""}"
               onclick="likePost('${post._id}', this)">
            👍 Like
          </div>

          <div class="post-action"
               onclick="toggleCommentBox('${post._id}')">
            💬 Comment
          </div>

        </div>

        <div class="comments-wrapper"
             id="comments-wrapper-${post._id}"
             style="display:none;">

          <div class="comment-input-area">
            <input type="text"
              placeholder="Write a comment..."
              id="comment-input-${post._id}">
            <button onclick="submitComment('${post._id}')">
              Send
            </button>
          </div>

          <div id="comments-${post._id}"></div>

        </div>

      </div>
    `;
  });
}
