// src/components/ChartDisplay.tsx

import React from "react";
import { Line } from "react-chartjs-2";
import { ChartData, ChartOptions } from "chart.js";
import Box from "@mui/material/Box";

// É necessário registrar os componentes do ChartJS aqui também se este for
// o único local que os utiliza diretamente em testes ou em outras partes da aplicação.
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface ChartDisplayProps {
  /**
   * O objeto de dados para o gráfico, contendo labels e datasets.
   */
  data: ChartData<"line">;
  /**
   * O objeto de opções para configurar a aparência e o comportamento do gráfico.
   */
  options: ChartOptions<"line">;
}

/**
 * Um componente de apresentação responsável por renderizar o gráfico de linha.
 * Ele desacopla a lógica de renderização do gráfico do componente da página principal.
 */
const ChartDisplay: React.FC<ChartDisplayProps> = ({ data, options }) => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: "300px",
        height: "40vh",
        border: "1px solid lightgray",
        borderRadius: 1,
        p: 1,
        position: "relative",
      }}
    >
      <Line data={data} options={options} />
    </Box>
  );
};

export default ChartDisplay;
