const panelMenu = document.getElementById("panelMenu");
const valorRecord = document.getElementById("valorRecord");
const valorUltimoGanador = document.getElementById("valorUltimoGanador");

const lienzo = document.getElementById("lienzoJuego");
const ctx = lienzo ? lienzo.getContext("2d") : null;

const capaFinal = document.getElementById("capaFinal");
const textoGanador = document.getElementById("textoGanador");

const botonVolverMenu = document.getElementById("botonVolverMenu");

// CONFIGURACIONES BÁSICAS DEL JUEGO

let estadoJuego = "menu"; // "menu" | "jugando" | "finalizado"

// Marcadores
let marcadorJ1 = 0;
let marcadorJ2 = 0;

// Puntos necesarios para ganar
const PUNTOS_PARA_GANAR = 5;

// Dimensiones del lienzo solo si hay lienzo
// Si estamos en menu.html, lienzo es null y no definimos ANCHO/ALTO
let ANCHO = 0;
let ALTO = 0;
if (lienzo) {
  ANCHO = lienzo.width;
  ALTO = lienzo.height;
}

// Tamaño de la portería (la "apertura" donde sí entra gol)
const ANCHO_PORTERIA = 120;

// RECORDS EN LOCALSTORAGE

function cargarRecords() {
  const mejorDiferenciaLS = localStorage.getItem("mejorDiferencia");
  const ultimoGanadorLS = localStorage.getItem("ultimoGanadorNombre");

  if (valorRecord) {
    valorRecord.textContent = mejorDiferenciaLS
      ? `+${mejorDiferenciaLS}`
      : "+0";
  }

  if (valorUltimoGanador) {
    valorUltimoGanador.textContent = ultimoGanadorLS
      ? `Último ganador: ${ultimoGanadorLS}`
      : "Último ganador: -";
  }
}

function guardarRecords(nombreGanador, diferencia) {
  // diferencia = marcador ganador - marcador perdedor
  const mejorActual = parseInt(
    localStorage.getItem("mejorDiferencia") || "0",
    10
  );

  if (diferencia > mejorActual) {
    localStorage.setItem("mejorDiferencia", diferencia.toString());
  }

  localStorage.setItem("ultimoGanadorNombre", nombreGanador);
}

// OBJETOS DEL JUEGO

const jugador1 = {
  x: ANCHO / 2,
  y: ALTO - 80,
  radio: 20,
  color: "#4fa3ff", // azul
  vx: 0,
  vy: 0,
  velocidadMax: 4,
  friccion: 0.9,
};

const jugador2 = {
  x: ANCHO / 2,
  y: 80,
  radio: 20,
  color: "#ff3b3b", // rojo
  vx: 0,
  vy: 0,
  velocidadMax: 4,
  friccion: 0.9,
};

const disco = {
  x: ANCHO / 2,
  y: ALTO / 2,
  radio: 12,
  color: "#ffffff",
  vx: 0,
  vy: 0,
};

// TECLADO
// Jugador 1: W A S D
// Jugador 2: Flechas

const teclasPresionadas = {
  w: false,
  a: false,
  s: false,
  d: false,
  ArrowUp: false,
  ArrowLeft: false,
  ArrowDown: false,
  ArrowRight: false,
};

window.addEventListener("keydown", (evento) => {
  if (evento.key in teclasPresionadas) {
    teclasPresionadas[evento.key] = true;
    evento.preventDefault();
  }
});

window.addEventListener("keyup", (evento) => {
  if (evento.key in teclasPresionadas) {
    teclasPresionadas[evento.key] = false;
    evento.preventDefault();
  }
});

// ACTUALIZAR MOVIMIENTO DE UN JUGADOR

function actualizarJugador(jugador, esquemaControles, limitesY) {
  if (!lienzo) return; // si no hay canvas (estamos en menu.html), no hacemos nada

  const aceleracion = 0.6;

  // Acelerar según teclas
  if (teclasPresionadas[esquemaControles.arriba]) {
    jugador.vy -= aceleracion;
  }
  if (teclasPresionadas[esquemaControles.abajo]) {
    jugador.vy += aceleracion;
  }
  if (teclasPresionadas[esquemaControles.izquierda]) {
    jugador.vx -= aceleracion;
  }
  if (teclasPresionadas[esquemaControles.derecha]) {
    jugador.vx += aceleracion;
  }

  // Limitar la velocidad máxima del jugador
  const magnitudVel = Math.sqrt(
    jugador.vx * jugador.vx + jugador.vy * jugador.vy
  );
  if (magnitudVel > jugador.velocidadMax) {
    const escala = jugador.velocidadMax / magnitudVel;
    jugador.vx *= escala;
    jugador.vy *= escala;
  }

  // Actualizar posición con la velocidad actual
  jugador.x += jugador.vx;
  jugador.y += jugador.vy;

  // Aplicar fricción para que vaya frenando solo
  jugador.vx *= jugador.friccion;
  jugador.vy *= jugador.friccion;

  // Limitar en el eje X dentro del lienzo
  if (jugador.x - jugador.radio < 0) {
    jugador.x = jugador.radio;
    jugador.vx = 0;
  }
  if (jugador.x + jugador.radio > ANCHO) {
    jugador.x = ANCHO - jugador.radio;
    jugador.vx = 0;
  }

  // Limitar en el eje Y dentro de su mitad
  if (jugador.y - jugador.radio < limitesY.minY) {
    jugador.y = limitesY.minY + jugador.radio;
    jugador.vy = 0;
  }
  if (jugador.y + jugador.radio > limitesY.maxY) {
    jugador.y = limitesY.maxY - jugador.radio;
    jugador.vy = 0;
  }
}

