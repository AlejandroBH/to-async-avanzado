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

async function procesarMultiplesAPIs() {
  const llamadasAPI = [];

  URL_LIST.forEach((url) => {
    llamadasAPI.push(obtenerInformacionWeb(url));
  });

  const resultados = await Promise.allSettled(llamadasAPI);

  const exitosos = resultados
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  const fallidos = resultados
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason.message);

  console.log(exitosos);

  console.log(`${exitosos.length} APIs respondieron correctamente`);
  console.log(`${fallidos.length} APIs fallaron`);
  return { exitosos, fallidos, todosLosResultados: resultados };
}

procesarMultiplesAPIs();
