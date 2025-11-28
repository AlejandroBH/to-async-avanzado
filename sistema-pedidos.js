const URL_LIST = [
  "https://urlmalaquenoexiste.cl",
  "https://holanoexisto.com",
  "https://google.cl",
  "https://instagram.com",
  "https://www.youtube.com",
  "https://www.wikipedia.org",
  "https://paginaquenoexiste.info",
  "https://www.reddit.com",
];

// Implementa función para obtener información de la web {titulo, url}
async function obtenerInformacionWeb(url) {
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error(
      `Fallo en la respuesta HTTP: ${respuesta.status} ${respuesta.statusText} para ${url}`
    );
  }

  const html = await respuesta.text();

  const regexTitle = /<title[^>]*>(.*?)<\/title>/i;
  const match = html.match(regexTitle);

  if (!match || !match[1]) {
    throw new Error(`No se pudo encontrar el tag <title> en el HTML de ${url}`);
  }

  let titulo = match[1].trim();

  return {
    titulo: titulo,
    url: url,
  };
}

// Implementa función para obtener información de la web {titulo, url} con reintentos
async function obtenerInformacionWebConReintentos(
  url,
  intentos = 3,
  delay = 1000
) {
  let ultimoError = null;

  for (let intento = 1; intento <= intentos; intento++) {
    try {
      console.log(`[${url}] Intento ${intento}/${intentos}...`);
      const resultado = await obtenerInformacionWeb(url);
      console.log(`[${url}] Éxito en el intento ${intento}.`);

      return resultado;
    } catch (error) {
      ultimoError = error;
      console.warn(`[${url}] Falló el intento ${intento}: ${error.message}`);

      if (intento < intentos) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Fallo definitivo para ${url} después de ${intentos} intentos. Último error: ${ultimoError.message}`
  );
}

// Implementa función de rate limiting
function rateLimit(concurrency) {
  const pending = [];
  let running = 0;

  const run = async (fn) => {
    running++;
    try {
      return await fn();
    } finally {
      running--;
      if (pending.length > 0) {
        pending.shift()(); // Ejecuta la siguiente tarea en cola
      }
    }
  };

  return (fn) =>
    new Promise((resolve, reject) => {
      const task = () => run(fn).then(resolve, reject);

      if (running < concurrency) {
        task();
      } else {
        pending.push(task);
      }
    });
}

// Implementa función para procesar múltiples urls
async function procesarMultiplesUrls(concurrenciaMaxima = 3) {
  const inicioTiempo = Date.now();
  console.log(
    `\n🚀 Iniciando procesamiento con concurrencia máxima de ${concurrenciaMaxima}...`
  );

  const limitPromise = rateLimit(concurrenciaMaxima);

  // Mapear URLs a tareas con limitación de concurrencia
  const tareasLimitadas = URL_LIST.map((url) =>
    limitPromise(() => obtenerInformacionWebConReintentos(url, 3, 2000))
  );

  const resultados = await Promise.allSettled(tareasLimitadas);

  // Calcula tiempo de ejecución
  const finTiempo = Date.now();
  const tiempoTotalMs = finTiempo - inicioTiempo;

  // Procesar resultados para el reporte
  const exitosos = resultados
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  const fallidos = resultados
    .filter((r) => r.status === "rejected")
    .map((r) => ({ error: r.reason.message }));

  // Generar Reporte
  const reporte = {
    totalPeticiones: URL_LIST.length,
    concurrenciaMaxima: concurrenciaMaxima,
    tiempoTotalMs: tiempoTotalMs,
    tiempoTotalS: (tiempoTotalMs / 1000).toFixed(2),
    exitosos: exitosos.length,
    fallidos: fallidos.length,
    detalleExitosos: exitosos,
    detalleFallidos: fallidos,
  };

  return reporte;
}

// Ejecucion del programa
procesarMultiplesUrls(3).then((reporte) => {
  console.log("\n🗒️  REPORTE DE RENDIMIENTO DETALLADO");
  console.table([
    { Métrica: "Total de Peticiones", Valor: reporte.totalPeticiones },
    {
      Métrica: "Concurrencia Máxima (Rate Limit)",
      Valor: reporte.concurrenciaMaxima,
    },
    { Métrica: "Peticiones Exitosas", Valor: reporte.exitosos },
    { Métrica: "Peticiones Fallidas", Valor: reporte.fallidos },
    { Métrica: "Tiempo Total de Ejecución (ms)", Valor: reporte.tiempoTotalMs },
    { Métrica: "Tiempo Total de Ejecución (s)", Valor: reporte.tiempoTotalS },
  ]);

  // Muestra el detalle de los éxitos
  console.log("\nDetalle de Éxitos:");
  console.table(reporte.detalleExitosos);

  // Muestra el detalle de los fallos
  if (reporte.detalleFallidos.length > 0) {
    console.log("\nDetalle de Fallos:");
    console.table(reporte.detalleFallidos);
  }
});
