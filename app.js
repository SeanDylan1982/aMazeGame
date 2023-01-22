const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 20;
const cellsVertical = 15;
const height = window.innerHeight;
const width = window.innerWidth;
const wallWidth = 2;
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height
  }
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, wallWidth, {
    isStatic: true,
  }),
  Bodies.rectangle(width / 2, height, width, wallWidth, {
    isStatic: true,
  }),
  Bodies.rectangle(0, height / 2, wallWidth, height, {
    isStatic: true,
  }),
  Bodies.rectangle(width, height / 2, wallWidth, height, {
    isStatic: true,
  })
]
World.add(world, walls)

// Maze generation
const shuffle = (arr) => {
  let counter = arr.length;
  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index]= temp;
  }
  return arr;
}

const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal)
  .fill(false));
const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal -1)
  .fill(false));
const horizontals = Array(cellsVertical -1)
.fill(null)
.map(() => Array(cellsHorizontal)
.fill(false));

// Starting point
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row,column) => {
  // if we've already visited this cell, return
  if (grid[row][column]) {
    return;
  }
  // mark cell as visited(true)
  grid[row][column] = true;
  // assemble randomly ordered list of neighbours
  const neighbours = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left']
  ]);
  // forEach neighbour
  for (let neighbour of neighbours) {
    const [nextRow,nextColumn,direction] = neighbour;
  // check if neighbour is out of bounds
    if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
      continue;
    }
  // check if we have visited that neighbour, continue to next neighbour
    if (grid[nextRow][nextColumn]) {
      continue;
    }
  // remove a wall from either verticals or horizontals array
    if (direction === "left") {
      verticals[row][column - 1] = true;
    } else if (direction === 'right') {
      verticals[row][column] = true;
    } else if (direction === "up") {
      horizontals[row - 1][column] = true;
    } else if (direction === 'down') {
      horizontals[row][column] = true;
    }
    // visit next cell
    stepThroughCell(nextRow, nextColumn);
  }
}
stepThroughCell(startRow,startColumn);

horizontals.forEach((row,rowIndex) => {
  row.forEach((open,columnIndex) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      wallWidth,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: "lime"
        },
      }
    );
    World.add(world,wall)
  });
});

verticals.forEach((row,rowIndex) => {
  row.forEach((open,columnIndex) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      wallWidth,
      unitLengthY,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: "lime"
        },
      }
    );
    World.add(world,wall)
  });
});

// goal
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    label: 'goal',
    isStatic: true,
    render: {
      fillStyle: "aqua"
    },
  }
);
World.add(world,goal);

// ball
const ballRadius = Math.min(unitLengthX,unitLengthY) / 4;
const ball = Bodies.circle(
  unitLengthX / 2,
  unitLengthY / 2,
  ballRadius,
  {
    label: 'ball',
    isStatic: false,
    render: {
      fillStyle: "red"
    },
  }
);
World.add(world,ball);

document.addEventListener("keydown", e => {
  const {x,y} = ball.velocity;
  
  if (e.code === 'KeyW' || e.code === "ArrowUp") {
    Body.setVelocity(ball, { x, y: - 5 });
  }
  if (e.code === 'KeyS' || e.code === "ArrowDown") {
    Body.setVelocity(ball, { x, y: + 5 });
  }
  if (e.code === 'KeyA' || e.code === "ArrowLeft") {
    Body.setVelocity(ball, { x: x - 5, y });
  }
  if (e.code === 'KeyD' || e.code === "ArrowRight") {
    Body.setVelocity(ball, { x: x + 5, y });
  }

})

// win conditions
Events.on(engine, 'collisionStart', event => {
  event.pairs.forEach((collision) => {
    const labels = ['ball', 'goal'];
    if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
      document.querySelector('.winner').classList.remove("hidden");
      world.gravity.y = 1;
      world.bodies.forEach(body => {
        if (body.label === 'wall') {
          Body.setStatic(body,false);
        }
      })
    }
  })
})