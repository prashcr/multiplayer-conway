# Multiplayer Conway's Game of Life

### How to run

Have a recent version of Node.js installed

```
npm install
npm start
```

Visit http://localhost:3000 to view the game running

### Technical details

* The front-end consists only of static files and no build step so `/public` could be copied to a CDN (However, the Primus client library has to be regenerated if Primus server configuration is changed)
* All the game logic resides on the back-end, the front-end is only responsible for sending click events, drawing game state received from the server and displaying game UI
* There is no authentication but session cookies are used as identities and to persist user information such as their color between connections. The cookies only contain the sessionId, user information is stored on the back-end.
