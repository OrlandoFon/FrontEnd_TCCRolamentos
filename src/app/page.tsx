"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Button from "@mui/material/Button";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { ChartOptions } from "chart.js";

// Importa o custom hook e o novo componente de gráfico
import { useSimulation } from "../hooks/useSimulation";
import ChartDisplay from "../components/ChartDisplay"; // <-- Alteração aqui

interface BearingOption {
  value: string;
  label: string;
}

export default function Home() {
  const [selectedBearing, setSelectedBearing] = React.useState("");
  const [bearingsList, setBearingsList] = React.useState<BearingOption[]>([]);

  const {
    status,
    logs,
    chartData,
    currentMinute,
    rulValue,
    startSimulation,
    stopSimulation,
  } = useSimulation();

  React.useEffect(() => {
    const fetchBearings = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/bearings");
        const data: BearingOption[] = await response.json();
        setBearingsList(data);
      } catch (error) {
        console.error("Falha ao buscar rolamentos", error);
      }
    };
    fetchBearings();
  }, []);

  const handleSelectChange = (event: SelectChangeEvent) => {
    setSelectedBearing(event.target.value as string);
  };

  const handlePlay = () => {
    startSimulation(selectedBearing);
  };

  const isSimulationRunning =
    status === "Rodando" ||
    status.startsWith("Iniciando") ||
    status.startsWith("Conectado");

  // As opções do gráfico permanecem aqui, pois são uma configuração da página.
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    scales: {
      x: {
        title: { display: true, text: "Tempo (minuto do arquivo)" },
        type: "category",
        ticks: { autoSkip: true, maxTicksLimit: 20 },
      },
      yESI: {
        type: "linear",
        position: "left",
        title: { display: true, text: "ESI (g)" },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: { position: "top" as const },
      tooltip: { mode: "index" as const, intersect: false },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: { xs: 1, sm: 2 },
        backgroundColor: "grey.200",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: "1000px",
          height: "auto",
          minHeight: "90vh",
          p: { xs: 1, sm: 2, md: 3 },
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom textAlign="center">
          Monitoramento de Rolamentos 🩺
        </Typography>

        {/* Painel de Controle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
            p: 1,
            border: "1px solid lightgray",
            borderRadius: 1,
          }}
        >
          <FormControl sx={{ minWidth: 250, flexGrow: { xs: 1, sm: 0 } }}>
            <InputLabel>Rolamento</InputLabel>
            <Select
              value={selectedBearing}
              label="Rolamento"
              onChange={handleSelectChange}
            >
              <MenuItem value="">
                <em>Selecione um rolamento</em>
              </MenuItem>
              {bearingsList.map((b) => (
                <MenuItem key={b.value} value={b.value}>
                  {b.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handlePlay}
            disabled={isSimulationRunning || !selectedBearing}
          >
            Play
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<StopIcon />}
            onClick={stopSimulation}
            disabled={!isSimulationRunning}
          >
            Stop
          </Button>
        </Box>

        {/* Painel de Status */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            gap: 2,
            flexWrap: "wrap",
            p: 1,
            backgroundColor: "grey.100",
            borderRadius: 1,
          }}
        >
          <Typography>
            Rolamento: <strong>{selectedBearing || "-"}</strong>
          </Typography>
          <Typography>
            Minuto: <strong>{currentMinute}</strong>
          </Typography>
          <Typography>
            Status: <strong>{status}</strong>
          </Typography>
        </Box>

        {/* Gráfico (agora usando o componente dedicado) */}
        <ChartDisplay data={chartData} options={chartOptions} />

        {/* RUL */}
        <Box
          sx={{
            p: 1,
            backgroundColor: "primary.light",
            color: "white",
            borderRadius: 1,
          }}
        >
          <Typography variant="h6">
            RUL: <strong>{rulValue}</strong>
          </Typography>
        </Box>

        {/* Logs */}
        <Box
          sx={{
            mt: 1,
            height: "150px",
            overflowY: "auto",
            border: "1px solid lightgray",
            borderRadius: 1,
            p: 1,
            backgroundColor: "grey.50",
            fontSize: "0.8rem",
          }}
        >
          <Typography variant="subtitle2">Logs do Sistema:</Typography>
          {logs.map((log, index) => (
            <Typography
              key={index}
              variant="caption"
              display="block"
              component="div"
              sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}
            >
              {log}
            </Typography>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
