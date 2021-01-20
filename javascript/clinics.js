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
     * Builds new template of HTML element of clinics header and
     * calls appendHtml().
     */
    drawHeader() {
        let html = `
            <div class="clinicsHeader"></div>
        `;

        this.appendHtml(html, this.clinicsElem);
    }

    /**
     * Builds new template of HTML element of clinics content and
     * calls appendHtml().
     */
    drawContent() {
        let html = `
            <div class="clinicsContent">
                <div class="infoContainer">
                    <div class="clinicTitle">
                        <text class="titleText">Sports Medicine Clinic</text>
                    </div>
                    <dl class="clinicDescription">
                        <dt class="categoryName">Address:</dt>
                        <dd class="categoryDesc">40 Bogdan Khmelnitski St</dd>
                        <dt class="categoryName">Phone: </dt>
                        <dd class="categoryDesc">593 33 73 30</dd>
                        <dt class="categoryName">Working Hours:</dt>
                        <dd class="categoryDesc">10:00 - 18:00</dd>
                        <dt class="categoryName">Supported Tests:</dt>
                        <dd class="categoryDesc">
                            <ul class="categoryDescList">
                                <li>Blood Glucose</li>
                                <li>Calcium</li>
                                <li>Cardiac Enzymes</li>
                                <li>Cholesterol and Lipid</li>
                            </ul>
                        </dd>
                    </dl>
                    <hr class="solid">
                    <div class="clinicDashboard">
                        <text>Clinic Dashboard</text>
                    </div>
                </div>
                <div class="mapContainer">
                    <div class="mapContent">
                        <div class="zoomContainer" id="zoomContainer">
                            <div class="zoomableContent" id="zoomableContent">
                                <img class="mapImg" id="mapImg" src="../svgs/map.svg">
                                <img class="pinImg hidden" id="pinImg" src="../svgs/pin.svg">
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
     * Builds new template of HTML element of clinics footer and
     * calls appendHtml().
     */
    drawFooter() {
        let html = `
            <div class="clinicsFooter"></div>
        `;

        this.appendHtml(html, this.clinicsElem);
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
        element.appendChild(template.content.firstChild);
    }

    /**
     * Initializes event listeners.
     */
    initListeners() {
        let zoomContainerElem = document.getElementById("zoomContainer");
        let mapFooterBtnsElem = document.getElementById("mapFooterBtns");
        let mapImgElem = document.getElementById("mapImg");

        zoomContainerElem.addEventListener("mousedown", this.mouseDownHandlerRef);
        zoomContainerElem.addEventListener("wheel", this.mouseWheelHandlerRef);
        mapFooterBtnsElem.addEventListener("click", this.mouseClickHandlerRef);

        mapImgElem.addEventListener("load", this.mapLoadHandlerRef);
        window.addEventListener("resize", this.windowResizeHandlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        let zoomContainerElem = document.getElementById("zoomContainer");
        let mapFooterBtnsElem = document.getElementById("mapFooterBtns");
        let mapImgElem = document.getElementById("mapImg");
        
        zoomContainerElem.removeEventListener("mousedown", this.mouseDownHandlerRef);
        zoomContainerElem.removeEventListener("wheel", this.mouseWheelHandlerRef);
        mapFooterBtnsElem.removeEventListener("click", this.mouseClickHandlerRef);

        mapImgElem.removeEventListener("load", this.mapLoadHandlerRef);
        window.removeEventListener("resize", this.windowResizeHandlerRef);
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
     * 'mapImg' and drops pin at that exact location.
     * @param position 
     */
    showPosition(position) {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;

        let pinImgElem = document.getElementById("pinImg");
        let pinImgElemOrigin = this.calcPinImgElemOrigin();
        let relativeCoordinates = this.calcPinImgElemRelative();

        relativeCoordinates.x += pinImgElemOrigin.x;
        relativeCoordinates.y += pinImgElemOrigin.y;

        pinImgElem.classList.remove("hidden");
        pinImgElem.style.left = `${relativeCoordinates.x}px`;
        pinImgElem.style.top = `${relativeCoordinates.y}px`;
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
                let pinImgElem = document.getElementById("pinImg");
                pinImgElem.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "center"
                });
                break;
        }
    }

    /**
     * Mouse down handler when 'zoomContainer' is zoomed.
     * @param {Event} event
     */
    mouseDownHandler(event) {
        event.preventDefault();
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
     * Mouse move handler when 'zoomContainer' is zoomed.
     * @param {Event} event
     */
    mouseMoveHandler(event) {
        event.preventDefault();
        let zoomContainerElem = document.getElementById("zoomContainer");
        let zoomableContentElem = document.getElementById("zoomableContent");
        if (!this.overflows(zoomableContentElem, zoomContainerElem)) return;

        const dx = event.clientX - this.pos.x;
        const dy = event.clientY - this.pos.y;
        
        zoomContainerElem.scrollLeft = this.pos.left - dx;
        zoomContainerElem.scrollTop = this.pos.top - dy;
    }

    /**
     * Mouse up handler when 'zoomContainer' is zoomed.
     * @param {Event} event
     */
    mouseUpHandler(event) {
        event.preventDefault();
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
    }

    /**
     * On each window resize adjusts 'mapImg' size, calcualtes
     * new 'pinImg' origin and relative coordinates and updates
     * them.
     */
    windowResizeHandler() {
        this.adjustMapImgElemSize();

        let pinImgElem = document.getElementById("pinImg");
        let pinImgElemOrigin = this.calcPinImgElemOrigin();
        let relativeCoordinates = this.calcPinImgElemRelative();

        relativeCoordinates.x += pinImgElemOrigin.x;
        relativeCoordinates.y += pinImgElemOrigin.y;

        pinImgElem.style.left = `${relativeCoordinates.x}px`;
        pinImgElem.style.top = `${relativeCoordinates.y}px`;
    }

    /**
     * Zooms in/out map according to given parameter and constants.
     * @param {Boolean} zoomIn 
     */
    zoomMap(zoomIn) {
        let zoomContainerElem = document.getElementById("zoomContainer");
        let zoomableContentElem = document.getElementById("zoomableContent");
        let pinImgElem = document.getElementById("pinImg");

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
        pinImgElem.style.transform = `scale(${1 / this.scale})`;
        
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
     * Calculates 'pinImg' origin coordinates relative to 'mapImg' using
     * parent element's and 'mapImg's' dimensions. Also accounts for the
     * dimensions of the 'pinImg' to make it's anchor at pin's point.
     */
    calcPinImgElemOrigin() {
        let pinImgElem = document.getElementById("pinImg");
        let zoomableContentElem = document.getElementById("zoomableContent");
        let mapImgElem = document.getElementById("mapImg");
        let zoomableContentElemBR = zoomableContentElem.getBoundingClientRect();
        let mapImgElemBR = mapImgElem.getBoundingClientRect();

        let x = mapImgElemBR.x - zoomableContentElemBR.x;
        let y = mapImgElemBR.y - zoomableContentElemBR.y;

        x -= pinImgElem.offsetWidth / 2;
        y -= pinImgElem.offsetHeight;

        return {x: x, y: y};
    }
    
    /**
     * Calculates 'pinImg' relative coordinates to 'mapImg' and returns it.
     */
    calcPinImgElemRelative() {
        let mapImgElem = document.getElementById("mapImg");
        let mapW = mapImgElem.getBoundingClientRect().width;

        const topmostLat = 41.816398;
        const leftmostLong = 44.682701;
        const rightmostLong = 45.012187;

        let wholeMapW = 360 / (rightmostLong - leftmostLong) * mapW;
        let wholeMapH = wholeMapW;

        let anchorCoordinates = this.calcMercator(topmostLat, leftmostLong, wholeMapW, wholeMapH);
        let currCoordinates = this.calcMercator(this.latitude, this.longitude, wholeMapW, wholeMapH);

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
            document.getElementById("pinImg").style.transform = "scale(1)";
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
}
