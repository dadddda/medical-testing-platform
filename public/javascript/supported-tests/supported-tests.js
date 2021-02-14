// constants
import {ANIMATION_DELAY} from "../utils/utils.js";

// functions
import {appendHtml} from "../utils/utils.js";
import * as Database from "../database.js";

export class SupportedTests {

    /**
     * Constructs new 'SupportedTests' object with given 'supportedTestsElem'
     * element.
     * @param {HTMLElement} supportedTestsElem 
     */
    constructor(supportedTestsElem) {
        this.supportedTestsElem = supportedTestsElem;
        this.inputUpdateHandlerRef = this.inputUpdateHandler.bind(this);
        this.testBoxData = new Map();
    }

    /**
     * Fetches supported tests data from Firestore database, builds main content
     * and appends new test box elements.
     */
    async drawContent() {
        let html = `
            <div class="searchBox">
                <input class="searchBoxInput" id="searchField" placeholder="Search..."></input>
            </div>
            <div class="testBoxes"></div>
        `;

        appendHtml(html, this.supportedTestsElem);

        let supportedTestDocs = await Database.fetchSupportedTestDocs();
        let testBoxes = this.supportedTestsElem.querySelector(".testBoxes");
        supportedTestDocs.forEach((doc) => {
            this.testBoxData.set(doc.id, doc.data().title);

            let html = `
                <div class="testBox" id="${doc.id}">
                    <div class="titleBox">
                        <text>${doc.data().title}</text>
                    </div>
                    <hr class="solid">
                    <div class="contentBox">
                        <text>${doc.data().content}</text>
                    </div>
                </div>
            `;

            appendHtml(html, testBoxes);
        });
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        this.supportedTestsElem.addEventListener("input", this.inputUpdateHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.supportedTestsElem.removeEventListener("input", this.inputUpdateHandlerRef);
    }

    /**
     * Handles page input updates.
     * @param {Event} event 
     */
    inputUpdateHandler(event) {
        if (event.target.id == "searchField") {
            let searchFieldValue = event.target.value.toLowerCase();

            this.testBoxData.forEach((value, key) => {
                let currTestBoxElem = document.getElementById(key);
                let currTestBoxTitle = value.toLowerCase();

                if (currTestBoxTitle.includes(searchFieldValue)) this.showTestBox(currTestBoxElem);
                else this.hideTestBox(currTestBoxElem);
            });
        }
    }

    /**
     * Unhides given text box by applying opacity value of
     * one and after animation display value of "flex". 
     * @param {HTMLElement} testBoxElem 
     */
    showTestBox(testBoxElem) {
        testBoxElem.style.opacity = 1;
        setTimeout(() => {
            testBoxElem.style.display = "flex";
        }, ANIMATION_DELAY);
    }

    /**
     * Hides given text box by applying opacity value of
     * zero and after animation display value of "none".
     * @param {HTMLElement} testBoxElem 
     */
    hideTestBox(testBoxElem) {
        testBoxElem.style.opacity = 0;
        setTimeout(() => {
            testBoxElem.style.display = "none";
        }, ANIMATION_DELAY);
    }
}
