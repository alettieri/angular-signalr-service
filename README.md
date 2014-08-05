angular-signalr-service
=======================

Angular SignalR Service

# Using the Service

1. Require the service as part of your application module.
2. Configure the hub name during the config cycle of your module.
3. Subscribe to hub events (.on) and Invoke hub events (.invoke or .send).


## Example usage

angular.app('myapp', ['services.hub']).config(function(HubProvider){

  HubProvider.setHubName('myHub');

}).factory('myService', function(Hub){

  var Factory = this;
  
  Factory.items = [];
  
  Factory.getItemsFromHub = function(){
    // Ask the hub for items
    Hub.invoke('getItems');
  };
  
  // Hub responds with items
  // Callcback function is wrapped in $apply by hub
  Hub.on('itemsSentFromHub', function(items){
  
    angular.each(items, function(item){
      Factory.items.push(item);
    });
  
  });
  
  
  return Factory;

}).controller('ItemsController', function(myService){

  this.items = myService.items;
  
  myService.getItems();

});
