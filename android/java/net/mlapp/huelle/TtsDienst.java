package net.mlapp.huelle;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Binder;
import android.os.Bundle;
import android.os.IBinder;
import android.os.PowerManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Sprachausgabe fuer die MLapp als Vordergrunddienst.
 *
 * Nur so sind die Anforderungen aus SPEZIFIKATION.md ueberhaupt erfuellbar: Sprache bei
 * ausgeschaltetem Bildschirm, Steuerung ueber den Sperrbildschirm und Kopfloerertasten,
 * Vorrang gegenueber anderen Apps (Audio-Fokus) und Rueckmeldung bei Unterbrechungen.
 *
 * Was dieser Dienst bewusst nicht tut: Saetze zerlegen. Der Player in der Web-Fassung spricht
 * Block fuer Block; jeder Aufruf kommt hier als eine Aeusserung an. Deshalb ist "Pause" auf
 * Blockgrenzen genau: angehalten wird am Ende des laufenden Blocks.
 */
public class TtsDienst extends Service implements TextToSpeech.OnInitListener {

    /** Rueckmeldung an die Oberflaeche, wenn eine Aeusserung gesprochen ist. */
    public interface Melder {
        void fertig(String kennung);
    }

    public static final String KANAL = "mlapp-vorlesen";

    private final Binder binder = new LokalerBinder();
    private TextToSpeech sprache;
    private boolean bereit;
    private String letzterText = "";
    private float letzteRate = 1f;
    private String letzteStimme = "";
    private Melder melder;
    private MediaSession sitzung;
    private AudioManager tonVerwaltung;
    private AudioFocusRequest fokusAnfrage;
    private PowerManager.WakeLock wach;

    public class LokalerBinder extends Binder {
        TtsDienst dienst() {
            return TtsDienst.this;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        tonVerwaltung = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        legeKanalAn();
        starteVordergrund();
        sprache = new TextToSpeech(this, this);
        sprache.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String kennung) {
                setzeWiedergabeZustand(PlaybackState.STATE_PLAYING);
            }

            @Override
            public void onDone(String kennung) {
                meldeFertig(kennung);
            }

