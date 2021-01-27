// constants
const triggerThreshold = 0.8;

class NewsFeed {

    /**
     * Constructs new 'NewsFeed' object with given 'newsFeedElem'
     * element.
     * @param newsFeedElem 
     */
    constructor(newsFeedElem) {
        this.newsFeedElem = newsFeedElem;
        this.newsRef = firebase.firestore().collection("news");
        this.latestInit = false;
        this.latestDoc = null;
    
        this.clickHandlerRef = this.clickHandler.bind(this);
        this.scrollHandlerRef = this.scrollHandler.bind(this);
        this.windowResizeHandlerRef = this.windowResizeHandler.bind(this);
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
    
        data.docs.forEach(doc => {
            let id = doc.id;
            let title = doc.data().title;
            let timestamp = doc.data().date.toMillis();
            let content = doc.data().content;
            
            content = content.replaceAll("\\n", "<br><br>");
            
            let formattedDate = this.createDate(timestamp);
            this.buildAndAppendNews(id, title, formattedDate, content);
        });
            
        this.latestDoc = data.docs[data.docs.length - 1];

        if (data.empty) {
            this.newsFeedElem.removeEventListener("scroll", this.scrollHandlerRef);
            window.removeEventListener("resize", this.windowResizeHandlerRef);
        } else {
            let triggerHeight = this.newsFeedElem.scrollTop + this.newsFeedElem.offsetHeight;
            if (triggerHeight >= this.newsFeedElem.scrollHeight * triggerThreshold) {
                this.getNews();
            }
            this.newsFeedElem.addEventListener("scroll", this.scrollHandlerRef);
        }
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

        let formattedDate = hours + ":" + minutes + " - ";
        formattedDate += date + "." + month + "." + year;

        return formattedDate;
    }

    /**
     * Builds new template of HTML element of news feed 
     * according to given data and calls 'this.appendNews()'
     * function.
     * @param {String} id 
     * @param {String} title 
     * @param {String} date 
     * @param {String} content 
     */
    buildAndAppendNews(id, title, date, content) {
        let wordCount = this.countWords(content);

        let moreBtn = "";
        if (wordCount > 128) {
            content = this.substrWords(content, 32);
            content += "...";
            moreBtn = `
                <div class="moreBtnContainer">
                    <button class="moreBtn" id="moreBtn">More</button>
                </div>
            `;
        }

        let html = `
            <div class="news" id="${id}">
                <div class="newsHeader">
                    <div class="newsTitle">
                        ${title}
                    </div>
                    <div class="newsDate">
                        ${date}
                    </div>
                </div>
                <hr class="solid">
                <div class="newsContent">
                    ${content}
                </div>
                ${moreBtn}
            </div>
        `;

        appendHtml(html, this.newsFeedElem);
    }

    /**
     * 
     * @param {String} id
     */
    async drawOpenedNews(id) {
        var docRef = this.newsRef.doc(id);

        await docRef.get().then(doc => {
            if (doc.exists) {
                let title = doc.data().title;
                let content = doc.data().content;
                content = content.replaceAll("\\n", "<br><br>");
                let html = `
                    <div class="openedNewsBackground" style="top: ${this.newsFeedElem.scrollTop}px;"></div>
                    <div class="openedNews" style="top: ${this.newsFeedElem.scrollTop + 50}px;">
                        <div class="openedNewsTitle">
                            <text class="titleText">${title}</text>
                            <img class="actionBtn" id="closeBtn" src="../svgs/close.svg">
                        </div>
                        <div class="openedNewsContent">
                            ${content}
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
    }

    /**
     * Handles click events.
     * @param {Event} event 
     */
    clickHandler(event) {
        if (event.target.id == "moreBtn") {
            this.newsFeedElem.style.overflow = "hidden";
            let parentElem = event.target.parentElement.parentElement;
            this.drawOpenedNews(parentElem.id);
        } else if (event.target.id == "closeBtn") {
            this.newsFeedElem.style.overflow = "overlay";

            let openedNewsBackgroundElem = document.getElementsByClassName("openedNewsBackground")[0];
            let openedNewsElem = document.getElementsByClassName("openedNews")[0];
            openedNewsBackgroundElem.style.opacity = 0;
            openedNewsElem.style.opacity = 0;

            setTimeout(() => {
                this.newsFeedElem.removeChild(openedNewsBackgroundElem);
                this.newsFeedElem.removeChild(openedNewsElem);
            }, 200);
        }
    }

    /**
     * Handles scroll events and if necessary calls getNews() function
     * to fetch additional data.
     */
    scrollHandler() {
        let triggerHeight = this.newsFeedElem.scrollTop + this.newsFeedElem.offsetHeight;
        if (triggerHeight >= this.newsFeedElem.scrollHeight * triggerThreshold) {
            this.newsFeedElem.removeEventListener("scroll", this.scrollHandlerRef);
            this.getNews();
        }
    }

    /**
     * Handles window resize events and if necessary calls getNews() function
     * to fetch additional data.
     */
    windowResizeHandler() {
        let triggerHeight = this.newsFeedElem.scrollTop + this.newsFeedElem.offsetHeight;
        if (triggerHeight >= this.newsFeedElem.scrollHeight * triggerThreshold) {
            window.removeEventListener("resize", this.windowResizeHandlerRef);
            this.getNews();
        }
    }
}
