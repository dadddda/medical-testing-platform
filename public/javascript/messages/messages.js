// constants
const TRIGGER_THRESHOLD = 0.8;
const FETCH_AT_ONCE = 4;
import {ANIMATION_DELAY, TIMEOUT_DELAY, MOBILE_L} from "../utils/utils.js";

//functions
import {appendHtml, prependHtml, getClickedParent} from "../utils/utils.js";
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
            <div class="leftPanel" id="messagesLeftPanel">
                <div class="infoContainer">
                    <text class="infoText">
                        No chats yet
                    </text>
                </div>
            </div>
            <div class="rightPanel" id="messagesRightPanel">
                <div class="infoContainer">
                    <text class="infoText">
                        Open a chat to see messages
                    </text>
                </div>
            </div>
        `;

        appendHtml(html, this.messagesElem);

        this.leftPanelElem = document.getElementById("messagesLeftPanel");
        this.rightPanelElem = document.getElementById("messagesRightPanel");
        await this.getChats();

        let uid = firebase.auth().currentUser.uid;
        let updateChatBoxRef = this.updateChatBox.bind(this);
        this.unsubscribeChat = Database.executeOnChatDocsChanges("user", uid, updateChatBoxRef);
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
            this.drawChatBox(currDoc);
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
                <form class="chatDashboard" id="chatForm" novalidate>
                    <img class="responsiveCloseBtn" src="./svgs/close-black.svg">
                    <input class="chatInput" type="text" placeholder="Type a message...">
                    <button class="chatBtn" type="submit">
                        <img src="./svgs/send-msg-icon.svg">
                    </button>
                </form>
            </div>
        `;

        appendHtml(html, this.rightPanelElem);

        let messageDocs = await Database.fetchMessageDocs(chatDocId);
        this.appendCount = messageDocs.length;

        this.chatFormHandlerRef = this.chatFormHandler.bind(this);
        this.chatFormElem = document.getElementById("chatForm");
        this.chatFormElem.addEventListener("submit", this.chatFormHandlerRef);
        
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
     * Draws chat box according to given chat document. If the chat box is the first
     * one to be drawn, info text is removed from the left panel.
     * @param chatDoc 
     */
    async drawChatBox(chatDoc) {
        if (chatDoc.data().latestMessageId == undefined) return;

        if (!this.firstChatBox) {
            this.leftPanelElem.querySelector(".infoContainer").style.opacity = 0;
            setTimeout(() => {
                this.leftPanelElem.querySelector(".infoContainer").style.display = "none";
                this.leftPanelElem.style.alignItems = "flex-start";
                this.leftPanelElem.style.justifyContent = "flex-start";
                this.leftPanelElem.style.padding = "10px 10px 0 10px";
            }, ANIMATION_DELAY);

            this.firstChatBox = false;
        }

        let html = await this.createChatBox(chatDoc);
        appendHtml(html, this.leftPanelElem);
        setTimeout(() => {
            document.getElementById(chatDoc.id).style.opacity = 1;
        }, TIMEOUT_DELAY);
    }

    /**
     * Updates already drawn chat box according to given new chat document.
     * @param chatDoc 
     * @param changeType
     */
    async updateChatBox(chatDoc, changeType) {
        if (changeType == "added") return;

        let chatBoxElem = this.leftPanelElem.querySelector("#" + chatDoc.id);
        let chatBoxData = await this.getChatBoxData(chatDoc);

        let dot = "";
        if (this.currChatDocId == chatDoc.id 
                && chatBoxElem.classList.contains("unread") 
                && chatBoxData.dot.length == 0) {
            chatBoxElem.classList.remove("unread");
        } else if (this.currChatDocId != chatDoc.id
                && !chatBoxElem.classList.contains("unread")
                && chatBoxData.dot.length != 0) {
            chatBoxElem.classList.add("unread");
            dot = chatBoxData.dot;
        } else if (this.currChatDocId == chatDoc.id
                && !chatBoxElem.classList.contains("unread")
                && chatBoxData.dot.length != 0) {
            await Database.markAsRead("user", this.currChatDocId);
        }

        chatBoxElem.id = chatBoxData.id;
        chatBoxElem.getElementsByClassName("boxHeader")[0].innerHTML = `
            ${dot}
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
            <div class="chatBox${chatBoxData.dot.length == 0 ? "" : " unread"}" id="${chatBoxData.id}">
                <div class="boxHeader">
                    ${chatBoxData.dot}
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

        let dot = `<div class="dot"></div>`;

        return {
            id: chatDoc.id,
            dot: chatDoc.data().userSeen ? "" : dot,
            clinicName: clinicName,
            formattedDate: formattedDate,
            contentText: messageDoc.data().text
        }
    }

    /**
     * Draws message bubbles according to data from given 'messageDoc' document.
     * If 'this.appendCount' is more than zero this means that it's a first fetch 
     * from the Firestore database and the HTML elements are appended to 'chatContentElem', 
     * if 'this.appendCount' equals zero that means that every element that was already in
     * database is fetched and next HTML elements will prepended to 'chatContentElem'. 
     * That's because 'chatContentElem' has CSS property of 'flex-direction: column-reverse'.
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
        if (this.appendCount > 0) {
            appendHtml(html, chatContentElem);
            this.appendCount--;
        } else {
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
        this.leftPanelElem.addEventListener("click", this.leftPanelClickHandlerRef);
        this.leftPanelElem.addEventListener("scroll", this.scrollHandlerRef);
        this.rightPanelElem.addEventListener("click", this.rightPanelClickHandlerRef);
        window.addEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.leftPanelElem.removeEventListener("click", this.leftPanelClickHandlerRef);
        this.leftPanelElem.removeEventListener("scroll", this.scrollHandlerRef);
        this.rightPanelElem.removeEventListener("click", this.rightPanelClickHandlerRef);
        window.removeEventListener("resize", this.windowResizeHandlerRef);

        if (this.chatFormElem) this.chatFormElem.removeEventListener("submit", this.chatFormHandlerRef);
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
        let chatBox = getClickedParent(event.target, "chatBox");
        if (chatBox == undefined) return;
        let chatBoxId = chatBox.id;

        let activeChatBoxElem = document.querySelector(".chatBox.active");
        if (activeChatBoxElem != undefined) {
            if (activeChatBoxElem.id == chatBoxId) return;

            activeChatBoxElem.classList.remove("active");
            this.chatFormElem.removeEventListener("submit", this.chatFormHandlerRef);
            this.unsubscribeMsg();
            this.rightPanelElem.style.opacity = 0;
        } else {
            this.rightPanelElem.style.display = "flex";
            this.rightPanelElem.style.backgroundColor = "rgb(250, 250, 250)";

            let infoContainerElem = this.rightPanelElem.querySelector(".infoContainer");
            if (infoContainerElem != undefined) {
                infoContainerElem.style.opacity = 0;
                setTimeout(() => {
                    this.rightPanelElem.querySelector(".infoContainer").style.display = "none";
                }, ANIMATION_DELAY);
            }
        }

        let clickedChatBoxElem = document.getElementById(chatBoxId);
        clickedChatBoxElem.classList.add("active");

        setTimeout(async () => {
            this.currChatDocId = chatBoxId;
            if (clickedChatBoxElem.classList.contains("unread")) {
                await Database.markAsRead("user", this.currChatDocId);
            }
            await this.getMessages(chatBoxId);
        }, ANIMATION_DELAY);
    }

    /**
     * Handles responsive close button click event.
     * @param {Event} event 
     */
    rightPanelClickHandler(event) {
        if (event.target.classList.contains("responsiveCloseBtn")) {
            this.currChatDocId = undefined;
            
            let activeChatBoxElem = document.querySelector(".chatBox.active");
            activeChatBoxElem.classList.remove("active");

            this.chatFormElem.removeEventListener("submit", this.chatFormHandlerRef);
            this.unsubscribeMsg();
            this.rightPanelElem.style.opacity = 0;
            setTimeout(() => {
                this.rightPanelElem.style.display = "none";
            }, ANIMATION_DELAY);
        }
    }

    /**
     * Handles submit events of chat content dashboard.
     * @param {Event} event 
     */
    async chatFormHandler(event) {
        event.preventDefault();

        let chatInputElem = this.chatFormElem.querySelector(".chatInput");
        let message = chatInputElem.value;

        if (message.length != 0) {
            chatInputElem.value = "";
            chatInputElem.select();
            chatInputElem.focus();
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
