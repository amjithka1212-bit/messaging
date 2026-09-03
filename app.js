import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Replace these with your Supabase project values.
// NEVER use the service_role/secret key in this file.
const SUPABASE_URL = "https://nzjtfqwpgkmveybdgofu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8zRq1iuD6BHYAHajGb1uYg_dRUYQgi3";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const loginCard=document.querySelector("#login-card"), messageCard=document.querySelector("#message-card");
const loginForm=document.querySelector("#login-form"), messageForm=document.querySelector("#message-form");
const passwordInput=document.querySelector("#password"), messageInput=document.querySelector("#message");
const loginError=document.querySelector("#login-error"), messageStatus=document.querySelector("#message-status");
const logoutButton=document.querySelector("#logout"), count=document.querySelector("#count");

const messageList = document.createElement("div");
messageList.id = "previous-messages";
messageList.innerHTML = `
  <h2>Previous 10 messages</h2>
  <div id="messages-loading" class="muted">Loading...</div>
  <div id="messages"></div>
`;
messageCard.appendChild(messageList);

async function loadPreviousMessages() {
  const box = document.querySelector("#messages");
  const loading = document.querySelector("#messages-loading");
  loading.textContent = "Loading...";
  box.innerHTML = "";

  const { data, error } = await supabase
    .from("messages")
    .select("id, message, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  loading.textContent = "";

  if (error) {
    loading.textContent = "Unable to load previous messages.";
    return;
  }

  if (!data.length) {
    loading.textContent = "No messages yet.";
    return;
  }

  data.forEach(row => {
    const item = document.createElement("div");
    item.className = "message-item";

    const text = document.createElement("div");
    text.className = "message-text";
    text.textContent = row.message;

    const date = document.createElement("div");
    date.className = "message-date";
    date.textContent = new Date(row.created_at).toLocaleString();

    item.append(text, date);
    box.appendChild(item);
  });
}

function showLoggedIn(v){loginCard.classList.toggle("hidden",v);messageCard.classList.toggle("hidden",!v);if(!v)passwordInput.value=""}
async function refreshSession(){const {data}=await supabase.auth.getSession();showLoggedIn(!!data.session)}

loginForm.addEventListener("submit",async e=>{
 e.preventDefault();loginError.textContent="";
 const {error}=await supabase.auth.signInWithPassword({
   email:"shared-user@private-messages.local",password:passwordInput.value
 });
 if(error){loginError.textContent="Incorrect password or login is unavailable.";return}
 showLoggedIn(true);
});

messageInput.addEventListener("input",()=>count.textContent=messageInput.value.length);

messageForm.addEventListener("submit",async e=>{
 e.preventDefault();messageStatus.textContent="";
 const message=messageInput.value.trim();if(!message)return;
 const {data:{user}}=await supabase.auth.getUser();
 if(!user){showLoggedIn(false);return}
 const {error}=await supabase.from("messages").insert({message,user_id:user.id});
 if(error){messageStatus.textContent="Could not submit the message. Please try again.";return}
 messageInput.value="";count.textContent="0";messageStatus.textContent="Message submitted successfully.";
});

logoutButton.addEventListener("click",async()=>{await supabase.auth.signOut();showLoggedIn(false)});
supabase.auth.onAuthStateChange((_event,session)=>showLoggedIn(!!session));
refreshSession();
