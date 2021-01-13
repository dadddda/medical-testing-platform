// variables and constants
const leftPanel = document.getElementById("leftPanel");
const btns = leftPanel.getElementsByClassName("leftPanelBtn");
const btnDelayMs = 400;

/**
 * Redirects page to login.html if the user isn't logged in.
 */
firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
        window.location.replace("login.html");
    }
});

/**
 * Event listener for header left button.
 */
document.getElementById("headerLeftBtn").addEventListener("click", function() {
    document.getElementById("rightPanel").classList.add("hidden");
    setTimeout(function() {
        window.location.assign("index.html");
    }, btnDelayMs);
})

/**
 * Event listener for logout button.
 */
document.getElementById("logoutBtn").addEventListener("click", function() {
    firebase.auth().signOut()
    .then((user) => {
        window.location.assign("login.html");
    })
    .catch((error) => {
        let errorCode = error.code;
        let errorMessage = error.message;
        
        console.log(errorCode);
        console.log(errorMessage);
    });
});

/**
 * initBtns() is called after pageload.
 */
window.addEventListener("DOMContentLoaded", initBtns);

/**
 * Left navigation panel button listeners.
 */
function initBtns() {
    for (let i = 0; i < btns.length; i++) {
        btns[i].addEventListener("click", function(event) {
            let curr = leftPanel.getElementsByClassName("active");
            if (curr.length != 0) curr[0].classList.remove("active");
            
            event.target.classList.add("active");
            
            document.getElementById("rightPanel").classList.add("hidden");
            setTimeout(function() {
                switch (event.target.id) {
                    case "newsFeedBtn":
                        window.location.assign("news-feed.html");
                        break;
                    case "clinicsBtn":
                        break;
                    case "supportedTestsBtn":
                        break;
                    case "testingResults":
                        break;
                    case "contactUs":
                        break;
                    case "aboutUs":
                        break;
                }
            }, btnDelayMs);
        });
    }
}
