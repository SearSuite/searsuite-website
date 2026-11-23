import { attachBackToTop } from 'searsuite-components/back-to-top';

document.querySelectorAll<HTMLButtonElement>('[data-searsuite-component="BackToTop"]')
  .forEach(attachBackToTop);
