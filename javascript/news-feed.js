// variables and constants
const newsRef = firebase.firestore().collection("news");
let latestInit = false;
let latestDoc = null;

/**
 * getNext() is called after pageload.
 */
window.addEventListener("DOMContentLoaded", getNext);

/**
 * handleScroll() is called at each scroll event.
 */
rightPanel.addEventListener("scroll", handleScroll);

/**
 * Handles scroll events and if necessary calls getNext() function
 * to fetch additional data.
 */
function handleScroll() {
    let triggerHeight = rightPanel.scrollTop + rightPanel.offsetHeight;
    if (triggerHeight >= rightPanel.scrollHeight) {
        getNext();
    }
}

/**
 * Fetches data from Firestore database. Calls appropriate
 * functions to build and append HTML elements. Manages scroll
 * event listener and ensures that the whole page will be covered
 * with news articles at the initial startup and after scroll events.
 */
async function getNext() {
    let data = null;

    if (!latestInit) {
        data = await newsRef
            .orderBy("date", "desc")
            .get();

        latestDoc = data.docs[0];
        latestInit = true;

        data = await newsRef
            .orderBy("date", "desc")
            .startAt(latestDoc)
            .limit(2)
            .get();
    } else {
        data = await newsRef
            .orderBy("date", "desc")
            .startAfter(latestDoc)
            .limit(2)
            .get();
    }
 
    data.docs.forEach(doc => {
        let title = doc.data().title;
        let timestamp = doc.data().date.toMillis();
        let content = doc.data().content;
        
        content = content.replaceAll("\\n", "<br><br>");
        
        let formattedDate = createDate(timestamp);
        let template = buildNews(title, formattedDate, content);
        appendNews(template);
        latestDoc = doc;
    });
        
    latestDoc = data.docs[data.docs.length - 1];

    if (data.empty) {
        rightPanel.removeEventListener("scroll", handleScroll);
    } else {
        let triggerHeight = rightPanel.scrollTop + rightPanel.offsetHeight;
        if (triggerHeight >= rightPanel.scrollHeight) {
            getNext();
        }
    }
}

/**
 * Formats input timestamp number into string and
 * returns it.
 * @param {number} timestamp 
 */
function createDate(timestamp) {
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
function buildNews(title, date, content) {
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
 * Appends given template element to 'rightPanel'.
 * @param {string} template
 */
function appendNews(template) {
    let rightPanel = document.getElementById("rightPanel");
    rightPanel.appendChild(template);
}
