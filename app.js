import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// =====================================================
// SUPABASE CONFIG
// =====================================================

const SUPABASE_URL =
    "https://nzjtfqwpgkmveybdgofu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_8zRq1iuD6BHYAHajGb1uYg_dRUYQgi3";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// =====================================================
// GET HTML ELEMENTS
// =====================================================

const loginCard =
    document.querySelector("#login-card");

const messageCard =
    document.querySelector("#message-card");

const loginForm =
    document.querySelector("#login-form");

const messageForm =
    document.querySelector("#message-form");

const passwordInput =
    document.querySelector("#password");

const messageInput =
    document.querySelector("#message");

const loginError =
    document.querySelector("#login-error");

const messageStatus =
    document.querySelector("#message-status");

const logoutButton =
    document.querySelector("#logout");

const count =
    document.querySelector("#count");


// =====================================================
// CREATE PREVIOUS MESSAGE SECTION
// =====================================================

const messageList = document.createElement("div");

messageList.id = "previous-messages";

messageList.innerHTML = `
    <h2>Previous 10 messages</h2>

    <div id="messages-loading" class="muted">
        Loading...
    </div>

    <div id="messages"></div>
`;

messageCard.appendChild(messageList);


// =====================================================
// SHOW LOGIN / MESSAGE CARD
// =====================================================

function showLoggedIn(isLoggedIn) {

    loginCard.classList.toggle(
        "hidden",
        isLoggedIn
    );

    messageCard.classList.toggle(
        "hidden",
        !isLoggedIn
    );

    if (!isLoggedIn) {
        passwordInput.value = "";
    }
}


// =====================================================
// LOAD PREVIOUS 10 MESSAGES
// =====================================================

async function loadPreviousMessages() {

    const box =
        document.querySelector("#messages");

    const loading =
        document.querySelector("#messages-loading");


    // Show loading
    loading.textContent = "Loading...";

    box.innerHTML = "";


    try {

        const {
            data,
            error
        } = await supabase
            .from("messages")
            .select("id, message, created_at")
            .order("created_at", {
                ascending: false
            })
            .limit(10);


        // ---------------------------------------------
        // Supabase error
        // ---------------------------------------------

        if (error) {

            console.error(
                "Error loading messages:",
                error
            );

            loading.textContent =
                "Unable to load previous messages.";

            return;
        }


        // ---------------------------------------------
        // No messages
        // ---------------------------------------------

        if (!data || data.length === 0) {

            loading.textContent =
                "No messages yet.";

            return;
        }


        // ---------------------------------------------
        // Messages found
        // ---------------------------------------------

        loading.textContent = "";


        data.forEach(row => {

            const item =
                document.createElement("div");

            item.className =
                "message-item";


            // Message text
            const text =
                document.createElement("div");

            text.className =
                "message-text";

            text.textContent =
                row.message;


            // Date
            const date =
                document.createElement("div");

            date.className =
                "message-date";

            date.textContent =
                new Date(
                    row.created_at
                ).toLocaleString();


            item.append(
                text,
                date
            );


            box.appendChild(item);

        });

    } catch (err) {

        console.error(
            "Unexpected error:",
            err
        );

        loading.textContent =
            "Unable to load previous messages.";
    }
}


// =====================================================
// CHECK EXISTING SESSION
// =====================================================

async function refreshSession() {

    const {
        data,
        error
    } = await supabase.auth.getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        showLoggedIn(false);

        return;
    }


    const isLoggedIn =
        !!data.session;


    showLoggedIn(isLoggedIn);


    // Load messages only when logged in
    if (isLoggedIn) {

        await loadPreviousMessages();

    }
}


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener(
    "submit",
    async e => {

        e.preventDefault();

        loginError.textContent = "";


        const password =
            passwordInput.value;


        const {
            error
        } = await supabase.auth.signInWithPassword({

            email:
                "shared-user@private-messages.local",

            password:
                password

        });


        if (error) {

            console.error(
                "Login error:",
                error
            );

            loginError.textContent =
                "Incorrect password or login is unavailable.";

            return;
        }


        // Show message page
        showLoggedIn(true);


        // Load previous messages
        await loadPreviousMessages();

    }
);


// =====================================================
// MESSAGE CHARACTER COUNT
// =====================================================

messageInput.addEventListener(
    "input",
    () => {

        count.textContent =
            messageInput.value.length;

    }
);


// =====================================================
// SUBMIT MESSAGE
// =====================================================

messageForm.addEventListener(
    "submit",
    async e => {

        e.preventDefault();

        messageStatus.textContent = "";


        const message =
            messageInput.value.trim();


        // Don't submit empty message
        if (!message) {

            messageStatus.textContent =
                "Please enter a message.";

            return;
        }


        // Check logged-in user
        const {
            data: {
                user
            }
        } = await supabase.auth.getUser();


        if (!user) {

            showLoggedIn(false);

            return;
        }


        // Insert message
        const {
            error
        } = await supabase
            .from("messages")
            .insert({

                message:
                    message,

                user_id:
                    user.id

            });


        if (error) {

            console.error(
                "Submit error:",
                error
            );

            messageStatus.textContent =
                "Could not submit the message. Please try again.";

            return;
        }


        // Clear input
        messageInput.value = "";

        count.textContent = "0";


        // Success message
        messageStatus.textContent =
            "Message submitted successfully.";


        // Refresh previous messages
        await loadPreviousMessages();

    }
);


// =====================================================
// LOGOUT
// =====================================================

logoutButton.addEventListener(
    "click",
    async () => {

        const {
            error
        } = await supabase.auth.signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

            return;
        }


        showLoggedIn(false);

    }
);


// =====================================================
// AUTH STATE CHANGE
// =====================================================

supabase.auth.onAuthStateChange(
    (_event, session) => {

        const isLoggedIn =
            !!session;

        showLoggedIn(isLoggedIn);

    }
);


// =====================================================
// START APPLICATION
// =====================================================

refreshSession();
