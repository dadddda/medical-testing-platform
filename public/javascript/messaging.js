// constants
import {ANIMATION_DELAY, TIMEOUT_DELAY, MOBILE_L} from "./utils/utils.js";

// functions
import {appendHtml} from "./utils/utils.js";
import * as Window from "./window.js";

export class Messaging {

    /**
     * Constructs new 'Messaging' object with given 'messagingElem'
     * and given parent element.
     * @param {HTMLElement} messagingElem 
     * @param {HTMLElement} parentElem 
     */
    constructor(messagingElem, parentElem) {
        this.messagingElem = messagingElem;
        this.parentElem = parentElem;

        this.chatsRef = firebase.firestore().collection("chats");
        this.currClinicId = null;

        this.mouseClickHandlerRef = this.mouseClickHandler.bind(this);
        this.pointerDownHandlerRef = this.pointerDownHandler.bind(this);
    }

    /**
     * Builds new template of HTML element of messaging window and renders 
     * created element. Also stores given clinic id to fetch appropriate
     * chat messages from database.
     */
    async drawMessagingWindow(currClinicId) {
        this.currClinicId = currClinicId;

        let html = `
            <div class="windowHeader">
                <text class="windowHeaderText">Messaging</text>
                <img class="actionBtn" id="messagingCloseBtn" src="./svgs/close.svg">
            </div>
            <div class="windowContent">
                <div class="messagingContent"></div>
            </div>
            <div class="windowFooter">
                <hr class="solid">
                <div class="windowDashboard">
                    <input class="windowDashboardInput" type="text">
                    <button class="windowDashboardBtn" id="sendBtn">
                        <img id="sendBtnImg" src="./svgs/send-msg-icon.svg">
                    </button>
                </div>
            </div>
        `;

        appendHtml(html, this.messagingElem);

        setTimeout(async () => {
            this.messagingElem.style.display = "flex";
            this.messagingElem.style.opacity = 1;
            this.adjustMessagingElemPos();
            await this.fetchMessages();
            this.initListeners();
        }, TIMEOUT_DELAY);
    }

    /**
     * Fetches appropriate messages using current user id and clinic id and renders
     * them in 'messagingContent' html element. If current combination of user and
     * clinic doesn't exsist in database, new document is created.
     */
    async fetchMessages() {
        let chats = await this.chatsRef
            .where("userId", "==", firebase.auth().currentUser.uid)
            .where("clinicId", "==", this.currClinicId)
            .get();

        if (chats.docs.length == 0) {
            console.log("no chats found");
            await this.createChatDocument();
            
            chats = await this.chatsRef
                .where("userId", "==", firebase.auth().currentUser.uid)
                .where("clinicId", "==", this.currClinicId)
                .get();
        }

        this.messagesRef = firebase.firestore().collection("chats/" + chats.docs[0].id + "/messages");
        let messages = await this.messagesRef
            .orderBy("date")
            .get();

        for (let i = 0; i < messages.docs.length; i++) {
            let currDoc = messages.docs[i];
            console.log(currDoc.data().text);

            let html = ``;
            if (currDoc.data().sender == "user") {
                html = `<div class="bubbleRight">${currDoc.data().text}</div>`;
            } else if (currDoc.data().sender == "clinic") {
                html = `<div class="bubbleLeft">${currDoc.data().text}</div>`;
            }

            let messagingContentElem = this.messagingElem.querySelector(".messagingContent");
            appendHtml(html, messagingContentElem);
        }
    }

    /**
     * Creates new chat document of current user and clinic combination
     * in Firestore database.
     */
    async createChatDocument() {
        await this.chatsRef.add({
            userId: firebase.auth().currentUser.uid,
            clinicId: this.currClinicId
        });
    }

    /**
     * Stores given message to current messages collection in Firestore database.
     * @param {String} message 
     */
    async sendMessage(message) {
        await this.messagesRef.add({
            date: firebase.firestore.FieldValue.serverTimestamp(),
            sender: "user",
            text: message
        });

        let html = `<div class="bubbleRight">${message}</div>`;
        let messagingContentElem = this.messagingElem.querySelector(".messagingContent");
        appendHtml(html, messagingContentElem);
    }

    /**
     * Deinitializes listeners, clears messaging window HTML content and sets 
     * it's opacity to 0 and display property to 'none'.
     */
    closeMessagingWindow() {
        this.deinitListeners();
        this.currClinicId = null;

        this.messagingElem.style.opacity = 0;
        setTimeout(() => {
            this.messagingElem.style.display = "none";
            this.messagingElem.innerHTML = "";
        }, ANIMATION_DELAY);
    }

    /**
     * Adjusts messaging window element position so that it never goes out of
     * 'this.parentElem' bounds.
     */
    adjustMessagingElemPos() {
        if (window.innerWidth > MOBILE_L) {
            Window.adjustWindowElemPos(this.messagingElem, this.parentElem);
        }
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        this.messagingElem.addEventListener("click", this.mouseClickHandlerRef);
        let windowHeaderElem = this.messagingElem.querySelector(".windowHeader");
        windowHeaderElem.addEventListener("pointerdown", this.pointerDownHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.messagingElem.removeEventListener("click", this.mouseClickHandlerRef);
        let windowHeaderElem = this.messagingElem.querySelector(".windowHeader");
        windowHeaderElem.removeEventListener("pointerdown", this.pointerDownHandlerRef);
    }

    /**
     * Messaging window mouse click handler.
     * @param {Event} event 
     */
    mouseClickHandler(event) {
        event.preventDefault();
        
        switch (event.target.id) {
            case "messagingCloseBtn":
                this.closeMessagingWindow();
                break;
            case "sendBtn":
            case "sendBtnImg":
                let windowDashboardInputElem = this.messagingElem.querySelector(".windowDashboardInput");
                let message = windowDashboardInputElem.value;
                if (message.length != 0) {
                    windowDashboardInputElem.value = "";
                    this.sendMessage(message);
                }
                break;
        }
    }

    /**
     * Window pointer down handler.
     * @param {Event} event 
     */
    pointerDownHandler(event) {
        if (window.innerWidth > MOBILE_L) {
            Window.pointerDownHandler(event, this.messagingElem, this.parentElem);
        }
    }
}
