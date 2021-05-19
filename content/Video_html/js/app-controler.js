app.controller('cannelle_appCtrl', ['$scope', '$sce', '$timeout', '$window', '$filter', '$http', function ($scope, $sce, $timeout, $window, $filter, $http) {

    //Initialise l'application
    //Positionne correctement le canvas qui sert de base pour dessiner le cercle
    $scope.init = function () {
        // Load YouTube library
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        var first_script_tag = document.getElementsByTagName('script')[0];
        first_script_tag.parentNode.insertBefore(tag, first_script_tag);

        bridge.setLocationForContent(document);
        $scope.displayPage("main");

        var body = $("body");
        bridge.manageRightToLeftLocales(body);
        bridge.manageContrastedColors(body);

        $scope.initialiseContentParams();
        $scope.setMobileDevice();
        $timeout($scope.initialiseVideo, 500);

        setTimeout(function(){
            //Refresh MathJax
            MathJax.typeset();
            bridge.refreshMathContent();
            // Définition du focus une fois l'écran prêt.
            var pageTitle = $(parent.document).find('#page-title'),
            bandeauTitre = $(parent.document).find('#video-player');
            bridge.setFocusWhenContentIsLoaded(pageTitle, bandeauTitre);
        }, 1000);
    };

    /**
     * @brief   Initialise les paramètres de l'écran.
     */
    $scope.initialiseContentParams = function () {
        $scope.allView = false;
        $scope.isBilanPage = false;
        $scope.videoType = null;
        $scope.videoRegexMatch = null;
        $scope.videoPlayer = null;
        $scope.displayLoader = true;

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
     * @brief   Initialise le lecteur vidéo.
     */
    $scope.initialiseVideo = function () {
        $scope.setVideoType();
        // Il faut un apply pour mettre à jour le DOM (le player est géré par un ng-switch)
        $scope.$apply();
        switch ($scope.videoType) {
            case 'youtube':
                $scope.initialiseYoutubeVideo();
                break;
            case 'dailymotion':
                $scope.initialiseDailymotionVideo();
                break;
            case 'vimeo':
                $scope.initialiseVimeoVideo();
                break;
            case 'libcast':
                $scope.initialiseLibcastVideo();
                break;
            default :
                $scope.initialiseLocalVideo();
                break;
        }
        $scope.displayLoader = false;
    }

    /**
     * @brief   Définit le type de vidéo.
     * @detail  En plus du type de vidéo, le résultat de la Regex est également sauvegardé car il est utilisé
     *          ensuite pour instancier le lecteur video correspondant.
     */
    $scope.setVideoType = function(){
        var regexs = {
            youtube: /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
            vimeo: /(vimeo.com\/)(\d+)/,
            dailymotion: /(?:dailymotion\.com(?:\/video|\/hub)|dai\.ly)\/([0-9a-z]+)(?:[\-_0-9a-zA-Z]+#video=([a-z0-9]+))?/g,
            libcast: /(.+\/\/)(.+libcast.com\/widget\/.+)/
        };

        angular.forEach(regexs, function(regex, type) {
            var match = $scope.url.match(regex);
            if(match) {
                $scope.videoType = type;
                $scope.videoRegexMatch = match;
            }
        });

        if($scope.videoType == null) $scope.videoType = "local";
    };

    /**
     * @brief   Initialise le lecteur vidéo Youtube.
     */
    $scope.initialiseYoutubeVideo = function () {
        $scope.videoPlayer = new YT.Player(
            'youtubePlayer',
            {
                videoId: $scope.videoRegexMatch[2],
                playerVars: {
                    'autohide': 0,
                    'controls': 1,
                    'iv_load_policy': 3,
                    'modestbranding': 1,
                    'rel': 0,
                    'showinfo': 0,
                    'enablejsapi': 1
                },
                events: {
                    'onStateChange': onPlayerStateChange
                }
            }
        );
    };

    /**
     * @brief   Initialise le lecteur vidéo Dailymotion.
     */
    $scope.initialiseDailymotionVideo = function () {
        var videoUrl = $scope.videoRegexMatch[0].split("/");
        videoUrl = videoUrl[videoUrl.length - 1];
        $scope.videoPlayer = DM.player(document.getElementById('dailymotionPlayer'), {
            video: videoUrl,
            params: {
                "queue-autoplay-next": false,
                "queue-enable": false
            }
        });
        $scope.videoPlayer.addEventListener('video_end', function(e) {
            $scope.allView = true;
        });
    };

    /**
     * @brief   Initialise le lecteur vidéo Vimeo.
     */
    $scope.initialiseVimeoVideo = function () {
        var options01 = {
            url: "https://player.vimeo.com/video/" + $scope.videoRegexMatch[2]
        };
        $scope.videoPlayer = new Vimeo.Player('vimeoPlayer', options01);
        $scope.videoPlayer.on('ended', function() {
            $scope.allView = true;
        });
    };

    /**
     * @brief   Initialise le lecteur vidéo local.
     */
    $scope.initialiseLocalVideo = function () {
        //Mise à jour de la balise vidéo une fois le cycle Angular terminé
        $scope.$$postDigest(function () {
            if ($window.params.transcription.trim().split(".")[1] === "vtt") { // L'utilisateur a rentré un fichier .vtt de sous-titres
                $scope.addSubtitlesToLocalVideo();
            } else {
                $("track").remove();
            }
            $("#localPlayer").attr("src", $scope.url);
            let vjsplayer = videojs("localPlayer", {
                techOrder: ["html5"],
                src: $scope.url,
                aspectRatio: '16:9'
            });
            $scope.videoPlayer = document.querySelector('video');
            $scope.videoPlayer.onended = function() {
                $scope.allView = true;
            };
            if ($window.params.transcription.trim().split(".")[1] === "vtt") {
                $scope.displaySubtitlesByDefault(vjsplayer);
            }
        });
    }

    /**
     * @brief   Ajoute les sous-titres au lecteur vidéo local.
     */
    $scope.addSubtitlesToLocalVideo = function () {
        let dir = window.location.pathname.replace(/[^\\\/]*$/, '');
        let filepath = `${dir}${$window.params.transcription}`;
        $("track").attr({
            kind: "subtitles",
            label: bridge.lang,
            src: filepath,
            srclang: bridge.lang
        });
    };

    /**
     * Affiche les sous-titres par défaut dans lecteur vidéo local si le mode accessible est activé.
     * @detail Code extrait de la documentation et adapté : https://docs.videojs.com/tutorial-text-tracks.html#showing-tracks-programmatically
     */
    $scope.displaySubtitlesByDefault = function (vjsplayer) {
        if (bridge.accessibleMode === true) {
            setTimeout(function () { // le setTimeout c'est dégueulasse, mais on y est pas arrivés avec une promesse
                let tracks = vjsplayer.textTracks();
                tracks[0].mode = 'showing';
            }, 500);
        }
    }

    /**
     * @brief   Initialise le lecteur vidéo libcast.
     */
    $scope.initialiseLibcastVideo = function () {
        var protocol = window.location.protocol;
        $scope.allView = true;
        $scope.videoUrl = $sce.trustAsResourceUrl(protocol + "//" + $scope.videoRegexMatch[2]);
        $("#libcastPlayer").src($scope.videoUrl);
    };

    function onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.ENDED) {
            $scope.allView = true;
            $scope.currentTime = 0;
            $scope.videoPlayer.stopVideo();
        }
    }

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
     * @brief   Détection du type d'écran.
     * @detail  Se base sur la fonction de l'appController de la metastructure.
     * @detail  Il arrive que le bridge ne soit pas encore disponible, d'où le test !=null
     * @returns {boolean}
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