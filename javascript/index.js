// variables and constants
const leftPanel = document.getElementById("leftPanel");
const btns = leftPanel.getElementsByClassName("leftPanelBtn");
const btnDelayMs = 200;

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
    let rightPanel = document.getElementById("rightPanel");
    rightPanel.classList.add("hidden");
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
            if (curr.length != 0) {
                if (curr[0].id == event.target.id) return;
                curr[0].classList.remove("active");
            }
            
            event.target.classList.add("active");
            
            let rightPanel = document.getElementById("rightPanel");
            rightPanel.classList.add("hidden");
            setTimeout(function() {
                let rightPanel = document.getElementById("rightPanel");
                rightPanel.removeChild(rightPanel.firstElementChild);
                rightPanel.classList.remove("hidden");
                let newElem = document.createElement("div");

                switch (event.target.id) {
                    case "newsFeedBtn":
                        newElem.className = "newsFeed";
                        rightPanel.appendChild(newElem);

                        new newsFeed(newElem);
                        break;
                    case "clinicsBtn":
                        newElem.className = "clinics";
                        rightPanel.appendChild(newElem);

                        break;
                    case "supportedTestsBtn":
                        newElem.className = "supportedTests";
                        rightPanel.appendChild(newElem);

                        break;
                    case "testingResultsBtn":
                        newElem.className = "testingResults";
                        rightPanel.appendChild(newElem);

                        break;
                    case "contactUsBtn":
                        newElem.className = "contactUs";
                        rightPanel.appendChild(newElem);

                        break;
                    case "aboutUsBtn":
                        newElem.className = "aboutUs";
                        rightPanel.appendChild(newElem);

                        break;
                }
            }, btnDelayMs);
        });
    }
}
