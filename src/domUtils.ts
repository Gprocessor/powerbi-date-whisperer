"use strict";

/**
 * Safe DOM utilities — AppSource certification compliant.
 * 
 * The core problem: DOMParser moves <style> tags to <head>, not <body>,
 * so importNode(body) silently drops all CSS. We solve this by:
 * 1. Extracting <style> content and injecting it via element.textContent (safe)
 * 2. Injecting the rest of the HTML via DOMParser → importNode
 */

/**
 * Safely sets element content from a developer-controlled HTML template.
 * Handles <style> tags correctly — CSS is injected via textContent, never innerHTML.
 * No user input is ever passed to this function.
 */
export function setHTML(el: HTMLElement, html: string): void {
    // Clear existing children
    while (el.firstChild) el.removeChild(el.firstChild);

    // Extract all <style> blocks first
    const stylePattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const styleMatches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = stylePattern.exec(html)) !== null) {
        styleMatches.push(match[1]); // capture group = CSS text only
    }

    // Remove style tags from html before parsing
    const bodyHtml = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

    // Inject each style block safely via textContent (not innerHTML)
    styleMatches.forEach(cssText => {
        const styleEl = document.createElement("style");
        styleEl.textContent = cssText; // textContent is safe — treated as text
        el.appendChild(styleEl);
    });

    // Parse remaining HTML with DOMParser — no scripts execute
    if (bodyHtml.trim()) {
        const parser = new DOMParser();
        const doc    = parser.parseFromString(bodyHtml, "text/html");
        const nodes  = Array.from(doc.body.childNodes);
        nodes.forEach(node => el.appendChild(document.importNode(node, true)));
    }
}
