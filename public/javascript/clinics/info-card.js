// constants
import {ANIMATION_DELAY, TIMEOUT_DELAY, MOBILE_M} from "../utils/utils.js";

// functions
import {appendHtml} from "../utils/utils.js";
import * as Window from "../window.js";
import {Messaging} from "../messaging.js";

export class InfoCard {

    /**
     * Constructs new 'InfoCard' object with given 'infoCardElem'
     * element and given parent element.
     * @param {HTMLElement} infoCardElem 
     * @param {HTMLElement} parentElem
     */
    constructor(infoCardElem, parentElem) {
        this.infoCardElem = infoCardElem;
        this.parentElem = parentElem;

        this.currClinicId = null;

        this.mouseClickHandlerRef = this.mouseClickHandler.bind(this);
        this.pointerDownHandlerRef = this.pointerDownHandler.bind(this);
    }

    /**
     * Builds new template of HTML element of clinic info card
     * according to given 'clinicInfo' object and renders created
     * element. Also stores ID from given object to use it for
     * messaging purposes.
     * @param clinicInfo
     */
    drawInfoCard(clinicInfo) {
        this.currClinicId = clinicInfo.id;

        let html = `
            <div class="windowHeader">
                <text class="windowHeaderText">${clinicInfo.name}</text>
                <img class="actionBtn" id="infoCardCloseBtn" src="./svgs/close.svg">
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

        appendHtml(html, this.infoCardElem);

        setTimeout(() => {
            let categoryDescListElem = document.getElementById("categoryDescList");
            clinicInfo.tests.forEach((testName) => {
                let currListItem = document.createElement("li");
                currListItem.innerHTML = testName;
                categoryDescListElem.appendChild(currListItem);
            });

            setTimeout(() => {
                this.infoCardElem.style.display = "flex";
                this.infoCardElem.style.opacity = 1;
                this.adjustInfoCardElemPos();
                this.initListeners();
            }, TIMEOUT_DELAY);
        }, TIMEOUT_DELAY);
    }

    /**
     * Deinitializes listeners, clears info card HTML content and sets 
     * it's opacity to 0 and display property to 'none'.
     */
    closeInfoCard() {
        this.deinitListeners();
        this.currClinicId = null;

        let messagingElem = document.getElementById("messaging");
        if (messagingElem.innerHTML != 0) this.messagingObj.closeMessagingWindow();

        this.infoCardElem.style.opacity = 0;
        setTimeout(() => {
            this.infoCardElem.style.display = "none";
            this.infoCardElem.innerHTML = "";
        }, ANIMATION_DELAY);
    }

    /**
     * Adjusts info card and it's child messaging window positions so that they never 
     * go out of 'this.parentElem' bounds.
     */
    adjustInfoCardElemPos() {
        let messagingElem = document.getElementById("messaging");
        if (messagingElem.innerHTML.length != 0) this.messagingObj.adjustMessagingElemPos();

        if (window.innerWidth > MOBILE_M) {
            Window.adjustWindowElemPos(this.infoCardElem, this.parentElem);
        }
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        this.infoCardElem.addEventListener("click", this.mouseClickHandlerRef);
        let infoCardHeaderElem = this.infoCardElem.getElementsByClassName("windowHeader")[0];
        infoCardHeaderElem.addEventListener("pointerdown", this.pointerDownHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.infoCardElem.removeEventListener("click", this.mouseClickHandlerRef);
        let infoCardHeaderElem = this.infoCardElem.getElementsByClassName("windowHeader")[0];
        infoCardHeaderElem.removeEventListener("pointerdown", this.pointerDownHandlerRef);
    }

    /**
     * Info card mouse click handler.
     * @param {Event} event 
     */
    mouseClickHandler(event) {
        event.preventDefault();

        switch (event.target.id) {
            case "infoCardCloseBtn":
                this.closeInfoCard();
                break;
            case "registerBtn":
            case "registerBtnSpan":
            case "registerBtnImg":
                console.log("register");
                break;
            case "contactBtn":
            case "contactBtnSpan":
            case "contactBtnImg":
                let messagingElem = document.getElementById("messaging");
                if (messagingElem.innerHTML != 0) break;
                this.messagingObj = new Messaging(messagingElem, this.parentElem);
                this.messagingObj.drawMessagingWindow(this.currClinicId);
                break;
        }
    }

    /**
     * Window pointer down handler.
     * @param {Event} event 
     */
    pointerDownHandler(event) {
        if (window.innerWidth > MOBILE_M) {
            Window.pointerDownHandler(event, this.infoCardElem, this.parentElem);
        }
    }
}
