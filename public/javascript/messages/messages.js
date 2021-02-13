// constants
const TRIGGER_THRESHOLD = 0.8;
const FETCH_AT_ONCE = 1;

//functions
import {ANIMATION_DELAY, TIMEOUT_DELAY, appendHtml, prependHtml, getClickedParentId} from "../utils/utils.js";
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
     * renders created element. Also attaches Firestore listener to
     * listen to chat document modifications.
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

        let uid = firebase.auth().currentUser.uid;
        let updateChatBoxRef = this.updateChatBox.bind(this);
        this.unsubscribeChat = Database.executeOnChatDocsModify("user", uid, updateChatBoxRef);
    }

    /**
     * Handles dynamic chat fetching on scrolling and window resize events.
     */
    async getChats() {
        let uid = firebase.auth().currentUser.uid;
        let chatDocs = null;
        if (!this.initialized) {
            chatDocs = await Database.fetchChatDocs("user", uid, FETCH_AT_ONCE);
            this.initialized = true;
        } else {
            chatDocs = await Database.fetchChatDocsAfter("user", uid, this.latestDoc, FETCH_AT_ONCE);
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
     * Loads chat messages from a chat document with given ID dynamically by attaching
     * Firestore listener to detect message document modifications.
     * @param {String} chatDocId 
     */
    async getMessages(chatDocId) {
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
        
        let drawChatBubblesRef = this.drawChatBubbles.bind(this);
        this.unsubscribeMsg = Database.executeOnMessageDocsChanges(chatDocId, drawChatBubblesRef);
    }

    /**
     * Sends given message using Firebase functions.
     * @param {String} message 
     */
    async sendMessage(message) {
        await Database.sendMessage("user", message, this.currChatDocId);
    }

    /**
     * Draws chat box according to given chat document.
     * @param chatDoc 
     */
    async drawChatBox(chatDoc) {
        if (chatDoc.data().latestMessageId == undefined) return;
        let html = await this.createChatBox(chatDoc);
        appendHtml(html, this.leftPanelElem);
        setTimeout(() => {
            document.getElementById(chatDoc.id).style.opacity = 1;
        }, TIMEOUT_DELAY);
    }

    /**
     * Updates already drawn chat box according to given new chat document.
     * @param chatDoc 
     */
    async updateChatBox(chatDoc) {
        let chatBoxElem = this.leftPanelElem.querySelector("#" + chatDoc.id);
        let chatBoxData = await this.getChatBoxData(chatDoc);

        let svgDot = "";
        if (this.currChatDocId == chatDoc.id 
                && chatBoxElem.classList.contains("unread") 
                && chatBoxData.svgDot.length == 0) {
            chatBoxElem.classList.remove("unread");
        } else if (this.currChatDocId != chatDoc.id
                && !chatBoxElem.classList.contains("unread")
                && chatBoxData.svgDot.length != 0) {
            chatBoxElem.classList.add("unread");
            svgDot = chatBoxData.svgDot;
        } else if (this.currChatDocId == chatDoc.id
                && !chatBoxElem.classList.contains("unread")
                && chatBoxData.svgDot.length != 0) {
            await Database.markAsRead("user", this.currChatDocId);
        }

        chatBoxElem.id = chatBoxData.id;
        chatBoxElem.getElementsByClassName("boxHeader")[0].innerHTML = `
            ${svgDot}
            <text class="boxTitle">${chatBoxData.clinicName}</text>
            <text class="boxDate">${chatBoxData.formattedDate}</text>
        `.trim();
        chatBoxElem.getElementsByClassName("contentText")[0].innerHTML = chatBoxData.contentText;

        this.leftPanelElem.removeChild(chatBoxElem);
        this.leftPanelElem.prepend(chatBoxElem);
    }

    /**
     * Creates chat box HTML text according to data from given 'chatDoc' document.
     * @param chatDoc 
     */
    async createChatBox(chatDoc) {
        let chatBoxData = await this.getChatBoxData(chatDoc);

        let html = `
            <div class="chatBox${chatBoxData.svgDot.length == 0 ? "" : " unread"}" id="${chatBoxData.id}">
                <div class="boxHeader">
                    ${chatBoxData.svgDot}
                    <text class="boxTitle">${chatBoxData.clinicName}</text>
                    <text class="boxDate">${chatBoxData.formattedDate}</text>
                </div>
                <hr class="solid">
                <div class="boxContent">
                    <text class="contentText">
                        ${chatBoxData.contentText}
                    </text>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Fetches and returnes necessary chat box data using given chat document.
     * @param chatDoc 
     */
    async getChatBoxData(chatDoc) {
        let messageDoc = await Database.fetchMessageDoc(chatDoc.id, chatDoc.data().latestMessageId);
        let clinicDoc = await Database.fetchClinicDoc(chatDoc.data().clinicId);

        let clinicName = clinicDoc.data().name;
        let formattedDate = this.createDate(chatDoc.data().latestMessageDate.toMillis());

        let svgDot = `
            <svg class="svgDot" xmlns="http://www.w3.org/2000/svg">
                <circle class="svgCircle"/>
            </svg>
        `;

        return {
            id: chatDoc.id,
            svgDot: chatDoc.data().userSeen ? "" : svgDot,
            clinicName: clinicName,
            formattedDate: formattedDate,
            contentText: messageDoc.data().text
        }
    }

    /**
     * Draws message bubbles according to data from given 'messageDoc' document.
     * If data is "added" meaning it's a first fetch from the Firestore the HTML
     * elements are appended to 'chatContentElem', if data is "modified" then HTML
     * elements are prepended to 'chatContentElem'. That's because 'chatContentElem'
     * has CSS property of 'flex-direction: column-reverse'.
     * @param messageDoc 
     */
    drawChatBubbles(messageDoc, changeType) {
        let html = ``;
        if (messageDoc.data().sender == "user") {
            html = `<div class="bubbleRight">${messageDoc.data().text}</div>`;
        } else if (messageDoc.data().sender == "clinic") {
            html = `<div class="bubbleLeft">${messageDoc.data().text}</div>`;
        }

        let chatContentElem = this.rightPanelElem.querySelector(".chatContent");
        if (changeType == "added") {
            appendHtml(html, chatContentElem);
        } else if (changeType == "modified") {
            prependHtml(html, chatContentElem);
        }
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
        this.rightPanelElem.addEventListener("click", this.rightPanelClickHandlerRef);
        this.leftPanelElem.addEventListener("click", this.leftPanelClickHandlerRef);
        this.leftPanelElem.addEventListener("scroll", this.scrollHandlerRef);
        window.addEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.rightPanelElem.removeEventListener("click", this.rightPanelClickHandlerRef);
        this.leftPanelElem.removeEventListener("click", this.leftPanelClickHandlerRef);
        this.leftPanelElem.removeEventListener("scroll", this.scrollHandlerRef);
        window.removeEventListener("resize", this.windowResizeHandlerRef);

        if (this.unsubscribeMsg) this.unsubscribeMsg();
        if (this.unsubscribeChat) this.unsubscribeChat();
    }

    /**
     * Handles click events on the left panel. Calls specific functions
     * to fetch appropriate messages and to make given chat "seen" if it's
     * not read.
     * @param {Event} event 
     */
    leftPanelClickHandler(event) {
        let chatBoxId = getClickedParentId(event.target, "chatBox");
        if (chatBoxId == undefined) return;

        let customAnimationDelay = 0;

        let activeChatBoxElem = document.querySelector(".chatBox.active");
        if (activeChatBoxElem != undefined) {
            if (activeChatBoxElem.id == chatBoxId) return;

            activeChatBoxElem.classList.remove("active");
            this.rightPanelElem.style.opacity = 0;
            this.unsubscribeMsg();
            customAnimationDelay = ANIMATION_DELAY;
        }

        let clickedChatBoxElem = document.getElementById(chatBoxId);
        clickedChatBoxElem.classList.add("active");

        setTimeout(async () => {
            this.currChatDocId = chatBoxId;
            if (clickedChatBoxElem.classList.contains("unread")) {
                await Database.markAsRead("user", this.currChatDocId);
            }
            await this.getMessages(chatBoxId);
        }, customAnimationDelay);
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
