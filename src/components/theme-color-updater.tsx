"use client";

import { useEffect } from "react";

export function ThemeColorUpdater() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Gerenciador Dinâmico de Cores da Barra de Status e Ações do Android
    const updateThemeColors = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      // Cor de fundo padrão do aplicativo para cada modo
      const targetBgColor = isDark ? "#0c090c" : "#ffffff";

      // Atualiza ou cria a meta tag theme-color principal (usada pelo Android Chrome / PWA)
      let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement("meta");
        metaThemeColor.setAttribute("name", "theme-color");
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute("content", targetBgColor);

      // Também sincroniza as meta tags condicionais por media query
      const lightMeta = document.querySelector('meta[name="theme-color"][media*="light"]');
      if (lightMeta) {
        lightMeta.setAttribute("content", "#ffffff");
      }
      const darkMeta = document.querySelector('meta[name="theme-color"][media*="dark"]');
      if (darkMeta) {
        darkMeta.setAttribute("content", "#0c090c");
      }

      // Configuração para iOS Safari Status Bar
      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!appleMeta) {
        appleMeta = document.createElement("meta");
        appleMeta.setAttribute("name", "apple-mobile-web-app-status-bar-style");
        document.head.appendChild(appleMeta);
      }
      appleMeta.setAttribute("content", isDark ? "black-translucent" : "default");
    };

    updateThemeColors();

    // Escuta mudanças de tema no sistema operacional do dispositivo
    const colorSchemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      updateThemeColors();
    };
    colorSchemeMediaQuery.addEventListener("change", handleMediaChange);

    // Observa alterações de classe no elemento <html> (caso seja alternado no futuro)
    const observer = new MutationObserver(() => {
      updateThemeColors();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // 2. Prevenção de Touch to Search e Seleção de Texto no Android PWA
    // Evita que toques em palavras do app ("tarefas", "hoje", etc.) abram a barra de pesquisa do Google
    const isInputElement = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        el.getAttribute("contenteditable") === "true" ||
        Boolean(el.closest("input, textarea, [contenteditable='true']"))
      );
    };

    const handleSelectionChange = () => {
      const active = document.activeElement;
      if (!isInputElement(active)) {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          selection.removeAllRanges();
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!isInputElement(target)) {
        e.preventDefault();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      colorSchemeMediaQuery.removeEventListener("change", handleMediaChange);
      observer.disconnect();
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return null;
}
