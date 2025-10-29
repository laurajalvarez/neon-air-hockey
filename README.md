# Neon Air Hockey

Neon Air Hockey es un juego tipo air hockey para 2 jugadores locales, hecho en HTML5 Canvas sin librerías externas.  
Cada jugador controla su paleta y trata de anotar en la portería rival. El juego incluye física básica, detección de colisiones, animación con `requestAnimationFrame` y almacenamiento de récords con `localStorage`.

---

## Características principales

### Motor de juego en Canvas

Todo el juego se renderiza y actualiza dentro de un `<canvas>`:

- Mesa estilo arcade / neón.
- Dos jugadores (arriba y abajo).
- Disco (puck) con movimiento continuo.
- Marcador en tiempo real dibujado en el propio canvas.

### Modo 2 jugadores locales

- **Jugador 1 (parte inferior / azul)**  
  Controles: `W`, `A`, `S`, `D`
- **Jugador 2 (parte superior / rojo)**  
  Controles: Flechas del teclado (`↑`, `↓`, `←`, `→`)

Cada jugador está limitado a su mitad de la mesa.

### Física y colisiones

- Cada paleta tiene posición, velocidad e inercia (fricción).
- El disco rebota en paredes y puede anotar gol si entra por la portería rival.
- Cuando la paleta golpea el disco, la fuerza del tiro depende de la velocidad real de la paleta en ese momento.  
  Esto simula “impulso”: si te mueves rápido contra el disco, el disparo es más fuerte.

### Goles y victoria

- Hay una portería abierta en la parte superior (para anotar al jugador rojo) y otra en la parte inferior (para anotar al jugador azul).
- Al entrar el disco en la portería, se suma un punto.
- Gana el primer jugador que llegue a 5 puntos.
- Cuando alguien gana, aparece una pantalla final (“Jugador X gana”) sobre el canvas.

### Persistencia con `localStorage`

Se guarda información localmente en el navegador:

- Mayor diferencia de victoria alcanzada históricamente.
- Último ganador.

Esto permite que aunque recargues la página, el juego recuerde quién ha sido el “mejor” hasta ahora.

---

## Tecnologías utilizadas

- **HTML5**  
  Estructura general de la página y el `<canvas>` donde corre el juego.

- **CSS**  
  Estilo visual estilo arcade / neón y layout responsive básico (panel de menú + panel de juego).

- **JavaScript**
  - Bucle de animación con `requestAnimationFrame`.
  - Simulación de movimiento con velocidad, fricción e inercia.
  - Detección de colisiones circular (paleta vs disco).
  - Control por teclado con `addEventListener("keydown"/"keyup")`.
  - Persistencia con `localStorage`.

No hay frameworks ni motores externos. Todo está programado “a mano”.

---

## Estructura de archivos

```text
.
├─ index.html      # Estructura principal de la página (menú, canvas, overlay de ganador)
├─ style.css       # Estilos visuales neon / layout / responsive
└─ juego.js        # Lógica del juego (movimiento, colisiones, marcador, localStorage)

```

## Cómo ejecutar el juego

**1.** Descarga/clona este repositorio.

**2.** Asegúrate de que los archivos index.html, style.css y juego.js estén en la misma carpeta.

**3.** Haz doble clic en index.html.

**4.** Tu navegador (Chrome, Firefox, Edge…) va a abrir el juego.
