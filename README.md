# For Broker

Use yarn to install essential dependencies 

## Installation 

Use yarn to install essential dependencies  [yarn](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&cad=rja&uact=8&ved=2ahUKEwiWo9is7YroAhXOzzgGHT62B8kQFjAAegQICRAC&url=https%3A%2F%2Fyarnpkg.com%2Flang%2Fen%2Fdocs%2Finstall%2F&usg=AOvVaw2NZ6b4ay9pnQPf3rzVCezK) to install yarn in local.

```bash
cd Broker && yarn 
```

## Stating as Debug mode (Broker)

```node
yarn run dev
```
## Initialization (Broker)

```node
node Clean.js
```
## Command for publisher to send the message

```node
node index.js localhost {topic} {Message}
```
## Command for subscriber to subscribe the interest topic

```node
node index.js localhost {topic} 
```
## After publisher sent the message, if subscribers are on that topic, they will receive them.

## Contributed by
Pasinee	
Supawan	
Sornsiri	
Supapat	Srion 
Parattha


Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
