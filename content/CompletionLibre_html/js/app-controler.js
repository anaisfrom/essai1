app.controller('cannelle_appCtrl', ['$compile', '$scope', '$sce', '$timeout', '$window', '$filter', '$http', function ($compile, $scope, $sce, $timeout, $window, $filter, $http) {

    //Initialise l'application
    //Positionne correctement le canvas qui sert de base pour dessiner le cercle
    $scope.init = function () {
        $scope.initialiseContentParams();
        bridge.setLocationForContent(document);
        $scope.displayPage("main");

        var body = $("body");
        bridge.manageRightToLeftLocales(body);
        bridge.manageContrastedColors(body);

        $scope.initTextToComplete();
        $scope.initialiseStandaloneIfActivated();
        $scope.replaceTimerString();
        $scope.setMobileDevice();

        //Démarrage du timer de l'exercice
        $timeout($scope.timer, 1000);

        setTimeout(function(){
            //Refresh MathJax
            MathJax.typeset()
            // Définition du focus une fois l'écran prêt.
            var pageTitle = $(parent.document).find('#page-title'),
                bandeauTitre = $("#bandeau-titre");
            bridge.setFocusWhenContentIsLoaded(pageTitle, bandeauTitre);
        }, 500);

        bridge.showInstructionsInTheFirstDisplayOfThePage();
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
        $scope.allView = false;
        $scope.isBilanPage = false;

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
    };

    /**
     * @brief   Initialise le jeu de données si le mode standalone est activé.
     */
    $scope.initialiseStandaloneIfActivated = function() {
        if (!$scope.standalone) {
            setTimeout(function() {
                $scope.recoverState(); // runs first
                $scope.showPopTimer(); // runs second
            }, 500)
        }
    };

    /**
     * @brief	Retourne la complétion de lecture du contenu de l'écran
     * @return 	{boolean}
     */
    $scope.isAllContentViewed = function () {
        if ($scope.feedbackFinal.feedbackText === "" && $scope.feedbackFinal.feedbackImage === ""){
            return true;
        }
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
    $scope.buttons.set("instructions",true);
    $scope.buttons.set("validate",false);
    $scope.buttons.set("retry",true);
    $scope.buttons.set("solution",true);
    $scope.buttons.set("myAnswers",true);
    $scope.buttons.set("feedback",true);
    $scope.buttons.set("restartQuiz",false);

    $scope.retryAttempt = function () {
        $scope.isOver= true;
        $scope.timerQuireste = Number($scope.timerPourEcran);
        $scope.feedbackPopupOpened = false;
                // active tout les input lorsque recommencer
                $('input').each(function(index, value) {
                    $(value).prop('disabled', false);
                  });
                
        if ($scope.timerQuireste != -1){
            $scope.removeTimer();
        }
        var pageTitle = $(parent.document).find('#page-title'),
            bandeauTitre = $("#bandeau-titre");
        bridge.setFocusWhenContentIsLoaded(pageTitle, bandeauTitre);
    };

    $scope.getExoTitle = function(){
        return $scope.exo_title;
    };

    $scope.validateAttempt = function () {

        clearTimeout($scope.timtim);
        if ($scope.isOver === true){
            $scope.validate();
            if ($scope.correction != 0) {
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
        if ($scope.success === true && ($scope.scoring === 'Par choix' || $scope.scoring === 'Par question répondu')){
            $scope.manageRetourFin('timer_points');
        } else if ($scope.success === false && $scope.score === 0 && ($scope.scoring === 'Par choix' || $scope.scoring === 'Par question répondu')){
            $scope.manageRetourFin('timer_nopoint');
        } else if ($scope.scoring === 'aucun'){
            $scope.retourfin = "";
            $('.retourScore').css('font-size','0em');
        } else{
            $scope.manageRetourFin('timer_partial');
        }
    };

    $scope.manageRetourFin = function(string) {
        $scope.retourfin = bridge.getLocalisedString(string);
        if ($scope.retourfin === ""){
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

    $scope.returnMainPage = function(){
        $scope.init();
    };


    $scope.backFeddback = function(){
        $scope.recoverState();
        $scope.displayPage('main');
    };

    //Affiche la page passée en paramètre
    $scope.displayPage = function (pPage) {
        $scope.currentPage = pPage;
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
                if ($scope.hidepop != true) {
                    bridge.showPopTimer();
                }
            }
        }
    };

    $scope.initTextToComplete = function () {
        $scope.items = [];
        var ar = $scope.text.match(/\[(.*?)\]/ig);
        for (var i = 0; i < ar.length; i++) {
            if (/(;)/.test(ar[i])) {
                var responsesAr = ar[i].split(";");
                $scope.items.push({id: "item_" + i, current: "", correct: responsesAr, baseValue: ar[i]});
            } else {
                $scope.items.push({id: "item_" + i, current: "", correct: [ar[i]], baseValue: ar[i]});
            }
        }
        $scope.resultMap = {};
    };

    //Met à jour la taille de la zone de texte
    $scope.updateTextSize = function (pID) {
       $("#span_" + pID).attr("data-value",  $("#" + pID).val());
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
            $scope.resultMap = currentState.resultMap;
            $timeout(function () {
                angular.forEach($scope.items, function (value, key) {
                    $scope.updateTextSize(value.id);
                });
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
                bridge.$apply();
            }, 500);
        }
    };

    //Validation de l'exercice
    $scope.validate = function () {
        $scope.tries++;
        $scope.checkForSuccess();
        var interactionsToSend = $scope.getInteractionsToSendBasedOnScoringType();
        // desactive tout les input lorsque incorrect
        $('input').each(function(index, value) {
            $(value).prop('disabled', true);
          });
        
        if ($scope.success) {
            if (($scope.scoring !== "Par choix") || $scope.scoremax == $scope.score){
                $scope.processValidation(interactionsToSend);
                $("#results").modal({show: false});
            } else if ($scope.tries >= $scope.nbtries){
                $scope.processValidation(interactionsToSend);
                $("#results").modal({show: false});
            }
        } else {
            if ($scope.tries >= $scope.nbtries) {
                $scope.processValidation(interactionsToSend);
                $("#results").modal({show: false});
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
                if ($scope.items[i].current != "") {
                    var interaction = {
                        description: $scope.exo_title,
                        type: "fill-in",
                        success: $scope.success,
                        learningData: {
                            learnerResponses: $scope.items[i],
                            useCase: $scope.useCase,
                            resultMap: {}
                        }
                    }
                    if (typeof $scope.resultMap[$scope.items[i].id] != "undefined") {
                        interaction.learningData.resultMap[$scope.items[i].id] = $scope.resultMap[$scope.items[i].id];
                    }
                    interactionsToSend[i] = interaction;
                }
            }
        } else {
            // Sinon, la totalité des réponses est une interraction SCORM
            var interaction = {
                description: $scope.exo_title,
                type: "fill-in",
                success: $scope.success,
                learningData: {
                    learnerResponses: $scope.items,
                    useCase: $scope.useCase,
                    resultMap: $scope.resultMap
                }
            };
            interactionsToSend.push(interaction);
        }

        return interactionsToSend;
    }

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
            items: JSON.stringify($scope.items),
            resultMap: $scope.resultMap,
        });
    };

    /**
     * Verifie la réussite ou bien l'echec de l'exercice
     * Attribue également les points, selon le mode de scoring choisi
     */
    $scope.checkForSuccess = function () {
        let goodAnswers = 0,
            emptyProposals = 0;
        // Parcours des réponses
        for(let i =0; i < $scope.items.length; i++) {
            let item = $scope.items[i], // Objet des bonnes réponses pour ce trou i
                response = $scope.resultMap[item.id],       // Proposition de réponse de l'utilisateur pour le trou i
                isCorrect = false;
            if (response === undefined || response === "") {     // Si la réponse est vide
                emptyProposals++;
            } else {
                // Pour chaque élément du tableau des bonnes réponses possibles
                for(let j = 0; j < item.correct.length; j++) {
                    let possibleCorrectAnswer = item.correct[j].replace("[", "").replace("]", "").trim(); //élément j du tableau des bonnes réponses possibles
                    item.current = response;
                    errorCountForAHole = 0;
                    if (!$scope.useCase) {      // Si la sensibilité à la casse est désactivée la proposition ET la correction sont transformées en minuscules
                        response = response.toLowerCase();
                        possibleCorrectAnswer = possibleCorrectAnswer.toLowerCase();
                    }
                    if (response === possibleCorrectAnswer) {
                        isCorrect = true;
                        goodAnswers++;
                        break;
                    }
                }
            }
        }
        // Score
        switch ($scope.scoring) {
            case "aucun":
                $scope.success = (goodAnswers === $scope.items.length);
                $scope.scoremax = 0;
                $scope.score = 0;
                break;
            case "Par question répondu":
                $scope.success = (goodAnswers === $scope.items.length);
                $scope.scoremax = 1;
                if ($scope.success === true) {
                    $scope.score = 1;
                } else {
                    $scope.score = 0;
                }
                break;
            case "Par choix":
                $scope.scoremax = $scope.items.length;
                let errorCount = $scope.scoremax - goodAnswers - emptyProposals;
                $scope.score = goodAnswers - errorCount;
                if ($scope.score < 0) {
                    $scope.score = 0;
                }
                $scope.success = ($scope.score >= ($scope.scoremax *(bridge.getMasteryScore() /100)))
                break;
        }
    };

    $scope.getScore = function(){
        return $scope.score;
    };

    $scope.getMaxScore = function(){
        return $scope.scoremax;
    };

    //Corrige l'exercice, selon le mode de correction choisi
    $scope.checkForCorrection = function () {
        //On montre ce qui est faux
        if ($scope.correction == 1 || $scope.correction == 3) {
            angular.forEach($scope.items, function (value, key) {
                $("#span_" + value.id).removeClass("correct").removeClass("incorrect").removeClass("forgotten");
                var response = $scope.resultMap[value.id];
                var isCorrect = false;
                for (var i = 0; i < value.correct.length; i++) {
                    var valueToTest = value.correct[i].replace("[", "").replace("]", "").trim();
                    var responseToTest = response;
                    if (responseToTest != null) {
                        if (!$scope.useCase) {
                            valueToTest = valueToTest.toLowerCase();
                            responseToTest = responseToTest.toLowerCase();
                        }
                        if (valueToTest == responseToTest) {
                            isCorrect = true;
                        }
                    }
                }
                if (!isCorrect) {
                    if (response === undefined || response.trim() === "") {
                        $scope.addStatusToItem(value.id, key, "forgotten");
                    } else {
                        $scope.addStatusToItem(value.id, key, "incorrect");
                    }
                } else {
                    $scope.addStatusToItem(value.id, key, "correct");
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
     * @param   valueId
     * @param   item : item de la page à traiter (ex: "item_1").
     * @param   status : état à appliquer (correct, incorrect ou forgotten).
     */
    $scope.addStatusToItem = function (valueId, item, status) {
        $("#span_" + valueId).addClass(status);
        $timeout(function () {
            var elem = $("#item_" + item),
                label = bridge.getLocalisedString('accessibility_activity_item_label_' + status);
            elem.attr("aria-label", label);
        },1000);
    };

    //Retourne sous forme de tableau, la correction
    $scope.getAllCorrections = function () {
        var ar = [];
        if (!$scope.gameStarted) {
            angular.forEach($scope.items, function (value, key) {
                var response = "";
                for (var i = 0; i < value.correct.length; i++) {
                    response += value.correct[i].replace("[", "").replace("]", "");
                    if (i < value.correct.length - 1) {
                        response += " / ";
                    }
                }
                ar.push(response);
            });
        }
        return ar;
    };

    //Montre la correction ou bien retourne aux réponses de l'utilisateur
    $scope.switchCorrection = function (pShowCorrection) {
        $scope.showCorrection = pShowCorrection;
        $scope.feedbackPopupOpened = !$scope.showCorrection;
        $scope.checkForCorrection();
        $("#feedbackpopup").collapse("hide");
        $(".textToReplace").removeClass("fadeDownIn");
        $timeout(function () {
            angular.forEach($scope.items, function (value, key) {
                $scope.updateTextSize("correction_" + key);
            });
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

    $scope.itsOk = function(){
        return $scope.oK;
    };

    $scope.removeTimer = function(){
        $('div').remove('#pop');
        $scope.oK = true;
        $scope.timtim = setTimeout($scope.validateAttempt,$scope.timerQuireste*1000);
    };

    /**
     * @brief   Mets à jour le type d'écran.
     * @detail  Se base sur la fonction de l'appController de la metastructure.
     *          Il arrive que le bridge ne soit pas encore disponible, d'où le test !=null
     */
    $scope.setMobileDevice = function () {
        $scope.isMobileDevice = (bridge != null) ? bridge.isMobileDevice() : false;
    };


    $timeout(function () {
        $("#bandeau-titre").focus();
        $scope.resize();
    },1000);

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
        $scope.setMobileDevice();
    });

    //Verifie si la page est chargée dans une frame ou bien de manière autonome
    if (window.self === window.top) {
        $scope.standalone = true;
        $scope.baseColor = "#CCCCCC";
        $scope.secondaryColor = "#808080";
        $scope.init();
    }
}]);

//Directive de remplacement des textes par des input
app.directive('ngShowtextDirective', ['$compile', function ($compile) {
    return function (scope, element, attrs) {
        if (typeof scope.items == "undefined") {
            scope.initTextToComplete();
        }
        var textToReplace = "<div>" + scope.text + "</div>";
        angular.forEach(scope.items, function (value, key) {
            var divOpen = "<div class='item' id='span_" + value.id + "' data-value=''>",
                input = "<input oninput='this.parentNode.dataset.value = this.value' id='" + value.id + "' " +
                    "class='shadow-sm' " +
                    "aria-label='" + scope.getLocalisedString('accessibility_input_label') + "'" +
                    "ng-disabled='gameStarted==false' " +
                    "ng-model='resultMap." + value.id + "' " +
                    "ng-keyup='updateTextSize(\"" + value.id + "\")' " +
                    " />",
                divClose = "</div>";

            var newValue = divOpen + input + divClose;
            textToReplace = textToReplace.replace(value.baseValue, newValue);
        });
        var regex = /(?:>)(.*?)(?=<)/g;
        var matches = getMatches(textToReplace, regex, 1);
        var index = 0;
        for (var i = 0; i < matches.length; i++) {
            var obj = matches[i];
            if (obj.trim() !== "" && obj.trim() !== "."){
                var label = "<label id='label_item_"+index+"'>"+obj+"</label>"
                index++;
                textToReplace = textToReplace.replace(obj, label);
            }
        }
        var compiled = $compile(textToReplace)(scope);
        element.html(compiled);
        // Réactivation des éléments de navigation désactivés pendant le chargement de l'écran
        scope.buttons.set("validate",true);
        scope.reactivateActionButtons();
        $(".loader-container").hide();

        //Refresh MathJax
        setTimeout(function(){
            MathJax.typeset();
            bridge.refreshMathContent();
        }, 1000);
    };
}]);

app.directive('ngShowtextCorrectionDirective', ['$compile', function ($compile) {
    return function (scope, element, attrs) {
        if (typeof scope.items == "undefined") {
            scope.initTextToComplete();
        }
        var textToReplace = "<div>" + scope.text + "</div>";
        angular.forEach(scope.items, function (value, key) {
            var response = "";
            for (var i = 0; i < value.correct.length; i++) {
                response += value.correct[i].replace("[", "").replace("]", "");
                if (i < value.correct.length - 1) {
                    response += " / ";
                }
            }
            var input = "<div class='item' data-value='" + response + "' >" +
                "<input id='correction_" + key + "'" +
                "class='shadow-sm bg-secondary-color on-secondary-color' " +
                "type='text'" +
                "disabled value='" + response + "'" +
                "aria-label='" + bridge.getLocalisedString('accessibility_activity_item_label_correction') + '"' +
                "ng-disabled='gameStarted==false'" +
                "/></div>";
            textToReplace = textToReplace.replace(value.baseValue, input);
        });
        var compiled = $compile(textToReplace)(scope);
        element.html(compiled);
    };
}]);

function getMatches(string, regex, index) {
    index || (index = 1); // default to the first capturing group
    var matches = [];
    var match;
    while (match = regex.exec(string)) {
        matches.push(match[index]);
    }
    return matches;
}
