"use strict";

/*
   Please familiarize with test tasks below before you start. This JS file is the only place you need to edit to finish all of them. To help you with completing all these tasks we placed "TODO" comments in appropriate places, pointing to certain task by a number. Have fun!

   TEST TASKS SUMMARY:

1. Fix game character movement physics:
    1.1. Game character shouldn't be able to go out of the game frame.
    1.2. Game character should be able to move left-right via pressing "left/right" arrow keys on the keyboard.

2. Rework shooting mechanism (available via pressing Shift key):
    2.1. Make initial speed for each shooting different (within reasonable limits)
    2.2. Add some gravitation influence for fired projectile. Direct flying is too boring :)

3. Define enemy behavior:
    3.1. Enemy should move automatically left-right inside the game frame.
    3.2. Periodically the enemy should shoot towards direction of his movement.

4. Change conditions for victory:
    4.1. Demo condition is already implemented (shoot left side of game field to win). It should be replaced by another condition: enemy should be killed.

5. Implement conditions of death of game character and enemy:
    5.1. Player should death on intersection with any fired projectile.
    5.2. Emeny also should death on the same intersection with any fired projectile.
    
    P.S.: You can also copy all of these files into your preferred local IDE for convenient debugging and then paste updated JS file back into JSFiddle to share it with us! If you prefer this approach - don't forget to link the CSS file and the JS file via HTML file in your local project.
 */

