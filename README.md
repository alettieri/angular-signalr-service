angular-signalr-service
=======================

Angular SignalR Service

# Using the Service

1. Require the service as part of your application module.
2. Configure the hub name during the config cycle of your module.
3. Subscribe to hub events (.on) and Invoke hub events (.invoke or .send).


## Example usage
```
  ItemHubFactory.$inject = ['HubService'];
  function ItemHubFactory(HubService) {
     return new HubService('itemHub');
  }

  ItemsService.$inject = ['ItemHub'];
  function ItemsService(Hub) {
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
  }

  ItemsController.$inject = ['ItemsService'];
  function ItemsController(ItemsService) {
    this.items = myService.items;
    myService.getItems();
  }
  
  angular.app('myapp', ['services.hub']).factory('ItemHub', ItemHubFactory).factory('ItemsService', ItemsService).controller('ItemsController', ItemsController);
```
