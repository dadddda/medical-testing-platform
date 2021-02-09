// constants
const triggerThreshold = 0.8;
import {ANIMATION_DELAY} from "../utils/utils.js";

// functions
import {appendHtml} from "../utils/utils.js";

export class NewsFeed {

    /**
     * Constructs new 'NewsFeed' object with given 'newsFeedElem'
     * element.
     * @param newsFeedElem 
     */
    constructor(newsFeedElem) {
        this.newsFeedElem = newsFeedElem;
        this.newsRef = firebase.firestore().collection("news");
        this.storageRef = firebase.storage();
        this.latestInit = false;
        this.latestDoc = null;
        this.moreBtnClicked = false;
    
        this.clickHandlerRef = this.clickHandler.bind(this);
        this.scrollHandlerRef = this.scrollHandler.bind(this);
        
        this.newsHeaderImgLoadHandlerRef = this.newsHeaderImgLoadHandler.bind(this);

        this.windowResizeHandlerRef = this.windowResizeHandler.bind(this);
        this.fetchNewsOnScroll = true;
        this.fetchNewsOnResize = true;

        this.observerHandlerRef = this.observerHandler.bind(this);
        this.observer = new MutationObserver(this.observerHandlerRef);
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Fetches data from Firestore database. Calls appropriate
     * functions to build and append HTML elements. Manages scroll
     * event listener and window resize event listener and ensures 
     * that the whole page will be covered with news articles at the 
     * initial startup and after scroll events.
     */
    async getNews() {
        let data = null;
        if (!this.latestInit) {
            data = await this.newsRef
                .orderBy("date", "desc")
                .get();

            this.latestDoc = data.docs[0];
            this.latestInit = true;

            data = await this.newsRef
                .orderBy("date", "desc")
                .startAt(this.latestDoc)
                .limit(2)
                .get();
        } else {
            data = await this.newsRef
                .orderBy("date", "desc")
                .startAfter(this.latestDoc)
                .limit(2)
                .get();
        }

        for (let i = 0; i < data.docs.length; i++) {
            let doc = data.docs[i];
            let newsData = await this.fetchNewsData(doc);
            
            newsData.content = newsData.content.replace(/(?:\r\n|\r|\n)/g, "<br>");
            this.buildAndAppendNews(newsData);
        }

        this.latestDoc = data.docs[data.docs.length - 1];

        if (data.empty) {
            this.fetchNewsOnScroll = false;
            this.fetchNewsOnResize = false;
        } else {
            let triggerHeight = this.newsFeedElem.scrollTop + this.newsFeedElem.offsetHeight;
            if (triggerHeight >= this.newsFeedElem.scrollHeight * triggerThreshold) {
                this.getNews();
            }
            this.fetchNewsOnScroll = true;
            this.fetchNewsOnResize = true;
        }
    }

    /**
     * Builds new template of HTML element of news feed 
     * according to given data and calls 'appendHtml()'
     * function.
     * @param newsData
     */
    buildAndAppendNews(newsData) {
        let formattedDate = this.createDate(newsData.timestamp);
        let wordCount = this.countWords(newsData.content);

        let moreBtn = "";
        if (wordCount > 128) {
            newsData.content = this.substrWords(newsData.content, 64);
            newsData.content += "...";
            moreBtn = `
                <div class="moreBtnContainer">
                    <button class="moreBtn" id="moreBtn">More</button>
                </div>
            `;
        }

        let html = `
            <div class="news" id="${newsData.id}">
                <div class="newsHeader">
                    <div class="newsTitle">
                        ${newsData.title}
                    </div>
                    <div class="newsDate">
                        ${formattedDate}
                    </div>
                </div>
                <hr class="solid">
                <img class="newsHeaderImg" src="${newsData.headerUrl}">
                <hr class="solid">
                <div class="newsContent">
                    ${newsData.content}
                </div>
                ${moreBtn}
            </div>
        `;

        appendHtml(html, this.newsFeedElem);
    }

    /**
     * According to given 'id' builds new template of HTML element of expanded
     * type of news and renders it by calling 'appendHtml()'.
     * @param {String} id
     */
    async drawOpenedNews(id) {
        let docRef = this.newsRef.doc(id);

        await docRef.get()
        .then(async doc => {
            if (doc.exists) {
                let newsData = await this.fetchNewsData(doc);

                newsData.content = newsData.content.replace(/(?:\r\n|\r|\n)/g, "<br>");
                let html = `
                    <div class="openedNewsBackground" style="top: ${this.newsFeedElem.scrollTop}px;"></div>
                    <div class="openedNews" style="top: ${this.newsFeedElem.scrollTop}px;">
                        <div class="openedNewsTitle">
                            <text class="titleText">${newsData.title}</text>
                            <img class="actionBtn" id="closeBtn" src="./svgs/close-black.svg">
                        </div>
                        <hr class="solid">
                        <div class="openedNewsContent">
                            ${newsData.content}
                        </div>
                    </div>
                `;

                appendHtml(html, this.newsFeedElem);
            } else {
                console.log("No such document.");
            }
        }).catch(error => {
            console.log("Error: ", error);
        });
    }

    /**
     * Extracts necessary information from given document object
     * and returns an object containing those data.
     * @param doc 
     */
    async fetchNewsData(doc) {
        let id = doc.id;
        let title = doc.data().title;
        let timestamp = doc.data().date.toMillis();
        let content = "";
        let headerUrl = "";

        let contentRef = this.storageRef.ref(`news/${id}/content.txt`);
        await contentRef.getDownloadURL()
        .then(async url => {
            await fetch(url)
            .then(async data => {
                await data.text()
                .then(text => {
                    content = text;
                });
            });
        }).catch((error) => {
            console.log("Error: ", error);
        });

        let headerRef = this.storageRef.ref(`news/${id}/header.jpg`);
        await headerRef.getDownloadURL()
        .then(url => {
            headerUrl = url;
        }).catch((error) => {
            console.log("Error: ", error);
        });

        return {
            id: id,
            title: title,
            timestamp: timestamp,
            content: content,
            headerUrl: headerUrl
        };
    }

    /**
     * Formats input timestamp number into string and
     * returns it.
     * @param {number} timestamp
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
     * Returns rough word count in given string.
     * @param {String} string 
     */
    countWords(string) {
        let wordCount = 0;
        for (let i = 0; i < string.length; i++) {
            if (string[i] == ' ') wordCount++;
        }

        return wordCount;
    }

    /**
     * Returns 'wordCount' number of words as string from given 'string'.
     * @param {String} string
     * @param {Number} wordCount 
     */
    substrWords(string, wordCountLim) {
        let substr = "";
        let wordCount = 0;
        let word = "";
        for (let i = 0; i < string.length; i++) {
            if (string[i] == ' ') {
                substr += word;
                wordCount++;
                word = "";

                if (wordCount < wordCountLim) substr += ' ';
                else i = string.length;
            } else {
                word += string[i];
            }
        }

        return substr;
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        this.newsFeedElem.addEventListener("click", this.clickHandlerRef);
        this.newsFeedElem.addEventListener("scroll", this.scrollHandlerRef);
        window.addEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.newsFeedElem.removeEventListener("click", this.clickHandlerRef);
        this.newsFeedElem.removeEventListener("scroll", this.scrollHandlerRef);
        window.removeEventListener("resize", this.windowResizeHandlerRef);

        this.observer.disconnect();
    }

    /**
     * Handles DOM mutations.
     * @param mutations 
     */
    async observerHandler(mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.classList.contains("news")) {
                    let newsHeaderImgElem = node.querySelector(".newsHeaderImg");
                    newsHeaderImgElem.addEventListener("load", this.newsHeaderImgLoadHandlerRef);
                }
            }
        }
    }

    /**
     * Handles click events.
     * @param {Event} event 
     */
    clickHandler(event) {
        if (event.target.id == "moreBtn" && this.moreBtnClicked == false) {
            this.moreBtnClicked = true;
            this.newsFeedElem.style.overflow = "hidden";
            let parentElem = event.target.parentElement.parentElement;
            this.drawOpenedNews(parentElem.id);
        } else if (event.target.id == "closeBtn") {
            this.moreBtnClicked = false;
            this.newsFeedElem.style.overflow = "overlay";

            let openedNewsBackgroundElem = document.getElementsByClassName("openedNewsBackground")[0];
            let openedNewsElem = document.getElementsByClassName("openedNews")[0];
            openedNewsBackgroundElem.style.opacity = 0;
            openedNewsElem.style.opacity = 0;

            setTimeout(() => {
                this.newsFeedElem.removeChild(openedNewsBackgroundElem);
                this.newsFeedElem.removeChild(openedNewsElem);
            }, ANIMATION_DELAY);
        }
    }

    /**
     * Handles scroll events and if necessary calls getNews() function
     * to fetch additional data.
     */
    scrollHandler() {
        if (this.fetchNewsOnScroll) {
            let triggerHeight = this.newsFeedElem.scrollTop + this.newsFeedElem.offsetHeight;
            if (triggerHeight >= this.newsFeedElem.scrollHeight * triggerThreshold) {
                this.fetchNewsOnScroll = false;
                this.getNews();
            }
        }
    }

    /**
     * Executes script for each fully loaded 'newsHeaderImg'.
     * @param {Event} event
     */
    newsHeaderImgLoadHandler(event) {
        let newsHeaderImgElem = event.target;
        newsHeaderImgElem.removeEventListener("load", this.newsHeaderImgLoadHandlerRef);

        newsHeaderImgElem.parentElement.style.opacity = 1;
    }

    /**
     * Handles window resize events and if necessary calls getNews() function
     * to fetch additional data.
     */
    windowResizeHandler() {
        if (this.moreBtnClicked) {
            let openedNewsBackgroundElem = document.getElementsByClassName("openedNewsBackground")[0];
            let openedNewsElem = document.getElementsByClassName("openedNews")[0];
            openedNewsBackgroundElem.style.top = `${this.newsFeedElem.scrollTop}px`;
            openedNewsElem.style.top = `${this.newsFeedElem.scrollTop}px`;
        }

        if (this.fetchNewsOnResize) {
            let triggerHeight = this.newsFeedElem.scrollTop + this.newsFeedElem.offsetHeight;
            if (triggerHeight >= this.newsFeedElem.scrollHeight * triggerThreshold) {
                this.fetchNewsOnResize = false;
                this.getNews();
            }
        }
    }
}
