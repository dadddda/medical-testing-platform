// constants
const mapScaleFactor = 1.2;
const mapScaleThreshold = 4;
const mapSizePct = 95;
const animationDelay = 200;
const timeoutDelay = 20;

class Clinics {

    /**
     * Constructs new 'Clinics' object with given 'clinicsElem'
     * element.
     * @param {HTMLElement} clinicsElem 
     */
    constructor(clinicsElem) {
        this.clinicsElem = clinicsElem;
        this.clinicsRef = firebase.firestore().collection("clinics");
        this.scale = 1;

        this.mouseClickHandlerRef = this.mouseClickHandler.bind(this);
        this.mouseDownHandlerRef = this.mouseDownHandler.bind(this);
        this.mouseMoveHandlerRef = this.mouseMoveHandler.bind(this);
        this.mouseUpHandlerRef = this.mouseUpHandler.bind(this);
        this.mouseWheelHandlerRef = this.mouseWheelHandler.bind(this);

        this.mapLoadHandlerRef = this.mapLoadHandler.bind(this);
        this.windowResizeHandlerRef = this.windowResizeHandler.bind(this);
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
                                <img class="mapImg" id="mapImg" src="../svgs/map.svg">
                            </div>
                        </div>
                        <div class="mapFooterBtns" id="mapFooterBtns">
                            <button class="actionBtnLng" id="filterBtn">Filter</button>
                            <img class="actionBtnSqr" id="zoomInBtn" src="../svgs/plus.svg">
                            <img class="actionBtnSqr" id="zoomOutBtn" src="../svgs/minus.svg">
                            <img class="actionBtnSqr" id="centerBtn" src="../svgs/center.svg">
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
     * geolocation then showPosition() or showError() function is called.
     * Logs "not supported" error message in console otherwise.
     */
    getLocation() {
        if (navigator.geolocation) {
            let showPositionRef = this.showPosition.bind(this);
            let showErrorRef = this.showError.bind(this);
            navigator.geolocation.getCurrentPosition(showPositionRef, showErrorRef, {
                enableHighAccuracy: true
            });
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }

    /**
     * Extracts latitude and longitude from user's location and calls
     * certain functions to calculate estimate coordinates on x, y plane of the
     * 'mapImg' and drops pin at that exact location. Then calls 'getClinics()'.
     * @param position 
     */
    showPosition(position) {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;

        let html = `<img class="userPin" id="userPin" src="../svgs/pin.svg">`;
        let zoomableContentElem = document.getElementById("zoomableContent");
        appendHtml(html, zoomableContentElem);
        
        setTimeout(() => {
            let userPinElem = document.getElementById("userPin");
            this.positionPinOnMap(userPinElem, this.latitude, this.longitude);
            this.getClinics();
        }, timeoutDelay);
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
     * Creates instance variable of a 'Map' object to store longitude and latitude
     * values for each clinic pin. Also adds event listeners to each.
     */
    async getClinics() {
        let zoomableContentElem = document.getElementById("zoomableContent");
        let data = await this.clinicsRef.get();

        this.clinicPins = new Map();
        this.clinicPinClickHandlerRef = this.clinicPinClickHandler.bind(this);

        data.docs.forEach((doc) => {
            let id = doc.data().id;
            let location = doc.data().location;

            let html = `<img class="clinicPin" id="${id}" src="../svgs/clinic.svg">`;
            appendHtml(html, zoomableContentElem);

            setTimeout(() => {
                let clinicPinElem = document.getElementById(id);
                this.positionPinOnMap(clinicPinElem, location.latitude, location.longitude);
                this.clinicPins.set(id, {lat: location.latitude, long: location.longitude});
                clinicPinElem.addEventListener("click", this.clinicPinClickHandlerRef);
            }, timeoutDelay);
        });
    }

    /**
     * Called when certain clinic pin is clicked on the map.
     * @param {Event} event 
     */
    async clinicPinClickHandler(event) {
        let currClinicPinElem = event.target;

        currClinicPinElem.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center"
        });

        let data = await this.clinicsRef.where("id", "==", currClinicPinElem.id).get();

        data.docs.forEach((doc) => {
            let id = doc.data().id;
            let name = doc.data().name;
            let address = doc.data().address;
            let phone = doc.data().phone;
            let hours = doc.data().hours;
            let tests = doc.data().tests;

            let clinicInfo = {
                id: id,
                name: name,
                address: address,
                phone: phone,
                hours: hours,
                tests: tests
            };

            if (this.infoCardObj != undefined) {
                this.infoCardObj.drawInfoCard(clinicInfo);
            } else {
                let infoCardElem = document.getElementById("infoCard");
                let clinicsContentElem = this.clinicsElem.firstElementChild;
                this.infoCardObj = new InfoCard(infoCardElem, clinicsContentElem);
                this.infoCardObj.drawInfoCard(clinicInfo);
                this.infoCardObj.initListeners();
            }
        });
    }

    /**
     * Fetches every test that is currently available from "clinics" database
     * and creates appropriate popup window. Calls 'toggleFilterPopup()' to make
     * this window visible.
     */
    async createFilterPopup() {
        let filterContainerElem = document.getElementById("filterContainer");
        let data = await this.clinicsRef.get();

        this.allTests = new Set();

        data.docs.forEach((doc) => {
            let tests = doc.data().tests;

            tests.forEach((testName) => {
                this.allTests.add(testName);
            });
        });

        let i = 1;
        this.allTests.forEach((testName) => {
            let html = `
                <div class="checkboxField">
                    <input id="ck${i}" type="checkbox">
                    <label class="checkboxLabel" for="ck${i}">
                        ${testName}
                    </label>
                </div>
            `;
            appendHtml(html, filterContainerElem);
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
            filterContainerElem.style.display = "block";
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
        userPinElem.style.transform = `scale(${1 / this.scale})`;
        this.clinicPins.forEach((value, key) => {
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
            this.clinicPins.forEach((value, key) => {
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
        }

        if (mapH > zoomableContentH * mapSizePct / 100) {
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
        let zoomContainerElem = document.getElementById("zoomContainer");
        zoomContainerElem.addEventListener("wheel", this.mouseWheelHandlerRef);
        
        let zoomableContentElem = document.getElementById("zoomableContent");
        zoomableContentElem.addEventListener("mousedown", this.mouseDownHandlerRef);

        let mapFooterBtnsElem = document.getElementById("mapFooterBtns");
        mapFooterBtnsElem.addEventListener("click", this.mouseClickHandlerRef);
        
        let mapImgElem = document.getElementById("mapImg");
        mapImgElem.addEventListener("load", this.mapLoadHandlerRef);

        window.addEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        let zoomContainerElem = document.getElementById("zoomContainer");
        zoomContainerElem.removeEventListener("wheel", this.mouseWheelHandlerRef);
        
        let zoomableContentElem = document.getElementById("zoomableContent");
        zoomableContentElem.removeEventListener("mousedown", this.mouseDownHandlerRef);

        let mapFooterBtnsElem = document.getElementById("mapFooterBtns");
        mapFooterBtnsElem.removeEventListener("click", this.mouseClickHandlerRef);

        let mapImgElem = document.getElementById("mapImg");
        mapImgElem.removeEventListener("load", this.mapLoadHandlerRef);

        window.removeEventListener("resize", this.windowResizeHandlerRef);

        if (this.clinicPins != undefined) {
            this.clinicPins.forEach((value, key) => {
                let currClinicPinElem = document.getElementById(key);
                currClinicPinElem.removeEventListener("click", this.clinicPinClickHandlerRef);
            });
        }

        if (this.infoCardObj != undefined) this.infoCardObj.deinitListeners();
    }

    /**
     * Mouse click handler.
     * @param {Event} event 
     */
    mouseClickHandler(event) {
        switch (event.target.id) {
            case "filterBtn":
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
                userPinElem.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "center"
                });
                break;
        }
    }

    /**
     * Mouse down handler.
     * @param {Event} event
     */
    mouseDownHandler(event) {
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
        
        document.addEventListener("mousemove", this.mouseMoveHandlerRef);
        document.addEventListener("mouseup", this.mouseUpHandlerRef);
    }

    /**
     * Mouse move handler.
     * @param {Event} event
     */
    mouseMoveHandler(event) {
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
     * Mouse up handler.
     * @param {Event} event
     */
    mouseUpHandler(event) {
        let zoomContainerElem = document.getElementById("zoomContainer");
        let zoomableContentElem = document.getElementById("zoomableContent");
        if (!this.overflows(zoomableContentElem, zoomContainerElem)) return;
        zoomContainerElem.style.cursor = "grab";

        document.removeEventListener("mousemove", this.mouseMoveHandlerRef);
        document.removeEventListener("mouseup", this.mouseUpHandlerRef);
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
     * Executes script when 'mapImg' is fully loaded.
     */
    mapLoadHandler() {
        this.adjustMapImgElemSize();
        this.getLocation();
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

        this.positionPinOnMap(userPinElem, this.latitude, this.longitude);
        this.clinicPins.forEach((value, key) => {
            let currClinicPinElem = document.getElementById(key);
            this.positionPinOnMap(currClinicPinElem, value.lat, value.long);
        });
    }
}
