// Custom Hook: useSimulation
// Encapsula toda a lógica e estado da simulação (Observer Pattern).
// O componente de UI se torna mais limpo, apenas consumindo o estado e as funções expostas por este hook.
import { useState, useRef, useCallback, useEffect } from "react";
import { ChartData } from "chart.js";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Tipos para os dados recebidos via SSE
interface EsiDataPoint {
  type: "esi";
  bearing: string;
  minute: number;
  value_raw_g?: number | null;
  value_smoothed_g?: number | null;
  error?: string;
}
interface RulDataPoint {
  type: "rul";
  bearing: string;
  minute: number;
  rul_predicted_min?: number | null;
  is_inf: boolean;
  is_nan: boolean;
}
type SseData =
  | EsiDataPoint
  | RulDataPoint
  | { type: string; [key: string]: any };

const initialChartData: ChartData<"line"> = {
  labels: [],
  datasets: [
    {
      label: "ESI (g) - Suavizado",
      data: [],
      borderColor: "rgb(75, 192, 192)",
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      yAxisID: "yESI",
      tension: 0.1,
    },
    {
      label: "ESI (g) - Bruto",
      data: [],
      borderColor: "rgb(255, 99, 132)",
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      yAxisID: "yESI",
      tension: 0.1,
    },
  ],
};

export const useSimulation = () => {
  const [status, setStatus] = useState("Ocioso");
  const [logs, setLogs] = useState<string[]>([]);
  const [chartData, setChartData] =
    useState<ChartData<"line">>(initialChartData);
  const [currentMinute, setCurrentMinute] = useState<string>("-");
  const [rulValue, setRulValue] = useState<string>("-");

  const eventSourceRef = useRef<EventSource | null>(null);

  const addLog = useCallback((message: string, type: string = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev.slice(-100),
      `[${time}] ${type.toUpperCase()}: ${message}`,
    ]);
  }, []);

  const resetState = useCallback(() => {
    setStatus("Ocioso");
    setChartData(initialChartData);
    setCurrentMinute("-");
    setRulValue("-");
    setLogs([]);
  }, []);

  const handleSseMessage = useCallback(
    (event: MessageEvent) => {
      const data: SseData = JSON.parse(event.data);

      switch (data.type) {
        case "esi":
          setStatus("Rodando");
          setCurrentMinute(String(data.minute));
          if (data.error) {
            addLog(`Erro no ESI min ${data.minute}: ${data.error}`, "error");
          }
          setChartData((prev) => {
            const newLabels = [...(prev.labels || [])];
            const newSmoothedData = [...(prev.datasets[0].data || [])];
            const newRawData = [...(prev.datasets[1].data || [])];

            if (!newLabels.includes(String(data.minute))) {
              newLabels.push(String(data.minute));
              newLabels.sort((a, b) => Number(a) - Number(b));
            }
            const labelIndex = newLabels.indexOf(String(data.minute));

            newSmoothedData[labelIndex] = data.value_smoothed_g ?? null;
            newRawData[labelIndex] = data.value_raw_g ?? null;

            return {
              labels: newLabels,
              datasets: [
                { ...prev.datasets[0], data: newSmoothedData },
                { ...prev.datasets[1], data: newRawData },
              ],
            };
          });
          break;

        case "rul":
          let rulDisplay = data.is_inf
            ? "Infinito"
            : data.rul_predicted_min
              ? `${Number(data.rul_predicted_min).toFixed(2)} min`
              : "N/A";
          setRulValue(`${rulDisplay} (no min ${data.minute})`);
          addLog(`RUL @ min ${data.minute}: ${rulDisplay}`);
          break;

        case "simulation_end":
        case "status":
          if (data.status === "completed" || data.type === "simulation_end") {
            setStatus(`Finalizada (${data.bearing})`);
            addLog(`Simulação para ${data.bearing} finalizada.`);
            eventSourceRef.current?.close();
          }
          break;

        case "error_python":
        case "error_system":
        case "error":
          const errorMsg = data.message || "Erro desconhecido na simulação";
          setStatus(`Erro: ${errorMsg.substring(0, 50)}...`);
          addLog(errorMsg, "error");
          eventSourceRef.current?.close();
          break;

        default:
          addLog(`[PYTHON LOG]: ${data.message || JSON.stringify(data)}`);
      }
    },
    [addLog],
  );

  const startSimulation = useCallback(
    async (bearingName: string) => {
      if (!bearingName) return;

      resetState();
      addLog(`Iniciando simulação para ${bearingName}...`);
      setStatus("Iniciando...");

      // Conecta ao stream de eventos do servidor (Observer)
      const es = new EventSource(`${API_BASE_URL}/events`);
      eventSourceRef.current = es;

      es.onopen = () => {
        addLog("Conectado ao servidor para atualizações.");
        setStatus("Conectado, aguardando dados...");
      };
      es.onmessage = handleSseMessage;
      es.onerror = () => {
        addLog("Erro na conexão SSE.", "error");
        setStatus("Erro de conexão SSE");
        es.close();
      };

      // Envia o comando para iniciar a simulação
      try {
        const response = await fetch(`${API_BASE_URL}/start-simulation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bearingName }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || `HTTP error ${response.status}`);
        addLog(result.message);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        addLog(`Falha ao iniciar simulação: ${errorMsg}`, "error");
        setStatus(`Falha ao iniciar`);
        es.close();
      }
    },
    [addLog, resetState, handleSseMessage],
  );

  const stopSimulation = useCallback(async () => {
    addLog("Tentando parar a simulação...");
    setStatus("Parando...");
    eventSourceRef.current?.close(); // Fecha a conexão do lado do cliente

    try {
      const response = await fetch(`${API_BASE_URL}/stop-simulation`);
      const result = await response.json();
      addLog(result.message);
      setStatus("Parada pelo usuário.");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`Erro ao parar simulação: ${errorMsg}`, "error");
      setStatus("Erro ao parar");
    }
  }, [addLog]);

  useEffect(() => {
    // Cleanup: Garante que a conexão SSE seja fechada quando o componente for desmontado
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return {
    status,
    logs,
    chartData,
    currentMinute,
    rulValue,
    startSimulation,
    stopSimulation,
  };
};
