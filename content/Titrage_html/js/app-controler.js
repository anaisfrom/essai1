app.controller('cannelle_appCtrl', ['$scope', '$sce', '$timeout', '$window', '$filter', '$http', function ($scope, $sce, $timeout, $window, $filter, $http) {

    //Initialise l'application
    //Positionne correctement le canvas qui sert de base pour dessiner le cercle
    $scope.init = function () {
        bridge.setLocationForContent(document);
        $scope.displayPage("main");
        var body = $("body");
        bridge.manageRightToLeftLocales(body);
        bridge.manageContrastedColors(body);
        $scope.setMobileDevice();
        $scope.initialiseContentParams();

        setTimeout(function(){
            //Refresh MathJax
            MathJax.typeset();
            bridge.refreshMathContent();
            // Définition du focus une fois l'écran prêt.
            var pageTitle = $(parent.document).find('#page-title'),
                bandeauTitre = $(parent.document).find('#btn-next');
            bridge.setFocusWhenContentIsLoaded(pageTitle, bandeauTitre);
        }, 100);
    };

    /**
     * @brief   Initialise les paramètres de l'écran.
     */
    $scope.initialiseContentParams = function () {
        $scope.isBilanPage = false;
        //Variables CSS
        cssVars({
            rootElement: document, // default
            onlyLegacy: true
        });
    };

    /**
     * @brief	Retourne la complétion de lecture du contenu de l'écran
     * @return 	{boolean}
     */
    $scope.isAllContentViewed = function () {
        return true;
    };

    /**
     * @brief   Retourne l'affichage ou non d'un bouton donné.
     * @param   button : nom du bouton
     * @returns {boolean|*} Affichage ou non du bouton.
     */
    $scope.showButton = function (button) {
        return $scope.buttons.get(button);
    };
    $scope.buttons = new Map();
    $scope.buttons.set("instructions",false);
    $scope.buttons.set("validate",false);
    $scope.buttons.set("retry",false);
    $scope.buttons.set("solution",false);
    $scope.buttons.set("myAnswers",false);
    $scope.buttons.set("feedback",false);
    $scope.buttons.set("restartQuiz",false);

    //Affiche la page passée en paramètre
    $scope.displayPage = function (pPage) {
        $scope.currentPage = pPage;
    };

    /**
     * @brief   Retourne la chaine localisée dont l'identifiant a été passé en parametres
     * @detail  Retourne une chaine vide si l'identifiant n'existe pas.
     *          fonction rendue muette car provoquant des logs consoles e ncas d'appel avant chargement du scope
     * @param pID
     * @returns {string|*}
     */
    $scope.getLocalisedString = function (pID) {
        try {
            if ($scope.localisation != null) {
                if ($scope.localisation[pID] != null) {
                    return $scope.localisation[pID];
                } else {
                    return "";
                }
            }
        } catch (error) {

        }
    };

    /**
     * @brief   Mets à jour le type d'écran.
     * @detail  Se base sur la fonction de l'appController de la metastructure.
     *          Il arrive que le bridge ne soit pas encore disponible, d'où le test !=null
     */
    $scope.setMobileDevice = function () {
        $scope.isMobileDevice = (bridge != null) ? bridge.isMobileDevice() : false;
    };

    //Démarrage ---------------------------------------------------------------

    //Verifie si la page est chargée dans une frame ou bien de manière autonome
    if (window.self === window.top) {
        $scope.standalone = true;
        $scope.baseColor = "#CCCCCC";
        $scope.secondaryColor = "#808080";
        $scope.init();
    }

    var delay = 250, // delay between calls
        throttled = false; // are we currently throttled?

    $(window).resize(function () {
        // only run if we're not throttled
        if (!throttled) {
            // actual callback action
            $scope.resize();
            $scope.setMobileDevice();
            // we're throttled!
            throttled = true;
            // set a timeout to un-throttle
            setTimeout(function() {
                throttled = false;
            }, delay);
        }

    });

    $scope.resize = function () {
        //fullheight
        var windowHeight = $(window).height();
        $('.minheight').css('min-height', (windowHeight)  + 'px');
        $('.maxheight').css('max-height', (windowHeight)  + 'px');
    };

}]);
