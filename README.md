# Frontend: Interface de Prognóstico de Rolamentos

Este é o repositório da camada de apresentação (frontend) de um sistema de Manutenção Preditiva (PdM) de código aberto desenvolvido como parte do TCC do curso de Bacharelado em Engenharia de Controle e Automação do IFSP - Campus Guarulhos por Orlando Fonseca. Desenvolvido com **Next.js**, **React** e **TypeScript**, este projeto proporciona uma interface web interativa para iniciar simulações, visualizar a degradação de rolamentos em tempo real e acompanhar a predição da vida útil remanescente (RUL).

O frontend consome dados de uma API de backend que executa os algoritmos de prognóstico (ESI e EKF) descritos no TCC do projeto.

-----

## 1. Funcionalidades Principais

* **Visualização em Tempo Real**: Renderiza gráficos dinâmicos que exibem a evolução do Indicador de Saúde (ESI) do rolamento, atualizados em tempo real via Server-Sent Events (SSE).
* **Controle da Simulação**: Permite ao usuário selecionar um caso de teste (rolamento) e iniciar ou parar a simulação de prognóstico a qualquer momento.
* **Painel de Status Dinâmico**: Exibe informações cruciais sobre o estado atual da simulação, incluindo o rolamento selecionado, o minuto do processo e o status geral (ex: "Rodando", "Finalizada", "Erro").
* **Exibição de RUL**: Apresenta o valor previsto para o Tempo de Vida Útil Remanescente (RUL) assim que é calculado pelo backend.
* **Interface Responsiva**: Utiliza a biblioteca **Material-UI** para garantir uma experiência de usuário consistente e adaptável a diferentes tamanhos de tela.
* **Logging de Eventos**: Mostra um log detalhado de todos os eventos da simulação, incluindo início, fim, erros e mensagens do backend, auxiliando na depuração e acompanhamento do processo.

-----

## 2. Arquitetura e Padrões de Projeto do Frontend

Este frontend atua como a **Camada de Apresentação** na arquitetura geral do sistema. Sua principal responsabilidade é oferecer uma UI robusta e desacoplada da lógica de negócio, que é executada no backend.

### 2.1. Comunicação com o Backend

A interação com a camada de aplicação (backend API) é feita de forma assíncrona através de:

1. **Requisições HTTP (`fetch`)**:
   * `GET /api/bearings`: Para buscar a lista de rolamentos disponíveis e popular o menu de seleção.
   * `POST /api/start-simulation`: Para enviar o comando de início da simulação com o rolamento selecionado.
   * `GET /api/stop-simulation`: Para enviar o comando de interrupção da simulação.

2. **Server-Sent Events (SSE)**:
   * Após o início da simulação, o frontend estabelece uma conexão persistente com o endpoint `/api/events` utilizando a interface `EventSource`.
   * Através desta conexão, o servidor envia um fluxo contínuo de dados (`ESI`, `RUL`, `status`), que são recebidos e processados em tempo real para atualizar a UI sem a necessidade de *polling*.

### 2.2. Padrões de Projeto Adotados

* **Custom Hooks para Encapsulamento de Lógica**: Toda a lógica de estado, gerenciamento de efeitos colaterais e comunicação com a API foi encapsulada no hook customizado `useSimulation.ts`. Isso remove a complexidade dos componentes de UI, que apenas consomem o estado e as funções expostas pelo hook (`status`, `chartData`, `startSimulation`, etc.), promovendo a reutilização e a clareza do código.

* **Separação Container/Componente de Apresentação**:
  * **`page.tsx`** atua como um **Container Component**. Ele é responsável por orquestrar a UI, gerenciar o estado da página (através do `useSimulation` hook) e passar os dados e callbacks necessários para os componentes filhos.
  * **`ChartDisplay.tsx`** é um **Presentational Component** puro. Sua única responsabilidade é renderizar o gráfico com base nos dados (`data`) e configurações (`options`) recebidos via `props`. Ele não possui estado próprio nem conhecimento da origem dos dados, o que o torna altamente reutilizável e fácil de testar.

