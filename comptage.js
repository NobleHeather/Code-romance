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
   POINT D’ENTRÉE — ACTION AU CLIC
   ============================================================ */

document.getElementById("run").addEventListener("click", () => {
    const textA = document.getElementById("textA").value;
    const textB = document.getElementById("textB").value;

    if (!textA.trim() || !textB.trim()) {
        alert("Merci de renseigner les deux textes.");
        return;
    }

    // Découpage
    const sentencesA = splitIntoSentences(textA);
    const sentencesB = splitIntoSentences(textB);

    // Calcul
    const total = sentencesA.length;
    const conserved = countConservedSentences(sentencesA, sentencesB);
    const modified = total - conserved;
    const percentage = total === 0 ? 0 : Math.round((modified / total) * 100);

    // Affichage
    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("hidden");

    resultDiv.innerHTML = `
        <strong>Résultat</strong><br><br>
        Phrases dans le texte original : ${total}<br>
        Phrases conservées : ${conserved}<br>
        Phrases modifiées ou supprimées : ${modified}<br><br>
        <strong>Taux de phrases retouchées : ${percentage} %</strong>
    `;
});
