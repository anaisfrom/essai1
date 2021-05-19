app.controller('cannelle_appCtrl', ['$scope', '$sce', '$timeout', '$window', '$filter', '$http', function($scope, $sce, $timeout, $window, $filter, $http) {

    //Initialise l'application
    //Positionne correctement le canvas qui sert de base pour dessiner le cercle
    $scope.init = function() {
        bridge.setLocationForContent(document);
        $scope.deleteUnusedResources();

        var body = $("body");
        bridge.manageRightToLeftLocales(body);
        bridge.manageContrastedColors(body);
        $scope.initialiseContentParams();
        $scope.setMobileDevice();

        setTimeout(function(){
            MathJax.typeset();
            bridge.refreshMathContent();
            // Définition du focus une fois l'écran prêt.
            var pageTitle = $(parent.document).find('#page-title'),
                bandeauTitre = $("#bandeau-titre");
            bridge.setFocusWhenContentIsLoaded(pageTitle, bandeauTitre);
        }, 1000);
    };

    /**
     * @brief   Initialise les paramètres de l'écran.
     */
    $scope.initialiseContentParams = function () {
        //Variables CSS
        cssVars({
            rootElement: document, // default
            onlyLegacy: true
        });


        //Polyfill Webp
        var webpMachine = new webpHero.WebpMachine()
        webpMachine.polyfillDocument();

        // Focus sur bouton de fermeture de la modal
        var $exampleModal = $("#modal-img"),
        $exampleModalClose = $(".btn-close");

        $exampleModal.on("shown.bs.modal", function() {
            document.activeElement.blur();
            $exampleModalClose.focus();
        });

        $scope.allView = false;
        $scope.isBilanPage = false;
        $scope.consultedResources = [];
    };

    /**
     * @brief   Supprime les ressources vides.
     * @detail  Si le texte ou le "lien" est vide alors la ressource est supprimée.
     */
    $scope.deleteUnusedResources = function() {
        var valuesToKeep = [];
        angular.forEach($scope.ressource, function (value, key) {
            if (value.contenu.trim() == "" && value.txt.trim() == "") {
                delete $scope.ressource[key];
            } else {
                value.key = key;
                valuesToKeep.push(value);
            }
        });
        $scope.ressource = valuesToKeep;
    }

    /**
     * @brief   Mets à jour la liste des ressources consultées.
     *          Si toutes les ressources sont consultées, mets à jour "$scope.allView".
     * @param   url : lien de la ressource
     */
    $scope.updateAllContentViewedStatus = function (url) {
        // Ajout de la ressource aux ressources consultées (si celle-ci n'est pas déjà dans la liste.
        if($scope.consultedResources.indexOf(url) == -1) {
            $scope.consultedResources.push(url);
        }
        $scope.allView = ($scope.consultedResources.length == $scope.countResources());
    };

    /**
     * @brief   Mets à jour la liste des ressources consultées.
     *          Si toutes les ressources sont consultées, mets à jour "$scope.allView".
     * @param url
     * @param event
     */
    $scope.updateAllContentViewedStatusKeyDown = function (url, event) {
        var touch = event.keyCode;
        switch(touch) {
            case 32:    // Touche espace
            case 13:    // Touche enter
                $scope.updateAllContentViewedStatus(url);
                break;
            default:
        }
    };

    /**
     * @brief   Retourne le nombre de ressources de la page.
     * @detail  Seules les ressources avec un texte et un contenu non vide sont prises en compte.
     * @returns {number}
     */
    $scope.countResources = function () {
        var nb = 0;
        for(var i = 0; i < $scope.ressource.length; i++) {
            if($scope.ressource[i].contenu != '' && $scope.ressource[i].txt != '') {
                nb++;
            }
        }
        return nb;
    };

    /**
     * @brief	Retourne la complétion de lecture du contenu de l'écran
     * @return 	{boolean}
     */
    $scope.isAllContentViewed = function () {
        return $scope.allView;
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
     * @brief   Analyse une chaîne de caractères pour déterminer s'il s'agit d'une url.
     * @param   str : chaîne de caractèrse à analyser.
     * @returns {boolean}
     */
    $scope.isUrl = function(str){
        var res = str.match(/^((?:http(s)?:\/\/)|(www))[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/g);
        return (res != null)
    };

    $scope.maxLength = function(str){
        var res = str.length;
        if (res>101) {
            if (str.lastIndexOf('Ko)')!=-1) {
                return (str.substr(0, 88) + "... " + str.substr(str.lastIndexOf('('), str.length));
            } else {
                return (str.substr(0, 88) + "...");
            }
        } else {
            return str;
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

}]);
