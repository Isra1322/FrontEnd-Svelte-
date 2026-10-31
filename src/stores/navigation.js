import { writable } from 'svelte/store';

const VALID_PAGES = ['home', 'login', 'register', 'createorder', 'invoices'];

function getInitialPage() {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace('#', '').toLowerCase();
  return VALID_PAGES.includes(hash) ? hash : 'home';
}

function createNavigationStore() {
  const { subscribe, set } = writable(getInitialPage());

  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      const page = getInitialPage();
      set(page);
    });
  }

  return {
    subscribe,
    navigate: (page) => {
      if (VALID_PAGES.includes(page)) {
        if (typeof window !== 'undefined') {
          window.location.hash = page;
        }
        set(page);
      }
    }
  };
}

export const navigation = createNavigationStore();
export const currentPage = navigation;
