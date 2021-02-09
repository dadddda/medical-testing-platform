// constants
export const ANIMATION_DELAY = 200;
export const TIMEOUT_DELAY = 20;

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
