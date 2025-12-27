Questions :

-   Est-ce que ect. n'est pas toujours en fin de phrase ? Il y a des phrases avec un etc. au milieu ?
-   ça, là, ça fonctionne aussi si on a un mixte ?! ou !? :
    // Ponctuations multiples (!!!, ???, ...) → un seul point
    .replace(/([.!?]){2,}/g, ".")
-   A quoi ça sert ça : function restoreAbbreviations(text) {
    return text.replace(/<DOT>/g, ".");
    }
