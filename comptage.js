/* ============================================================
   Comptage des phrases modifiées
   ------------------------------------------------------------
   Principe général :
   - On extrait les phrases du texte original (A)
   - On extrait les phrases du texte corrigé (B)
   - Une phrase de A est conservée si elle existe encore telle
     quelle dans B, dans le même ordre, même si B contient
     des phrases supplémentaires
   - Les phrases ajoutées dans B ne sont pas pénalisées
   - Les phrases supprimées, modifiées ou déplacées sont
     comptées comme retouchées
   ============================================================ */

/* ============================================================
   CONFIGURATION
   ============================================================ */

/*
 Liste d’abréviations courantes contenant un point,
 à protéger pour éviter les faux découpages de phrases.
 Tu peux en ajouter sans toucher au reste du code.
*/
const ABBREVIATIONS = ["m.", "mme.", "dr.", "pr.", "etc.", "vs."];

/* ============================================================
   NORMALISATION DU TEXTE
   ============================================================ */

/*
 Objectif :
 - éviter les faux positifs dus aux espaces, retours ligne,
   espaces insécables, ponctuation répétée
 - NE PAS interpréter le sens
*/
function normalizeText(text) {
    return (
        text
            // Minuscules pour comparaison stricte
            .toLowerCase()

            // Espaces insécables → espaces normaux
            .replace(/\u00A0/g, " ")

            // Réduction des espaces multiples
            .replace(/\s+/g, " ")

            // Ponctuations multiples (!!!, ???, ...) → un seul point
            .replace(/([.!?]){2,}/g, ".")

            // Suppression des espaces autour des ponctuations
            .replace(/\s*([.!?])\s*/g, "$1")

            .trim()
    );
}

/* ============================================================
   PROTECTION DES ABRÉVIATIONS
   ============================================================ */

/*
 On remplace temporairement le point des abréviations
 pour qu’il ne soit pas pris comme fin de phrase.
*/
function protectAbbreviations(text) {
    let protectedText = text;

    ABBREVIATIONS.forEach((abbr) => {
        const safe = abbr.replace(".", "<DOT>");
        const regex = new RegExp(abbr.replace(".", "\\."), "g");
        protectedText = protectedText.replace(regex, safe);
    });

    return protectedText;
}

/*
 Restauration éventuelle (pas strictement nécessaire
 pour le calcul, mais propre si on affiche les phrases)
*/
function restoreAbbreviations(text) {
    return text.replace(/<DOT>/g, ".");
}

/* ============================================================
   DÉCOUPAGE EN PHRASES
   ============================================================ */

/*
 Règle :
 - Une phrase = ce qu’il y a entre deux séparateurs . ! ?
 - On ajoute artificiellement un "." au début du texte
   pour simplifier le découpage de la première phrase
*/
function splitIntoSentences(text) {
    // Normalisation + protection
    let prepared = normalizeText(text);
    prepared = protectAbbreviations(prepared);

    // Ajout du point artificiel en début
    prepared = "." + prepared;

    // Découpage
    const rawSentences = prepared.split(/[.!?]/);

    // Nettoyage final
    const sentences = rawSentences
        .map((s) => restoreAbbreviations(s.trim()))
        .filter((s) => s.length > 0);

    return sentences;
}

/* ============================================================
   DÉCOUPAGE EN MOTS
   ============================================================ */

/*
 Règle :
 - un mot = suite de lettres ou chiffres
 - ponctuation ignorée
 - casse ignorée
*/
function splitIntoWords(text) {
    const normalized = normalizeText(text);

    return normalized
        .replace(/[.!?]/g, " ") // on enlève les fins de phrases
        .split(" ")
        .filter((w) => w.length > 0);
}

/* ============================================================
   COMPARAISON DES PHRASES (logique "dans l’ordre")
   ============================================================ */

/*
 Principe :
 - On parcourt les phrases de A
 - Pour chacune, on cherche une phrase IDENTIQUE dans B
   en avançant toujours dans B (pas de retour en arrière)
 - Si trouvée → phrase conservée
 - Sinon → phrase retouchée
*/
function countConservedSentences(sentencesA, sentencesB) {
    let indexB = 0;
    let conserved = 0;

    for (let i = 0; i < sentencesA.length; i++) {
        const sentenceA = sentencesA[i];

        for (let j = indexB; j < sentencesB.length; j++) {
            if (sentenceA === sentencesB[j]) {
                conserved++;
                indexB = j + 1;
                break;
            }
        }
    }

    return conserved;
}

/* ============================================================
   COMPARAISON DES MOTS (LCS)
   ============================================================ */

function countConservedWords(wordsA, wordsB) {
    const m = wordsA.length;
    const n = wordsB.length;

    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (wordsA[i - 1] === wordsB[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    return dp[m][n];
}

/* ============================================================
   POINT D’ENTRÉE — ACTION AU CLIC
   ============================================================ */

document.getElementById("run").addEventListener("click", () => {
    const textA = document.getElementById("textA").value;
    const textB = document.getElementById("textB").value;

    if (!textA.trim() || !textB.trim()) {
        alert("Merci de renseigner les deux textes.");
        return;
    }

    /* COMPTAGE DES PHRASES */

    const sentencesA = splitIntoSentences(textA);
    const sentencesB = splitIntoSentences(textB);

    const totalSentences = sentencesA.length;
    const conservedSentences = countConservedSentences(sentencesA, sentencesB);
    const modifiedSentences = totalSentences - conservedSentences;
    const sentencePercentage =
        totalSentences === 0
            ? 0
            : Math.round((modifiedSentences / totalSentences) * 100);

    /* COMPTAGE DES MOTS */

    const wordsA = splitIntoWords(textA);
    const wordsB = splitIntoWords(textB);

    const totalWords = wordsA.length;
    const conservedWords = countConservedWords(wordsA, wordsB);
    const wordPercentage =
        totalWords === 0 ? 0 : Math.round((conservedWords / totalWords) * 100);

    /* AFFICHAGE DES RÉSULTATS */

    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("hidden");

    resultDiv.innerHTML = `
        <strong>Résultat</strong><br><br>

        <strong>Phrases</strong><br>
        Phrases dans le texte original : ${totalSentences}<br>
        Phrases conservées : ${conservedSentences}<br>
        Phrases modifiées ou supprimées : ${modifiedSentences}<br>
        <strong>Taux de phrases retouchées : ${sentencePercentage} %</strong><br><br>

        <strong>Mots</strong><br>
        Mots dans le texte original : ${totalWords}<br>
        Mots conservés : ${conservedWords}<br>
        <strong>Taux de mots conservés : ${wordPercentage} %</strong>
    `;
});
