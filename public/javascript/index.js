// constants
const leftPanelBtns = document.getElementById("leftPanelBtns");
const btns = leftPanelBtns.getElementsByClassName("leftPanelBtn");
import {ANIMATION_DELAY, fadeAndReplace} from "./utils/utils.js";

// classes
import {NewsFeed} from "./news-feed/news-feed.js";
import {Clinics} from "./clinics/clinics.js";
import {Messages} from "./messages/messages.js"

// variables
let tempClass = null;

/**
 * Initializes listeners and main page buttons if user is signed in.
 * Redirects page to login.html if the user isn't signed in.
 */
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        document.getElementById("headerLeftBtn").addEventListener("click", headerLeftClickHandler);
        document.getElementById("logoutBtn").addEventListener("click", logoutClickHandler);
        initBtns();
        document.body.style.display = "flex";
    } else {
        fadeAndReplace("login.html");
    }
});

/**
 * Event listener for header left button.
 */
function headerLeftClickHandler() {
    fadeAndReplace("index.html");
}

/**
 * Event listener for logout button.
 */
function logoutClickHandler() {
    firebase.auth().signOut()
    .then((user) => {
        // 'onAuthStateChanged()' handles login action
    })
    .catch((error) => {
        let errorCode = error.code;
        let errorMessage = error.message;
        
        console.log(errorCode);
        console.log(errorMessage);
    });
}

/**
 * Left navigation panel button listeners.
 */
function initBtns() {
    for (let i = 0; i < btns.length; i++) {
        btns[i].addEventListener("click", function(event) {
            let clickedBtn = event.target;
            if (clickedBtn.id == "") clickedBtn = clickedBtn.parentElement;

            let curr = leftPanelBtns.getElementsByClassName("active");
            if (curr.length != 0) {
                if (curr[0].id == clickedBtn.id) return;
                curr[0].classList.remove("active");
            }
            clickedBtn.classList.add("active");

            if (tempClass != null) {
                tempClass.deinitListeners();
                tempClass = null;
            }
            
            let rightPanelElem = document.getElementById("rightPanel");
            rightPanelElem.classList.add("hidden");
            setTimeout(async function() {
                rightPanelElem.removeChild(rightPanelElem.firstElementChild);
                rightPanelElem.classList.remove("hidden");
                let newElem = document.createElement("div");

                switch (clickedBtn.id) {
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
                    case "testResultsBtn":
                        newElem.className = "testResults";
                        rightPanelElem.appendChild(newElem);
                        
                        break;
                    case "messagesBtn":
                        newElem.className = "messages";
                        rightPanelElem.appendChild(newElem);

                        let messagesObj = new Messages(newElem);
                        await messagesObj.drawContent();
                        messagesObj.initListeners();
                        
                        tempClass = messagesObj;
                        break;
                    case "supportedTestsBtn":
                        newElem.className = "supportedTests";
                        rightPanelElem.appendChild(newElem);

                        break;
                    case "aboutUsBtn":
                        newElem.className = "aboutUs";
                        rightPanelElem.appendChild(newElem);

                        break;
                }
            }, ANIMATION_DELAY);
        });
    }
}
