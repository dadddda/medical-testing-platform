// constants
const mapScaleFactor = 1.2;
const mapScaleThreshold = 4;
const mapSizePct = 95;

class clinics {

    /**
     * Constructs new 'clinics' object with given 'clinicsElem'
     * element.
     * @param {HTMLElement} clinicsElem 
     */
    constructor(clinicsElem) {
        this.clinicsElem = clinicsElem;
        this.clinicsRef = firebase.firestore().collection("clinics");
        this.pos = {top: 0, left: 0, x: 0, y: 0};
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
                <div class="infoContainer" id="infoContainer"></div>
                <div class="mapContainer">
                    <div class="mapContent">
                        <div class="zoomContainer" id="zoomContainer">
                            <div class="zoomableContent" id="zoomableContent">
                                <img class="mapImg" id="mapImg" src="../svgs/map.svg">
                            </div>
                        </div>
                        <div class="mapFooterBtns" id="mapFooterBtns">
                            <img class="actionBtn" id="zoomInBtn" src="../svgs/plus.svg">
                            <img class="actionBtn" id="zoomOutBtn" src="../svgs/minus.svg">
                            <img class="actionBtn" id="centerBtn" src="../svgs/center.svg">
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.appendHtml(html, this.clinicsElem);
    }

    /**
     * Builds new template of HTML element of clinic info container
     * according to given 'clinicInfo' object and renders created
     * element.
     * @param clinicInfo
     */
    drawInfoContainer(clinicInfo) {
        let html = `
            <div class="clinicName" id="clinicName">
                <text class="nameText">${clinicInfo.name}</text>
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
            <hr class="solid">
            <div class="clinicDashboard">
                <text>Clinic Dashboard</text>
            </div>
        `;
        let infoContainerElem = document.getElementById("infoContainer");
        infoContainerElem.innerHTML = "";
        this.appendHtml(html, infoContainerElem);

        setTimeout(() => {
            let categoryDescListElem = document.getElementById("categoryDescList");
            clinicInfo.tests.forEach((testName) => {
                let currListItem = document.createElement("li");
                currListItem.innerHTML = testName;
                categoryDescListElem.appendChild(currListItem);
            });
        }, 10);
        
        infoContainerElem.style.display = "flex";
    }

