// constants
import {ANIMATION_DELAY, TIMEOUT_DELAY, MOBILE_L} from "../utils/utils.js";

// functions
import {appendHtml, prependHtml} from "../utils/utils.js";
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
            await this.getMessages();
            this.initListeners();
        }, TIMEOUT_DELAY);
    }

    /**
     * Fetches appropriate messages using current user id and clinic id and renders
     * them in 'chatWindowContent' HTML element dynamically using Firestore listener.
     */
    async getMessages() {
        let uid = firebase.auth().currentUser.uid;
        let chatData = await Database.createAndFetchMessageDocs(uid, this.currClinicId);
        let messageDocs = chatData.messageDocs;
        this.chatDoc = chatData.chatDoc;
        this.appendCount = messageDocs.length;

        let drawChatBubblesRef = this.drawChatBubbles.bind(this);
        this.unsubscribeMsg = Database.executeOnMessageDocsChanges(this.chatDoc.id, drawChatBubblesRef);

        await Database.markAsRead("user", this.chatDoc.id);
    }

    /**
     * Draws message bubbles according to data from given 'messageDoc' document.
     * If 'this.appendCount' is more than zero this means that it's a first fetch 
     * from the Firestore database and the HTML elements are appended to 'chatWindowContentElem', 
     * if 'this.appendCount' equals zero that means that every element that was already in
     * database is fetched and next HTML elements will prepended to 'chatWindowContentElem'. 
     * That's because 'chatWindowContentElem' has CSS property of 'flex-direction: column-reverse'.
     * @param messageDoc
     */
    drawChatBubbles(messageDoc) {
        let html = ``;
        if (messageDoc.data().sender == "user") {
            html = `<div class="bubbleRight">${messageDoc.data().text}</div>`;
        } else if (messageDoc.data().sender == "clinic") {
            html = `<div class="bubbleLeft">${messageDoc.data().text}</div>`;
        }

        let chatWindowContentElem = this.chatWindowElem.querySelector(".chatWindowContent");
        if (this.appendCount > 0) {
            appendHtml(html, chatWindowContentElem);
            this.appendCount--;
        } else {
            prependHtml(html, chatWindowContentElem);
        }
    }

    /**
     * Sends given message and renders new message bubble.
     * @param {String} message 
     */
    async sendMessage(message) {
        await Database.sendMessage("user", message, this.chatDoc.id);
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

        if (this.unsubscribeMsg) this.unsubscribeMsg();
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