            @Override
            public void onError(String kennung) {
                meldeFertig(kennung);
            }
        });
        richteSitzungEin();
    }

    private void richteSitzungEin() {
        sitzung = new MediaSession(this, "MLapp");
        sitzung.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                fortsetzen();
            }

            @Override
            public void onPause() {
                pause();
            }

            @Override
            public void onStop() {
                halt();
            }
        });
        sitzung.setActive(true);
        setzeWiedergabeZustand(PlaybackState.STATE_NONE);
    }

    private void setzeWiedergabeZustand(int zustand) {
        if (sitzung == null) return;
        PlaybackState.Builder bauer = new PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE
                        | PlaybackState.ACTION_STOP | PlaybackState.ACTION_PLAY_PAUSE);
        bauer.setState(zustand, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1f);
        sitzung.setPlaybackState(bauer.build());
    }

    private void legeKanalAn() {
        NotificationManager verwaltung = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (verwaltung.getNotificationChannel(KANAL) == null) {
            NotificationChannel kanal = new NotificationChannel(
                    KANAL, "Vorlesen", NotificationManager.IMPORTANCE_LOW);
            kanal.setDescription("Zeigt an, dass die MLapp vorliest");
            verwaltung.createNotificationChannel(kanal);
        }
    }

    private void starteVordergrund() {
        Intent oeffnen = new Intent(this, MainActivity.class);
        PendingIntent fenster = PendingIntent.getActivity(
                this, 0, oeffnen, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification hinweis = new Notification.Builder(this, KANAL)
                .setContentTitle("MLapp liest vor")
                .setContentText("Tippen, um zur Lektion zurueckzukehren")
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentIntent(fenster)
                .setOngoing(true)
                .build();
        startForeground(4711, hinweis);
    }

    @Override
    public int onStartCommand(Intent absicht, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent absicht) {
        return binder;
    }

    @Override
    public void onInit(int status) {
        bereit = status == TextToSpeech.SUCCESS;
        if (bereit) {
            sprache.setLanguage(Locale.GERMAN);
        }
    }

    public void setzeMelder(Melder neuerMelder) {
        this.melder = neuerMelder;
    }

    /** Spricht einen Block. Rueckmeldung kommt ueber Melder.fertig(kennung). */
    public void sprich(String text, float rate, String stimmenName, String kennung) {
        if (!bereit || text == null || text.isEmpty()) {
            meldeFertig(kennung);
            return;
        }
        letzterText = text;
        letzteRate = rate;
        letzteStimme = stimmenName == null ? "" : stimmenName;
        nimmFokus();
        halteWach();
        setzeStimme(letzteStimme);
        sprache.setSpeechRate(letzteRate <= 0f ? 1f : letzteRate);
        Bundle einstellungen = new Bundle();
        sprache.speak(text, TextToSpeech.QUEUE_FLUSH, einstellungen, kennung);
    }

    private void setzeStimme(String name) {
        if (name == null || name.isEmpty()) return;
        for (Voice stimme : sprache.getVoices()) {
            if (stimme.getName().equals(name)) {
                sprache.setVoice(stimme);
                return;
            }
        }
    }

    public void halt() {
        if (sprache != null) sprache.stop();
        setzeWiedergabeZustand(PlaybackState.STATE_STOPPED);
        gibFokusFrei();
        loeseWach();
    }

    /**
     * Anhalten ist in Android-TTS nicht vorgesehen: es gibt kein echtes Pausieren, nur ein
     * Beenden. Der Player in der Web-Fassung faengt deshalb am Anfang des laufenden Blocks
     * wieder an. Das ist ehrlicher als ein Pausieren vorzutaeuschen, das den Satz zerschneidet.
     */
    public void pause() {
        if (sprache != null) sprache.stop();
        setzeWiedergabeZustand(PlaybackState.STATE_PAUSED);
    }

    /** Setzt die letzte Aeusserung fort - auf Blockgrenze. */
    public void fortsetzen() {
        if (letzterText.isEmpty()) return;
        sprich(letzterText, letzteRate, letzteStimme, "wiederaufnahme-" + System.currentTimeMillis());
    }

    public String stimmenJson() {
        JSONArray liste = new JSONArray();
        if (sprache != null) {
            List<Voice> stimmen = new ArrayList<>(sprache.getVoices());
            stimmen.sort((a, b) -> a.getName().compareTo(b.getName()));
            for (Voice stimme : stimmen) {
                // Nur deutsche Stimmen anbieten; alles andere versteht den Lektionstext nicht.
                if (stimme.getLocale() == null) continue;
                if (!"deu".equals(stimme.getLocale().getISO3Language())) continue;
                if (stimme.isNetworkConnectionRequired()) continue;
                JSONObject eintrag = new JSONObject();
                try {
                    eintrag.put("uri", stimme.getName());
                    eintrag.put("label", stimme.getName() + " (" + stimme.getLocale().getDisplayLanguage() + ")");
                    eintrag.put("sprache", stimme.getLocale().toLanguageTag());
                } catch (Exception ignoriert) {
                    continue;
                }
                liste.put(eintrag);
            }
        }
        return liste.toString();
    }

    private void meldeFertig(String kennung) {
        if (melder != null) melder.fertig(kennung);
    }

    private void nimmFokus() {
        if (fokusAnfrage == null) {
            fokusAnfrage = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build())
                    .setOnAudioFocusChangeListener(wechsel -> {
                        if (wechsel == AudioManager.AUDIOFOCUS_LOSS
                                || wechsel == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                            pause();
                        }
                    })
                    .build();
        }
        tonVerwaltung.requestAudioFocus(fokusAnfrage);
    }

    private void gibFokusFrei() {
        if (fokusAnfrage != null) tonVerwaltung.abandonAudioFocusRequest(fokusAnfrage);
    }

    /** Haelt die Recheneinheit wach, damit Sprache bei ausgeschaltetem Bildschirm weiterlaeuft. */
    private void halteWach() {
        if (wach != null && wach.isHeld()) return;
        PowerManager verwaltung = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wach = verwaltung.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MLapp:Vorlesen");
        wach.setReferenceCounted(false);
        wach.acquire(30 * 60 * 1000L);
    }

    private void loeseWach() {
        if (wach != null && wach.isHeld()) wach.release();
    }

    @Override
    public void onDestroy() {
        if (sprache != null) {
            sprache.stop();
            sprache.shutdown();
        }
        if (sitzung != null) sitzung.release();
        gibFokusFrei();
        loeseWach();
        super.onDestroy();
    }
}
