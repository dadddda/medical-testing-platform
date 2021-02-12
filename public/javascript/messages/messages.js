// constants
const TRIGGER_THRESHOLD = 0.8;

//functions
import {ANIMATION_DELAY, appendHtml, getClickedParentId} from "../utils/utils.js";
import * as Database from "../database.js";

export class Messages {

    /**
     * Constructs new 'Messages' object with given 'messagesElem'
     * element.
     * @param {HTMLElement} messagesElem 
     */
    constructor(messagesElem) {
        this.messagesElem = messagesElem;
        this.chatsRef = firebase.firestore().collection("chats");
        
        this.initialized = false;
        this.fetchChatsOnResize = true;
        this.fetchChatsOnResize = true;

        this.leftPanelClickHandlerRef = this.leftPanelClickHandler.bind(this);
        this.rightPanelClickHandlerRef = this.rightPanelClickHandler.bind(this);
        this.scrollHandlerRef = this.scrollHandler.bind(this);
        this.windowResizeHandlerRef = this.windowResizeHandler.bind(this);
    }

    /**
     * Builds new template of HTML element of messages content and
     * renders created element.
     */
    async drawContent() {
        let html = `
            <div class="leftPanel" id="messagesLeftPanel"></div>
            <div class="rightPanel" id="messagesRightPanel"></div>
        `;

        appendHtml(html, this.messagesElem);

        this.leftPanelElem = document.getElementById("messagesLeftPanel");
        this.rightPanelElem = document.getElementById("messagesRightPanel");
        await this.getChats();
    }

    /**
     * Handles dynamic chat fetching on scrolling and window resize events.
     */
    async getChats() {
        let uid = firebase.auth().currentUser.uid;
        let chatDocs = null;
        if (!this.initialized) {
            chatDocs = await Database.fetchChatDocs("user", uid, 1);
            this.initialized = true;
        } else {
            chatDocs = await Database.fetchChatDocsAfter("user", uid, this.latestDoc, 1);
        }

        if (chatDocs.length == 0) {
            this.fetchChatsOnScroll = false;
            this.fetchChatsOnResize = false;
            return;
        }

        for (let i = 0; i < chatDocs.length; i++) {
            let currDoc = chatDocs[i];
            await this.drawChatBox(currDoc);
        }

        this.latestDoc = chatDocs[chatDocs.length - 1];

        let triggerHeight = this.leftPanelElem.scrollTop + this.leftPanelElem.offsetHeight;
        if (triggerHeight >= this.leftPanelElem.scrollHeight * TRIGGER_THRESHOLD) {
            await this.getChats();
        }
        this.fetchChatsOnScroll = true;
        this.fetchChatsOnResize = true;
    }

    /**
     * Loads chat messages from specific chat document. If messages from
     * different chat document ware already loaded the old one get's removed
     * from HTML and new is then added.
     * @param {String} chatDocId 
     */
    getMessages(chatDocId) {
        let customAnimationDelay = 0;
        if (this.rightPanelElem.innerHTML.length != 0) {
            this.rightPanelElem.style.opacity = 0;
            customAnimationDelay = ANIMATION_DELAY;
        }
        
        setTimeout(async () => {
            this.rightPanelElem.innerHTML = "";
            this.rightPanelElem.style.opacity = 1;
            
            let html = `
                <div class="chatContent"></div>
                <div class="chatFooter">
                    <hr class="solid">
                    <div class="chatDashboard">
                        <input class="chatInput" type="text">
                        <button class="chatBtn" id="chatBtn">
                            <img id="sendBtnImg" src="./svgs/send-msg-icon.svg">
                        </button>
                    </div>
                </div>
            `;

            appendHtml(html, this.rightPanelElem);
            
            let messageDocs = await Database.fetchMessageDocs(chatDocId);
            
            for (let i = 0; i < messageDocs.length; i++) {
                let currDoc = messageDocs[i];
                this.drawChatBubbles(currDoc);
            }

            await Database.markAsRead("user", chatDocId);
        }, customAnimationDelay);
    }

    /**
     * Sends given message and renders new message bubble.
     * @param {String} message 
     */
    async sendMessage(message) {
        await Database.sendMessage("user", message, this.currChatDocId);

        let html = `<div class="bubbleRight">${message}</div>`;
        let chatContentElem = this.rightPanelElem.querySelector(".chatContent");
        appendHtml(html, chatContentElem);
    }

