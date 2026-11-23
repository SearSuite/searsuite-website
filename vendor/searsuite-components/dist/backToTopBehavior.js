export function attachBackToTop(button) {
    const view = button.ownerDocument.defaultView;
    if (!view)
        return () => { };
    const duration = 450;
    const configuredThreshold = Number(button.dataset['showAfter']);
    const showAfter = Number.isFinite(configuredThreshold) && configuredThreshold >= 0
        ? configuredThreshold : 400;
    const alwaysVisible = button.hasAttribute('data-always-visible');
    let animationFrame = 0;
    const stopAnimation = () => {
        if (animationFrame)
            view.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
    };
    const update = () => {
        button.hidden = !alwaysVisible && view.scrollY <= showAfter && button.ownerDocument.activeElement !== button;
    };
    const scrollToTop = (event) => {
        if (event.detail > 0)
            button.blur();
        stopAnimation();
        const reduceMotion = view.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        if (reduceMotion || view.scrollY <= 0) {
            view.scrollTo({ top: 0, behavior: 'instant' });
            return;
        }
        const startY = view.scrollY;
        let startTime;
        const step = (time) => {
            startTime ??= time;
            const progress = Math.min((time - startTime) / duration, 1);
            const eased = 1 - (1 - progress) ** 3;
            view.scrollTo({ top: Math.max(0, startY * (1 - eased)), behavior: 'instant' });
            animationFrame = progress < 1 ? view.requestAnimationFrame(step) : 0;
        };
        animationFrame = view.requestAnimationFrame(step);
    };
    button.addEventListener('click', scrollToTop);
    button.addEventListener('blur', update);
    view.addEventListener('scroll', update, { passive: true });
    view.addEventListener('wheel', stopAnimation, { passive: true });
    view.addEventListener('touchstart', stopAnimation, { passive: true });
    update();
    return () => {
        stopAnimation();
        button.removeEventListener('click', scrollToTop);
        button.removeEventListener('blur', update);
        view.removeEventListener('scroll', update);
        view.removeEventListener('wheel', stopAnimation);
        view.removeEventListener('touchstart', stopAnimation);
    };
}
