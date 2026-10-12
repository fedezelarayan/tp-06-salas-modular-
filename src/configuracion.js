function cargarConfiguracion(env = process.env) {
  const puerto = env.PORT === undefined ? 3000 : Number(env.PORT);

  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    throw new Error(
      `PORT inválido: "${env.PORT}". Debe ser un entero entre 1 y 65535.`,
    );
  }

  const entorno = env.NODE_ENV || "development";
  const formatoRegistro = entorno === "production" ? "combined" : "dev";

  return { puerto, entorno, formatoRegistro };
}

module.exports = { cargarConfiguracion };
