app.controller('cannelle_appCtrl', ['$scope', '$sce', '$timeout', '$window', '$filter', '$http', function ($scope, $sce, $timeout, $window, $filter, $http) {

    //Initialise l'application
    //Positionne correctement le canvas qui sert de base pour dessiner le cercle
    $scope.init = function () {
        bridge.setLocationForContent(document);
        $scope.displayPage("main");
        var body = $("body");
        bridge.manageContrastedColors(body);
        bridge.manageRightToLeftLocales(body);
        //Variables CSS
        cssVars({
            rootElement: document, // default
            onlyLegacy: true
        });
        $scope.initialiseStandaloneIfActivated();
        $scope.printmodel = {};
        $scope.manageThemesDisplaying();
        $scope.presentationScore();
        $scope.manageMasteryScoreAndCertificate();
        $scope.updateMaxAttemps();
        bridge.setCurrentContentState({
            id: "bilan",
            maxAttempts: $scope.maxAttempts,
        });
        bridge.lmsController.saveProgression();
        $scope.isBilanPage = true;
        $scope.setMobileDevice();
        bridge.pauseTimer();
        //Refresh MathJax
        setTimeout(function(){
            MathJax.typeset();
            bridge.refreshMathContent();
            var pageTitle = $(parent.document).find('#page-title'),
                firstInputField = $("#input-fields-for-certificate input").first();
            bridge.setFocusWhenContentIsLoaded(pageTitle, firstInputField);
        }, 1000);
    };

    /**
     * @brief   Définit le mastery_score depuis la métacore puis gère l'affichage ou non du certificat.
     */
    $scope.manageMasteryScoreAndCertificate = function() {
        var masteryscore = bridge.getMasteryScore();
        if ($scope.getTotalScore() < masteryscore) {
            $scope.certificate = false;
        }
        $scope.showSmiley = !(masteryscore == 0);
    };

    /**
     * @brief   Gère l'affichage des thèmes (si ceux-ci sont définis).
     */
    $scope.manageThemesDisplaying  =function() {
        if ($scope.themes.length == 1) {
            if ($scope.themes[0].id == "") {
                $scope.displayThemes = false;
            }
        }
    };

    /**
     * @brief   Initialise le jeu de données si le mode standalone est activé.
     */
    $scope.initialiseStandaloneIfActivated = function() {
        // Le "$scope.standalone" est tilisé pour des tests en dev, il faut donc le désactiver pour la prod
        // $scope.standalone = true;
        if ($scope.standalone) {
            //jeu de données d'exemple
            $scope.themes = [{
                id: "Theme 1",
                time: 10000,
                score: 100,
                scoremax: 100,
            }, {
                id: "Theme 2",
                time: 10000,
                score: 100,
                scoremax: 100,
            }, {
                id: "Theme 3",
                time: 10000,
                score: 100,
                scoremax: 100,
            }, {
                id: "Theme 4",
                time: 10000,
                score: 100,
                scoremax: 100,
            },];
            $scope.previous = {
                time: 20000,
                score: 50,
                scoremax: 100
            }
        } else {
            $scope.themes = bridge.getThemes();
            $scope.previous = bridge.getPrevious();
            if ($scope.previous == null) {
                $scope.displayPrevious = false;
            }
        }
    };

    /**
     * @brief   Mise a jour du nombre de tentatives.
     */
    $scope.updateMaxAttemps = function() {
        if (bridge.maxAttempts == null) {
            var currentState = bridge.getCurrentContentState();
            if (currentState != null) {
                $scope.maxAttempts = currentState.maxAttempts;
            }
            bridge.maxAttempts = $scope.maxAttempts;
        }
        if (bridge.maxAttempts > 0) {
            bridge.maxAttempts -= 1;
        }

        $scope.maxAttempts = bridge.maxAttempts;
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
    $scope.buttons.set("restartQuiz",true);

    $scope.presentationScore = function(){
        $scope.retourfin = bridge.getLocalisedString('score_final');
        $scope.retourfin = $scope.retourfin.replace('$1', $scope.getTotalScorebis());
        $scope.retourfin = $scope.retourfin.replace('$2', $scope.getTotalMaxScore());
    };

    //Demande au player de recommencer le quiz
    $scope.restart = function () {
        bridge.restartQuiz();
        bridge.$apply();
    };

    //Retourne la phrase de validation du certificat correctement formatée avec nom, prénom et date
    $scope.getCertificateComment = function () {
        if ($scope.printmodel != null) {
            var comment = $scope.certificate_comment.replace(/\[firstname\]/g, $scope.printmodel.firstname);
            comment = comment.replace(/\[name\]/g, $scope.printmodel.name);
            var date = new Date();
            comment = comment.replace(/\[date\]/g, $filter('date')(date, $scope.getLocalisedString("dateFormat")));
            return comment;
        }
        return "";
    };

    //Retourne le temps sous forme de chaine formattée à partir d'un temps en secondes
    $scope.getFormattedTime = function (pTime) {
        var min = Math.floor(pTime / 60);
        var sec = Math.floor(pTime % 60);
        if (min >= 1) {
            return min + " " + $scope.getLocalisedString("min") + " " + sec + " " + $scope.getLocalisedString("sec");
        } else {
            return sec + " " + $scope.getLocalisedString("sec");
        }
    };

    //Retourne le score en pourcentage
    $scope.getFormattedScore = function (pScore, pScoreMax) {
        return Math.round((pScore * 100) / pScoreMax);
    };

    $scope.winOrFail = function(pScore){
        if($scope.bridgeIsLoaded()) {
            if (pScore < bridge.getMasteryScore() && $scope.feedbackText === "Texte de feedback") {
                if ($scope.feedbackAttemptWrong === "Ce n'est pas exactement la réponse attendue...") {
                    $scope.feedbackAttemptWrong = "";
                }
                return 1;
            } else if (pScore>= bridge.getMasteryScore() && $scope.feedbackText === "Texte de feedback") {
                if ($scope.feedbackAttemptRight === "Bravo!") {
                    $scope.feedbackAttemptRight = "";
                }
                return 2;
            } else {
                return 3;
            }
        }
    };

    /**
     * @brief   Est-ce que le bridge vers la méta est bien chargée et fonctionnelle.
     * @returns {boolean}
     */
    $scope.bridgeIsLoaded = function() {
        return !(angular.isUndefined(bridge) || bridge === null);
    };

    /**
     * @brief   Retourne l'icone en fonction du score
     */
    $scope.getIconForScore = function (pScore) {
        var result = "";
        if($scope.bridgeIsLoaded()) {
            result = (pScore < bridge.getMasteryScore()) ? "bad" : "good";
        }
        return result;
    };

    /**
     * @brief   Retourne le temps total passé sur la formation
     */
    $scope.getTotalTime = function () {
        var result = "";
        if($scope.bridgeIsLoaded()) {
            var totalTime = bridge.getTotalTime() / 1000;
            result = $scope.getFormattedTime(totalTime);
        }
        return result;
    };
    /**
     * @brief   Retourne le temps total passé sur la formation lors de la dernière tentative
     */
    $scope.getPreviousTotalTime = function () {
        if(typeof $scope.previous != "undefined") {
            if(typeof $scope.previous.time != "undefined") {
                return $scope.previous.time / 1000;
            }
        }
    };

    //Retourne le score total en pourcentage
    $scope.getTotalScore = function () {
        var totalScore = 0;
        var totalScoreMax = 0;
        angular.forEach($scope.themes, function (value, key) {
            totalScore += value.score;
            totalScoreMax += value.scoremax;
        });
        return $scope.getFormattedScore(totalScore, totalScoreMax);
    };

    $scope.getPreviousTotalScore = function () {
        try{
            return $scope.getFormattedScore($scope.previous.score, $scope.previous.scoremax);
        } catch (e) {
            return false;
        }
    };

    //Retourne le score total
    $scope.getTotalScorebis = function () {
        var totalScore = 0;
        angular.forEach($scope.themes, function (value, key) {
            totalScore += value.score;
        });
        return totalScore;
    };

    //Retourne le score max
    $scope.getTotalMaxScore = function () {
        var totalScoreMax = 0;
        angular.forEach($scope.themes, function (value, key) {
            totalScoreMax += value.scoremax;
        });
        return totalScoreMax;
    };

    $scope.printPage = function () {
        $("body").addClass("print");
        $(".noprint").hide();
        setTimeout(function (){
            window.print();
            $(".noprint").show();
            $("body").removeClass("print");
        }, 100);
    };

    //Affiche la page passée en paramètre
    $scope.displayPage = function (pPage) {
        $scope.currentPage = pPage;
        $timeout($scope.resize, 50);
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
    $scope.resize = function () {
        //fullheight
        var windowHeight = $(window).height();
        $('.minheight').css('min-height', (windowHeight) + 'px');
        $('.maxheight').css('max-height', (windowHeight)  + 'px');
    };

    // Hauteur du #main
    $(window).resize(function () {
        $scope.resize();
    });


    //Verifie si la page est chargée dans une frame ou bien de manière autonome
    if (window.self === window.top) {
        $scope.standalone = true;
        $scope.baseColor = "#CCCCCC";
        $scope.secondaryColor = "#808080";
        $scope.init();
    }
}]);

// Input field
function leaveInput(el) {
    if (el.value.length > 0) {
        if (!el.classList.contains('active')) {
            el.classList.add('active');
        }
    } else {
        if (el.classList.contains('active')) {
            el.classList.remove('active');
        }
    }
}