    /**
     * Appends given html to given element.
     * @param {string} html 
     * @param {HTMLElement} element
     */
    appendHtml(html, element) {
        let template = document.createElement("template");
        html = html.trim();
        template.innerHTML = html;

        let templateChildren = template.content.childNodes;
        for (let i = 0; i < templateChildren.length; i++) {
            element.appendChild(templateChildren[i]);
        }
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        this.clinicsElem.addEventListener("click", this.mouseClickHandlerRef);
        this.clinicsElem.addEventListener("mousedown", this.mouseDownHandlerRef);
        
        let zoomContainerElem = document.getElementById("zoomContainer");
        zoomContainerElem.addEventListener("wheel", this.mouseWheelHandlerRef);
        
        let mapImgElem = document.getElementById("mapImg");
        mapImgElem.addEventListener("load", this.mapLoadHandlerRef);
        window.addEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        this.clinicsElem.removeEventListener("click", this.mouseClickHandlerRef);
        this.clinicsElem.removeEventListener("mousedown", this.mouseDownHandlerRef);

        let zoomContainerElem = document.getElementById("zoomContainer");
        zoomContainerElem.removeEventListener("wheel", this.mouseWheelHandlerRef);

        let mapImgElem = document.getElementById("mapImg");
        mapImgElem.removeEventListener("load", this.mapLoadHandlerRef);
        window.removeEventListener("resize", this.windowResizeHandlerRef);

        this.clinicPins.forEach((value, key) => {
            let currClinicPinElem = document.getElementById(key);
            currClinicPinElem.removeEventListener("click", this.clinicPinClickHandlerRef);
        });
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
        this.appendHtml(html, zoomableContentElem);
        
        setTimeout(() => {
            let userPinElem = document.getElementById("userPin");
            this.positionPinOnMap(userPinElem, this.latitude, this.longitude);
        }, 10);

        this.getClinics();
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
            this.appendHtml(html, zoomableContentElem);

            setTimeout(() => {
                let clinicPinElem = document.getElementById(id);
                this.positionPinOnMap(clinicPinElem, location.latitude, location.longitude);
                this.clinicPins.set(id, {lat: location.latitude, long: location.longitude});
                clinicPinElem.addEventListener("click", this.clinicPinClickHandlerRef);
            }, 10);
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
            let name = doc.data().name;
            let address = doc.data().address;
            let phone = doc.data().phone;
            let hours = doc.data().hours;
            let tests = doc.data().tests;

            let clinicInfo = {
                name: name,
                address: address,
                phone: phone,
                hours: hours,
                tests: tests
            };

            this.drawInfoContainer(clinicInfo);
        });
    }

    /**
     * Mouse click handler.
     * @param {Event} event 
     */
    mouseClickHandler(event) {
        switch (event.target.id) {
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
        switch (event.target.id) {
            case "mapImg":
                this.mapMouseDown(event);
                break;
            case "clinicName":
                console.log("drag");
                break;
        }
    }

    /**
     * Mouse move handler.
     * @param {Event} event
     */
    mouseMoveHandler(event) {
        event.preventDefault();
        switch (event.target.id) {
            case "mapImg":
                this.mapMouseMove(event);
                break;
            case "clinicName":
                console.log("drag");
                break;
        }
    }

    /**
     * Mouse up handler.
     * @param {Event} event
     */
    mouseUpHandler(event) {
        event.preventDefault();
        switch (event.target.id) {
            case "mapImg":
                this.mapMouseUp(event);
                break;
            case "clinicName":
                console.log("drag");
                break;
        }
    }

    /**
     * Map mouse down handler.
     * @param {Event} event
     */
    mapMouseDown(event) {
        let zoomContainerElem = document.getElementById("zoomContainer");
        let zoomableContentElem = document.getElementById("zoomableContent");
        if (!this.overflows(zoomableContentElem, zoomContainerElem)) return;
        zoomContainerElem.style.cursor = "grabbing";

        this.pos = {
            left: zoomContainerElem.scrollLeft,
            top: zoomContainerElem.scrollTop,
            x: event.clientX,
            y: event.clientY
        };
        
        document.addEventListener("mousemove", this.mouseMoveHandlerRef);
        document.addEventListener("mouseup", this.mouseUpHandlerRef);
    }

    /**
     * Map mouse move handler.
     * @param {Event} event
     */
    mapMouseMove(event) {
        let zoomContainerElem = document.getElementById("zoomContainer");
        let zoomableContentElem = document.getElementById("zoomableContent");
        if (!this.overflows(zoomableContentElem, zoomContainerElem)) return;

        const dx = event.clientX - this.pos.x;
        const dy = event.clientY - this.pos.y;
        
        zoomContainerElem.scrollLeft = this.pos.left - dx;
        zoomContainerElem.scrollTop = this.pos.top - dy;
    }

    /**
     * Map mouse up handler.
     */
    mapMouseUp() {
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
        
        let userPinElem = document.getElementById("userPin");

        this.positionPinOnMap(userPinElem, this.latitude, this.longitude);
        this.clinicPins.forEach((value, key) => {
            let currClinicPinElem = document.getElementById(key);
            this.positionPinOnMap(currClinicPinElem, value.lat, value.long);
        });
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
        let zoomableContentElemBR = zoomableContentElem.getBoundingClientRect();
        let mapImgElemBR = mapImgElem.getBoundingClientRect();

        let x = mapImgElemBR.x - zoomableContentElemBR.x;
        let y = mapImgElemBR.y - zoomableContentElemBR.y;

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

        console.log(zoomableContentW, zoomableContentH);
        console.log(mapW, mapH);

        if (mapW > zoomableContentW * mapSizePct / 100) {
            console.log("dasdasd");
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
}
