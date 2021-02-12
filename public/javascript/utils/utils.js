// constants
export const ANIMATION_DELAY = 200;
export const TIMEOUT_DELAY = 20;

export const MOBILE_L = 425;
export const MOBILE_M = 375;

// functions
/**
 * Appends given html to given element.
 * @param {string} html 
 * @param {HTMLElement} element
 */
export function appendHtml(html, element) {
    let template = document.createElement("template");
    html = html.trim();
    template.innerHTML = html;

    let templateChildren = template.content.childNodes;
    for (let i = 0; i < templateChildren.length; i++) {
        element.appendChild(templateChildren[i]);
    }
}

/**
 * Set's body opacity to 0 and replaces given URL to window.
 * @param {String} destination
 */
export function fadeAndReplace(destination) {
    document.body.style.opacity = 0;    
    setTimeout(function() {
        window.location.replace(destination);
    }, ANIMATION_DELAY);
}
