export const sidebarResizeBounds = { min: 220, max: 480 };
const minimumContentWidth = 320;
const keyboardStep = 16;
export function attachSidebarResizeHandle(handle) {
    const shell = handle.closest('.searsuite-resizable-shell');
    const sidebar = shell?.querySelector(':scope > .searsuite-sidebar');
    if (!shell || !sidebar)
        return () => { };
    let activePointer = null;
    let startX = 0;
    let startWidth = 0;
    const bounds = () => ({
        min: sidebarResizeBounds.min,
        max: Math.max(sidebarResizeBounds.min, Math.min(sidebarResizeBounds.max, shell.getBoundingClientRect().width - minimumContentWidth)),
    });
    const currentWidth = () => sidebar.getBoundingClientRect().width;
    const syncRange = () => {
        const { min, max } = bounds();
        handle.setAttribute('aria-valuemin', String(min));
        handle.setAttribute('aria-valuemax', String(Math.floor(max)));
        handle.setAttribute('aria-valuenow', String(Math.round(currentWidth())));
    };
    const setWidth = (width) => {
        const { min, max } = bounds();
        const next = Math.round(Math.max(min, Math.min(max, width)));
        shell.style.setProperty('--searsuite-sidebar-width', `${next}px`);
        syncRange();
    };
    const isVisible = () => getComputedStyle(handle).display !== 'none';
    const stopDragging = (event) => {
        if (activePointer !== event.pointerId)
            return;
        activePointer = null;
        document.documentElement.classList.remove('searsuite-resizing-sidebar');
        if (handle.hasPointerCapture?.(event.pointerId))
            handle.releasePointerCapture(event.pointerId);
    };
    const onPointerDown = (event) => {
        if (event.button !== 0 || !isVisible())
            return;
        event.preventDefault();
        activePointer = event.pointerId;
        startX = event.clientX;
        startWidth = currentWidth();
        handle.setPointerCapture?.(event.pointerId);
        document.documentElement.classList.add('searsuite-resizing-sidebar');
    };
    const onPointerMove = (event) => {
        if (activePointer === event.pointerId)
            setWidth(startWidth + event.clientX - startX);
    };
    const onKeyDown = (event) => {
        if (!isVisible())
            return;
        const { min, max } = bounds();
        const step = event.shiftKey ? keyboardStep * 2 : keyboardStep;
        const width = event.key === 'ArrowLeft' ? currentWidth() - step
            : event.key === 'ArrowRight' ? currentWidth() + step
                : event.key === 'Home' ? min
                    : event.key === 'End' ? max
                        : null;
        if (width === null)
            return;
        event.preventDefault();
        setWidth(width);
    };
    const onDoubleClick = () => {
        shell.style.removeProperty('--searsuite-sidebar-width');
        syncRange();
    };
    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', stopDragging);
    handle.addEventListener('pointercancel', stopDragging);
    handle.addEventListener('lostpointercapture', stopDragging);
    handle.addEventListener('keydown', onKeyDown);
    handle.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('resize', syncRange);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncRange);
    observer?.observe(shell);
    syncRange();
    return () => {
        observer?.disconnect();
        window.removeEventListener('resize', syncRange);
        handle.removeEventListener('pointerdown', onPointerDown);
        handle.removeEventListener('pointermove', onPointerMove);
        handle.removeEventListener('pointerup', stopDragging);
        handle.removeEventListener('pointercancel', stopDragging);
        handle.removeEventListener('lostpointercapture', stopDragging);
        handle.removeEventListener('keydown', onKeyDown);
        handle.removeEventListener('dblclick', onDoubleClick);
        document.documentElement.classList.remove('searsuite-resizing-sidebar');
    };
}
