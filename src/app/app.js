
angular.element(document).ready(function() {
  angular.module( 'ripplecharts', [
    'templates-app',
    'templates-common',
    'ripplecharts.landing',
    'ripplecharts.markets',
    'ripplecharts.manage-currencies',
    'ripplecharts.manage-gateways',
    'ripplecharts.multimarkets',
    'ripplecharts.activeAccounts',
    'ripplecharts.trade-volume',
    'ripplecharts.graph',
    'ripplecharts.accounts',
    'ripplecharts.value',
    'ripplecharts.history',
    'ui.state',
    'ui.route',
    'snap',
    'gateways',
    'rippleName',
    'matrixFactory',
    'chordDiagram'
  ])

  .config( function myAppConfig ( $stateProvider, $urlRouterProvider ) {
    $urlRouterProvider.otherwise('/');
  })

  .run(function($window, $rootScope) {
    if (typeof navigator.onLine != 'undefined') {
      $rootScope.online = navigator.onLine;
      $window.addEventListener("offline", function () {
        $rootScope.$apply(function() {
          $rootScope.online = false;
        });
      }, false);
      $window.addEventListener("online", function () {
        $rootScope.$apply(function() {
          $rootScope.online = true;
        });
      }, false);
    }
  })

  .controller( 'AppCtrl', function AppCtrl ( $scope, $location ) {
    $scope.theme = store.get('theme') || Options.theme || 'dark';
    $scope.$watch('theme', function(){store.set('theme', $scope.theme)});

    $scope.toggleTheme = function(){
      if ($scope.theme == 'dark') $scope.theme = 'light';
      else $scope.theme = 'dark';
    };

    $scope.snapOptions = {
      disable: 'right',
      maxPosition: 267
    }

    //disable touch drag for desktop devices
    if (!Modernizr.touch) $scope.snapOptions.touchToDrag = false;


    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      mixpanel.track("Page", {"Page Name":toState.name, "Theme":$scope.theme});
      if (ga) ga('send', 'pageview', toState.name);

      if ( angular.isDefined( toState.data.pageTitle ) )
           $scope.pageTitle = toState.data.pageTitle + ' | Ripple Charts' ;
      else $scope.pageTitle = "Ripple Charts"

    });

  //connect to the ripple network;
    remote = new ripple.Remote(Options.ripple);
    remote.connect();

  //get ledger number and total coins
    remote.on('ledger_closed', function(x){

      $scope.ledgerLabel = "Ledger #:";
      $scope.ledgerIndex = commas(parseInt(x.ledger_index,10));
      remote.request_ledger('closed', handleLedger);
      $scope.$apply();

    });

    function handleLedger(err, obj) {
      if (obj) {
        var totalCoins = obj.ledger.total_coins,
            totalCoinsXrp = [commas(parseInt(totalCoins.slice(0, -6), 10)), totalCoins.slice(-6, -4)].join(".");
        $scope.ledgerLabel = "Ledger #:";
        $scope.ledgerIndex = commas(parseInt(obj.ledger.ledger_index, 10));
        $scope.totalCoins = totalCoinsXrp;
        $scope.totalXRP = parseFloat(totalCoins)/ 1000000.0;
        $scope.$apply();
      }
    }

    $scope.ledgerLabel = "connecting...";

    remote.request_ledger('closed', handleLedger); //get current ledger;
    remote.on("disconnect", function(){
      $scope.ledgerLabel      = "reconnecting...";
      $scope.ledgerIndex      = "";
      $scope.connectionStatus = "disconnected";
      $scope.$apply();
    });

    remote.on("connect", function(){
      $scope.ledgerLabel      = "connected";
      $scope.connectionStatus = "connected";
      $scope.$apply();

      //setTimeout(function(){remote.disconnect()},5000);
      //setTimeout(function(){remote.connect()},10000);
    });
  });

  angular.bootstrap(document, ['ripplecharts']);
});

function commas (number, precision) {
  if (number===0) return 0;
  if (!number) return null;
  var parts = number.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (precision && parts[1]) {
    parts[1] = parts[1].substring(0,precision);
    while(precision>parts[1].length) parts[1] += '0';
  }
  else if (precision===0) return parts[0];
  return parts.join(".");
}
