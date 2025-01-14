export function disableMultitouch(element) {
    let pointerId = null
    element.addEventListener("pointerdown", function(e) {
        if (pointerId !== null)
            e.stopPropagation();
        else
            pointerId = e.pointerId;
    }, true);
    element.addEventListener("pointermove", function(e) {
        if (e.pointerId !== pointerId)
            e.stopPropagation();
    }, true);
    element.addEventListener("pointerup", function(e) {
        if (e.pointerId !== pointerId)
            e.stopPropagation();
        else
            pointerId = null;
    }, true);
}