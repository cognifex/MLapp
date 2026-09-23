package net.mlapp.huelle;

import android.content.res.AssetManager;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

/**
 * Liefert die gebaute Web-Fassung aus Anlagen ueber 127.0.0.1 aus.
 *
 * Warum ein eigener Server und nicht file://: die Oberflaeche besteht aus ES-Modulen. Ueber
 * file:// verweigert der WebView das Nachladen der Module (CORS). Ein Server auf der
 * Schleifenadresse loest das ohne Fremdbibliothek - das Geraet soll nichts nachladen muessen.
 */
final class LokalerServer implements Runnable {

    private final AssetManager anlagen;
    private ServerSocket server;
    private volatile boolean laeuft = true;
    private int port;

    LokalerServer(AssetManager anlagen) {
        this.anlagen = anlagen;
    }

    int port() {
        return port;
    }

    void beenden() {
        laeuft = false;
        try {
            if (server != null) server.close();
        } catch (IOException ignoriert) {
            // Beim Beenden ist ein Fehler nicht mehr von Belang.
        }
    }

    @Override
    public void run() {
        try {
            server = new ServerSocket(0, 8, InetAddress.getByName("127.0.0.1"));
            port = server.getLocalPort();
            while (laeuft) {
                Socket verbindung = server.accept();
                new Thread(() -> bediene(verbindung)).start();
            }
        } catch (IOException fehler) {
            laeuft = false;
        }
    }

    private void bediene(Socket verbindung) {
        try (Socket s = verbindung) {
            String kopf = leseKopf(s.getInputStream());
            if (kopf == null) return;
            String pfad = pfadAus(kopf);
            byte[] inhalt = lade(pfad);
            OutputStream aus = s.getOutputStream();
            if (inhalt == null) {
                byte[] text = "nicht gefunden".getBytes(StandardCharsets.UTF_8);
                schreibe(aus, "404 Not Found", "text/plain; charset=utf-8", text.length);
                aus.write(text);
            } else {
                schreibe(aus, "200 OK", typFuer(pfad), inhalt.length);
                aus.write(inhalt);
            }
            aus.flush();
        } catch (IOException ignoriert) {
            // Eine abgebrochene Verbindung ist kein Fehlerfall der App.
        }
    }

    private String leseKopf(InputStream ein) throws IOException {
        ByteArrayOutputStream puffer = new ByteArrayOutputStream();
        int zeichen;
        int zeilen = 0;
        while ((zeichen = ein.read()) != -1) {
            puffer.write(zeichen);
            if (zeichen == '\n') {
                zeilen++;
                if (zeilen > 40) break;
                byte[] bisher = puffer.toByteArray();
                if (bisher.length >= 4
                        && bisher[bisher.length - 2] == '\r'
                        && bisher[bisher.length - 3] == '\n'
                        && bisher[bisher.length - 4] == '\r') {
                    break;
                }
            }
        }
        String text = puffer.toString("UTF-8");
        return text.isEmpty() ? null : text;
    }

    private String pfadAus(String kopf) {
        int ersterLeerschritt = kopf.indexOf(' ');
        if (ersterLeerschritt < 0) return "/index.html";
        int zweiter = kopf.indexOf(' ', ersterLeerschritt + 1);
        if (zweiter < 0) return "/index.html";
        String pfad = kopf.substring(ersterLeerschritt + 1, zweiter);
        int frage = pfad.indexOf('?');
        if (frage >= 0) pfad = pfad.substring(0, frage);
        if (pfad.startsWith("/")) pfad = pfad.substring(1);
        if (pfad.isEmpty()) pfad = "index.html";
        // Kein Ausbrechen aus dem Anlagenverzeichnis.
        if (pfad.contains("..")) pfad = "index.html";
        return pfad;
    }

    private byte[] lade(String pfad) {
        try (InputStream ein = anlagen.open(pfad)) {
            ByteArrayOutputStream puffer = new ByteArrayOutputStream();
            byte[] block = new byte[8192];
            int gelesen;
            while ((gelesen = ein.read(block)) != -1) puffer.write(block, 0, gelesen);
            return puffer.toByteArray();
        } catch (IOException fehler) {
            return null;
        }
    }

    private void schreibe(OutputStream aus, String status, String typ, int laenge) throws IOException {
        String kopf = "HTTP/1.1 " + status + "\r\n"
                + "Content-Type: " + typ + "\r\n"
                + "Content-Length: " + laenge + "\r\n"
                + "Cache-Control: no-store\r\n"
                + "Connection: close\r\n\r\n";
        aus.write(kopf.getBytes(StandardCharsets.UTF_8));
    }

    private String typFuer(String pfad) {
        String klein = pfad.toLowerCase(java.util.Locale.ROOT);
        if (klein.endsWith(".html")) return "text/html; charset=utf-8";
        if (klein.endsWith(".js") || klein.endsWith(".mjs")) return "text/javascript; charset=utf-8";
        if (klein.endsWith(".css")) return "text/css; charset=utf-8";
        if (klein.endsWith(".json") || klein.endsWith(".map")) return "application/json; charset=utf-8";
        if (klein.endsWith(".png")) return "image/png";
        if (klein.endsWith(".svg")) return "image/svg+xml";
        if (klein.endsWith(".mp3")) return "audio/mpeg";
        if (klein.endsWith(".md")) return "text/markdown; charset=utf-8";
        return "application/octet-stream";
    }
}
