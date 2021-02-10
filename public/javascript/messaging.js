// constants
import {ANIMATION_DELAY, TIMEOUT_DELAY} from "./utils/utils.js";

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

        this.mouseClickHandlerRef = this.mouseClickHandler.bind(this);
    }

    /**
     * Builds new template of HTML element of messaging window and renders 
     * created element.
     */
    drawMessagingWindow() {
        let html = `
            <div class="windowHeader">
                <text class="windowHeaderText">Messaging</text>
                <img class="actionBtn" id="closeBtn" src="./svgs/close.svg">
            </div>
            <div class="windowContent">
                <div class="messagingContent"></div>
            </div>
            <div class="windowFooter">
                <hr class="solid">
                <div class="windowDashboard">
                    <input class="windowDashboardInput" type="text"></input>
                    <button class="windowDashboardBtn">
                        <img src="./svgs/send-msg-icon.svg">
                    </button>
                </div>
            </div>
        `;

        appendHtml(html, this.messagingElem);

        setTimeout(() => {
            this.messagingElem.style.display = "flex";
            this.messagingElem.style.opacity = 1;
            this.adjustMessagingElemPos();
            this.initListeners();
        }, TIMEOUT_DELAY);
    }

    /**
     * Deinitializes listeners, clears messaging window HTML content and sets 
     * it's opacity to 0 and display property to 'none'.
     */
    closeInfoCard() {
        this.deinitListeners();

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
        Window.adjustWindowElemPos(this.messagingElem, this.parentElem);
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        this.messagingElem.addEventListener("click", this.mouseClickHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.messagingElem.removeEventListener("click", this.mouseClickHandlerRef);
    }

    /**
     * Messaging window mouse click handler.
     * @param {Event} event 
     */
    mouseClickHandler(event) {
        event.preventDefault();

        switch (event.target.id) {
            case "closeBtn":
                this.closeInfoCard();
                break;
        }
    }
}
