const URL_LIST = [
  "https://urlmalaquenoexiste.cl",
  "https://google.cl",
  "https://instagram.com",
];

async function obtenerInformacionWeb(url) {
  try {
    const respuesta = await fetch(url);
    const html = await respuesta.text();

    // Buscar titulo con expresión regular y asignarlo a variable
    const regexTitle = /<title[^>]*>(.*?)<\/title>/i;
    const match = html.match(regexTitle);
    let titulo = match[1].trim();

    // Devolver el título y la URL original
    return {
      titulo: titulo,
      url: url,
    };
  } catch (error) {
    throw new TypeError(error);
  }
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
