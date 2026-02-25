<!DOCTYPE html>
<html>
<head>
<title>Notifications | AIFT</title>
<style>
body{
  font-family:Inter;
  background:#f3f2ef;
  margin:0;
  padding:40px;
}
.card{
  background:white;
  padding:20px;
  border-radius:12px;
  max-width:700px;
  margin:auto;
}
.notification{
  padding:15px;
  border-bottom:1px solid #eee;
  cursor:pointer;
}
.notification.unread{
  background:#eef3f8;
}
.small{
  font-size:13px;
  color:#6f6f6f;
}
</style>
</head>
<body>

<div class="card">
  <h2>Notifications</h2>
  <div id="notificationList"></div>
</div>

<script>
const API="https://backend-1-9b6f.onrender.com";
const token=localStorage.getItem("token");

async function loadNotifications(){
  const res=await fetch(API+"/api/notifications",{
    headers:{Authorization:"Bearer "+token}
  });

  const data=await res.json();
  const container=document.getElementById("notificationList");
  container.innerHTML="";

  if(data.length===0){
    container.innerHTML="<p>No notifications</p>";
    return;
  }

  data.forEach(n=>{
    container.innerHTML+=`
      <div class="notification ${n.read ? "" : "unread"}"
           onclick="openNotification('${n._id}','${n.link}')">

        <b>${n.sender?.name || "System"}</b>
        <div>${n.text}</div>
        <div class="small">${new Date(n.createdAt).toLocaleString()}</div>
      </div>
    `;
  });
}

async function openNotification(id,link){
  await fetch(API+"/api/notifications/"+id+"/read",{
    method:"PATCH",
    headers:{Authorization:"Bearer "+token}
  });

  if(link) window.location.href=link;
}

loadNotifications();
</script>

</body>
</html>