    /**
     * Draws chat box according to data from given 'chatDoc' document.
     * @param chatDoc 
     */
    async drawChatBox(chatDoc) {
        if (chatDoc.data().latestMessageId == undefined) return;
        let messageDoc = await Database.fetchMessageDoc(chatDoc.id, chatDoc.data().latestMessageId);
        let clinicDoc = await Database.fetchClinicDoc(chatDoc.data().clinicId);

        let clinicName = clinicDoc.data().name;
        let formattedDate = this.createDate(chatDoc.data().latestMessageDate.toMillis());

        let svgDot = `
            <svg class="svgDot" xmlns="http://www.w3.org/2000/svg">
                <circle class="svgCircle"/>
            </svg>
        `;

        let html = `
            <div class="chatBox ${chatDoc.data().userSeen ? "" : "unread"}" id="${chatDoc.id}">
                <div class="boxHeader">
                    ${chatDoc.data().userSeen ? "" : svgDot}
                    <text class="boxTitle">${clinicName}</text>
                    <text class="boxDate">${formattedDate}</text>
                </div>
                <hr class="solid">
                <div class="boxContent">
                    <text class="contentText">
                        ${messageDoc.data().text}
                    </text>
                </div>
            </div>
        `;

        appendHtml(html, this.leftPanelElem);
    }

    /**
     * Draws message bubbles according to data from given 'messageDoc' document.
     * @param messageDoc 
     */
    drawChatBubbles(messageDoc) {
        let html = ``;
        if (messageDoc.data().sender == "user") {
            html = `<div class="bubbleRight">${messageDoc.data().text}</div>`;
        } else if (messageDoc.data().sender == "clinic") {
            html = `<div class="bubbleLeft">${messageDoc.data().text}</div>`;
        }

        let chatContentElem = this.rightPanelElem.querySelector(".chatContent");
        appendHtml(html, chatContentElem);
    }

    /**
     * Formats input timestamp into string and returns it.
     * @param timestamp
     */
    createDate(timestamp) {
        let dateObj = new Date(timestamp);

        let hours = dateObj.getHours();
        let minutes = dateObj.getMinutes();
        minutes = (minutes < 10 ? "0" : "") + minutes;
        let date = dateObj.getDate();
        let month = dateObj.getMonth() + 1;
        let year = dateObj.getFullYear();

        let formattedDate = hours + ":" + minutes + " ";
        formattedDate += date + "." + month + "." + year;

        return formattedDate;
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        this.leftPanelElem.addEventListener("click", this.leftPanelClickHandlerRef);
        this.rightPanelElem.addEventListener("click", this.rightPanelClickHandlerRef);
        this.messagesElem.addEventListener("scroll", this.scrollHandlerRef);
        window.addEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.leftPanelElem.removeEventListener("click", this.leftPanelClickHandlerRef);
        this.rightPanelElem.removeEventListener("click", this.rightPanelClickHandlerRef);
        this.messagesElem.removeEventListener("scroll", this.scrollHandlerRef);
        window.removeEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * Handles click events on the left panel.
     * @param {Event} event 
     */
    leftPanelClickHandler(event) {
        let chatBoxId = getClickedParentId(event.target, "chatBox");
        if (chatBoxId == undefined) return;

        let activeChatBoxElem = document.querySelector(".chatBox.active");
        if (activeChatBoxElem != undefined) {
            if (activeChatBoxElem.id == chatBoxId) return;
            activeChatBoxElem.classList.remove("active");
        }

        document.getElementById(chatBoxId).classList.add("active");

        this.currChatDocId = chatBoxId;
        this.getMessages(chatBoxId);
    }

    /**
     * Handles click events on the right panel.
     * @param {Event} event 
     */
    async rightPanelClickHandler(event) {
        let chatBtnId = getClickedParentId(event.target, "chatBtn");
        if (chatBtnId != "chatBtn") return;

        let chatInputElem = this.rightPanelElem.querySelector(".chatInput");
        let message = chatInputElem.value;

        if (message.length != 0) {
            chatInputElem.value = "";
            await this.sendMessage(message);
        }
    }

    /**
     * Handles scroll events.
     */
    async scrollHandler() {
        if (this.fetchChatsOnScroll) {
            let triggerHeight = this.leftPanelElem.scrollTop + this.leftPanelElem.offsetHeight;
            if (triggerHeight >= this.leftPanelElem.scrollHeight * TRIGGER_THRESHOLD) {
                this.fetchChatsOnScroll = false;
                await this.getChats();
            }
        }
    }

    /**
     * Handles window resize events.
     */
    async windowResizeHandler() {
        if (this.fetchChatsOnResize) {
            let triggerHeight = this.leftPanelElem.scrollTop + this.leftPanelElem.offsetHeight;
            if (triggerHeight >= this.leftPanelElem.scrollHeight * TRIGGER_THRESHOLD) {
                this.fetchChatsOnResize = false;
                await this.getChats();
            }
        }
    }
}
