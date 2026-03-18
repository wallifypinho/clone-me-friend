import { QRCodeSVG } from "qrcode.react";

interface ThermalTicketProps {
  // Company
  companyName?: string;
  companyCnpj?: string;
  companyAddress?: string;
  companyCityUf?: string;
  companyPhone?: string;

  // Trip
  origem: string;
  destino: string;
  dataViagem: string;
  horario: string;
  poltrona: string;
  servico?: string;
  tipoServico: string;
  prefixo?: string;
  linha?: string;
  plataforma?: string;
  arrival?: string;

  // Passenger
  nomePassageiro: string;
  documento: string;
  tipoPassageiro?: string;
  localizador: string;

  // Financial
  tarifa: number;
  taxaEmbarque?: number;
  seguro?: number;
  desconto?: number;
  valorTotal: number;
  valorPago?: number;
  formaPagamento: string;
  statusPagamento: string;

  // Footer
  dataEmissao?: string;
  numeroPedido?: string;

  // QR
  qrValue?: string;
}

const Line = () => (
  <div className="border-t border-dashed border-gray-400 my-2" />
);

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex justify-between text-[11px] leading-tight">
    <span className="text-gray-600">{label}</span>
    <span className={bold ? "font-bold text-gray-900" : "text-gray-800"}>{value}</span>
  </div>
);

const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const formatDate = (d: string) => {
  if (!d) return "";
  if (d.includes("/")) return d;
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
};

