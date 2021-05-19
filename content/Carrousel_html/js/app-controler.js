app.controller('cannelle_appCtrl', ['$scope', '$sce', '$timeout', '$window', '$filter', '$http', function ($scope, $sce, $timeout, $window, $filter, $http) {

    //Initialise l'application
    //Positionne correctement le canvas qui sert de base pour dessiner le cercle
    $scope.init = function () {
        bridge.setLocationForContent(document);
        $scope.initialiseContentParams();

        var body = $("body");
        bridge.manageContrastedColors(body);
        bridge.manageRightToLeftLocales(body);

        $scope.displayPage("main");
        $scope.setMobileDevice();

        setTimeout(function(){
            $scope.resize();
            //Refresh MathJax
            MathJax.typeset();
            bridge.refreshMathContent();
            // Définition du focus une fois l'écran prêt.
            var pageTitle = $(parent.document).find('#page-title'),
                firstCarouselElement = $(".owl-dots .owl-dot:first-child");
            bridge.setFocusWhenContentIsLoaded(pageTitle, firstCarouselElement);
        }, 1000);
    };

    /**
     * @brief   Initialise les paramètres de l'écran.
     */
    $scope.initialiseContentParams = function () {
        $scope.currentTab = "onglet_1";
        $scope.isBilanPage = false;
        $scope.viewedElements = [];

        //Variables CSS
        cssVars({
            rootElement: document, // default
            onlyLegacy: true
        });

        //Polyfill Webp
        var webpMachine = new webpHero.WebpMachine()
        webpMachine.polyfillDocument();

        // Focus sur bouton de fermeture de la modal
        var $exampleModalClose = $(".btn-close");

        $('.modal-full').each(function(index, value) {
            $(value).on("shown.bs.modal", function() {
                document.activeElement.blur();
                $exampleModalClose.focus();
            });
        });
    };

    /**
     * @brief	Retourne la complétion de lecture du contenu de l'écran
     * @return 	{boolean}
     */
    $scope.isAllContentViewed = function () {
        return ($scope.getNbOfActivesSlides() == $scope.viewedElements.length);
    };

    /**
     * @brief   Ajout de la ressource aux ressources consultées (si celle-ci n'est pas déjà dans la liste.
     * @param   item : ressource consultée.
     */
    $scope.updateViewedElements = function (item) {
        if($scope.viewedElements.indexOf(item) == -1) {
            $scope.viewedElements.push(item);
        }
    };

    /**
     * @brief   Retourne le nombre de sliders actifs de la page
     * @returns {number}
     */
    $scope.getNbOfActivesSlides = function() {
        var result = 0;
        angular.forEach($scope.items, function(value, key) {
            if($scope.isSlideActive(value)) {
                result++;
            }
        });
        return result;
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
    $scope.buttons.set("instructions", false);
    $scope.buttons.set("validate", false);
    $scope.buttons.set("retry", false);
    $scope.buttons.set("solution", false);
    $scope.buttons.set("myAnswers", false);
    $scope.buttons.set("feedback", false);
    $scope.buttons.set("restartQuiz",false);

    //Affiche la page passée en paramètre
    $scope.displayPage = function (pPage) {
        $scope.currentPage = pPage;
        $timeout($scope.initOwl, 300);
    };

    $scope.setCurrentTab = function (pTab) {
        $scope.currentTab = pTab;
    };

    //Retourne le texte de l'onglet actuel
    $scope.getCurrentTabText = function () {
        return $scope.items[$scope.currentTab].text;
    };

    //Retourne l'image de l'onglet actuel
    $scope.getCurrentTabImage = function () {
        return $scope.items[$scope.currentTab].illustration;
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

    $scope.isSlideActive = function (pSlide) {
        var active = true;
        if (pSlide.text == "" && pSlide.illustration == "") {
            active = false;
        }
        return active;
    };

    /**
     * @brief   Initialisation du carousel.
     * @detail  Les boutons précédent et suivant sont renseignés ici.
     */
    $scope.initOwl = function () {
        var owl = $(".owl-carousel"),
            btnPrevious = "<svg><use href=\"#icon-next\"></use></svg><svg><use href=\"#icon-previous\"></use></svg><span>"+$scope.getLocalisedString("aria_btn_prev_label")+"</span>",
            btnNext = "<span>"+$scope.getLocalisedString("aria_btn_next_label")+"</span><svg><use href=\"#icon-next\"></use></svg><svg><use href=\"#icon-previous\"></use></svg>";
        owl.owlCarousel({
            loop: true,
            paginationNumbers: true,
            dotsContainer: '.owl-dots',
            nav: true,
            items: 1,
            autoHeight: false,
            navigation: true,
            navText: [
                btnPrevious,
                btnNext
            ],
            smartSpeed: 450,
            navContainer: '.navContainer'
        });

        // Ajout du premier onglet à ceux consultés
        var firstOnglet = $(".owl-item.active").children(":first").attr("data-id");;
        $scope.updateViewedElements(firstOnglet);

        // Event pour ajouter les onglets consultés à la liste
        owl.on('translated.owl.carousel', function(event) {
            var onglet = $(".owl-item.active").children(":first").attr("data-id");
            $scope.updateViewedElements(onglet);
        });

        //Ajout des éléments d'accessibilité aux boutons "précédent" et "suivant" du carousel.
        $(".owl-prev").attr({
            "aria-label": $scope.getLocalisedString('aria_btn_prev_label'),
            "name": $scope.getLocalisedString('aria_btn_prev_name')
        });
        $(".owl-next").attr({
            "aria-label": $scope.getLocalisedString('aria_btn_next_label'),
            "name": $scope.getLocalisedString('aria_btn_next_name')
        });
    };

    /**
     * @brief   Mets à jour le type d'écran.
     * @detail  Se base sur la fonction de l'appController de la metastructure.
     *          Il arrive que le bridge ne soit pas encore disponible, d'où le test !=null
     */
    $scope.setMobileDevice = function () {
        $scope.isMobileDevice = (bridge != null) ? bridge.isMobileDevice() : false;
    };

    $scope.resize = function () {
        //fullheight
        var windowHeight = $(window).height();
        var owlHeight = $(".owl-control").height();
        var bandeauHeight = $("#bandeau-titre").height();
        $('.minheight').css('min-height', (windowHeight - bandeauHeight - owlHeight) - 60 + 'px');
        $('.maxheight').css('max-height', (windowHeight - bandeauHeight - owlHeight) + 'px');
        $('.sticky-md').css('top', (bandeauHeight) + 'px');
        $('.windowheight').css('max-height', (windowHeight)  + 'px');
    };

    // Hauteur du #main
    $(window).resize(function () {
        $scope.resize();
    });

    //Démarrage ---------------------------------------------------------------

    //Verifie si la page est chargée dans une frame ou bien de manière autonome
    if (window.self === window.top) {
        $scope.standalone = true;
        $scope.baseColor = "#CCCCCC";
        $scope.secondaryColor = "#808080";
        $scope.init();
    }
}]);

