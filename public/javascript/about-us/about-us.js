// functions
import {appendHtml} from "../utils/utils.js";
import {fetchAboutUsDoc} from "../database.js";

export class AboutUs {

    /**
     * Constructs new 'AboutUs' object with given 'aboutUsElem' element.
     * @param {HTMLElement} aboutUsElem 
     */
    constructor(aboutUsElem) {
        this.aboutUsElem = aboutUsElem;
        this.storageRef = firebase.storage();
    }

    /**
     * Draws about us page by fetching appropriate data from Firestore database
     * and Firebase Storage.
     */
    async drawContent() {
        let aboutUsDoc = await fetchAboutUsDoc();
        let storageData = await this.fetchFromStorage();

        let html = `
            <div class="aboutUsHeader">
                <div class="headerTitle">
                    ${aboutUsDoc.data().title}
                </div>
                <div class="headerSubtitle">
                    ${aboutUsDoc.data().subtitle}
                </div>
            </div>
            <hr class="solid">
            <div class="aboutUsContent">
                <img class="contentImage" src="${storageData.headerUrl}">
                <hr class="solid">
                <div class="contentText">
                    ${storageData.contentText}
                </div>
            </div>
            <hr class="solid">
            <div class="aboutUsFooter">
                <text>Hotline:&nbsp</text>
                ${aboutUsDoc.data().hotline}
                &nbsp
                <text>Email:&nbsp</text>
                ${aboutUsDoc.data().email}
            </div>
        `;

        appendHtml(html, this.aboutUsElem);
    }

    /**
     * Fetches about us page content text and header image from
     * Firebase Storage.
     */
    async fetchFromStorage() {
        let headerUrl = "";
        let contentText = "";

        let headerRef = this.storageRef.ref("aboutUs/header.jpg");
        await headerRef.getDownloadURL()
        .then(url => {
            headerUrl = url;
        }).catch((error) => {
            console.log("Error: ", error);
        });

        let contentRef = this.storageRef.ref("aboutUs/content.txt");
        await contentRef.getDownloadURL()
        .then(async url => {
            await fetch(url)
            .then(async data => {
                await data.text()
                .then(text => {
                    contentText = text;
                });
            });
        }).catch((error) => {
            console.log("Error: ", error);
        });

        contentText = contentText.replace(/(?:\r\n|\r|\n)/g, "<br>");

        return {
            headerUrl: headerUrl,
            contentText: contentText
        }
    }
}
