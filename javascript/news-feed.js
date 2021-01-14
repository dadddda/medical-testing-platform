class newsFeed {
    constructor(newsFeed) {
        this.newsFeed = newsFeed;
        this.newsRef = firebase.firestore().collection("news");
        this.latestInit = false;
        this.latestDoc = null;

        this.handleScrollRef = this.handleScroll.bind(this);
        this.newsFeed.addEventListener("scroll", this.handleScrollRef);

        this.getNews();
    }

    /**
     * Handles scroll events and if necessary calls getNews() function
     * to fetch additional data.
     */
    handleScroll() {
        let triggerHeight = this.newsFeed.scrollTop + this.newsFeed.offsetHeight;
        if (triggerHeight >= this.newsFeed.scrollHeight) {
            this.getNews();
        }
    }

    /**
     * Fetches data from Firestore database. Calls appropriate
     * functions to build and append HTML elements. Manages scroll
     * event listener and ensures that the whole page will be covered
     * with news articles at the initial startup and after scroll events.
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
            let template = this.buildNews(title, formattedDate, content);
            this.appendNews(template);
        });
            
        this.latestDoc = data.docs[data.docs.length - 1];

        if (data.empty) {
            this.newsFeed.removeEventListener("scroll", this.handleScrollRef);
        } else {
            let triggerHeight = this.newsFeed.scrollTop + this.newsFeed.offsetHeight;
            if (triggerHeight >= this.newsFeed.scrollHeight) {
                this.getNews();
            }
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
     * according to given data and returns it.
     * @param {string} title 
     * @param {string} date 
     * @param {string} content 
     */
    buildNews(title, date, content) {
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
        return template.content.firstChild;
    }

    /**
     * Appends given template element to 'newsFeed'.
     * @param template
     */
    appendNews(template) {
        this.newsFeed.appendChild(template);
    }
}
