const monto = document.querySelector("#monto");
const bttnConvertir = document.querySelector("#convertir");
const selectDivisa = document.querySelector("#divisa");
const resultado = document.querySelector("#resultado");
const limpiar = document.querySelector("#reset");
const graficar = document.querySelector("#graficar");
const graficoDivisa = document.getElementById("graficoDivisa");


async function cargarJSON() {
  const response = await fetch("assets/json/mindicador.json");
  const data = await response.json();
  return data;
}

async function iniciar() {
  try {
    resultado.innerHTML = `
        <div class="d-flex justify-content-center mt-3">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      `;

    const currencySource = await cargarJSON();
    const claves = Object.keys(currencySource).filter((clave) => {
      const indicador = currencySource[clave];
      return (
        indicador.valor &&
        typeof indicador.valor === "number" &&
        indicador.unidad_medida !== "Porcentaje"
      );
    });

    selectDivisa.innerHTML = "";
    claves.forEach((clave) => {
      const indicador = currencySource[clave];
      const option = document.createElement("option");
      option.value = clave;
      option.textContent = `${indicador.nombre} (${clave.toUpperCase()})`;
      selectDivisa.appendChild(option);
    });

    resultado.innerHTML = ""; // limpiar spinner

    bttnConvertir.addEventListener("click", () => {
      const cantidadCLP = parseInt(monto.value);
      const claveSeleccionada = selectDivisa.value;
      resultado.style.display = "block";
      resultado.style.backgroundColor = "whitesmoke";
      if (isNaN(cantidadCLP) || cantidadCLP <= 0) {
        resultado.innerHTML = `
            <div class="alert alert-warning text-center" role="alert">
              ⚠️ Ingresa un monto válido en CLP.
            </div>
          `;
        return;
      }

      const divisa = currencySource[claveSeleccionada];

      if (!divisa || !divisa.valor) {
        resultado.innerHTML = `
            <div class="alert alert-danger text-center" role="alert">
              ❌ No se pudo obtener el valor de la divisa seleccionada.
            </div>
          `;
        return;
      }

      const convertido = cantidadCLP / divisa.valor;

      resultado.innerHTML = `
          <div class="alert alert-success text-center" role="alert">
            💱 <strong>${cantidadCLP.toLocaleString(
              "es-CL"
            )} CLP</strong> equivale a 
            <strong>${convertido.toFixed(
              2
            )}</strong> ${claveSeleccionada.toUpperCase()} <br>
            <small>Valor utilizado: ${divisa.valor.toLocaleString(
              "es-CL"
            )} CLP/${claveSeleccionada.toUpperCase()}</small>
          </div>
        `;
    });
  } catch (error) {
    resultado.innerHTML = `
        <div class="alert alert-danger text-center" role="alert">
          ❌ Error al cargar los datos desde el archivo JSON.<br>
          <span>Error: ${error.message}</span>
        </div>
      `;
  }
}
// Llamar a la función al cargar la página
iniciar();

graficar.addEventListener("click", async () => {
  try {
    const claveSeleccionada = selectDivisa.value;
    const response = await fetch("assets/json/evolucionDivisas.json");
    const datosEvolucion = await response.json();

    const divisaData = datosEvolucion.find(
      (item) => item.divisa === claveSeleccionada
    );

    if (!divisaData) {
      alert("No se encontraron datos de evolución para esta divisa.");
      return;
    }

    const labels = Object.keys(divisaData.valor);
    const valores = Object.values(divisaData.valor);

    // Destruye gráfico anterior si existe
    if (window.miGrafico) {
      window.miGrafico.destroy();
    }

    window.miGrafico = new Chart(graficoDivisa, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `Evolución de ${claveSeleccionada.toUpperCase()} (últimos 10 días)`,
            data: valores,
            borderColor: "rgba(245, 133, 59, 1)",
            backgroundColor: "rgba(116, 192, 252, 0.2)",
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: "whitesmoke",
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            color: "whitesmoke",
          },
        },
        scales: {
          x: {
        ticks: {
          color: "whitesmoke", // Cambia color de las etiquetas del eje X
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)", // Opcional: color de líneas de grilla
        },
      },
          y: {
            ticks: {
          color: "whitesmoke", // Cambia color de las etiquetas del eje Y
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)", // Opcional: líneas de grilla
        },
            beginAtZero: false,
          },
        },
      },
    });
  } catch (error) {
    alert("❌ Error al cargar los datos del gráfico: " + error.message);
  }
});
limpiar.addEventListener("click", () => {
  monto.value = "";
  selectDivisa.selectedIndex = 0;
  resultado.innerHTML = "";
  resultado.style.display = "none";
  if (window.miGrafico) {
    window.miGrafico.destroy();
    window.miGrafico = null;
  }
});

