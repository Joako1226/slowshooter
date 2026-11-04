/*--ADS--*/const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
// ====== CONFIGURACIÓN: sustituye por tus IDs reales antes de publicar ======
const CFG = {
  testing: false,                                           // pon false con tus IDs reales
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
function adNote(t) { const e = document.getElementById('adErr'); if (!e) return; e.textContent = t || ''; e.hidden = !t; }
const ADS = {
  provider: NATIVE ? 'admob' : 'test',
  busy: false,
  showRewarded(onReward) {
    if (this.provider === 'test') { testAd(onReward); return; }
    if (this.busy) return;
    this.busy = true;
    const subs = [];
    let rewarded = false, shown = false, finished = false, timer = 0;
    const end = () => { finished = true; this.busy = false; clearTimeout(timer); subs.forEach(h => h && h.remove && h.remove()); };
    const fail = (why) => { if (finished) return; end(); adNote('Anuncio no disponible' + (why ? ' (' + why + ')' : '')); };
    (async () => {
      try {
        if (!P.AdMob) { fail('sin plugin'); return; }
        adNote('Cargando anuncio…');
        timer = setTimeout(() => fail('tiempo agotado'), 20000);
        if (!adReady) { await P.AdMob.initialize({ initializeForTesting: CFG.testing }); adReady = true; }
        subs.push(await P.AdMob.addListener('onRewardedVideoAdReward', () => { rewarded = true; }));
        subs.push(await P.AdMob.addListener('onRewardedVideoAdDismissed', () => { if (finished) return; end(); adNote(''); if (rewarded) onReward(); }));
        subs.push(await P.AdMob.addListener('onRewardedVideoAdFailedToLoad', e => fail(e && (e.message || e.code))));
        subs.push(await P.AdMob.addListener('onRewardedVideoAdFailedToShow', e => fail(e && (e.message || e.code))));
        subs.push(await P.AdMob.addListener('onRewardedVideoAdShowed', () => { shown = true; clearTimeout(timer); adNote(''); }));
        await P.AdMob.prepareRewardVideoAd({ adId: CFG.rewardedAdUnit, isTesting: CFG.testing });
        if (finished) return;
        await P.AdMob.showRewardVideoAd();
        if (!shown) { clearTimeout(timer); }
      } catch (e) { fail(e && (e.message || e.code || String(e))); }
    })();
  }
};
/*--ADS--*/
