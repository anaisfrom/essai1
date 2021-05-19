app.controller('cannelle_appCtrl', ['$scope', '$sce', '$timeout', '$window', '$filter', '$http', function ($scope, $sce, $timeout, $window, $filter, $http) {


    /**
     * @brief   Initialise l'application.
     *          Positionne correctement le canvas qui sert de base pour dessiner le cercle.
     */
    $scope.init = function () {
        $scope.initialiseContentParams();
        bridge.setLocationForContent(document);
        $scope.displayPage("main");

        var body = $("body");
        bridge.manageRightToLeftLocales(body);
        bridge.manageContrastedColors(body);

        $scope.prepareItems();
        $scope.initialiseStandaloneIfActivated();
        $scope.replaceTimerString();
        $scope.allView = false;
        $scope.isBilanPage = false;
        $scope.setMobileDevice();

        //Démarrage du timer de l'exercice
        $timeout($scope.timer, 1000);

        $scope.reactivateActionButtons();

        setTimeout(function(){
            //Refresh MathJax
            MathJax.typeset();
            bridge.refreshMathContent();
            // Définition du focus une fois l'écran prêt.
            var pageTitle = $(parent.document).find('#page-title'),
                bandeauTitre = $("#bandeau-titre");
            bridge.setFocusWhenContentIsLoaded(pageTitle, bandeauTitre);
        }, 1000);

        bridge.showInstructionsInTheFirstDisplayOfThePage();
        $(".loader-container").hide();

        /**
         * Navigation tabulaire : Permettre la sélection d'une proposition avec "Enter"
         */
        $(document).ready(function() {
            $('input[type="checkbox"]').on('keypress', function(event) {
                if (event.which === 13) {
                    let proposalId = this.id;
                    $scope.items[proposalId].selected = !$scope.items[proposalId].selected;
                    this.checked = !this.checked;
                };
            });
        });
    };

    /**
     * @brief    Réactive les boutons d'action (une fois l'écran chargé).
     */
    $scope.reactivateActionButtons = function () {
        var buttons = [
            "#btn-next",
            "#btn-previous"
        ];
        bridge.reactivateActionButtons(buttons);
    };

    /**
     * @brief   Initialise les paramètres de l'écran.
     */
    $scope.initialiseContentParams = function () {
        if ($scope.timerPourEcran == "NbTime"){
            $scope.timerPourEcran = "-1";
        }
        $scope.timerQuireste = Number($scope.timerPourEcran);
        $scope.isOver= true;

        $scope.stageSize = {
            "w": $(document).width(),
            "h": $(document).height()
        };

        $scope.gameStarted = true;
        $scope.tries = 0;
        $scope.time = 0;
        $scope.enonceCollapsed = false;

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

        $('input:checkbox').keypress(function(e){
            if((e.keyCode ? e.keyCode : e.which) == 13){
                $(this).trigger('click');
            }
        });
    };

    /**
     * @brief   Préparation des items.
     * @detail  Suppression des items inusités et mélange si nécessaire.
     */
    $scope.prepareItems = function() {
        $scope.deleteUnusedItems();
        $scope.shuffleItemsIfOptionIsActivated();
    };

    /**
     * @brief   Suppression les items non utilisés.
     */
    $scope.deleteUnusedItems = function() {
        var valuesToKeep = [];
        angular.forEach($scope.items, function (value, key) {
            if (value.value == "") {
                delete $scope.items[key];
            } else {
                value.key = key;
                valuesToKeep.push(value);
            }
        });
        $scope.items = valuesToKeep;
    };

    /**
     * @brief   Mélange les items si cette option est activée.
     */
    $scope.shuffleItemsIfOptionIsActivated = function() {
        if ($scope.shuffle) {
            shuffle($scope.items);
        }
    };

    /**
     * @brief   Initialise le jeu de données si le mode standalone est activé.
     */
    $scope.initialiseStandaloneIfActivated = function() {
        if (!$scope.standalone) {
            setTimeout(function() {
                $scope.recoverState(); // runs first
                $scope.showPopTimer(); // runs second
            }, 10)
        }
    };

    /**
     * @brief	Retourne la complétion de lecture du contenu de l'écran
     * @return 	{boolean}
     */
    $scope.isAllContentViewed = function () {
        return ($scope.feedbackFinal.feedbackText ==="" && $scope.feedbackFinal.feedbackImage ==="") ? true : $scope.allView;
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
    $scope.buttons.set("instructions",true);
    $scope.buttons.set("validate",true);
    $scope.buttons.set("retry",true);
    $scope.buttons.set("solution",true);
    $scope.buttons.set("myAnswers",true);
    $scope.buttons.set("feedback",true);
    $scope.buttons.set("restartQuiz",false);

    $scope.collapseEnonce = function(){
        $("#bandeau-titre").collapse("toggle");
        $scope.enonceCollapsed = !$scope.enonceCollapsed;
    };

    $scope.checkByKey = function (pKey, pValue) {
        $scope.items[pKey].selected = !$scope.items[pKey].selected;
    };

    $scope.retryAttempt = function () {
        $scope.isOver= true;
        $scope.timerQuireste = Number($scope.timerPourEcran);
        $scope.feedbackPopupOpened = false;
        $scope.activateInterractions();
        $("#feedbackpopup").collapse("hide");
        if ($scope.timerQuireste !== -1){
            $scope.removeTimer();
        }
        var pageTitle = $(parent.document).find('#page-title'),
            bandeauTitre = $("#bandeau-titre");
        bridge.setFocusWhenContentIsLoaded(pageTitle, bandeauTitre);
    };

    $scope.getExoTitle = function(){
        return $scope.statement;
    };

    $scope.validateAttempt = function () {
        clearTimeout($scope.timtim);
        $scope.disableInterractions();
        if ($scope.isOver === true){
            $scope.validate();
            if ($scope.correction !== 0) {
                $scope.feedbackPopupOpened = true;
                $("#feedbackpopup").collapse("show");
                $timeout(function () {
                    var elem = ($scope.success) ? $(".tagSuccess") : $(".tagFailed");
                    if (typeof elem.get(0) != "undefined") {
                        elem.get(0).focus();
                    }
                },1000);
            }
            $scope.isOver = false;
        }
        if ($scope.success === true && ($scope.scoring==='Par choix' || $scope.scoring==='Par question répondu')) {
            $scope.manageRetourFin('timer_points');
        } else if ($scope.success===false && $scope.score===0 && ($scope.scoring==='Par choix' || $scope.scoring==='Par question répondu')) {
            $scope.manageRetourFin('timer_nopoint');
        } else if ($scope.scoring==='aucun') {
            $scope.retourfin = "";
            $('.retourScore').css('font-size','0em');
        } else {
            $scope.manageRetourFin('timer_partial');
        }
    };

    /**
     * @brief   Désactive les interractions avec l'exercice.
     */
    $scope.disableInterractions = function() {
        // active tout les select lorsque incorrect
        $('.radio-custom').each(function(index, value) {
            $(value).prop('disabled', true);
        });
        $scope.disabledToggled = true;
    };

    /**
     * @brief   Réactive les interractions avec l'exercice.
     */
    $scope.activateInterractions = function () {
        // active tout les select lorsque incorrect
        $('.radio-custom').each(function(index, value) {
            $(value).prop('disabled', false);
        });
        $scope.disabledToggled = false;
    };

    $scope.manageRetourFin = function(string) {
        $scope.retourfin = bridge.getLocalisedString(string);
        if ($scope.retourfin===""){
            $('.retourScore').css('font-size','0em');
        } else{
            $scope.retourfin = $scope.retourfin.replace('$$', $scope.score);
        }
    };

    $scope.replaceTimerString = function(){
        $scope.timerString = bridge.getLocalisedString('timer_instructions');
        $scope.timerString = $scope.timerString.replace('$$', $scope.timerPourEcran);
    };

    //Timer de l'exercice
    $scope.timer = function () {
        if ($scope.gameStarted) {
            $scope.time++;
            $timeout($scope.timer, 1000);
        }
    };

    $scope.returnMainPage = function(pPage){
        $('div').remove('#pop');
        $scope.displayPage(pPage);
    };

    $scope.backFeddback = function(){
        $scope.recoverState();
        $scope.displayPage('main');
    };

    //Affiche la page passée en paramètre
    $scope.displayPage = function (pPage) {
        $scope.currentPage = pPage;
        if (pPage == "main" && !$scope.gameStarted) {
            $timeout($scope.checkForCorrection, 100);
        }
    };

    /**
     * @brief   Affiche ou non la modale du popTimer. Cette fonction appelle la meta-core.
     * @detail  Les conditions suivantes doivent être remplies :
     *              - L'écran ne doit pas être déjà complété (alreadyDone)?
     *              - Le popTimer ne doit pas avoir été déjà affiché sur cet écran.
     */
    $scope.showPopTimer = function () {
        var parsedToIntTimer = parseInt($scope.timerPourEcran, 10);
        var isInt = Number.isInteger(parsedToIntTimer);
        var isPositive = parsedToIntTimer > 0;

        if (isInt && isPositive ) {
            // Si l'écran n'est pas déjà fait
            if (!$scope.alreadyDone) {
                // Si la "modale" du timer n'a pas été déjà affichée
                if ($scope.hidepop !== true) {
                    bridge.showPopTimer();
                }
            }
        }
    };

    //Récupère l'etat de l'exercice
    $scope.recoverState = function () {
        var currentState = bridge.getCurrentContentState();
        $scope.alreadyDone = currentState;
        if (currentState != null) {

            // Si l'exercice a déjà été effectué, le panneau de la légende sera affiché.
            $scope.feedbackPopupOpened = !$scope.showCorrection;

            $scope.time = currentState.time;
            $scope.items = JSON.parse(currentState.items);
            $scope.tries = currentState.tries;
            $scope.checkForSuccess();
            if ($scope.success) {
                $scope.gameStarted = false;
                if (!$scope.standalone) {
                    bridge.unlockMeta();
                }
                $scope.checkForCorrection();
            } else {
                if ($scope.tries >= $scope.nbtries) {
                    $scope.gameStarted = false;
                    if (!$scope.standalone) {
                        bridge.unlockMeta();
                    }
                    $scope.checkForCorrection();
                }
            }
        }
    };

    //Validation de l'exercice
    $scope.validate = function () {
        $scope.tries++;
        $scope.checkForSuccess();
        let interactionsToSend = $scope.getInteractionsToSendBasedOnScoringType();

        if ($scope.success) {
            if (($scope.scoring !== "Par choix") || $scope.scoremax === $scope.score){
                $scope.processValidation(interactionsToSend);
            } else if ($scope.tries >= $scope.nbtries){
                $scope.processValidation(interactionsToSend);
            }
        } else {
            if ($scope.tries >= $scope.nbtries) {
                $scope.processValidation(interactionsToSend);
            }
        }
    };

    /**
     * @brief   Retourne le tableau d'interactions SCORM à envoyer au LRS.
     * @detail  Le nombre d'interactions dépend du scoring : par défaut, il n'y en a qu'une seule mais si le scoring
     *          est fait par réponse alors chaque réponse sera une interaction SCORM.
     * @returns {[]} le tableau d'interractions SCORM à envoyer.
     */
    $scope.getInteractionsToSendBasedOnScoringType = function () {
        var interactionsToSend = [];

        if ($scope.scoring === "Par choix") {
            // Avec un scoring par choix, chaque réponse est considérée comme interraction SCORM
            for(var i =0; i < $scope.items.length; i++) {
                // On ne récupère par les propositions de réponse non sélectionnées afin de ne pas polluer les stats.
                if ($scope.items[i].selected) {
                    var interaction = {
                        description: $scope.exo_title,
                        type: "choice",
                        success: $scope.success,
                        learningData: [$scope.items[i]]
                    }
                    interactionsToSend[i] = interaction;
                }
            }
        } else {
            // Sinon, la totalité des réponses est une interraction SCORM
            var interaction = {
                description: $scope.exo_title,
                type: "choice",
                success: $scope.success,
                learningData: $scope.items
            };
            interactionsToSend.push(interaction);
        }

        return interactionsToSend;
    };

    $scope.processValidation = function(interactionsToSend) {
        $scope.gameStarted = false;
        if (!$scope.standalone) {
            bridge.setScore($scope.score, $scope.scoremax);
            $scope.sendCurrentState();
            bridge.unlockMeta();
            $scope.sendInteractions(interactionsToSend);
            bridge.$apply();
        }
        $scope.checkForCorrection();
    };

    /**
     * @brief   Envoi des interractions SCORM au LRS.
     * @param   interactionsToSend : Tableau d'interractions SCORM à envoyer.
     */
    $scope.sendInteractions = function (interactionsToSend) {
        angular.forEach(interactionsToSend, function(interactionToSend, key) {
            bridge.setInteraction(interactionToSend);
        });
    };

    //Envoi l'etat en cours de l'interaction à la meta
    $scope.sendCurrentState = function () {
        bridge.setCurrentContentState({
            id: $scope.id,
            time: $scope.time,
            tries: $scope.tries,
            items: JSON.stringify($scope.items)
        });
    };

    /**
     * Contrôle les réponses fournies aux propositions puis calcule le score et détermine
     * la réussite ou l'échec de l'activité
     */
    $scope.checkForSuccess = function () {
        var errorCount = 0;         // Nombre de mauvaises réponses

        // Parcours des propositions pour vérifier les réponses.
        angular.forEach($scope.items, function (item) {
            // Si la proposition a été choisie
            if (item.selected) {
                // mais qu'elle n'est pas correcte alors c'est une erreur.
                if (!item.correct)
                    errorCount++;
            }
            // Si la proposition n'a pas été choisie
            else {
                // mais qu'elle est correcte alors c'est une erreur.
                if (item.correct)
                    errorCount++;
            }
        });

        // Calcul du score et de la réussite de l'activité selon le mode de scoring choisi.
        switch ($scope.scoring) {
            case "Par choix":
                // Le score max correspond au nombre de propositions devant être choisies (les propositions piège en sont donc excluses).
                $scope.scoremax = 0;
                angular.forEach($scope.items, function (item) {
                    if (item.value !=="" && item.correct === true){
                        $scope.scoremax++;
                    }
                });

                // Calcul et affectation du score.
                $scope.score = ($scope.scoremax - errorCount) * $scope.scoringAmount;
                // La valeur la plus basse autorisée est zéro
                if ($scope.score < 0)  $scope.score = 0;

                // Pour réussir l'exercice, le taux de bonnes réponses se base sur le mastery score.
                $scope.success = ($scope.score >= ($scope.scoremax *(bridge.getMasteryScore() /100)))

                break;
            case "Par question répondu":
            case "Oui":         // Les anciennes versions du fichier excel avaient comme options de scoring "Oui" et "Non"
                // Pour réussir dans ces modes de scoring il faut n'avoir fait aucune erreur.
                $scope.success = (errorCount <= 0);
                $scope.scoremax = $scope.scoringAmount;
                $scope.score = $scope.success ? $scope.scoringAmount : 0;
                break;
            case "Non":
            case "aucun":
                // Pour réussir dans ces modes de scoring il faut n'avoir fait aucune erreur.
                $scope.success = (errorCount <= 0);
                // L'écran ne rapporte pas de points, aucun score n'est donc affecté.
                break;
            default:
        }
    };

    $scope.getScore = function(){
        return $scope.score;
    };

    $scope.getMaxScore = function(){
        return $scope.scoremax;
    };



    //Corrige l'exercice, celon le mode de correction choisi
    $scope.checkForCorrection = function () {
        //On montre ce qui est faux
        if ($scope.correction == 1 || $scope.correction == 3) {
            angular.forEach($scope.items, function (value, key) {
                $("#" + key).parent().removeClass("correct").removeClass("incorrect").removeClass("forgotten");
                if (value.selected) {
                    if (!value.correct) {
                        $scope.addStatusToItem(key, "incorrect");
                    } else {
                        $scope.addStatusToItem(key, "correct");
                    }
                }
                if (!value.selected) {
                    if (value.correct) {
                        $scope.addStatusToItem(key, "forgotten");
                    }
                }
            });
        }

        //On montre ce qu'il fallait faire
        if ($scope.correction == 2 || $scope.correction == 3) {
            $scope.correctionAvaiable = true;
        }
    };

    /**
     * @brief   Ajoute la classe de statut correspondante à un item de la page.
     * @param   item : item de la page à traiter (ex: "item_1").
     * @param   status : état à appliquer (correct, incorrect ou forgotten).
     */
    $scope.addStatusToItem = function (item, status) {
        $("#" + item).parent().addClass(status);
        $timeout(function () {
            var elem = $("#" + item + "-aria-correction"),
                label = bridge.getLocalisedString("accessibility_activity_item_label_" + status);
            elem.text(label);
        },1000);
    };

    /**
     * @brief   Navigation entre les réponses de l'apprenant et la correction.
     * @param   pShowCorrection {true : false } : afficher la correction ou non.
     */
    $scope.switchCorrection = function (pShowCorrection) {
        $scope.showCorrection = pShowCorrection;
        $scope.feedbackPopupOpened = !$scope.showCorrection;
        // On utilise un $apply() afin de répercuter les changements d'état sur la page.
        // Sinon on va se retrouver à faire la correction des réponses attendues au lieu de celles de l'apprenant
        // PUIS à basculer sur les réponses de l'apprenant qui ne seront pas bonnes du coup.
        $scope.$apply();
        if (!$scope.showCorrection) {
            // Puis on corrige les réponses de l'apprenant.
            $scope.checkForCorrection();
        }

        $("#feedbackpopup").collapse("hide");
        $timeout(function () {
            $("#bandeau-titre").focus();
        },1000);
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

    $scope.startTimer = function(){

    };

    $scope.removeTimer = function(){
        $('div').remove('#pop');
        $scope.oK = true;
        $scope.timtim = setTimeout($scope.validateAttempt,$scope.timerQuireste*1000);
    };

    $scope.itsOk = function(){
        return $scope.oK;
    };

    /**
     * @brief   Mets à jour le type d'écran.
     * @detail  Se base sur la fonction de l'appController de la metastructure.
     *          Il arrive que le bridge ne soit pas encore disponible, d'où le test !=null
     */
    $scope.setMobileDevice = function () {
        $scope.isMobileDevice = (bridge != null) ? bridge.isMobileDevice() : false;
    };

    /**
     * @brief   Retourne le label des items pour la correction
     * @param   correct
     * @returns {*}
     */
    $scope.getAriaLabelForItemCorrection = function (correct) {
        return bridge.getAriaLabelForItemCorrection(correct);
    }

    /**
     * Cet écran est déjà accessible.
     * Cette fonction existe pour éviter une erreur dans la console lorsque l'utilisateur clique sur le bouton toggle pour activer/désactiver le mode accessible.
     * Elle permet par la même occasion de ne pas garder le bouton toggle bloqué sur cet écran.
     */
    $scope.showAccessVersion = function () {};

    //Démarrage ---------------------------------------------------------------
    $scope.resize = function () {
        //fullheight
        var windowHeight = $(window).height();
        $('.minheight').css('min-height', (windowHeight) + 'px');
        $('.maxheight').css('max-height', (windowHeight)  + 'px');
    };

    $scope.getMaxHeight = function() {
        var windowHeight = $(window).height();
        var maxHeight = (windowHeight)  + 'px';
        return maxHeight;
    };

    $scope.getMinHeight = function() {
        var windowHeight = $(window).height();
        var minHeight = (windowHeight) + 'px';
        return minHeight;
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

app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        console.log(element);
        console.log(attrs);

        // scope.initialiseCanvas();
    };
});

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}
