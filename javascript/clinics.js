// constants
const mapScaleFactor = 1.2;
const mapScaleThreshold = 2;
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
        this.windowResizeHndlerRef = this.windowResizeHndler.bind(this);
    }

    /**
     * Builds new template of HTML element of clinics header and
     * calls appendHtml().
     */
    drawHeader() {
        let html = `
            <div class="clinicsHeader">
                <text>Header</text>
            </div>
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
                        <text>Clinic Title</text>
                    </div>
                    <div class="clinicDescription">
                        <text>Clinic Description</text>
                    </div>
                    <div class="clinicDashboard">
                        <text>Clinic Dashboard</text>
                    </div>
                </div>
                <div class="mapContainer">
                    <div class="mapHeader">
                        <text>Map Header</text>
                    </div>
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
                    <div class="mapFooter">
                        <text>Map Footer</text>
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
            <div class="clinicsFooter">
                <text>Footer</text>
            </div>
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

        zoomContainerElem.addEventListener("mousedown", this.mouseDownHandlerRef);
        zoomContainerElem.addEventListener("wheel", this.mouseWheelHandlerRef);
        mapFooterBtnsElem.addEventListener("click", this.mouseClickHandlerRef);

        window.addEventListener("resize", this.windowResizeHndlerRef);
    }

    /**
     * Deinitializes event listeners.
     */
    deinitListeners() {
        let zoomContainerElem = document.getElementById("zoomContainer");
        let mapFooterBtnsElem = document.getElementById("mapFooterBtns");
        
        zoomContainerElem.removeEventListener("mousedown", this.mouseDownHandlerRef);
        zoomContainerElem.removeEventListener("wheel", this.mouseWheelHandlerRef);
        mapFooterBtnsElem.removeEventListener("click", this.mouseClickHandlerRef);

        window.removeEventListener("resize", this.windowResizeHndlerRef);
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
            navigator.geolocation.getCurrentPosition(showPositionRef, showErrorRef);
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
        this.latitude = 41.816448 - position.coords.latitude;
        this.longitude = position.coords.longitude - 44.682537;

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
     * On each window resize adjusts 'mapImg' size, calcualtes
     * new 'pinImg' origin and relative coordinates and updates
     * them.
     */
    windowResizeHndler() {
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
        let zoomableContentElem = document.getElementById("zoomableContent");

        if (!zoomIn && this.scale > 1) {
            this.scale /= mapScaleFactor;
        } else if (zoomIn && this.scale < mapScaleThreshold) {
            this.scale *= mapScaleFactor;
        }

        zoomableContentElem.style.transform = `scale(${this.scale})`;
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
     * Mercator projection. Calculates the coordinates of the point according
     * to given latitude and longitude on the map according to it's dimensions.
     * 
     * TODO! Needs revision as this isn't valid calculation for segments of the map.
     */
    calcPinImgElemRelative() {
        let mapImgElem = document.getElementById("mapImg");
        let mapW = mapImgElem.getBoundingClientRect().width;
        let mapH = mapImgElem.getBoundingClientRect().height;

        let x = (this.longitude + 180) * (mapW / 360);
        let latRad = this.latitude * Math.PI / 180;
        let mercator = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
        let y = (mapH / 2) - (mapW * mercator / (2 * Math.PI));

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
