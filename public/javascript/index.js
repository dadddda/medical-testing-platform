// constants
const leftPanelBtns = document.getElementById("leftPanelBtns");
const btns = leftPanelBtns.getElementsByClassName("leftPanelBtn");
import {animationDelay} from "./utils/utils.js";

// classes
import {NewsFeed} from "./news-feed/news-feed.js";
import {Clinics} from "./clinics/clinics.js";

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
    let rightPanelElem = document.getElementById("rightPanel");
    rightPanelElem.classList.add("hidden");
    setTimeout(function() {
        window.location.assign("index.html");
    }, animationDelay);
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

// initBtns() is called after pageload.
window.addEventListener("DOMContentLoaded", initBtns);

// Used to store a class reference.
let tempClass = null;

/**
 * Left navigation panel button listeners.
 */
function initBtns() {
    for (let i = 0; i < btns.length; i++) {
        btns[i].addEventListener("click", function(event) {
            let curr = leftPanelBtns.getElementsByClassName("active");
            if (curr.length != 0) {
                if (curr[0].id == event.target.id) return;
                curr[0].classList.remove("active");
            }
            event.target.classList.add("active");

            if (tempClass != null) {
                tempClass.deinitListeners();
                tempClass = null;
            }
            
            let rightPanelElem = document.getElementById("rightPanel");
            rightPanelElem.classList.add("hidden");
            setTimeout(function() {
                rightPanelElem.removeChild(rightPanelElem.firstElementChild);
                rightPanelElem.classList.remove("hidden");
                let newElem = document.createElement("div");

                switch (event.target.id) {
                    case "newsFeedBtn":
                        newElem.className = "newsFeed";
                        rightPanelElem.appendChild(newElem);

                        let newsFeedObj = new NewsFeed(newElem);
                        newsFeedObj.getNews();
                        newsFeedObj.initListeners();
                        
                        tempClass = newsFeedObj;
                        break;
                    case "clinicsBtn":
                        newElem.className = "clinics";
                        rightPanelElem.appendChild(newElem);

                        let clinicsObj = new Clinics(newElem);
                        clinicsObj.drawContent();
                        clinicsObj.initListeners();
                        
                        tempClass = clinicsObj;
                        break;
                    case "supportedTestsBtn":
                        newElem.className = "supportedTests";
                        rightPanelElem.appendChild(newElem);

                        break;
                    case "testingResultsBtn":
                        newElem.className = "testingResults";
                        rightPanelElem.appendChild(newElem);

                        break;
                    case "contactUsBtn":
                        newElem.className = "contactUs";
                        rightPanelElem.appendChild(newElem);

                        break;
                    case "aboutUsBtn":
                        newElem.className = "aboutUs";
                        rightPanelElem.appendChild(newElem);

                        break;
                }
            }, animationDelay);
        });
    }
}
