//Déclaration de l'application (contrôleur global/racine)
var app = angular.module('cannelle_app', []).config(function($sceProvider) {
  $sceProvider.enabled(false);
});

app.config(['$sceProvider', '$compileProvider', function($sceProvider, $compileProvider) {
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|file):/);
}]);

app.run(function($rootScope, $window) {

	//--------------------------------------------------------
	// RECUPERATION DE TOUS LES PARAMETRES DEFINIS DANS LA PAGE HTML
	// ATTENTION: les noms de paramètres saisis dans la page HTML
	// doivent correspondre avec ceux utilisés par le script de l'application
	//--------------------------------------------------------
	for (var param in $window.params) {
		$rootScope[param] = $window.params[param];
	}
});
