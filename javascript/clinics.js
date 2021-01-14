class clinics {

    /**
     * Constructs new 'clinics' object with given 'clinicsElem'
     * element.
     * @param clinicsElem 
     */
    constructor(clinicsElem) {
        this.clinicsElem = clinicsElem;
        this.pos = {top: 0, left: 0, x: 0, y: 0};
        this.scale = 1;

        this.mouseDownHandlerRef = this.mouseDownHandler.bind(this);
        this.mouseMoveHandlerRef = this.mouseMoveHandler.bind(this);
        this.mouseUpHandlerRef = this.mouseUpHandler.bind(this);
        this.mouseWheelHandlerRef = this.mouseWheelHandler.bind(this);
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
            <div class="clinicsContent" id="clinicsContent">
                <div class="zoomableContent">
                    <img class="mapImg" id="mapImg" src="../images/map.png">
                    <img class="pinImg hidden" id="pinImg" src="../images/pin.png">
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
     * @param element
     */
    appendHtml(html, element) {
        let template = document.createElement("template");
        html = html.trim();
        template.innerHTML = html;
        element.appendChild(template.content.firstChild);
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
     * Initializes "mouseDown" and "wheel" event listeners for the content.
     * Extracts latitude and longitude from user's location and using 'mapImg' element
     * dimensions and Mercator projection calculates estimate coordinates on x, y
     * plane and drops pin at that exact location.
     * @param position 
     */
    showPosition(position) {
        let clinicsContentElem = document.getElementById("clinicsContent");
        clinicsContentElem.addEventListener("mousedown", this.mouseDownHandlerRef);
        clinicsContentElem.addEventListener("wheel", this.mouseWheelHandlerRef);
        
        let latitude = 41.816448 - position.coords.latitude;
        let longitude = position.coords.longitude - 44.682537;

        let mapW = document.getElementById("mapImg").offsetWidth;
        let mapH = document.getElementById("mapImg").offsetHeight;
              
        let x = (longitude + 180) * (mapW / 360);
        let latRad = latitude * Math.PI / 180;
        let mercator = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
        let y = (mapH / 2) - (mapW * mercator / (2 * Math.PI));

        let pinImgElem = document.getElementById("pinImg");

        x -= pinImgElem.offsetWidth / 2;
        y -= pinImgElem.offsetHeight;

        pinImgElem.classList.remove("hidden");
        pinImgElem.style.left = `${x}px`;
        pinImgElem.style.top = `${y}px`;
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
     * Mouse down handler when 'zoomableContent' is zoomed.
     * @param event 
     */
    mouseDownHandler(event) {
        event.preventDefault();
        let clinicsContentElem = document.getElementById("clinicsContent");
        let zoomableContentElem = clinicsContentElem.firstElementChild;
        if (!this.overflows(zoomableContentElem, clinicsContentElem)) return;
        clinicsContentElem.style.cursor = "grabbing";

        console.log("down");

        this.pos = {
            left: clinicsContentElem.scrollLeft,
            top: clinicsContentElem.scrollTop,
            x: event.clientX,
            y: event.clientY
        };
        
        document.addEventListener("mousemove", this.mouseMoveHandlerRef);
        document.addEventListener("mouseup", this.mouseUpHandlerRef);
    }

    /**
     * Mouse move handler when 'zoomableContent' is zoomed.
     * @param event 
     */
    mouseMoveHandler(event) {
        event.preventDefault();
        let clinicsContentElem = document.getElementById("clinicsContent");
        let zoomableContentElem = clinicsContentElem.firstElementChild;
        if (!this.overflows(zoomableContentElem, clinicsContentElem)) return;

        console.log("move");

        const dx = event.clientX - this.pos.x;
        const dy = event.clientY - this.pos.y;
        
        clinicsContentElem.scrollTop = this.pos.top - dy;
        clinicsContentElem.scrollLeft = this.pos.left - dx;
    }

    /**
     * Mouse up handler when 'zoomableContent' is zoomed.
     * @param event 
     */
    mouseUpHandler(event) {
        event.preventDefault();
        let clinicsContentElem = document.getElementById("clinicsContent");
        let zoomableContentElem = clinicsContentElem.firstElementChild;
        if (!this.overflows(zoomableContentElem, clinicsContentElem)) return;
        clinicsContentElem.style.cursor = "grab";

        console.log("up");

        document.removeEventListener("mousemove", this.mouseMoveHandlerRef);
        document.removeEventListener("mouseup", this.mouseUpHandlerRef);
    }

    /**
     * Mouse wheel handler for zooming 'zoomableContent'.
     * @param event 
     */
    mouseWheelHandler(event) {
        event.preventDefault();

        this.scale += event.deltaY * -0.005;
        this.scale = Math.min(Math.max(1, this.scale), 4);
        
        let clinicsContentElem = document.getElementById("clinicsContent");
        let zoomableContentElem = clinicsContentElem.firstElementChild;
        zoomableContentElem.style.transform = `scale(${this.scale})`;

        if (!this.overflows(zoomableContentElem, clinicsContentElem)) {
            clinicsContentElem.style.cursor = "default";
        } else {
            clinicsContentElem.style.cursor = "grab";
        }
    }

    /**
     * If elem1 overflows from elem2 true is returned.
     * @param elem1 
     * @param elem2 
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
