/*--ADS--*/const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
// ====== CONFIGURACIÓN: sustituye por tus IDs reales antes de publicar ======
const CFG = {
  testing: true,                                           // pon false con tus IDs reales
  rewardedAdUnit: 'ca-app-pub-2046215707383325/9122055316', // ID de prueba de Google (rewarded)
  leaderboards: {                                          // IDs de Play Games Services (uno por modo)
    classic: 'REEMPLAZA_ID_CLASICO',
    time: 'REEMPLAZA_ID_CONTRARRELOJ',
    hard: 'REEMPLAZA_ID_POLVORA'
  }
};
const P = NATIVE ? window.Capacitor.Plugins : {};
let adReady = false, gcSigned = false;
async function initNative() {
  if (!NATIVE) return;
  try {
    if (P.AdMob) {
      await P.AdMob.initialize({ initializeForTesting: CFG.testing });
      try {
        const info = await P.AdMob.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === 'REQUIRED') await P.AdMob.showConsentForm();
      } catch (e) { /* consentimiento no disponible */ }
      adReady = true;
    }
  } catch (e) { adReady = false; }
  try { if (P.CapacitorGameConnect) { await P.CapacitorGameConnect.signIn(); gcSigned = true; } } catch (e) { gcSigned = false; }
}
function submitScoreNative(total) {
  if (!NATIVE || !gcSigned || !P.CapacitorGameConnect) return;
  P.CapacitorGameConnect.submitScore({ leaderboardID: CFG.leaderboards[modeId], totalScoreAmount: total }).catch(() => {});
}
async function showLeaderboardNative() {
  if (!NATIVE || !P.CapacitorGameConnect) return;
  try { if (!gcSigned) { await P.CapacitorGameConnect.signIn(); gcSigned = true; } await P.CapacitorGameConnect.showLeaderboard({ leaderboardID: CFG.leaderboards[modeId] }); } catch (e) { /* sin sesión */ }
}
const ADS = {
  provider: NATIVE ? 'admob' : 'test',
  showRewarded(onReward) {
    if (this.provider === 'test') { testAd(onReward); return; }
    if (!P.AdMob || !adReady) { callout('Anuncio no disponible', '#ff9a4d'); return; }
    let rewarded = false;
    const subs = [];
    const done = () => { subs.forEach(h => h && h.remove && h.remove()); if (rewarded) onReward(); };
    (async () => {
      try {
        subs.push(await P.AdMob.addListener('onRewardedVideoAdReward', () => { rewarded = true; }));
        subs.push(await P.AdMob.addListener('onRewardedVideoAdDismissed', done));
        subs.push(await P.AdMob.addListener('onRewardedVideoAdFailedToShow', () => { subs.forEach(h => h && h.remove && h.remove()); callout('Anuncio no disponible', '#ff9a4d'); }));
        await P.AdMob.prepareRewardVideoAd({ adId: CFG.rewardedAdUnit, isTesting: CFG.testing });
        await P.AdMob.showRewardVideoAd();
      } catch (e) { subs.forEach(h => h && h.remove && h.remove()); callout('Anuncio no disponible', '#ff9a4d'); }
    })();
  }
};
/*--ADS--*/
