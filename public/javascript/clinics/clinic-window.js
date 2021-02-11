// constants
import {ANIMATION_DELAY, TIMEOUT_DELAY, MOBILE_M} from "../utils/utils.js";

// functions
import {appendHtml} from "../utils/utils.js";
import * as Window from "../window.js";
import {ChatWindow} from "./chat-window.js";

export class ClinicWindow {

    /**
     * Constructs new 'ClinicWindow' object with given 'clinicWindowElem'
     * element and given parent element.
     * @param {HTMLElement} clinicWindowElem 
     * @param {HTMLElement} parentElem
     */
    constructor(clinicWindowElem, parentElem) {
        this.clinicWindowElem = clinicWindowElem;
        this.parentElem = parentElem;

        this.currClinicId = null;

        this.mouseClickHandlerRef = this.mouseClickHandler.bind(this);
        this.pointerDownHandlerRef = this.pointerDownHandler.bind(this);
    }

    /**
     * Builds new template of HTML element of clinic window
     * according to given 'clinicInfo' object and renders created
     * element. Also stores ID from given object to use it for
     * messaging purposes.
     * @param clinicInfo
     */
    drawClinicWindow(clinicInfo) {
        this.currClinicId = clinicInfo.id;

        let html = `
            <div class="windowHeader">
                <text class="windowHeaderText">${clinicInfo.name}</text>
                <img class="actionBtn" id="clinicWindowCloseBtn" src="./svgs/close.svg">
            </div>
            <div class="windowContent">
                <dl class="clinicDescription">
                    <dt class="categoryName">Address:</dt>
                    <dd class="categoryDesc">${clinicInfo.address}</dd>
                    <dt class="categoryName">Phone: </dt>
                    <dd class="categoryDesc">${clinicInfo.phone}</dd>
                    <dt class="categoryName">Working Hours:</dt>
                    <dd class="categoryDesc">${clinicInfo.hours}</dd>
                    <dt class="categoryName">Supported Tests:</dt>
                    <dd class="categoryDesc">
                        <ul class="categoryDescList" id="categoryDescList"></ul>
                    </dd>
                </dl>
            </div>
            <div class="windowFooter">
                <hr class="solid">
                <div class="windowDashboard">
                    <button class="windowDashboardBtn" id="registerBtn">
                        <span id="registerBtnSpan">Register</span>
                        <img id="registerBtnImg" src="./svgs/close.svg">
                    </button>
                    <button class="windowDashboardBtn" id="contactBtn">
                        <span id="contactBtnSpan">Contact</span>
                        <img id="contactBtnImg" src="./svgs/contact-icon-light.svg">
                    </button>
                </div>
            </div>
        `;

        appendHtml(html, this.clinicWindowElem);

        setTimeout(() => {
            let categoryDescListElem = document.getElementById("categoryDescList");
            clinicInfo.tests.forEach((testName) => {
                let currListItem = document.createElement("li");
                currListItem.innerHTML = testName;
                categoryDescListElem.appendChild(currListItem);
            });

            setTimeout(() => {
                this.clinicWindowElem.style.display = "flex";
                this.clinicWindowElem.style.opacity = 1;
                this.adjustClinicWindowElemPos();
                this.initListeners();
            }, TIMEOUT_DELAY);
        }, TIMEOUT_DELAY);
    }

    /**
     * Deinitializes listeners, clears clinic window HTML content and sets 
     * it's opacity to 0 and display property to 'none'.
     */
    closeClinicWindow() {
        this.deinitListeners();
        this.currClinicId = null;

        let chatWindowElem = document.getElementById("chatWindow");
        if (chatWindowElem.innerHTML != 0) this.chatWindowObj.closeChatWindow();

        this.clinicWindowElem.style.opacity = 0;
        setTimeout(() => {
            this.clinicWindowElem.style.display = "none";
            this.clinicWindowElem.innerHTML = "";
        }, ANIMATION_DELAY);
    }

    /**
     * Adjusts clinic window and it's child chat window positions so that they never 
     * go out of 'this.parentElem' bounds.
     */
    adjustClinicWindowElemPos() {
        let chatWindowElem = document.getElementById("chatWindow");
        if (chatWindowElem.innerHTML.length != 0) this.chatWindowObj.adjustChatWindowElemPos();

        if (window.innerWidth > MOBILE_M) {
            Window.adjustWindowElemPos(this.clinicWindowElem, this.parentElem);
        }
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        this.clinicWindowElem.addEventListener("click", this.mouseClickHandlerRef);
        let windowHeaderElem = this.clinicWindowElem.querySelector(".windowHeader");
        windowHeaderElem.addEventListener("pointerdown", this.pointerDownHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.clinicWindowElem.removeEventListener("click", this.mouseClickHandlerRef);
        let windowHeaderElem = this.clinicWindowElem.querySelector(".windowHeader");
        windowHeaderElem.removeEventListener("pointerdown", this.pointerDownHandlerRef);
    }

    /**
     * Clinic window mouse click handler.
     * @param {Event} event 
     */
    mouseClickHandler(event) {
        event.preventDefault();

        switch (event.target.id) {
            case "clinicWindowCloseBtn":
                this.closeClinicWindow();
                break;
            case "registerBtn":
            case "registerBtnSpan":
            case "registerBtnImg":
                console.log("register");
                break;
            case "contactBtn":
            case "contactBtnSpan":
            case "contactBtnImg":
                let chatWindowElem = document.getElementById("chatWindow");
                if (chatWindowElem.innerHTML != 0) break;
                this.chatWindowObj = new ChatWindow(chatWindowElem, this.parentElem);
                this.chatWindowObj.drawChatWindow(this.currClinicId);
                break;
        }
    }

    /**
     * Window pointer down handler.
     * @param {Event} event 
     */
    pointerDownHandler(event) {
        if (window.innerWidth > MOBILE_M) {
            Window.pointerDownHandler(event, this.clinicWindowElem, this.parentElem);
        }
    }
}
