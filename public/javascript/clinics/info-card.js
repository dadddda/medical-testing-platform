// constants
import {ANIMATION_DELAY, TIMEOUT_DELAY, MOBILE_M} from "../utils/utils.js";

// functions
import {appendHtml} from "../utils/utils.js";
import * as Window from "../window.js";

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

        this.mouseClickHandlerRef = this.mouseClickHandler.bind(this);
        this.pointerDownHandlerRef = this.pointerDownHandler.bind(this);
    }

    /**
     * Builds new template of HTML element of clinic info card
     * according to given 'clinicInfo' object and renders created
     * element.
     * @param clinicInfo
     */
    drawInfoCard(clinicInfo) {
        let html = `
            <div class="windowHeader" id="windowHeader">
                <text class="windowHeaderText" id="windowHeaderText">${clinicInfo.name}</text>
                <img class="actionBtn" id="closeBtn" src="./svgs/close.svg">
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
                <div class="windowFooterBtns">
                    <button class="windowFooterBtn" id="registerBtn">
                        <span id="registerBtnSpan">Register</span>
                        <img id="registerBtnImg" src="./svgs/close.svg">
                    </button>
                    <button class="windowFooterBtn" id="contactBtn">
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
                this.infoCardElem.style.display = "flex"
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

        this.infoCardElem.style.opacity = 0;
        setTimeout(() => {
            this.infoCardElem.style.display = "none";
            this.infoCardElem.innerHTML = "";
        }, ANIMATION_DELAY);
    }

    /**
     * Adjusts info card element position so that it never goes out of
     * 'this.parentElem' bounds.
     */
    adjustInfoCardElemPos() {
        Window.adjustWindowElemPos(this.infoCardElem, this.parentElem);
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        this.infoCardElem.addEventListener("click", this.mouseClickHandlerRef);
        this.infoCardElem.addEventListener("pointerdown", this.pointerDownHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.infoCardElem.removeEventListener("click", this.mouseClickHandlerRef);
        this.infoCardElem.removeEventListener("pointerdown", this.pointerDownHandlerRef);
    }

    /**
     * Info card mouse click handler.
     * @param {Event} event 
     */
    mouseClickHandler(event) {
        event.preventDefault();

        switch (event.target.id) {
            case "closeBtn":
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
                console.log("contact");
                break;
        }
    }

    /**
     * Window pointer down handler.
     * @param {Event} event 
     */
    pointerDownHandler(event) {
        Window.pointerDownHandler(event, this.infoCardElem, this.parentElem);
    }
}
