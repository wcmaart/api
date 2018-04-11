export default () => {
  <html>
    <head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.6.0/p5.js"></script>
      <script src="http://localhost:3000/socket.io/socket.io.js"></script>
      <script>
          let animals, client, lastTime

          function setAnimal(animal) {
              let a = {
                  name: animal.name.word,
                  species: animal.species.word,
                  mx: animal.x.value,
                  my: animal.y.value,
                  x: animal.x.value * window.width,
                  y: animal.y.value * window.height,
              }
              animals.set(a.name, a)

              setTimeout(() => {
                  client.retract(`${a.name} is a ${a.species} animal at (${a.mx}, ${a.my})`)
              }, 100)
          }

          function setup() {
              animals = new Map()
              client = new window.room(`http://localhost:3000`)
              lastTime = millis()
              client.facts().then(console.dir)

              createCanvas(window.innerWidth, window.innerHeight)

              client.select('$name is a $species animal at ($x, $y)')
                .then(wut => { console.dir(wut); return wut })
                .then(({solutions}) => solutions.forEach(setAnimal))

              client.subscribe('$name is a $species animal at ($x, $y)', ({assertions}) => {
                  if (assertions.length) {
                    assertions.forEach(setAnimal)
                  }
              })
          }

          function draw() {
              background(255)
              animals.forEach(({x, y}, name) => {
                  ellipse(x, y, 60, 60)
                  text(name, x, y)
              })
          }

          function mouseMoved() {
              if (millis() - lastTime < 16) return

              const mx = mouseX/window.innerWidth
              const my = mouseY/window.innerHeight
              client.assert(`mouse is a robot animal at (${mx}, ${my})`)
              lastTime = millis()
          }
      </script>
    </head>
    <body>
    </body>
  </html>
}
