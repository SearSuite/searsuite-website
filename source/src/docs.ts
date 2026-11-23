import { attachSidebarResizeHandle } from 'searsuite-components/sidebar-resize';

document.querySelectorAll<HTMLElement>('.searsuite-sidebar-resize-handle').forEach(attachSidebarResizeHandle);

function setActive(id: string) {
  document.querySelectorAll<HTMLAnchorElement>('.manual-sidebar a.is-active, .manual-sidebar a.searsuite-toc-active')
    .forEach((link) => {
      link.classList.remove('is-active', 'searsuite-toc-active');
      link.removeAttribute('aria-current');
    });
  const next = document.querySelector<HTMLAnchorElement>(`.manual-sidebar a[href="#${id}"]`);
  next?.classList.add('is-active', 'searsuite-toc-active');
  next?.setAttribute('aria-current', 'location');
}

if (document.body.classList.contains('guide-page')) {
  const headings = [...document.querySelectorAll<HTMLElement>(
    '.manual-article .searsuite-article-header[id], .manual-article section[id], .manual-article h3[id]',
  )];
  const update = () => {
    const headerHeight = document.querySelector('.searsuite-header')?.getBoundingClientRect().height ?? 72;
    let current = headings[0];
    for (const heading of headings) {
      const scrollMargin = parseFloat(getComputedStyle(heading).scrollMarginTop);
      const activationLine = scrollMargin > 0 ? scrollMargin : headerHeight + 30;
      if (heading.getBoundingClientRect().top > activationLine + 1) break;
      current = heading;
    }
    if (current) setActive(current.id);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('hashchange', update);
  update();
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (!visible) return;
      setActive(visible.target.id);
    },
    { rootMargin: '-20% 0px -65%' },
  );

  document.querySelectorAll<HTMLElement>('.manual-article [id]').forEach((section) => observer.observe(section));
}
