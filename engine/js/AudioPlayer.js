/**
 * Classe maison pour le lecteur Audio de Cannelle.
 * Celui-ci correspond à l'élément DOM suivant :
 * <!--Audio player-->
 <div id="audio-player" class="btn ml-auto d-block h-100 btn-sidebar align-items-center d-flex px-0 px-lg-3"
 type="button"
 ng-show="currentContentParams.sound != null && currentContentParams.sound.trim().length > 0"
 aria-label="{{getLocalisedString('audioPlayer')}}" role="region">
 <!--Play btn-->
 <button class="my-auto my-lg-0 mr-lg-3 mr-1 h-100"
 type="button"
 ng-show="audioPlayer.isPlaying() == false"
 ng-click="audioPlayer.play()"
 aria-label="{{getLocalisedString('audioPlayer_play')}}"
 data-toggle="tooltip" data-placement="bottom" title="{{getLocalisedString('audioPlayer_play')}}">
 <svg class="fill-white h-100" style="width:12px;">
 <use href="#icon-play"></use>
 </svg>
 </button>
 <!--Pause btn-->
 <button class="my-auto my-lg-0 mr-lg-3 mr-1 h-100"
 type="button"
 ng-show="audioPlayer.isPlaying() == true"
 ng-click="audioPlayer.pause()"
 aria-label="{{getLocalisedString('audioPlayer_pause')}}"
 data-toggle="tooltip" data-placement="bottom" title="{{getLocalisedString('audioPlayer_pause')}}">
 <svg class="fill-white h-100" style="width:12px;">
 <use href="#icon-pause"></use>
 </svg>
 </button>
 <!--Seekbar-->
 <input id="seek" class="slider d-none d-md-flex"
 type="range" value="0" min="0"
 max="{{audioPlayer._track.duration}}"
 ng-model="audioPlayer._track.currentTime"


 aria-label="{{getLocalisedString('audioPlayer_seek')}}"/>
 <!--Mute btn-->
 <button class="my-auto my-lg-0 ml-lg-3 ml-0 h-100"
 type="button"
 ng-show="audioPlayer.getVolume() > 0"
 ng-click="audioPlayer.mute()"
 aria-label="{{getLocalisedString('audioPlayer_mute')}}"
 data-toggle="tooltip" data-placement="bottom" title="{{getLocalisedString('audioPlayer_mute')}}">
 <svg class="fill-white h-100" style="width:16px;">
 <use href="#icon-mute"></use>
 </svg>
 </button>
 <!--Unmute btn-->
 <button class="my-auto my-lg-0 ml-3 h-100"
 type="button"
 ng-show="audioPlayer.getVolume() == 0"
 ng-click="audioPlayer.unmute()"
 aria-label="{{getLocalisedString('audioPlayer_unmute')}}"
 data-toggle="tooltip" data-placement="bottom" title="{{getLocalisedString('audioPlayer_unmute')}}">
 <svg class="fill-white h-100" style="width:16px;">
 <use href="#icon-audio"></use>
 </svg>
 </button>
 </div>
 */

class AudioPlayer {

    /**
     * Objet HTML audio player.
     * @type {Object}
     * @private
     */
    _player;
    setPlayer(player) {this._player=player;}
    getPlayer() {return this._player;}

    /**
     * Objet HTML bouton play / pause.
     * @type {Object}
     * @private
     */
    _playBtn;
    setPlayBtn(playBtn) {this._playBtn=playBtn;}
    getPlayBtn() {return this._playBtn;}

    /**
     * Objet HTML bouton mute / unmute.
     * @type {Object}
     * @private
     */
    _muteBtn;
    setMutebtn(muteBtn) {this._muteBtn=muteBtn;}
    getMuteBtn() {return this._muteBtn;}

    /**
     * Piste en cours de lecture.
     * @detail La création d'une track passe par l'instanciation d'un lecteur audio html5.
     * @detail Il faut cibler cet élément pour toute action de lecture / pause / etc...
     * @private
     */
    _track = null;
    setTrack(track) {this._track = new Audio(track);}
    getTrack() {return this._track;}

    /**
     * Durée en secondes de la piste en cours de lecture.
     * @type {number}
     * @private
     */
    _duration=0;
    setDuration(duration) {this._duration=duration;}
    getDuration() {return this._duration;}

    /**
     * Est-ce que la piste audio est en cours de lecture.
     * @return {boolean}
     */
    isPlaying() {
        if(this.getTrack() != null) {
            return !this._track.paused;
        } else {
            return false;
        }
    }

    /**
     * Est-ce que le son est coupé ?
     * @return {boolean}
     */
    isMuted() {
        if(this.track != null)  {
            return (this._track.volume === 0);
        }
    }

    /**
     * Volume du lecteur (de 0 à 1).
     * @type {number}
     * @private
     */
    setVolume(volume) {
        if(this.getTrack() != null)
            this.getTrack().volume=volume;
    }
    getVolume() {
        if(this.getTrack() != null)
            return this.getTrack().volume;
    }

    //------------------
    // CONSTRUCTEUR
    //------------------

    /**
     * Instancie un objet AudioPlayer.
     * @param {String} playerID Identifiant du player audio dans le DOM HTML.
     */
    constructor(playerID) {
        this.setPlayer($(playerID).get(0));
        this.setPlayBtn($(`${playerID} #play`).get(0));
        this.setMutebtn($(`${playerID} #mute`).get(0));
    }

    //------------------
    // BOUTONS
    //------------------

    /**
     * Initialisation du bouton Play/Pause.
     */
    initPlayBtn() {
        let _self = this;
        this.getPlayBtn().addEventListener('click', function () {
            if(_self.isPlaying() === true) {
                _self.pause();
            } else {
                _self.play();
            }
        })
    }

    /**
     * Initialisation du bouton Mute/Unmute.
     */
    initMuteBtn() {
        let _self = this;
        this.getMuteBtn().addEventListener('click', function () {
            if(_self.isMuted) {
                _self.unmute();
            } else {
                _self.mute();
            }
        })
    }

    //------------------
    // CONTROLS
    //------------------

    /**
     * Lance la lecture.
     */
    play() {
        this._track.play();
    }

    /**
     * Mets en pause la lecture.
     */
    pause() {
        this._track.pause();
    }

    /**
     * Coupe le son.
     */
    mute() {
        this._track.volume = 0;
    }

    /**
     * Réactive le son.
     */
    unmute() {
        this._track.volume = 1;
    }

    /**
     * Supprime la piste actuelle.
     */
    deleteCurrentTrack() {
        this._track.pause();
        this._track=null;
    }
}