-----

## 3. Tecnologias e Bibliotecas

| Categoria | Tecnologia/Biblioteca | Versão (Recomendada) | Papel no Projeto |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js | 14.x | Estrutura principal do projeto, oferecendo roteamento e renderização otimizada. |
| **Biblioteca UI** | React | 18.x | Base para a construção de componentes de interface de usuário reativos. |
| **Linguagem** | TypeScript | 5.x | Adiciona tipagem estática ao JavaScript para maior robustez e manutenibilidade. |
| **Componentes UI** | Material-UI (MUI) | 5.x | Fornece um conjunto de componentes de UI (Botões, Menus, etc.) prontos e estilizáveis. |
| **Gráficos** | Chart.js / react-chartjs-2 | 4.x / 5.x | Utilizados para a renderização dos gráficos de linha dinâmicos e interativos. |

-----

## 4. Estrutura de Pastas do Frontend

O diretório `frontend/` segue as convenções do Next.js App Router para uma organização clara e modular.

```
frontend/
└── src/
    ├── app/
    │   └── page.tsx             # Componente "Container" da página principal. Define o layout e orquestra a UI.
    ├── components/
    │   └── ChartDisplay.tsx     # Componente de "Apresentação" reutilizável para renderizar o gráfico.
    └── hooks/
        └── useSimulation.ts     # Hook customizado que encapsula toda a lógica de estado e comunicação.
```

-----

## 5. Instalação e Execução

### Pré-requisitos

* Node.js (versão 18.x ou superior)
* npm (geralmente instalado com o Node.js)

### Passos

1. **Clone o repositório** e navegue até a pasta do frontend:

   ```bash
   git clone https://github.com/OrlandoFon/FrontEnd_TCCRolamentos.git
   cd FrontEnd_TCCRolamentos/frontend
   ```

2. **Instale as dependências**:

   ```bash
   npm install
   ```

3. **Configuração da API**:
   O frontend precisa saber o endereço do backend. Configure a variável `API_BASE_URL` no arquivo `src/hooks/useSimulation.ts`:

   ```typescript
   // Em src/hooks/useSimulation.ts
   const API_BASE_URL =
     process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"; // Verifique se esta URL está correta
   ```

4. **Execute o servidor de desenvolvimento**:

   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**:
   Abra seu navegador e acesse [http://localhost:3000](http://localhost:3000).

> **Importante**: Para que o frontend funcione corretamente, a **API do backend (`backend-api`) deve estar em execução** na URL configurada no passo 3.

-----

## 6. Guia de Uso da Interface

1. Com a aplicação aberta no navegador, utilize o menu suspenso **"Rolamento"** para selecionar um dos casos de teste disponíveis.
2. Clique no botão **"Play"** para iniciar o processo de simulação. O status mudará para "Iniciando..." e depois para "Rodando".
3. Observe o gráfico sendo preenchido com os dados do ESI e os painéis de "Minuto" e "RUL" sendo atualizados em tempo real.
4. O painel de **"Logs do Sistema"** exibirá mensagens detalhadas sobre o andamento da simulação.
5. Para interromper o processo, clique no botão **"Stop"** a qualquer momento.

-----

## 7. Contribuição

Contribuições para melhorar o frontend são bem-vindas! Sinta-se à vontade para abrir uma *issue* para relatar bugs ou sugerir melhorias na interface. Para contribuições de código, por favor, siga o processo de *fork* e *pull request*.

Algumas áreas para contribuição incluem:

* Melhorar a experiência do usuário (UX) e a interface (UI).
* Adicionar novas funcionalidades de visualização aos gráficos.
* Refatorar componentes para maior reutilização.
* Melhorar o tratamento de erros e o feedback ao usuário.
