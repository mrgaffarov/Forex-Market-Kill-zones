/* APK (Capacitor) uchun native ko‘prik.
   Bu fayl faqat build vaqtida yig‘iladi: esbuild → www/native-bundle.js
   Brauzerda (PWA) bu fayl ishlatilmaydi. */
import { App } from "@capacitor/app";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

const DARK = "#0b121b", LIGHT = "#f4f6f9";

window.KZNative = {
  /* Status bar rangini mavzuga moslash */
  setTheme(isDark) {
    try {
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: isDark ? DARK : LIGHT }).catch(() => {});
    } catch (e) {}
  },

  /* Zaxira faylini ilova keshiga yozib, “Ulashish” oynasini ochadi
     (Google Drive, Telegram, Files va h.k.) */
  async saveFile(name, text) {
    const r = await Filesystem.writeFile({
      path: "KillZone/" + name,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true
    });
    try {
      await Share.share({
        title: name,
        url: r.uri,
        dialogTitle: "Zaxira faylini saqlash"
      });
    } catch (e) {}
    return r.uri;
  },

  /* Android “orqaga” tugmasi: cb() true qaytarsa — ilova ochiq qoladi */
  onBack(cb) {
    App.addListener("backButton", () => {
      let handled = false;
      try { handled = !!cb(); } catch (e) {}
      if (!handled) App.exitApp();
    });
  },

  hideSplash() {
    SplashScreen.hide().catch(() => {});
  }
};
