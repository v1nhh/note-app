// 1 plek voor namen die de app zelf gebruikt. Zonder TypeScript vangt niets
// een typefout in een veldnaam, dus staan ze hier en nergens anders als losse
// tekst.

/// De ingebouwde soort waar losse notities in vallen
export const NOTE_TYPE = {
    name: "notitie",
    icon: "📝",
  };
  
  /// Namen van de formuliervelden, gedeeld tussen formulier en server action
  export const NOTE_FORM = {
    TITLE: "title",
    BODY: "body",
  };