const formatCpf = (v: string) => {
  const digits = v.replace(/\D/g, "");
  if (digits.length !== 11) return v;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const ThermalTicket = ({
  companyName = "VIAÇÃO EXEMPLO S.A.",
  companyCnpj,
  companyAddress,
  companyCityUf,
  companyPhone = "SAC: 0800 000 0000",
  origem,
  destino,
  dataViagem,
  horario,
  poltrona,
  servico,
  tipoServico,
  prefixo,
  linha,
  plataforma,
  arrival,
  nomePassageiro,
  documento,
  tipoPassageiro = "Adulto",
  localizador,
  tarifa,
  taxaEmbarque = 2.50,
  seguro = 0,
  desconto = 0,
  valorTotal,
  valorPago,
  formaPagamento,
  statusPagamento,
  dataEmissao,
  numeroPedido,
  qrValue,
}: ThermalTicketProps) => {
  const now = new Date();
  const emissao = dataEmissao || `${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  const pedido = numeroPedido || localizador;
  const pago = valorPago ?? valorTotal;
  const svcCode = servico || Math.floor(1000000 + Math.random() * 9000000).toString();
  const prefixoVal = prefixo || "00000000";
  const linhaVal = linha || `${origem} - ${destino}`;
  const plataformaVal = plataforma || "—";

  return (
    <div
      id="thermal-ticket"
      className="bg-white text-gray-900 mx-auto shadow-lg"
      style={{
        width: "340px",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "11px",
        padding: "20px 16px",
        lineHeight: 1.5,
      }}
    >
      {/* Company header */}
      <div className="text-center text-[10px] leading-tight mb-1">
        <p className="font-bold text-[12px]">{companyName}</p>
        {companyCnpj && <p>CNPJ: {companyCnpj}</p>}
        {companyAddress && <p>{companyAddress}</p>}
        {companyCityUf && <p>{companyCityUf}</p>}
        <p>{companyPhone}</p>
      </div>

      <Line />

      {/* Disclaimer */}
      <div className="text-center my-2">
        <p className="font-bold text-[13px] tracking-wide">PRÉVIA DE RESERVA</p>
        <div
          className="mx-auto mt-1 px-2 py-0.5 text-[9px] font-bold tracking-wider border rounded"
          style={{
            color: "#b91c1c",
            borderColor: "#b91c1c",
            background: "#fef2f2",
            display: "inline-block",
          }}
        >
          DOCUMENTO NÃO VÁLIDO PARA EMBARQUE
        </div>
      </div>

      <Line />

      {/* Trip details */}
      <div className="space-y-0.5 my-1">
        <Row label="Origem:" value={origem.toUpperCase()} bold />
        <Row label="Destino:" value={destino.toUpperCase()} bold />
        <Row label="Data:" value={formatDate(dataViagem)} />
        <Row label="Horário:" value={horario} />
        {arrival && <Row label="Chegada:" value={arrival} />}
        <Row label="Poltrona:" value={poltrona} bold />
        <Row label="Serviço:" value={svcCode} />
        <Row label="Tipo:" value={tipoServico.toUpperCase()} />
        <Row label="Prefixo:" value={prefixoVal} />
        <Row label="Linha:" value={linhaVal} />
        <Row label="Plataforma:" value={plataformaVal} />
      </div>

      <Line />

      {/* Passenger */}
      <div className="space-y-0.5 my-1">
        <p className="text-[10px] font-bold text-gray-500 tracking-wider">PASSAGEIRO</p>
        <Row label="Nome:" value={nomePassageiro.toUpperCase()} bold />
        <Row label="CPF:" value={formatCpf(documento)} />
        <Row label="Tipo:" value={tipoPassageiro} />
        <Row label="Localizador:" value={localizador} bold />
      </div>

      <Line />

      {/* Illustrative barcode */}
      <div className="flex justify-center my-2">
        <div className="flex items-end gap-[1px]" aria-hidden="true">
          {Array.from({ length: 60 }, (_, i) => (
            <div
              key={i}
              className="bg-gray-900"
              style={{
                width: i % 3 === 0 ? "2px" : "1px",
                height: `${20 + (i * 7) % 12}px`,
              }}
            />
          ))}
        </div>
      </div>

      <Line />

      {/* Financial */}
      <div className="space-y-0.5 my-1">
        <Row label="Tarifa" value={formatCurrency(tarifa)} />
        <Row label="Taxa de Embarque" value={formatCurrency(taxaEmbarque)} />
        <Row label="Seguro" value={formatCurrency(seguro)} />
        {desconto > 0 && <Row label="Desconto R$" value={formatCurrency(desconto)} />}
        <div className="border-t border-gray-300 my-1" />
        <Row label="Valor Total R$" value={formatCurrency(valorTotal)} bold />
        <Row label="Valor a Pagar R$" value={formatCurrency(pago)} bold />
        <div className="border-t border-gray-300 my-1" />
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-600">FORMA DE PAGAMENTO</span>
          <span className="text-gray-600">VALOR PAGO R$</span>
        </div>
        <div className="flex justify-between text-[11px] font-bold">
          <span>{formaPagamento.toUpperCase()}</span>
          <span>{formatCurrency(pago)}</span>
        </div>
      </div>

      <Line />

      {/* Payment status */}
      <div className="text-center my-2">
        <span
          className="inline-block px-3 py-1 text-[10px] font-bold tracking-wider rounded"
          style={{
            background:
              statusPagamento === "paid" || statusPagamento === "approved"
                ? "#dcfce7"
                : "#fef9c3",
            color:
              statusPagamento === "paid" || statusPagamento === "approved"
                ? "#166534"
                : "#854d0e",
          }}
        >
          {statusPagamento === "paid" || statusPagamento === "approved"
            ? "PAGAMENTO CONFIRMADO"
            : statusPagamento === "awaiting_payment"
            ? "AGUARDANDO PAGAMENTO"
            : "PENDENTE"}
        </span>
      </div>

      <Line />

      {/* QR Code - illustrative */}
      <div className="flex flex-col items-center my-3">
        <p className="text-[9px] text-gray-400 mb-1 tracking-wider">CONSULTA DA RESERVA</p>
        {qrValue ? (
          <QRCodeSVG value={qrValue} size={100} level="L" />
        ) : (
          <div
            className="bg-gray-100 border border-gray-300 flex items-center justify-center"
            style={{ width: 100, height: 100 }}
          >
            <span className="text-[8px] text-gray-400">QR ILUSTRATIVO</span>
          </div>
        )}
        <p className="text-[8px] text-gray-400 mt-1">Apenas para consulta interna</p>
      </div>

      <Line />

      {/* Footer */}
      <div className="text-center text-[9px] text-gray-500 space-y-1 mt-2">
        <p>Emissão: {emissao}</p>
        <p>Pedido: {pedido}</p>
        <div className="border-t border-gray-300 my-1" />
        <p className="text-[9px] leading-tight">
          Apresente um documento oficial com foto no embarque.
        </p>
        <p className="text-[9px] leading-tight">
          Este é um comprovante de reserva e poderá ser atualizado após confirmação final.
        </p>
      </div>

      {/* Non-official stamp */}
      <div className="flex justify-center mt-3">
        <div
          className="px-4 py-1 text-[10px] font-bold tracking-widest rounded border-2 rotate-[-3deg]"
          style={{
            color: "#991b1b",
            borderColor: "#991b1b",
            opacity: 0.6,
          }}
        >
          NÃO OFICIAL
        </div>
      </div>
    </div>
  );
};

export default ThermalTicket;
