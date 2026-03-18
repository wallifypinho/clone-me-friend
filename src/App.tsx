import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Resultados from "./pages/Resultados.tsx";
import SelecionarAssento from "./pages/SelecionarAssento.tsx";
import DadosPassageiro from "./pages/DadosPassageiro.tsx";
import Pagamento from "./pages/Pagamento.tsx";
import Confirmacao from "./pages/Confirmacao.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="/selecionar-assento" element={<SelecionarAssento />} />
          <Route path="/dados-passageiro" element={<DadosPassageiro />} />
          <Route path="/pagamento" element={<Pagamento />} />
          <Route path="/confirmacao" element={<Confirmacao />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