// ACTUALIZAR DISCO

function actualizarDisco() {
  if (!lienzo) return;

  disco.x += disco.vx;
  disco.y += disco.vy;

  // Pequeña fricción global para que el disco desacelere
  disco.vx *= 0.995;
  disco.vy *= 0.995;

  // Rebote pared izquierda
  if (disco.x - disco.radio < 0) {
    disco.x = disco.radio;
    disco.vx *= -1;
  }

  // Rebote pared derecha
  if (disco.x + disco.radio > ANCHO) {
    disco.x = ANCHO - disco.radio;
    disco.vx *= -1;
  }

  // Zona superior (posible gol para Jugador 1)
  if (disco.y - disco.radio < 0) {
    const porteriaMinX = (ANCHO - ANCHO_PORTERIA) / 2;
    const porteriaMaxX = (ANCHO + ANCHO_PORTERIA) / 2;

    if (disco.x > porteriaMinX && disco.x < porteriaMaxX) {
      // Gol para Jugador 1 (abajo / azul)
      marcadorJ1++;
      revisarVictoria();
      reiniciarRonda();
      return;
    } else {
      // Rebote contra pared superior normal
      disco.y = disco.radio;
      disco.vy *= -1;
    }
  }

  // Zona inferior (posible gol para Jugador 2)
  if (disco.y + disco.radio > ALTO) {
    const porteriaMinX = (ANCHO - ANCHO_PORTERIA) / 2;
    const porteriaMaxX = (ANCHO + ANCHO_PORTERIA) / 2;

    if (disco.x > porteriaMinX && disco.x < porteriaMaxX) {
      // Gol para Jugador 2 (arriba / rojo)
      marcadorJ2++;
      revisarVictoria();
      reiniciarRonda();
      return;
    } else {
      // Rebote contra pared inferior normal
      disco.y = ALTO - disco.radio;
      disco.vy *= -1;
    }
  }
}

// COLISIÓN ENTRE JUGADOR Y DISCO
// La fuerza del tiro depende de la velocidad del jugador al momento del impacto.

function manejarColision(jugador) {
  if (!lienzo) return;

  const dx = disco.x - jugador.x;
  const dy = disco.y - jugador.y;
  const distancia = Math.sqrt(dx * dx + dy * dy);
  const distanciaMinima = disco.radio + jugador.radio;

  if (distancia < distanciaMinima) {
    // Dirección normalizada del impacto (de jugador hacia fuera)
    let nx = dx / distancia;
    let ny = dy / distancia;

    // Magnitud de velocidad del jugador en el instante del impacto
    const rapidezJugador = Math.sqrt(
      jugador.vx * jugador.vx + jugador.vy * jugador.vy
    );

    // Potencia base del golpe
    const potenciaBase = 3;
    const potenciaTotal = potenciaBase + rapidezJugador * 1.2;

    // Velocidad nueva del disco (sale disparado)
    disco.vx = nx * potenciaTotal;
    disco.vy = ny * potenciaTotal;

    // Reposicionar el disco un poco afuera de la paleta
    disco.x = jugador.x + nx * (distanciaMinima + 1);
    disco.y = jugador.y + ny * (distanciaMinima + 1);
  }
}

// REINICIAR RONDA DESPUÉS DE UN GOL

function reiniciarRonda() {
  if (!lienzo) return;

  // Recolocar jugadores
  jugador1.x = ANCHO / 2;
  jugador1.y = ALTO - 80;
  jugador1.vx = 0;
  jugador1.vy = 0;

  jugador2.x = ANCHO / 2;
  jugador2.y = 80;
  jugador2.vx = 0;
  jugador2.vy = 0;

  // Recolocar disco
  disco.x = ANCHO / 2;
  disco.y = ALTO / 2;
  disco.vx = 0;
  disco.vy = 0;
}

// VERIFICAR SI ALGUIEN YA GANÓ LA PARTIDA

function revisarVictoria() {
  if (!lienzo) return;

  if (marcadorJ1 >= PUNTOS_PARA_GANAR || marcadorJ2 >= PUNTOS_PARA_GANAR) {
    // Determinar ganador por marcador
    const ganador = marcadorJ1 > marcadorJ2 ? "Jugador 1" : "Jugador 2";

    // Calcular diferencia de victoria para guardarla
    const diferencia = Math.abs(marcadorJ1 - marcadorJ2);
    guardarRecords(ganador, diferencia);
    cargarRecords(); // para refrescar localStorage en caso de volver al menú

    // Mostrar pantalla final
    if (textoGanador) {
      textoGanador.textContent = `${ganador} Gana`;
    }
    if (capaFinal) {
      capaFinal.classList.remove("oculto");
    }

    estadoJuego = "finalizado";
  }
}

