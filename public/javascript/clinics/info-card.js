// constants
import {ANIMATION_DELAY, TIMEOUT_DELAY, MOBILE_M} from "../utils/utils.js";

// functions
import {appendHtml} from "../utils/utils.js";

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
        this.pointerMoveHandlerRef = this.pointerMoveHandler.bind(this);
        this.pointerUpHandlerRef = this.pointerUpHandler.bind(this);
    }

    /**
     * Builds new template of HTML element of clinic info card
     * according to given 'clinicInfo' object and renders created
     * element.
     * @param clinicInfo
     */
    drawInfoCard(clinicInfo) {
        if (clinicInfo.id == this.lastClinicId) return;
        this.lastClinicId = clinicInfo.id;

        let html = `
            <div class="clinicName" id="clinicName">
                <text class="nameText" id="nameText">${clinicInfo.name}</text>
                <img class="actionBtn" id="closeBtn" src="./svgs/close.svg">
            </div>
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
            <div class="clinicDashboard">
                <hr class="solid">
                <div class="dashboardBtns">
                    <button class="dashboardBtn" id="registerBtn">
                        <span id="registerBtnSpan">Register</span>
                        <img id="registerBtnImg" src="./svgs/close.svg">
                    </button>
                    <button class="dashboardBtn" id="contactBtn">
                        <span id="contactBtnSpan">Contact</span>
                        <img id="contactBtnImg" src="./svgs/contact-icon-light.svg">
                    </button>
                </div>
            </div>
        `;
        let currAnimationDelay = ANIMATION_DELAY;
        if (this.infoCardElem.innerHTML.length == 0) {
            currAnimationDelay = 0;
            this.infoCardElem.style.display = "flex";
        }

        this.infoCardElem.style.opacity = 0;
        setTimeout(() => {
            this.infoCardElem.innerHTML = "";
            appendHtml(html, this.infoCardElem);

            setTimeout(() => {
                let categoryDescListElem = document.getElementById("categoryDescList");
                clinicInfo.tests.forEach((testName) => {
                    let currListItem = document.createElement("li");
                    currListItem.innerHTML = testName;
                    categoryDescListElem.appendChild(currListItem);
                });

                setTimeout(() => {
                    this.adjustCardElemPos();
                }, TIMEOUT_DELAY);
            }, TIMEOUT_DELAY);

            this.infoCardElem.style.opacity = `${100}%`;
        }, currAnimationDelay);
    }

    /**
     * Clears info card HTML content and sets it's display property
     * to 'none'.
     */
    closeInfoCard() {
        this.lastClinicId = null;

        this.infoCardElem.style.opacity = 0;
        setTimeout(() => {
            this.infoCardElem.innerHTML = "";
            this.infoCardElem.style.display = "none";
        }, ANIMATION_DELAY);
    }

    /**
     * Adjusts info card element position so that it never goes out of
     * 'this.parentElem' bounds.
     */
    adjustCardElemPos() {
        if (window.innerWidth <= MOBILE_M) return;
        if (this.infoCardElem.innerHTML.length == 0) return;

        let parentElemBr = this.parentElem.getBoundingClientRect();
        let infoCardElemBr = this.infoCardElem.getBoundingClientRect();

        let left = infoCardElemBr.left - parentElemBr.left;
        let top = infoCardElemBr.top - parentElemBr.top;

        let overflowX = parentElemBr.width - (left + infoCardElemBr.width);
        let overflowY = parentElemBr.height - (top + infoCardElemBr.height);

        if (left <= 0) {
            this.infoCardElem.style.left = 0;
        } else {
            if (overflowX < 0) this.infoCardElem.style.left = `${left + overflowX}px`;
        }

        if (top <= 0) {
            this.infoCardElem.style.top = 0;
        } else {
            if (overflowY < 0) this.infoCardElem.style.top = `${top + overflowY}px`;
        }
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
        let closeBtnElem = document.getElementById("closeBtn");
        if (closeBtnElem) closeBtnElem.removeEventListener("click", this.mouseClickHandlerRef);
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
     * Info card pointer down handler.
     * @param {Event} event 
     */
    pointerDownHandler(event) {
        event.preventDefault();

        if (window.innerWidth <= MOBILE_M) return;
        if (event.target.id != "clinicName" && event.target.id != "nameText") return;
        let clinicNameElem = document.getElementById("clinicName");
        clinicNameElem.style.cursor = "grabbing";
        
        this.cardPos = {
            x: event.clientX,
            y: event.clientY
        };
        
        document.addEventListener("pointermove", this.pointerMoveHandlerRef);
        document.addEventListener("pointerup", this.pointerUpHandlerRef);
    }

    /**
     * Info card pointer move handler.
     * @param {Event} event 
     */
    pointerMoveHandler(event) {
        event.preventDefault();
        let parentElemBr = this.parentElem.getBoundingClientRect();
        let infoCardElemBr = this.infoCardElem.getBoundingClientRect();

        const dx = event.clientX - this.cardPos.x;
        const dy = event.clientY - this.cardPos.y;

        this.cardPos = {
            x: event.clientX,
            y: event.clientY
        };

        let left = infoCardElemBr.left - parentElemBr.left;
        let top = infoCardElemBr.top - parentElemBr.top;

        left += dx;
        top += dy;

        if (left >= 0 && left <= parentElemBr.width - infoCardElemBr.width) {
            this.infoCardElem.style.left = `${left}px`;
        }
        if (top >= 0 && top <= parentElemBr.height - infoCardElemBr.height) {
            this.infoCardElem.style.top = `${top}px`;
        }
    }

    /**
     * Info card pointer up handler.
     */
    pointerUpHandler(event) {
        event.preventDefault();
        let clinicNameElem = document.getElementById("clinicName");
        clinicNameElem.style.cursor = "grab";

        document.removeEventListener("pointermove", this.pointerMoveHandlerRef);
        document.removeEventListener("pointerup", this.pointerUpHandlerRef);
    }
}
