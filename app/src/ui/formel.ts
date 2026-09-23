/**
 * Darstellung von Formeln.
 *
 * Die Lektionen speichern Formeln als LaTeX (fuer die Fachlichkeit) und zusaetzlich einen
 * ausgeschriebenen Sprechtext (fuer das Vorlesen). Damit im Text nicht rohes LaTeX steht,
 * wird hier die kleine Teilmenge, die im Kurs vorkommt, in lesbare Zeichen uebersetzt:
 * Hochzahlen, Multiplikationspunkt, Brueche und duenne Abstaende.
 *
 * Bewusst keine vollstaendige Formelsatzmaschine: was hier nicht vorkommt, bleibt stehen und
 * ist damit sichtbar unfertig, statt still falsch zu erscheinen.
 */

const HOCHZAHLEN: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  n: "ⁿ",
  i: "ⁱ",
  T: "ᵀ",
  "-": "⁻",
};

function hochgestellt(text: string): string {
  return [...text].map((zeichen) => HOCHZAHLEN[zeichen] ?? `^${zeichen}`).join("");
}

const ZEICHEN: Record<string, string> = {
  nabla: "∇",
  partial: "∂",
  cdot: "·",
  times: "×",
  to: "→",
  rightarrow: "→",
  leftarrow: "←",
  longrightarrow: "→",
  eta: "η",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  sigma: "σ",
  phi: "φ",
  psi: "ψ",
  omega: "ω",
  sum: "Σ",
  prod: "Π",
  int: "∫",
  infty: "∞",
  approx: "≈",
  leq: "≤",
  geq: "≥",
  pm: "±",
};

export function formelAnzeige(latex: string): string {
  let text = latex;
  // Brueche: \frac{a}{b} -> (a) / (b)
  text = text.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1) / ($2)");
  text = text.replace(/\\sqrt\{([^{}]*)\}/g, "√($1)");
  text = text.replace(/\\left\b|\\right\b/g, "");
  text = text.replace(/\\quad|\\;|\\:/g, "   ");
  text = text.replace(/\\,/g, " ");
  // Hochzahlen: ^{2} oder ^2
  text = text.replace(/\^\{([^{}]*)\}/g, (_treffer, inhalt: string) => hochgestellt(inhalt));
  text = text.replace(/\^(\w)/g, (_treffer, inhalt: string) => hochgestellt(inhalt));
  // Tiefzahlen: _{11} -> (11), _1 -> (1)
  text = text.replace(/_\{([^{}]*)\}/g, "($1)");
  text = text.replace(/_(\w)/g, "($1)");
  // Bekannte Befehle in Zeichen uebersetzen.
  for (const [befehl, zeichen] of Object.entries(ZEICHEN)) {
    text = text.replace(new RegExp(`\\\\${befehl}\\b`, "g"), zeichen);
  }
  // Alles, was jetzt noch als Befehl uebrig ist, verliert nur den Rueckstrich und bleibt lesbar
  // stehen (z. B. \det -> det). Damit steht nie rohes LaTeX im Text.
  text = text.replace(/\\([a-zA-Z]+)/g, "$1");
  return text.replace(/\s+/g, " ").trim();
}
