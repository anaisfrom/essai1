this.customSettings = {

    // Management of navigation modes:
    // 0: Free navigation.
    // 1: supervised navigation (we warn the learner if he has not consulted all the resources of the page).
    // 2: forced navigation (the learner MUST have consulted all the resources of the page).
    forcedNavigation: 0,

    // Display of the recipient when loading each activity screen for the first time:
    // false : Disabled.
    // true : Enabled.
    showInstructionsInTheFirstDisplayOfEachActivityScreen: false,

    // Content's screens options
    contents: {
        // Options for Classification's screens.
        classification: {
            // Allow you to chose between "square" and "rectangle" display style for the images inside the items.
            // Notez que dans les deux cas de figure, une image plus petite que le cadre ne sera pas modifiée et
            // sera présentée tel qu'elle. De même, aucun rognage ne sera effectué : si l'image est trop grande par
            // rapport au cadre, celle-ci sera juste réduite pour tenir dans le cadre.
            // "square" : Le cadre est  de forme carrée.
            // "rectangle" : Le cadre est de forme rectangulaire, plus adapté à des images de format paysage.
            itemsImgDisplayStyle: "rectangle"
        }
    }
};