// DIBUJO DEL CAMPO Y JUGADORES

function dibujarCampo() {
  if (!ctx) return;

  ctx.save();

  // Bordes superior/inferior tipo neón
  ctx.shadowBlur = 20;

  // Banda superior roja
  ctx.shadowColor = "rgba(255,59,59,0.7)";
  ctx.strokeStyle = "rgba(255,59,59,0.9)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(20, 20);
  ctx.lineTo(ANCHO - 20, 20);
  ctx.stroke();

  // Banda inferior azul
  ctx.shadowColor = "rgba(79,163,255,0.7)";
  ctx.strokeStyle = "rgba(79,163,255,0.9)";
  ctx.beginPath();
  ctx.moveTo(20, ALTO - 20);
  ctx.lineTo(ANCHO - 20, ALTO - 20);
  ctx.stroke();

  // Línea media
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, ALTO / 2);
  ctx.lineTo(ANCHO, ALTO / 2);
  ctx.stroke();

  // Dibujar porterías
  const porteriaMinX = (ANCHO - ANCHO_PORTERIA) / 2;
  const porteriaMaxX = (ANCHO + ANCHO_PORTERIA) / 2;

  // Portería superior (roja)
  ctx.shadowColor = "rgba(255,59,59,0.6)";
  ctx.strokeStyle = "rgba(255,59,59,0.8)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.rect(porteriaMinX, 5, ANCHO_PORTERIA, 15);
  ctx.stroke();

  // Portería inferior (azul)
  ctx.shadowColor = "rgba(79,163,255,0.6)";
  ctx.strokeStyle = "rgba(79,163,255,0.8)";
  ctx.beginPath();
  ctx.rect(porteriaMinX, ALTO - 20, ANCHO_PORTERIA, 15);
  ctx.stroke();

  // Círculo central
  ctx.shadowColor = "rgba(255,255,255,0.15)";
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ANCHO / 2, ALTO / 2, 40, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function dibujarJugador(jugador) {
  if (!ctx) return;

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = jugador.color;
  ctx.fillStyle = jugador.color;
  ctx.beginPath();
  ctx.arc(jugador.x, jugador.y, jugador.radio, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dibujarDisco() {
  if (!ctx) return;

  ctx.save();
  ctx.shadowBlur = 15;
  ctx.shadowColor = "rgba(255,255,255,0.8)";
  ctx.fillStyle = disco.color;
  ctx.beginPath();
  ctx.arc(disco.x, disco.y, disco.radio, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Marcador dibujado dentro del canvas
function dibujarMarcadorCanvas() {
  if (!ctx) return;

  ctx.save();
  ctx.font = "20px monospace";
  ctx.textAlign = "right";

  // Marcador Jugador 2 arriba (rojo)
  ctx.fillStyle = "#ff3b3b";
  ctx.fillText(marcadorJ2.toString(), ANCHO - 20, ALTO / 2 - 10);

  // Marcador Jugador 1 abajo (azul)
  ctx.fillStyle = "#4fa3ff";
  ctx.fillText(marcadorJ1.toString(), ANCHO - 20, ALTO / 2 + 25);

  ctx.restore();
}

// BUCLE PRINCIPAL DE ANIMACIÓN

function bucleJuego() {
  if (!ctx) return;

  if (estadoJuego === "jugando") {
    // Actualizar jugadores
    actualizarJugador(
      jugador2,
      {
        arriba: "ArrowUp",
        abajo: "ArrowDown",
        izquierda: "ArrowLeft",
        derecha: "ArrowRight",
      },
      { minY: 0, maxY: ALTO / 2 }
    );

    actualizarJugador(
      jugador1,
      { arriba: "w", abajo: "s", izquierda: "a", derecha: "d" },
      { minY: ALTO / 2, maxY: ALTO }
    );

    // Actualizar disco y colisiones
    actualizarDisco();
    manejarColision(jugador1);
    manejarColision(jugador2);
  }

  // Redibujar frame
  ctx.clearRect(0, 0, ANCHO, ALTO);
  dibujarCampo();
  dibujarDisco();
  dibujarJugador(jugador1);
  dibujarJugador(jugador2);
  dibujarMarcadorCanvas();

  requestAnimationFrame(bucleJuego);
}

// INICIO / FLUJO SEGÚN PANTALLA

function iniciarPartida() {
  if (!lienzo) return; // en menu.html no hay partida

  marcadorJ1 = 0;
  marcadorJ2 = 0;
  reiniciarRonda();

  // ocultar capa final si estaba visible
  if (capaFinal) {
    capaFinal.classList.add("oculto");
  }

  estadoJuego = "jugando";
}

// ARRANQUE AUTOMÁTICO

if (panelMenu && !lienzo) {
  cargarRecords();
}

if (lienzo && ctx) {
  cargarRecords();
  iniciarPartida();
  requestAnimationFrame(bucleJuego);
}
