// constants
import {ANIMATION_DELAY, TIMEOUT_DELAY, MOBILE_L} from "../utils/utils.js";

// functions
import {appendHtml} from "../utils/utils.js";
import * as Window from "../window.js";
import * as Database from "../database.js";

export class ChatWindow {

    /**
     * Constructs new 'ChatWindow' object with given 'chatWindowElem'
     * and given parent element.
     * @param {HTMLElement} chatWindowElem 
     * @param {HTMLElement} parentElem 
     */
    constructor(chatWindowElem, parentElem) {
        this.chatWindowElem = chatWindowElem;
        this.parentElem = parentElem;

        this.chatsRef = firebase.firestore().collection("chats");
        this.currClinicId = null;

        this.mouseClickHandlerRef = this.mouseClickHandler.bind(this);
        this.pointerDownHandlerRef = this.pointerDownHandler.bind(this);
    }

    /**
     * Builds new template of HTML element of chat window and renders 
     * created element. Also stores given clinic id to fetch appropriate
     * chat messages from database.
     */
    async drawChatWindow(currClinicId) {
        this.currClinicId = currClinicId;

        let html = `
            <div class="windowHeader">
                <text class="windowHeaderText">Chat</text>
                <img class="actionBtn" id="chatWindowCloseBtn" src="./svgs/close.svg">
            </div>
            <div class="windowContent">
                <div class="chatWindowContent"></div>
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

        appendHtml(html, this.chatWindowElem);

        setTimeout(async () => {
            this.chatWindowElem.style.display = "flex";
            this.chatWindowElem.style.opacity = 1;
            this.adjustChatWindowElemPos();
            await this.fetchAndRenderMessages();
            this.initListeners();
        }, TIMEOUT_DELAY);
    }

    /**
     * Fetches appropriate messages using current user id and clinic id and renders
     * them in 'chatWindowContent' html element.
     */
    async fetchAndRenderMessages() {
        let data = await Database.fetchMessageDocs(firebase.auth().currentUser.uid, this.currClinicId);
        this.chatDoc = data.chatDoc;
        let messageDocs = data.messageDocs;

        for (let i = 0; i < messageDocs.length; i++) {
            let currDoc = messageDocs[i];

            let html = ``;
            if (currDoc.data().sender == "user") {
                html = `<div class="bubbleRight">${currDoc.data().text}</div>`;
            } else if (currDoc.data().sender == "clinic") {
                html = `<div class="bubbleLeft">${currDoc.data().text}</div>`;
            }

            let chatWindowContentElem = this.chatWindowElem.querySelector(".chatWindowContent");
            appendHtml(html, chatWindowContentElem);
        }

        await Database.markAsRead("user", this.chatDoc);
    }

    /**
     * Sends given message and renders new message bubble.
     * @param {String} message 
     */
    async sendMessage(message) {
        await Database.sendMessage("user", message, this.chatDoc);

        let html = `<div class="bubbleRight">${message}</div>`;
        let chatWindowContentElem = this.chatWindowElem.querySelector(".chatWindowContent");
        appendHtml(html, chatWindowContentElem);
    }

    /**
     * Deinitializes listeners, clears chat window HTML content and sets 
     * it's opacity to 0 and display property to 'none'.
     */
    closeChatWindow() {
        this.deinitListeners();
        this.currClinicId = null;

        this.chatWindowElem.style.opacity = 0;
        setTimeout(() => {
            this.chatWindowElem.style.display = "none";
            this.chatWindowElem.innerHTML = "";
        }, ANIMATION_DELAY);
    }

    /**
     * Adjusts chat window element position so that it never goes out of
     * 'this.parentElem' bounds.
     */
    adjustChatWindowElemPos() {
        if (window.innerWidth > MOBILE_L) {
            Window.adjustWindowElemPos(this.chatWindowElem, this.parentElem);
        }
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        this.chatWindowElem.addEventListener("click", this.mouseClickHandlerRef);
        let windowHeaderElem = this.chatWindowElem.querySelector(".windowHeader");
        windowHeaderElem.addEventListener("pointerdown", this.pointerDownHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.chatWindowElem.removeEventListener("click", this.mouseClickHandlerRef);
        let windowHeaderElem = this.chatWindowElem.querySelector(".windowHeader");
        windowHeaderElem.removeEventListener("pointerdown", this.pointerDownHandlerRef);
    }

    /**
     * Chat window mouse click handler.
     * @param {Event} event 
     */
    async mouseClickHandler(event) {
        event.preventDefault();
        
        switch (event.target.id) {
            case "chatWindowCloseBtn":
                this.closeChatWindow();
                break;
            case "sendBtn":
            case "sendBtnImg":
                let windowDashboardInputElem = this.chatWindowElem.querySelector(".windowDashboardInput");
                let message = windowDashboardInputElem.value;
                if (message.length != 0) {
                    windowDashboardInputElem.value = "";
                    await this.sendMessage(message);
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
            Window.pointerDownHandler(event, this.chatWindowElem, this.parentElem);
        }
    }
}