window.GAME = (() => {
  const KeyCodes = {
    ESCAPE: 27,
    SPACE: 32,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
  };

  const GameFrame = {
    WIDTH: 500,
    HEIGHT: 250,
  };

  const GameObjectType = {
    PLAYER: 0,
    FIREBALL: 1,
    ENEMY: 2,
  };

  const ObjectState = {
    ACTIVE: 0,
    DISPOSED: 1,
  };

  const MovementDirection = {
    EMPTY: 0,
    LEFT: 1,
    RIGHT: 2,
    UP: 4,
    DOWN: 8,
  };

  const GameStatus = {
    CONTINUE: 0,
    WIN: 1,
    FAIL: 2,
    PAUSE: 3,
    INTRO: 4,
  };

  const GameConst = {
    Fireball: {
      size: 30,
      gravity: 0.3,
      getSpeed: (isLeftDirection) =>
        isLeftDirection
          ? Math.floor(Math.random() * 5 + 3)
          : Math.floor(Math.random() * 10 + 1), // TODO [TASK 2.1]
    },
    Player: {
      speed: 2,
      width: 150,
      getHeight: (width) => width,
      getX: (width) => width / 3,
      getY: (height) => height - 140,
    },
    Enemy: {
      speed: 1,
      width: 100,
      height: 82,
      getX: (width) => (width * 2) / 3,
      getY: (height) => height - 82,
    },
  };

  const FLIPPED = "-reversed";

  const GameSpritesData = {
    [GameObjectType.PLAYER]: {
      width: 150,
      height: 150,
      url: "https://interns.room4.team/test-task-v1/player.png",
    },
    [GameObjectType.PLAYER + FLIPPED]: {
      width: 120,
      height: 120,
      url: "https://interns.room4.team/test-task-v1/player-reversed.png",
    },
    [GameObjectType.FIREBALL]: {
      width: 28,
      height: 14,
      url: "https://interns.room4.team/test-task-v1/comet.png",
    },
    [GameObjectType.ENEMY]: {
      width: 78,
      height: 82,
      url: "https://interns.room4.team/test-task-v1/enemy.png",
    },
    [GameObjectType.ENEMY + FLIPPED]: {
      width: 78,
      height: 82,
      url: "https://interns.room4.team/test-task-v1/enemy-reversed.png",
    },
  };

  const GAME_MESSAGES = {
    [GameStatus.WIN]: "You win!\nYeah!",
    [GameStatus.FAIL]: "You loose!",
    [GameStatus.PAUSE]: "Game paused!\nPress Space to continue",
    [GameStatus.INTRO]: "Welcome!\nPress Space to start the game",
  };

  /** @abstract */
  class AbstractGameObject {
    constructor({ height, width, direction, speed, x, y, angle = 0 }) {
      this.direction = direction;
      this.height = height;
      this.speed = speed;
      this.width = width;
      this.x = x;
      this.y = y;
      this.angle = angle;

      this.state = ObjectState.ACTIVE;
      this.sprite = null;
      this.type = null;
    }

    _checkDirection(direction) {
      return this.direction & direction;
    }

    _setDirection(newDirection) {
      if (newDirection === MovementDirection.EMPTY) {
        this.direction = newDirection;
        return;
      }

      const directionAntagonistCodes = { 1: 2, 2: 1, 4: 8, 8: 4 };

      this.direction = this.direction & ~directionAntagonistCodes[newDirection];
      this.direction = this.direction | newDirection;
    }

    /** @abstract */
    behave(gameState, timeFrame) {
      throw new Error("Method is not implemented");
    }
  }

  /** @abstract */
  class FireballsThrowerObject extends AbstractGameObject {
    _throwFireball(gameState) {
      const fireballWidth = GameConst.Fireball.size * 2;
      const fireballHeight = GameConst.Fireball.size;

      const fireballX = this._checkDirection(MovementDirection.RIGHT)
        ? this.x + this.width - fireballWidth / 2
        : this.x - GameConst.Fireball.size - fireballWidth / 2;

      const fireballY = this.y + this.height / 2;

      const fireballObj = new FireballObject({
        direction: this.direction,
        speed: GameConst.Fireball.getSpeed(
          this._checkDirection(MovementDirection.LEFT)
        ),
        width: fireballWidth,
        height: fireballHeight,
        x: fireballX,
        y: fireballY,
        angle: -20,
      });

      gameState.objects.push(fireballObj);
    }
  }

  class PlayerObject extends FireballsThrowerObject {
    constructor(args) {
      super(args);
      this.type = GameObjectType.PLAYER;
      this.sprite = GameSpritesData[GameObjectType.PLAYER];
    }

    /**
     * @param {Object} gameState
     * @param {number} timeframe
     */
    behave(gameState, timeframe) {
      // TODO [TASK 1.1]
      if (gameState.keysPressed.UP && this.y > 0) {
        this._setDirection(MovementDirection.UP);
        this.y -= this.speed * timeframe * 2;
      }

      if (!gameState.keysPressed.UP) {
        if (this.y < GameFrame.HEIGHT - this.height + 15) {
          this._setDirection(MovementDirection.DOWN);
          this.y += (this.speed * timeframe) / 3;
        }
      }

      // TODO [TASK 1.4]

      if (this.y < 0) {
        this.y = 0;
      }

      // TODO [TASK 1.2]
      if (gameState.keysPressed.LEFT && this.x > 0) {
        this._setDirection(MovementDirection.LEFT);
        this.x -= this.speed * timeframe * 2;
        if (this.x < 0) {
          this.x = 0;
        }
      }
      if (
        gameState.keysPressed.RIGHT &&
        this.x <= GameFrame.WIDTH - GameConst.Player.width
      ) {
        this._setDirection(MovementDirection.RIGHT);
        this.x += this.speed * timeframe * 2;
      }

      if (gameState.keysPressed.SHIFT) {
        gameState.keysPressed.SHIFT = false;
        this._throwFireball(gameState);
      }
    }
  }

  class EnemyObject extends FireballsThrowerObject {
    constructor(args) {
      super(args);
      this.type = GameObjectType.ENEMY;
      this.sprite = GameSpritesData[GameObjectType.ENEMY];
    }

    /**
     * @param {Object} gameState
     * @param {number} timeframe
     */
    behave(gameState, timeframe) {
      // TODO [TASK 3.1]
      if (this.direction === MovementDirection.LEFT) {
        this.x -= this.speed * timeframe;
      }
      if (this.direction === MovementDirection.RIGHT) {
        this.x += this.speed * timeframe;
      }

      if (this.x <= 0) {
        this._setDirection(MovementDirection.RIGHT);
      }
      if (this.x >= GameFrame.WIDTH - GameConst.Enemy.width) {
        this._setDirection(MovementDirection.LEFT);
      }

      // TODO [TASK 3.2]
      const shouldThrowFireball = Math.random() > 0.994;
      if (shouldThrowFireball) {
        console.log("FIRE!");
        this._throwFireball(gameState);
      }
      // TODO [TASK 5.2]
    }
  }

  class FireballObject extends AbstractGameObject {
    constructor(args) {
      super(args);
      this.type = GameObjectType.FIREBALL;
      this.sprite = GameSpritesData[GameObjectType.FIREBALL];
    }

    /**
     * TODO [TASK 2.2]
     * @param {Object} gameState
     * @param {number} timeframe
     */
    behave(gameState, timeframe) {
      if (this._checkDirection(MovementDirection.LEFT)) {
        this.x -= this.speed * timeframe;
      }

      if (this._checkDirection(MovementDirection.RIGHT)) {
        this.x += this.speed * timeframe;
      }

      this.y += GameConst.Fireball.gravity * timeframe;

      if (this.x < 0 || this.x > GameFrame.WIDTH || this.y > GameFrame.HEIGHT) {
        this.state = ObjectState.DISPOSED;
      }
    }
  }

  const GAME_RULES = [
    /**
     * Player dies - game over.
     * @param {Object} gameState
     * @return {GameStatus}
     */
    (gameState) => {
      // TODO [TASK 5.1]
      const player = gameState.objects.filter(
        (object) => object.type === GameObjectType.PLAYER
      )[0];
      const activeFireballs = gameState.objects.filter(
        (object) => object.type === GameObjectType.FIREBALL
      );

      const isPlayerHited = activeFireballs.filter((fireball) => {
        return (
          fireball.x > player.x + 30 &&
          fireball.x < player.x + player.width - 30 &&
          fireball.y > player.y + 2 &&
          fireball.y < player.y + player.height - 2
        );
      })[0];

      if (isPlayerHited) {
        player.state = ObjectState.DISPOSED;
      }

      return player.state === ObjectState.DISPOSED
        ? GameStatus.FAIL
        : GameStatus.CONTINUE;
    },

    /**
     * Pressed ESC button can pause/resume the game
     * @param {Object} gameState
     * @return {GameStatus}
     */
    (gameState) => {
      return gameState.keysPressed.ESC ? GameStatus.PAUSE : GameStatus.CONTINUE;
    },

    /**
     * TODO [TASK 4.1]
     * Demo condition: game round considering as won if thrown fireball shoot the left side of game area
     * @param {Object} gameState
     * @return {GameStatus}
     */
    (gameState) => {
      const activeFireballs = gameState.objects.filter(
        (object) => object.type === GameObjectType.FIREBALL
      );
      const enemy = gameState.objects.filter(
        (object) => object.type === GameObjectType.ENEMY
      )[0];

      const isEnemyHited = activeFireballs.filter((fireball) => {
        return (
          fireball.x > enemy.x + 30 &&
          fireball.x < enemy.x + enemy.width - 30 &&
          fireball.y > enemy.y + 2 &&
          fireball.y < enemy.y + enemy.height - 2
        );
      })[0];

      if (isEnemyHited) {
        enemy.state = ObjectState.DISPOSED;
      }

      return enemy.state === ObjectState.DISPOSED
        ? GameStatus.WIN
        : GameStatus.CONTINUE;
    },
  ];

  const onLevelInitialized = (gameState) => {
    const playerObj = new PlayerObject({
      direction: MovementDirection.RIGHT,
      height: GameConst.Player.getHeight(GameConst.Player.width),
      speed: GameConst.Player.speed,
      width: GameConst.Player.width,
      x: GameConst.Player.getX(GameFrame.WIDTH),
      y: GameConst.Player.getY(GameFrame.HEIGHT),
    });

    const enemyObj = new EnemyObject({
      direction: MovementDirection.LEFT,
      height: GameConst.Enemy.height,
      speed: GameConst.Enemy.speed,
      width: GameConst.Enemy.width,
      x: GameConst.Enemy.getX(GameFrame.WIDTH),
      y: GameConst.Enemy.getY(GameFrame.HEIGHT),
    });

    gameState.objects.push(playerObj);
    gameState.objects.push(enemyObj);
  };

  class Game {
    /**
     * @param {Element} container
     * @param {Function[]} rules
     * @param {Function | null} onLevelInitializedCallback
     * @constructor
     */
    constructor(container, rules, onLevelInitializedCallback = null) {
      this.container = container;
      this.rules = rules;
      this.onLevelInitialized = onLevelInitializedCallback;

      this._prepareRenderingContext();

      this._onKeyDown = this._onKeyDown.bind(this);
      this._onKeyUp = this._onKeyUp.bind(this);
      this._pauseListener = this._pauseListener.bind(this);

      this.setDeactivated(false);
    }

    _prepareRenderingContext() {
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.container.clientWidth;
      this.canvas.height = this.container.clientHeight;
      this.container.appendChild(this.canvas);

      this.ctx = this.canvas.getContext("2d");
    }

    /** @param {boolean} deactivated */
    setDeactivated(deactivated) {
      if (this._deactivated === deactivated) {
        return;
      }

      this._deactivated = deactivated;

      if (deactivated) {
        this._removeGameListeners();
      } else {
        this._initializeGameListeners();
      }
    }

    /**
     * @return {Object}
     */
    getInitialState() {
      return {
        currentStatus: GameStatus.CONTINUE,
        objectsToDispose: [], // deleted objects since the last game tick
        lastUpdated: null,
        keysPressed: {
          ESC: false,
          SPACE: false,
          LEFT: false,
          RIGHT: false,
          UP: false,
          DOWN: false,
        },
        gameStartedAt: null,
        objects: [],
        startTime: null,
      };
    }

    /**
     * @param {boolean} restart
     */
    initializeLevelAndStart(restart = true) {
      if (restart || !this.state) {
        this._mediaIsPreloaded = false;
        this.state = this.getInitialState();

        if (this.onLevelInitialized) {
          this.onLevelInitialized(this.state);
        }
      } else {
        this.state.currentStatus = GameStatus.CONTINUE;
      }

      this.state.gameStartedAt = Date.now();
      if (!this.state.startTime) {
        this.state.startTime = this.state.gameStartedAt;
      }

      this._preloadImagesForLevel().then(() => {
        this.render();
        this._initializeGameListeners();
        this.processGameCycle();
      });
    }

    /**
     * @param {GameStatus=} verdict
     */
    pauseLevel(verdict) {
      if (verdict) {
        this.state.currentStatus = verdict;
      }

      this.state.keysPressed.ESC = false;
      this.state.lastUpdated = null;

      this._removeGameListeners();
      window.addEventListener("keydown", this._pauseListener);

      this._drawPauseScreen();
    }

    /**
     * @param {KeyboardEvent} evt
     * @private
     */
    _pauseListener(evt) {
      if (evt.keyCode === KeyCodes.SPACE && !this._deactivated) {
        evt.preventDefault();

        const isRestart = [GameStatus.WIN, GameStatus.FAIL].includes(
          this.state.currentStatus
        );
        this.initializeLevelAndStart(isRestart);

        window.removeEventListener("keydown", this._pauseListener);
      }
    }

    _drawPauseScreen() {
      this._drawMessage(GAME_MESSAGES[this.state.currentStatus]);
    }

    _drawMessage(message) {
      const ctx = this.ctx;

      const drawCloud = (x, y, width, heigth) => {
        const offset = 2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + offset, y + heigth / 2);
        ctx.lineTo(x, y + heigth);
        ctx.lineTo(x + width / 2, y + heigth - offset);
        ctx.lineTo(x + width, y + heigth);
        ctx.lineTo(x + width - offset, y + heigth / 2);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width / 2, y + offset);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();
        ctx.fill();
      };

      ctx.fillStyle = "rgba(256, 256, 256, .3)";
      drawCloud(195, 85, 220, 100);

      ctx.fillStyle = "rgba(256, 256, 256, 0.8)";
      drawCloud(190, 80, 220, 100);

      ctx.fillStyle = "#000";
      ctx.font = "16px PT Mono";
      message
        .split("\n")
        .forEach((line, i) => ctx.fillText(line, 210, 130 + 20 * i));
    }

    /**
     * @param {Object} spriteObj
     * @return {Promise<void>}
     * @private
     */
    _loadSpriteObject(spriteObj) {
      return new Promise((resolve) => {
        const image = new Image(spriteObj.width, spriteObj.height);
        image.src = spriteObj.url;
        image.onload = () => {
          spriteObj.image = image;
          resolve();
        };
      });
    }

    /** @private */
    async _preloadImagesForLevel() {
      if (this._mediaIsPreloaded) {
        return;
      }

      const keys = Object.keys(GameSpritesData);
      await Promise.all(
        keys.map((GameSpritesDataKey) =>
          this._loadSpriteObject(GameSpritesData[GameSpritesDataKey])
        )
      );
      this._mediaIsPreloaded = true;
    }

    /**
     * @param {number} delta - time elapsed since the previous game tick
     */
    processGameObjects(delta) {
      this.state.objectsToDispose = [];
      this.state.objects.forEach((object) => object.behave(this.state, delta));
      this.state.objectsToDispose = this.state.objects.filter(
        (object) => object.state === ObjectState.DISPOSED
      );
      this.state.objects = this.state.objects.filter(
        (object) => !this.state.objectsToDispose.includes(object)
      );
    }

    checkStatus() {
      if (this.state.currentStatus !== GameStatus.CONTINUE) {
        return;
      }

      let currentCheck = GameStatus.CONTINUE;
      let ruleIdx = 0;

      while (
        ruleIdx < this.rules.length &&
        currentCheck === GameStatus.CONTINUE
      ) {
        currentCheck = this.rules[ruleIdx](this.state);
        ruleIdx++;
      }

      this.state.currentStatus = currentCheck;
    }

    /**
     * @param {GameStatus} status
     */
    setGameStatus(status) {
      if (this.state.currentStatus !== status) {
        this.state.currentStatus = status;
      }
    }

    render() {
      this.ctx.clearRect(0, 0, GameFrame.WIDTH, GameFrame.HEIGHT);

      this.state.objects.forEach((object) => {
        if (!object.sprite) {
          return;
        }

        const isFlipped = object.direction & MovementDirection.LEFT;
        const sprite =
          GameSpritesData[object.type + (isFlipped ? FLIPPED : "")] ||
          GameSpritesData[object.type];

        this.ctx.save();
        this.ctx.translate(object.x, object.y);
        this.ctx.rotate((object.angle * Math.PI) / 180);
        this.ctx.drawImage(sprite.image, 0, 0, object.width, object.height);
        this.ctx.restore();
      });
    }

    processGameCycle() {
      const now = Date.now();

      if (!this.state.lastUpdated) {
        this.state.lastUpdated = now;
      }

      const delta = (now - this.state.lastUpdated) / 10;
      this.processGameObjects(delta);
      this.checkStatus();

      switch (this.state.currentStatus) {
        case GameStatus.CONTINUE:
          this.state.lastUpdated = now;
          this.render();
          requestAnimationFrame(() => this.processGameCycle());
          break;

        case GameStatus.WIN:
        case GameStatus.FAIL:
        case GameStatus.PAUSE:
        case GameStatus.INTRO:
          this.pauseLevel();
          break;
      }
    }

    /**
     * @param evt {KeyboardEvent} evt
     * @param stateModifierVal {boolean}
     * @private
     */
    _updateKeyState(evt, stateModifierVal) {
      const keysMap = {
        [KeyCodes.ARROW_LEFT]: "LEFT",
        [KeyCodes.ARROW_RIGHT]: "RIGHT",
        [KeyCodes.ARROW_UP]: "UP",
        [KeyCodes.ARROW_DOWN]: "DOWN",
        [KeyCodes.ESCAPE]: "ESC",
        [KeyCodes.SPACE]: "SPACE",
      };

      if (keysMap.hasOwnProperty(evt.keyCode)) {
        this.state.keysPressed[keysMap[evt.keyCode]] = stateModifierVal;
      }

      if (evt.shiftKey) {
        this.state.keysPressed.SHIFT = stateModifierVal;
      }
    }

    /**
     * @param {KeyboardEvent} evt
     * @private
     */
    _onKeyDown(evt) {
      this._updateKeyState(evt, true);
    }

    /**
     * @param {KeyboardEvent} evt
     * @private
     */
    _onKeyUp(evt) {
      this._updateKeyState(evt, false);
    }

    /** @private */
    _initializeGameListeners() {
      window.addEventListener("keydown", this._onKeyDown);
      window.addEventListener("keyup", this._onKeyUp);
    }

    /** @private */
    _removeGameListeners() {
      window.removeEventListener("keydown", this._onKeyDown);
      window.removeEventListener("keyup", this._onKeyUp);
    }
  }

  const game = new Game(
    document.querySelector("#game-area"),
    GAME_RULES,
    onLevelInitialized
  );

  window.restartGame = () => {
    game.initializeLevelAndStart();
    game.setGameStatus(GameStatus.INTRO);
  };

  window.restartGame();

  return game;
})();
