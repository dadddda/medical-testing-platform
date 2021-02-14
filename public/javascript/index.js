// constants
const leftPanelBtns = document.getElementById("leftPanelBtns");
const btns = leftPanelBtns.getElementsByClassName("leftPanelBtn");
import {ANIMATION_DELAY, fadeAndReplace} from "./utils/utils.js";

// classes
import {NewsFeed} from "./news-feed/news-feed.js";
import {Clinics} from "./clinics/clinics.js";
import {Messages} from "./messages/messages.js";
import {SupportedTests} from "./supported-tests/supported-tests.js";
import {AboutUs} from "./about-us/about-us.js";

// functions
import * as Database from "./database.js";
import {getClickedParent} from "./utils/utils.js";

// variables
let tempClass = null;
let unreadMessages = 0;
let chatDocMap = new Map();
let leftPanelElem = null;

/**
 * Initializes listeners and main page buttons if user is signed in.
 * Also attaches listener to fetch updates about messages "read/unread" status.
 * Redirects page to login.html if the user isn't signed in.
 */
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        document.getElementById("headerLeftBtn").addEventListener("click", headerLeftClickHandler);
        document.querySelector(".headerRight").addEventListener("click", headerRightClickHandler);
        leftPanelElem = document.querySelector(".leftPanel");
        leftPanelElem.addEventListener("click", leftPanelClickHandler);
        document.body.style.display = "flex";
        Database.executeOnChatDocsChanges("user", user.uid, updateNotificationDot);
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
 * Event listener for header right buttons.
 */
function headerRightClickHandler(event) {
    let clickedElem = getClickedParent(event.target, "redirectBtn");
    
    if (clickedElem.id == "logoutBtn") {
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
}

/**
 * Left navigation panel button click handler.
 */
function leftPanelClickHandler(event) {
    let clickedBtn = getClickedParent(event.target, "leftPanelBtn");
    if (clickedBtn == undefined) return;
    leftPanelElem.removeEventListener("click", leftPanelClickHandler);

    let currActive = leftPanelBtns.getElementsByClassName("active");
    if (currActive.length != 0) {
        if (currActive[0].id == clickedBtn.id) return;
        currActive[0].classList.remove("active");
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
                await newsFeedObj.getNews();
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

                let supportedTestsObj = new SupportedTests(newElem);
                await supportedTestsObj.drawContent();
                supportedTestsObj.initListeners();

                tempClass = supportedTestsObj;
                break;
            case "aboutUsBtn":
                newElem.className = "aboutUs";
                rightPanelElem.appendChild(newElem);

                let aboutUsObj = new AboutUs(newElem);
                await aboutUsObj.drawContent();

                break;
        }

        leftPanelElem.addEventListener("click", leftPanelClickHandler);
    }, ANIMATION_DELAY);
}

/**
 * Dyncamically updates messages button notification dot with the
 * number of unread messages using database functions.
 * @param {String} chatDoc 
 */
function updateNotificationDot(chatDoc) {
    let prevUnreadMessages = unreadMessages;

    if (chatDocMap.has(chatDoc.id)) {
        let prevSeenStatus = chatDocMap.get(chatDoc.id);
        if (prevSeenStatus == chatDoc.data().userSeen) return;

        if (chatDoc.data().userSeen) unreadMessages--;
        else unreadMessages++;
    } else {
        if (!chatDoc.data().userSeen) unreadMessages++;
    }

    chatDocMap.set(chatDoc.id, chatDoc.data().userSeen);

    let notificationDotElem = document.getElementById("notificationDot");
    let notificationTextElem = document.getElementById("notificationText");

    if (prevUnreadMessages > 0 && unreadMessages == 0) {
        notificationDotElem.style.opacity = 0;
        setTimeout(function() {
            notificationDotElem.style.display = "none";
            notificationTextElem.innerHTML = "0";
        }, ANIMATION_DELAY);
    } else if (prevUnreadMessages == 0 && unreadMessages > 0) {
        notificationTextElem.innerHTML = `${unreadMessages}`;
        notificationDotElem.style.display = "flex";
        notificationDotElem.style.opacity = 1;
    } else {
        notificationTextElem.innerHTML = `${unreadMessages}`;
    }
}
