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

        this.scrollHandlerRef = this.scrollHandler.bind(this);
        this.windowResizeHandlerRef = this.windowResizeHandler.bind(this);
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        this.newsFeedElem.addEventListener("scroll", this.scrollHandlerRef);
        window.addEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.newsFeedElem.removeEventListener("scroll", this.scrollHandlerRef);
        window.removeEventListener("resize", this.windowResizeHandlerRef);
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
            let title = doc.data().title;
            let timestamp = doc.data().date.toMillis();
            let content = doc.data().content;
            
            content = content.replaceAll("\\n", "<br><br>");
            
            let formattedDate = this.createDate(timestamp);
            this.buildAndAppendNews(title, formattedDate, content);
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
     * according to given data and calls this.appendNews()
     * function.
     * @param {string} title 
     * @param {string} date 
     * @param {string} content 
     */
    buildAndAppendNews(title, date, content) {
        let html = `
            <div class="news">
                <div class="newsHeader">
                    <div class="newsTitle">
                        ${title}
                    </div>
                    <div class="newsDate">
                        ${date}
                    </div>
                </div>

                <div class="newsContent">
                    ${content}
                </div>
            </div>
        `;

        let template = document.createElement("template");
        html = html.trim();
        template.innerHTML = html;
        this.appendNews(template.content.firstChild);
    }

    /**
     * Appends given template element to 'newsFeedElem'.
     * @param template
     */
    appendNews(template) {
        this.newsFeedElem.appendChild(template);
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
