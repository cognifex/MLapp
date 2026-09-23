package net.mlapp.huelle;

import android.Manifest;
import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Die einzige Ansicht der Android-Huelle: ein WebView mit der gebauten Web-Fassung.
 *
 * Aufgaben:
 *  1. Anlagen ueber den lokalen Server ausliefern und laden.
 *  2. Die Schnittstelle window.MLappTTS bereitstellen (sprechen, anhalten, fortschreiten,
 *     Stimmen) und nach jeder Aeusserung window.__mlappTtsFertig(kennung) aufrufen.
 *  3. Die Zurueck-Taste an die Oberflaeche weitergeben, solange es dort Verlauf gibt.
 */
public class MainActivity extends Activity implements TtsDienst.Melder {

    private WebView ansicht;
    private LokalerServer server;
    private TtsDienst dienst;
    private boolean gebunden;

    private final ServiceConnection verbindung = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder binder) {
            dienst = ((TtsDienst.LokalerBinder) binder).dienst();
            dienst.setzeMelder(MainActivity.this);
            gebunden = true;
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            dienst = null;
        }
    };

    @Override
    protected void onCreate(Bundle zustand) {
        super.onCreate(zustand);

        server = new LokalerServer(getAssets());
        Thread serverFaden = new Thread(server, "mlapp-server");
        serverFaden.setDaemon(true);
        serverFaden.start();

        ansicht = new WebView(this);
        WebSettings einstellungen = ansicht.getSettings();
        einstellungen.setJavaScriptEnabled(true);
        einstellungen.setDomStorageEnabled(true);
        einstellungen.setMediaPlaybackRequiresUserGesture(false);
        einstellungen.setAllowFileAccess(false);
        einstellungen.setAllowContentAccess(false);
        einstellungen.setSupportZoom(false);
        ansicht.setWebViewClient(new WebViewClient());
        ansicht.addJavascriptInterface(new Bruecke(), "MLappTTS");
        setContentView(ansicht);

        aufPortWartenUndLaden();

        Intent dienstAbsicht = new Intent(this, TtsDienst.class);
        startForegroundService(dienstAbsicht);
        bindService(dienstAbsicht, verbindung, Context.BIND_AUTO_CREATE);

        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, 12);
        }
    }

    private void aufPortWartenUndLaden() {
        new Thread(() -> {
            int versuche = 0;
            while (server.port() == 0 && versuche < 100) {
                try {
                    Thread.sleep(20);
                } catch (InterruptedException ignoriert) {
                    Thread.currentThread().interrupt();
                    return;
                }
                versuche++;
            }
            final String adresse = "http://127.0.0.1:" + server.port() + "/";
            runOnUiThread(() -> ansicht.loadUrl(adresse));
        }, "mlapp-lader").start();
    }

    /** Schnittstelle fuer die Web-Fassung: window.MLappTTS. */
    public class Bruecke {
        @JavascriptInterface
        public void speak(String text, float rate, String stimme, String kennung) {
            runOnUiThread(() -> {
                if (dienst != null) dienst.sprich(text, rate, stimme, kennung);
                else fertig(kennung);
            });
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> {
                if (dienst != null) dienst.halt();
            });
        }

        @JavascriptInterface
        public void pause() {
            runOnUiThread(() -> {
                if (dienst != null) dienst.pause();
            });
        }

        @JavascriptInterface
        public void resume() {
            runOnUiThread(() -> {
                if (dienst != null) dienst.fortsetzen();
            });
        }

        @JavascriptInterface
        public String voices() {
            return dienst == null ? "[]" : dienst.stimmenJson();
        }
    }

    @Override
    public void fertig(String kennung) {
        runOnUiThread(() -> {
            if (ansicht == null || kennung == null) return;
            String bereinigt = kennung.replace("'", "");
            ansicht.evaluateJavascript(
                    "window.__mlappTtsFertig && window.__mlappTtsFertig('" + bereinigt + "')", null);
        });
    }

    @Override
    public void onBackPressed() {
        if (ansicht != null && ansicht.canGoBack()) {
            ansicht.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (gebunden) {
            unbindService(verbindung);
            gebunden = false;
        }
        stopService(new Intent(this, TtsDienst.class));
        if (server != null) server.beenden();
        if (ansicht != null) ansicht.destroy();
        super.onDestroy();
    }
}
