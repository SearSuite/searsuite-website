const packages = Array.from(document.querySelectorAll<HTMLElement>('[data-reference-package]'));
const navigation = document.querySelector<HTMLElement>('[data-reference-navigation]');
const navigationScroller = navigation?.closest<HTMLElement>('.searsuite-toc-inner');
const detailChapters = Array.from(document.querySelectorAll<HTMLElement>('[data-reference-detail-chapter]'));
let scrollFrame = 0;

const symbolIds = new Map<string, string>();
const ambiguousSymbols = new Set<string>();
for (const symbol of document.querySelectorAll<HTMLElement>('.reference-package [data-reference-symbol]')) {
  const name = symbol.querySelector('dt > a:not(.source-link)')?.textContent?.trim();
  if (!name) continue;
  if (symbolIds.has(name)) ambiguousSymbols.add(name);
  else symbolIds.set(name, symbol.id);
}
for (const name of ambiguousSymbols) symbolIds.delete(name);

for (const concept of document.querySelectorAll<HTMLElement>('.reference-concept')) {
  for (const code of concept.querySelectorAll<HTMLElement>('p code, li code')) {
    if (code.closest('a')) continue;
    const name = code.textContent?.trim().replace(/\(\)$/, '') ?? '';
    const packageId = name.match(/^@searsuite\/(sear-[a-z0-9-]+)$/)?.[1];
    const id = packageId && document.getElementById(packageId) ? packageId : symbolIds.get(name);
    if (!id) continue;
    const link = document.createElement('a');
    link.href = `#${id}`;
    link.append(code.cloneNode(true));
    code.replaceWith(link);
  }
}

function hashTarget(): HTMLElement | null {
  try {
    return document.getElementById(decodeURIComponent(location.hash.slice(1)));
  } catch {
    return null;
  }
}

function setActiveSection(id: string | undefined): void {
  for (const link of navigation?.querySelectorAll<HTMLAnchorElement>('a') ?? []) {
    const active = link.hash === `#${id}`;
    link.classList.toggle('searsuite-toc-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
    if (active && navigationScroller) {
      const linkRect = link.getBoundingClientRect();
      const scrollerRect = navigationScroller.getBoundingClientRect();
      if (linkRect.top < scrollerRect.top) navigationScroller.scrollTop += linkRect.top - scrollerRect.top;
      else if (linkRect.bottom > scrollerRect.bottom) navigationScroller.scrollTop += linkRect.bottom - scrollerRect.bottom;
    }
  }
}

function updateActiveFromScroll(): void {
  const current = packages.filter((item) => item.getBoundingClientRect().top <= 140).at(-1);
  const chapter = detailChapters.filter((item) => item.getBoundingClientRect().top <= 140).at(-1);
  setActiveSection(current?.id ?? chapter?.id);
}

function followHash(): void {
  const target = hashTarget();
  const packageElement = target?.closest<HTMLElement>('[data-reference-package]');
  let expanded = false;
  for (let parent = target?.parentElement; parent; parent = parent.parentElement) {
    if (parent.matches('.reference-member-group, .reference-inherited') && !(parent as HTMLDetailsElement).open) {
      (parent as HTMLDetailsElement).open = true;
      expanded = true;
    }
  }
  if (packageElement) setActiveSection(packageElement.id);
  else if (target && navigation?.querySelector(`a[href="#${target.id}"]`)) setActiveSection(target.id);
  if (expanded) requestAnimationFrame(() => target?.scrollIntoView({ block: 'start' }));
}

window.addEventListener('hashchange', followHash);
window.addEventListener('scroll', () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    updateActiveFromScroll();
  });
}, { passive: true });
if (location.hash) followHash();
else updateActiveFromScroll();
