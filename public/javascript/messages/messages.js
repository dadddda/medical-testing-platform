// constants
const TRIGGER_THRESHOLD = 0.8;

//functions
import {appendHtml, getClickedParentId} from "../utils/utils.js";
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

        this.clickHandlerRef = this.clickHandler.bind(this);
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
            <div class="rightPanel"></div>
        `;

        appendHtml(html, this.messagesElem);

        this.leftPanelElem = document.getElementById("messagesLeftPanel");
        await this.getChats();
    }

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
     * 
     * @param chatDoc 
     */
    async drawChatBox(chatDoc) {
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
        this.messagesElem.addEventListener("click", this.clickHandlerRef);
        this.messagesElem.addEventListener("scroll", this.scrollHandlerRef);
        window.addEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.messagesElem.removeEventListener("click", this.clickHandlerRef);
        this.messagesElem.removeEventListener("scroll", this.scrollHandlerRef);
        window.removeEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * 
     * @param {Event} event 
     */
    clickHandler(event) {
        let chatBoxId = getClickedParentId(event.target, "chatBox");
        if (chatBoxId == undefined) return;

        let activeChatBoxElem = document.querySelector(".chatBox.active");
        if (activeChatBoxElem != undefined) {
            if (activeChatBoxElem.id == chatBoxId) return;
            activeChatBoxElem.classList.remove("active");
        }

        document.getElementById(chatBoxId).classList.add("active");

        console.log(chatBoxId);
    }

    /**
     * 
     * @param {Event} event 
     */
    async scrollHandler(event) {
        if (this.fetchChatsOnScroll) {
            let triggerHeight = this.leftPanelElem.scrollTop + this.leftPanelElem.offsetHeight;
            if (triggerHeight >= this.leftPanelElem.scrollHeight * TRIGGER_THRESHOLD) {
                this.fetchChatsOnScroll = false;
                await this.getChats();
            }
        }
    }

    /**
     * 
     * @param {Event} event 
     */
    async windowResizeHandler(event) {
        if (this.fetchChatsOnResize) {
            let triggerHeight = this.leftPanelElem.scrollTop + this.leftPanelElem.offsetHeight;
            if (triggerHeight >= this.leftPanelElem.scrollHeight * TRIGGER_THRESHOLD) {
                this.fetchChatsOnResize = false;
                await this.getChats();
            }
        }
    }
}
