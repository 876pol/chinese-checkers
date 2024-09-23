export class CookieManager {
    static set(name, value): void {
        document.cookie = `${name}=${value}; path=/`;
    }

    static get(name): string {
        const cookies: string[] = document.cookie.split('; ');
        for (const cookie: string of cookies) {
            const [cookieName, cookieValue]: string[] = cookie.split('=');
            if (cookieName === name) return cookieValue;
        }
        return null;
    }

    static delete(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    }
}