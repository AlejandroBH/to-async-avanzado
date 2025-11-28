const URL_LIST = [
  "https://urlmalaquenoexiste.cl",
  "https://google.cl",
  "https://instagram.com",
];

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
    `Fallo definitivo para ${url} después de ${intentos} intentos. Último error: ${lastError.message}`
  );
}

async function procesarMultiplesAPIs() {
  const llamadasAPI = [];

  URL_LIST.forEach((url) => {
    llamadasAPI.push(obtenerInformacionWebConReintentos(url, 3, 2000));
  });

  const resultados = await Promise.allSettled(llamadasAPI);

  const exitosos = resultados
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  const fallidos = resultados
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason.message);

  console.log(`${exitosos.length} APIs respondieron correctamente`);
  console.log(`${fallidos.length} APIs fallaron`);
  return { exitosos, fallidos, todosLosResultados: resultados };
}

procesarMultiplesAPIs().then(({ exitosos }) => {
  console.log({ exitosos: exitosos });
});
