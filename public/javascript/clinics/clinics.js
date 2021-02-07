// constants
const mapScaleFactor = 1.2;
const mapScaleThreshold = 4;
const mapSizePct = 95;
import {animationDelay} from "../utils/utils.js";

// classes
import {InfoCard} from "./info-card.js";

// functions
import {appendHtml} from "../utils/utils.js";

export class Clinics {

    /**
     * Constructs new 'Clinics' object with given 'clinicsElem'
     * element.
     * @param {HTMLElement} clinicsElem 
     */
    constructor(clinicsElem) {
        this.clinicsElem = clinicsElem;
        this.clinicsRef = firebase.firestore().collection("clinics");
        this.clinicsData = new Map();
        this.scale = 1;

        this.inputUpdateHandlerRef = this.inputUpdateHandler.bind(this);

        this.mouseClickHandlerRef = this.mouseClickHandler.bind(this);
        this.mouseWheelHandlerRef = this.mouseWheelHandler.bind(this);
        this.pointerDownHandlerRef = this.pointerDownHandler.bind(this);
        this.pointerMoveHandlerRef = this.pointerMoveHandler.bind(this);
        this.pointerUpHandlerRef = this.pointerUpHandler.bind(this);

        this.mapImgLoadHandlerRef = this.mapImgLoadHandler.bind(this);
        this.clinicPinLoadHandlerRef = this.clinicPinLoadHandler.bind(this);
        this.userPinLoadHandlerRef = this.userPinLoadHandler.bind(this);

        this.windowResizeHandlerRef = this.windowResizeHandler.bind(this);

        this.observerHandlerRef = this.observerHandler.bind(this);
        this.observer = new MutationObserver(this.observerHandlerRef);
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Builds new template of HTML element of clinics content and
     * renders created element.
     */
    drawContent() {
        let html = `
            <div class="clinicsContent">
                <div class="infoCard" id="infoCard"></div>
                <div class="mapContainer">
                    <div class="mapContent">
                        <div class="zoomContainer" id="zoomContainer">
                            <div class="zoomableContent" id="zoomableContent">
                                <img class="mapImg" id="mapImg" src="./svgs/map.svg">
                            </div>
                        </div>
                        <div class="mapFooterDashboard" id="mapFooterDashboard">
                            <div class="footerDashboardLeft">
                                <div class="searchFieldContainer">
                                    <label class="searchFieldLabel" for="searchField">
                                        <img src="./svgs/search-icon.svg">
                                        <span>Search:</span>
                                    </label>
                                    <input class="searchField" type="text" id="searchField">
                                </div>
                                <button class="actionBtnLng" id="filterBtn">
                                    <img id="filterBtnImg" src="./svgs/filter-icon.svg">
                                    <span id="filterBtnSpan">Filter</span>
                                </button>
                            </div>
                            <div class="footerDashboardRight">
                                <img class="actionBtnSqr" id="zoomInBtn" src="./svgs/plus.svg">
                                <img class="actionBtnSqr" id="zoomOutBtn" src="./svgs/minus.svg">
                                <img class="actionBtnSqr" id="centerBtn" src="./svgs/center.svg">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="filterContainer" id="filterContainer"></div>
            </div>
        `;

        appendHtml(html, this.clinicsElem);
    }

    /**
     * Prompts the user for location access and if browser supports
     * geolocation then 'showPosition()' or 'showError()' function is called.
     * Logs "not supported" error message in console otherwise.
     */
    async getLocation() {
        if (navigator.geolocation) {
            let position = await this.getCoordinates();
            if (position != undefined) {
                this.showPosition(position);
            }
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }

    /**
     * Returns new promise after 'getCurrentPosition()' calls resolve.
     * calls 'showError()' if some error is catched.
     */
    async getCoordinates() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        }).catch(error => {
            this.showError(error);
        });
    }

    /**
     * Extracts and stores latitude and longitude from user's location and 
     * adds 'userPin' HTML element to the map. The rest is handled in mutation
     * observer.
     * @param position 
     */
    showPosition(position) {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;

        let html = `<img class="userPin" id="userPin" src="./svgs/pin.svg">`;
        let zoomableContentElem = document.getElementById("zoomableContent");
        appendHtml(html, zoomableContentElem);
    }

    /**
     * Logs specific error message to console if geolocation throws some.
     * @param error 
     */
    showError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                console.log("User denied the request for Geolocation.");
                break;
            case error.POSITION_UNAVAILABLE:
                console.log("Location information is unavailable.");
                break;
            case error.TIMEOUT:
                console.log("The request to get user location timed out.");
                break;
            case error.UNKNOWN_ERROR:
                console.log("An unknown error occurred.");
                break;
        }
    }

    /**
     * Fetches clinics data from database and places each clinic pin on the map.
     * Creates instance variable of a 'Map' object to store data of each fetched clinic.
     * Mutation observer does the rest.
     */
    async getClinics() {
        let zoomableContentElem = document.getElementById("zoomableContent");
        let data = await this.clinicsRef.get();

        this.clinicPinClickHandlerRef = this.clinicPinClickHandler.bind(this);

        data.docs.forEach((doc) => {
            let id = doc.id;
            let name = doc.data().name;
            let address = doc.data().address;
            let phone = doc.data().phone;
            let hours = doc.data().hours;
            let tests = doc.data().tests;
            let location = doc.data().location;
            
            let currClinicInfo = {
                id: id,
                name: name,
                address: address,
                phone: phone,
                hours: hours,
                tests: tests,
                location: location
            };
            
            let html = `<img class="clinicPin" id="${id}" src="./svgs/clinic.svg">`;
            appendHtml(html, zoomableContentElem);

            this.clinicsData.set(id, currClinicInfo);
        });
    }

    /**
     * Called when certain clinic pin is clicked on the map.
     * @param {Event} event 
     */
    clinicPinClickHandler(event) {
        let clinicPinElem = event.target;

        clinicPinElem.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center"
        });

        let clinicInfo = this.clinicsData.get(clinicPinElem.id);

        if (this.infoCardObj != undefined) {
            this.infoCardObj.drawInfoCard(clinicInfo);
        } else {
            let infoCardElem = document.getElementById("infoCard");
            let clinicsContentElem = this.clinicsElem.firstElementChild;
            this.infoCardObj = new InfoCard(infoCardElem, clinicsContentElem);
            this.infoCardObj.drawInfoCard(clinicInfo);
            this.infoCardObj.initListeners();
        }
    }

    /**
     * Makes given clinic pin user accessible.
     * @param {HTMLElement} clinicPinElem 
     */
    enableClinicPin(clinicPinElem) {
        clinicPinElem.style.opacity = "100%";
        clinicPinElem.style.cursor = "pointer";
        clinicPinElem.addEventListener("click", this.clinicPinClickHandlerRef);
    }

    /**
     * Makes given clinic pin user inaccessible.
     * @param {HTMLElement} clinicPinElem 
     */
    disableClinicPin(clinicPinElem) {
        clinicPinElem.style.opacity = "25%";
        clinicPinElem.style.cursor = "unset";
        clinicPinElem.removeEventListener("click", this.clinicPinClickHandlerRef);
    }

    /**
     * Takes every test name that is currently available from 'this.clinicsData' map
     * and creates appropriate popup window. Calls 'toggleFilterPopup()' to make
     * this window visible.
     */
    createFilterPopup() {
        let filterContainerElem = document.getElementById("filterContainer");
        this.filterTestsMap = new Map();

        let allTests = new Set();
        this.clinicsData.forEach((value, key) => {
            let tests = value.tests;
            tests.forEach((testName) => {
                allTests.add(testName);
            });
        });

        let i = 1;
        allTests.forEach((testName) => {
            let html = `
                <div class="checkboxField">
                    <input class="checkboxInput" id="ck${i}" type="checkbox">
                    <label class="checkboxLabel" for="ck${i}">
                        ${testName}
                    </label>
                </div>
            `;
            appendHtml(html, filterContainerElem);
            this.filterTestsMap.set(`ck${i}`, testName);
            i++;
        });

        this.toggleFilterPopup();
    }

    /**
     * Toggles the visibility of 'filterContainer'.
     */
    toggleFilterPopup() {
        if (this.opened) {
            this.opened = false;

            let filterContainerElem = document.getElementById("filterContainer");
            filterContainerElem.style.opacity = 0;
            setTimeout(() => {
                filterContainerElem.style.display = "none";
            }, animationDelay);
        } else {
            this.opened = true;

            let filterContainerElem = document.getElementById("filterContainer");
            filterContainerElem.style.display = "flex";
            filterContainerElem.style.opacity = "100%";
        }
    }

    /**
     * Zooms in/out map according to given parameter and constants.
     * @param {Boolean} zoomIn 
     */
    zoomMap(zoomIn) {
        let zoomContainerElem = document.getElementById("zoomContainer");
        let zoomableContentElem = document.getElementById("zoomableContent");
        let userPinElem = document.getElementById("userPin");

        if (!zoomIn && this.scale > 1) {
            this.scale /= mapScaleFactor;
        } else if (zoomIn && this.scale < mapScaleThreshold) {
            this.scale *= mapScaleFactor;
        } else {
            return;
        }

        let elemWidth = zoomContainerElem.clientWidth;
        let elemHeight = zoomContainerElem.clientHeight;
        let lastScrollWidth = zoomContainerElem.scrollWidth;
        let lastScrollHeight = zoomContainerElem.scrollHeight;

        zoomableContentElem.style.transform = `scale(${this.scale})`;
        if (userPinElem != undefined) {
            userPinElem.style.transform = `scale(${1 / this.scale})`;
        }
        this.clinicsData.forEach((value, key) => {
            let currClinicPinElem = document.getElementById(key);
            currClinicPinElem.style.transform = `scale(${1 / this.scale})`;
        });
        
        if (!zoomIn) {
            let pctW = 1 - zoomContainerElem.scrollWidth / lastScrollWidth;
            let pctH = 1 - zoomContainerElem.scrollHeight / lastScrollHeight;
            zoomContainerElem.scrollLeft -= (zoomContainerElem.scrollLeft + elemWidth / 2) * pctW;
            zoomContainerElem.scrollTop -= (zoomContainerElem.scrollTop + elemHeight / 2) * pctH;
        } else if (zoomIn) {
            zoomContainerElem.scrollLeft += (zoomContainerElem.scrollLeft + elemWidth / 2) * 0.2;
            zoomContainerElem.scrollTop += (zoomContainerElem.scrollTop + elemHeight / 2) * 0.2;
        }
    }

    /**
     * Positions given pin element on the map according to given
     * latitude and longitude.
     * @param {HTMLElement} pin 
     */
    positionPinOnMap(pin, lat, long) {
        let pinElemOrigin = this.calcElemOrigin(pin);
        let relativeCoordinates = this.calcElemRelative(lat, long);

        relativeCoordinates.x += pinElemOrigin.x;
        relativeCoordinates.y += pinElemOrigin.y;

        pin.style.left = `${relativeCoordinates.x}px`;
        pin.style.top = `${relativeCoordinates.y}px`;
    }

    /**
     * Calculates 'elem' origin coordinates relative to 'mapImg' using
     * parent element's and 'mapImg's' dimensions. Also accounts for the
     * dimensions of the 'elem' to make it's anchor at pin's point.
     * @param {HTMLElement} elem
     */
    calcElemOrigin(elem) {
        let zoomableContentElem = document.getElementById("zoomableContent");
        let mapImgElem = document.getElementById("mapImg");
        let zoomableContentElemBr = zoomableContentElem.getBoundingClientRect();
        let mapImgElemBr = mapImgElem.getBoundingClientRect();

        let x = mapImgElemBr.x - zoomableContentElemBr.x;
        let y = mapImgElemBr.y - zoomableContentElemBr.y;

        x -= elem.offsetWidth / 2;
        y -= elem.offsetHeight;

        return {x: x, y: y};
    }
    
    /**
     * Calculates relative coordinates to 'mapImg' according to given
     * latitude and longitude values and returns it.
     */
    calcElemRelative(lat, long) {
        let mapImgElem = document.getElementById("mapImg");
        let mapW = mapImgElem.getBoundingClientRect().width;

        const topmostLat = 41.816398;
        const leftmostLong = 44.682701;
        const rightmostLong = 45.012187;

        let wholeMapW = 360 / (rightmostLong - leftmostLong) * mapW;
        let wholeMapH = wholeMapW;

        let anchorCoordinates = this.calcMercator(topmostLat, leftmostLong, wholeMapW, wholeMapH);
        let currCoordinates = this.calcMercator(lat, long, wholeMapW, wholeMapH);

        let x = currCoordinates.x - anchorCoordinates.x;
        let y = currCoordinates.y - anchorCoordinates.y;

        return {x: x, y: y};
    }

    /**
     * Mercator projection. Calculates the (x, y) coordinates from given 
     * (lat, long) on the map according to map's dimensions.
     * @param lat 
     * @param long 
     * @param w 
     * @param h 
     */
    calcMercator(lat, long, w, h) {
        let x = (long + 180) * (w / 360);
        let latRad = lat * Math.PI / 180;
        let mercator = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
        let y = (h / 2) - (w * mercator / (2 * Math.PI));

        return {x: x, y: y};
    }

    /**
     * Adjusts 'mapImg' size according to parent element's dimensions. 
     * Makes it to always fit and retain slimmest bounding box.
     */
    adjustMapImgElemSize() {
        let mapImgElem = document.getElementById("mapImg");
        let zoomableContentElem = document.getElementById("zoomableContent");

        if (this.scale > 1) {
            zoomableContentElem.style.transform = "scale(1)";
            document.getElementById("userPin").style.transform = "scale(1)";
            this.clinicsData.forEach((value, key) => {
                let currClinicPinElem = document.getElementById(key);
                currClinicPinElem.style.transform = "scale(1)";
            });
            this.scale = 1;
        }

        let mapW = mapImgElem.getBoundingClientRect().width;
        let mapH = mapImgElem.getBoundingClientRect().height;
        let zoomableContentW = zoomableContentElem.getBoundingClientRect().width;
        let zoomableContentH = zoomableContentElem.getBoundingClientRect().height;

        if (mapW > zoomableContentW * mapSizePct / 100) {
            mapImgElem.style.width = `${mapSizePct}%`;
            mapImgElem.style.height = "unset";
        } else if (mapH > zoomableContentH * mapSizePct / 100) {
            mapImgElem.style.width = "unset";
            mapImgElem.style.height = `${mapSizePct}%`;
        }
    }

    /**
     * If elem1 overflows from elem2 true is returned.
     * @param {HTMLElement} elem1 
     * @param {HTMLElement} elem2 
     */
    overflows(elem1, elem2) {
        let elem1W = elem1.getBoundingClientRect().width;
        let elem1H = elem1.getBoundingClientRect().height;
        let elem2W = elem2.getBoundingClientRect().width;
        let elem2H = elem2.getBoundingClientRect().height;

        if (elem1W > elem2W) return true;
        if (elem1H > elem2H) return true;
        return false;
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        window.addEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * Initializes secondary event listeners.
     */
    initSecondaryListeners() {
        this.clinicsElem.addEventListener("input", this.inputUpdateHandlerRef);

        let mapFooterDashboardElem = document.getElementById("mapFooterDashboard");
        mapFooterDashboardElem.addEventListener("click", this.mouseClickHandlerRef);
        let zoomContainerElem = document.getElementById("zoomContainer");
        zoomContainerElem.addEventListener("wheel", this.mouseWheelHandlerRef);
        let zoomableContentElem = document.getElementById("zoomableContent");
        zoomableContentElem.addEventListener("pointerdown", this.pointerDownHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.clinicsElem.removeEventListener("input", this.inputUpdateHandlerRef);

        let mapFooterDashboardElem = document.getElementById("mapFooterDashboard");
        mapFooterDashboardElem.removeEventListener("click", this.mouseClickHandlerRef);
        let zoomContainerElem = document.getElementById("zoomContainer");
        zoomContainerElem.removeEventListener("wheel", this.mouseWheelHandlerRef);
        let zoomableContentElem = document.getElementById("zoomableContent");
        zoomableContentElem.removeEventListener("pointerdown", this.pointerDownHandlerRef);

        window.removeEventListener("resize", this.windowResizeHandlerRef);

        this.clinicsData.forEach((value, key) => {
            let currClinicPinElem = document.getElementById(key);
            currClinicPinElem.removeEventListener("click", this.clinicPinClickHandlerRef);
        });

        if (this.infoCardObj != undefined) this.infoCardObj.deinitListeners();

        this.observer.disconnect();
    }

    /**
     * Handles DOM mutations.
     * @param mutations 
     */
    async observerHandler(mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.classList.contains("clinicPin")) {
                    node.addEventListener("load", this.clinicPinLoadHandlerRef);
                } else if (node.classList.contains("userPin")) {
                    node.addEventListener("load", this.userPinLoadHandlerRef);
                } else if (node.classList.contains("clinicsContent")) {
                    node.querySelector("#mapImg").addEventListener("load", this.mapImgLoadHandlerRef);
                }
            }
        }
    }

    /**
     * Handles input element update events.
     * @param {Event} event 
     */
    inputUpdateHandler(event) {
        if (event.target.id == "searchField") {
            let searchFieldValue = event.target.value.toLowerCase();

            this.clinicsData.forEach((value, key) => {
                let currClinicPinElem = document.getElementById(key);
                let currClinicName = value.name.toLowerCase();

                if (currClinicName.includes(searchFieldValue)) this.enableClinicPin(currClinicPinElem);
                else this.disableClinicPin(currClinicPinElem);
            });
        } else {
            let checkedTests = new Set();

            this.filterTestsMap.forEach((value, key) => {
                let currCheckboxElem = document.getElementById(key);

                if (currCheckboxElem.checked) checkedTests.add(value);
                else checkedTests.delete(value);
            });
            
            this.clinicsData.forEach((value, key) => {
                let currClinicPinElem = document.getElementById(key);
                let currClinicTests = value.tests;

                let containsSome = true;
                checkedTests.forEach(testName => {
                    if (currClinicTests.indexOf(testName) == -1) containsSome = false;
                });

                if (containsSome == true) this.enableClinicPin(currClinicPinElem);
                else this.disableClinicPin(currClinicPinElem);
            });
        }
    }

    /**
     * Mouse click handler.
     * @param {Event} event 
     */
    mouseClickHandler(event) {
        switch (event.target.id) {
            case "filterBtn":
            case "filterBtnImg":
            case "filterBtnSpan":
                if (this.opened == undefined) {
                    this.createFilterPopup();
                } else {
                    this.toggleFilterPopup();
                }
                break;
            case "zoomInBtn":
                this.zoomMap(true);
                break;
            case "zoomOutBtn":
                this.zoomMap(false);
                break;
            case "centerBtn":
                let userPinElem = document.getElementById("userPin");
                if (userPinElem != undefined) {
                    userPinElem.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "center"
                    });
                }
                break;
        }
    }

    /**
     * Mouse wheel handler for zooming 'zoomContainer'.
     * @param {Event} event
     */
    mouseWheelHandler(event) {
        event.preventDefault();

        let zoomMode = true;
        if (event.deltaY > 0) zoomMode = false;
        this.zoomMap(zoomMode);
        
        let zoomContainerElem = document.getElementById("zoomContainer");
        let zoomableContentElem = document.getElementById("zoomableContent");

        if (!this.overflows(zoomableContentElem, zoomContainerElem)) {
            zoomContainerElem.style.cursor = "default";
        } else {
            zoomContainerElem.style.cursor = "grab";
        }
    }

    /**
     * Pointer down handler.
     * @param {Event} event
     */
    pointerDownHandler(event) {
        event.preventDefault();
        let zoomContainerElem = document.getElementById("zoomContainer");
        let zoomableContentElem = document.getElementById("zoomableContent");
        if (!this.overflows(zoomableContentElem, zoomContainerElem)) return;
        zoomContainerElem.style.cursor = "grabbing";

        this.mapPos = {
            left: zoomContainerElem.scrollLeft,
            top: zoomContainerElem.scrollTop,
            x: event.clientX,
            y: event.clientY
        };
        
        document.addEventListener("pointermove", this.pointerMoveHandlerRef);
        document.addEventListener("pointerup", this.pointerUpHandlerRef);
    }

    /**
     * Pointer move handler.
     * @param {Event} event
     */
    pointerMoveHandler(event) {
        event.preventDefault();
        let zoomContainerElem = document.getElementById("zoomContainer");
        let zoomableContentElem = document.getElementById("zoomableContent");
        if (!this.overflows(zoomableContentElem, zoomContainerElem)) return;

        const dx = event.clientX - this.mapPos.x;
        const dy = event.clientY - this.mapPos.y;
        
        zoomContainerElem.scrollLeft = this.mapPos.left - dx;
        zoomContainerElem.scrollTop = this.mapPos.top - dy;
    }

    /**
     * Pointer up handler.
     * @param {Event} event
     */
    pointerUpHandler(event) {
        let zoomContainerElem = document.getElementById("zoomContainer");
        let zoomableContentElem = document.getElementById("zoomableContent");
        if (!this.overflows(zoomableContentElem, zoomContainerElem)) return;
        zoomContainerElem.style.cursor = "grab";

        document.removeEventListener("pointermove", this.pointerMoveHandlerRef);
        document.removeEventListener("pointerup", this.pointerUpHandlerRef);
    }

    /**
     * Executes script when 'mapImg' is fully loaded and
     * removes load event listener from it.
     * @param {Event} event
     */
    async mapImgLoadHandler(event) {
        let mapImgElem = event.target;
        mapImgElem.removeEventListener("load", this.mapImgLoadHandlerRef);
        
        this.adjustMapImgElemSize();
        mapImgElem.style.opacity = 1;
        
        await this.getClinics();
        await this.getLocation();
        this.initSecondaryListeners();
    }

    /**
     * Executes script for each fully loaded 'clinicPin'.
     * @param {Event} event
     */
    clinicPinLoadHandler(event) {
        let clinicPinElem = event.target;
        clinicPinElem.removeEventListener("load", this.clinicPinLoadHandlerRef);

        let clinicData = this.clinicsData.get(clinicPinElem.id);
        this.positionPinOnMap(clinicPinElem, clinicData.location.latitude, clinicData.location.longitude);
        clinicPinElem.addEventListener("click", this.clinicPinClickHandlerRef);
        
        clinicPinElem.style.opacity = 1;
    }

    /**
     * Executes script for fully loaded 'userPin'.
     * @param {Event} event
     */
    userPinLoadHandler(event) {
        let userPinElem = event.target;
        userPinElem.removeEventListener("load", this.userPinLoadHandlerRef);
        
        this.positionPinOnMap(userPinElem, this.latitude, this.longitude);

        userPinElem.style.opacity = 1;
    }

    /**
     * On each window resize adjusts 'mapImg' size, calcualtes
     * new 'userPin' and 'clinicPin' elements origins and relative
     * coordinates and updates them.
     */
    windowResizeHandler() {
        this.adjustMapImgElemSize();
        if (this.infoCardObj != undefined) this.infoCardObj.adjustCardElemPos();
        
        let userPinElem = document.getElementById("userPin");
        if (userPinElem != undefined) {
            this.positionPinOnMap(userPinElem, this.latitude, this.longitude);
        }

        this.clinicsData.forEach((value, key) => {
            let currClinicPinElem = document.getElementById(key);
            this.positionPinOnMap(currClinicPinElem, value.location.latitude, value.location.longitude);
        });
    }
}
