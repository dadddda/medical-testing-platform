// variables
let windowElemVar = null;
let parentElemVar = null;
let cardPos = null;

/**
 * Adjusts window element position so that it never goes out of
 * given 'parentElem' bounds.
 * @param {HTMLElement} windowElem
 * @param {HTMLElement} parentElem
 */
export function adjustWindowElemPos(windowElem, parentElem) {
    windowElemVar = windowElem;
    parentElemVar = parentElem;

    if (windowElemVar.innerHTML.length == 0) return;

    let parentElemVarBr = parentElemVar.getBoundingClientRect();
    let windowElemVarBr = windowElemVar.getBoundingClientRect();

    let left = windowElemVarBr.left - parentElemVarBr.left;
    let top = windowElemVarBr.top - parentElemVarBr.top;

    let overflowX = parentElemVarBr.width - (left + windowElemVarBr.width);
    let overflowY = parentElemVarBr.height - (top + windowElemVarBr.height);

    if (left <= 0) {
        windowElemVar.style.left = 0;
    } else {
        if (overflowX < 0) windowElemVar.style.left = `${left + overflowX}px`;
    }

    if (top <= 0) {
        windowElemVar.style.top = 0;
    } else {
        if (overflowY < 0) windowElemVar.style.top = `${top + overflowY}px`;
    }
}

/**
 * Window pointer down handler.
 * @param {Event} event 
 * @param {HTMLElement} windowElem
 * @param {HTMLElement} parentElem
 */
export function pointerDownHandler(event, windowElem, parentElem) {
    event.preventDefault();

    windowElemVar = windowElem;
    parentElemVar = parentElem;
    
    if (event.target.className != "windowHeader" && event.target.className != "windowHeaderText") return;
    windowElemVar.getElementsByClassName("windowHeader")[0].style.cursor = "grabbing";
    
    cardPos = {
        x: event.clientX,
        y: event.clientY
    };
    
    document.addEventListener("pointermove", pointerMoveHandler);
    document.addEventListener("pointerup", pointerUpHandler);
}

/**
 * Window pointer move handler.
 * @param {Event} event 
 */
function pointerMoveHandler(event) {
    event.preventDefault();

    let parentElemVarBr = parentElemVar.getBoundingClientRect();
    let windowElemVarBr = windowElemVar.getBoundingClientRect();

    const dx = event.clientX - cardPos.x;
    const dy = event.clientY - cardPos.y;

    cardPos = {
        x: event.clientX,
        y: event.clientY
    };

    let left = windowElemVarBr.left - parentElemVarBr.left;
    let top = windowElemVarBr.top - parentElemVarBr.top;

    left += dx;
    top += dy;

    if (left >= 0 && left <= parentElemVarBr.width - windowElemVarBr.width) {
        windowElemVar.style.left = `${left}px`;
    }
    if (top >= 0 && top <= parentElemVarBr.height - windowElemVarBr.height) {
        windowElemVar.style.top = `${top}px`;
    }
}

/**
 * Window pointer up handler.
 * @param {Event} event
 */
function pointerUpHandler(event) {
    event.preventDefault();

    windowElemVar.getElementsByClassName("windowHeader")[0].style.cursor = "grab";

    document.removeEventListener("pointermove", pointerMoveHandler);
    document.removeEventListener("pointerup", pointerUpHandler);
}
