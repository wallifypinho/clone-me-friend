import { QRCodeSVG } from "qrcode.react";

interface ThermalTicketProps {
  companyName?: string;
  companyLogo?: string;
  companyCnpj?: string;
  companyAddress?: string;
  companyCityUf?: string;
  companyPhone?: string;
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
  nomePassageiro: string;
  documento: string;
  tipoPassageiro?: string;
  localizador: string;
  tarifa: number;
  taxaEmbarque?: number;
  seguro?: number;
  desconto?: number;
  valorTotal: number;
  valorPago?: number;
  formaPagamento: string;
  statusPagamento: string;
  dataEmissao?: string;
  numeroPedido?: string;
  qrValue?: string;
}

const mono = "'Courier New', Courier, monospace";
const gray6 = "#4b5563";
const gray8 = "#1f2937";
const gray9 = "#111827";
const gray4 = "#9ca3af";
const gray3 = "#d1d5db";

const Line = () => (
  <div style={{ borderTop: "1px dashed #9ca3af", margin: "8px 0" }} />
);

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", lineHeight: "1.4", fontFamily: mono }}>
    <span style={{ color: gray6 }}>{label}</span>
    <span style={{ color: bold ? gray9 : gray8, fontWeight: bold ? 700 : 400 }}>{value}</span>
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
  companyLogo,
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
      style={{
        width: "340px",
        fontFamily: mono,
        fontSize: "11px",
        padding: "20px 16px",
        lineHeight: "1.5",
        background: "#ffffff",
        color: gray9,
        margin: "0 auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      {/* Company header */}
      <div style={{ textAlign: "center", fontSize: "10px", lineHeight: "1.4", marginBottom: "4px" }}>
        {companyLogo?.startsWith("http") && (
          <div style={{ marginBottom: "4px" }}>
            <img src={companyLogo} alt={companyName} style={{ height: "28px", maxWidth: "140px", objectFit: "contain", margin: "0 auto" }} />
          </div>
        )}
        <p style={{ fontWeight: 700, fontSize: "12px" }}>{companyName}</p>
        {companyCnpj && <p>CNPJ: {companyCnpj}</p>}
        {companyAddress && <p>{companyAddress}</p>}
        {companyCityUf && <p>{companyCityUf}</p>}
        <p>{companyPhone}</p>
      </div>

      <Line />

      {/* Title */}
      <div style={{ textAlign: "center", margin: "8px 0" }}>
        <p style={{ fontWeight: 700, fontSize: "13px", letterSpacing: "1px" }}>PRÉVIA DE RESERVA</p>
      </div>

      <Line />

      {/* Trip details */}
      <div style={{ margin: "4px 0" }}>
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
      <div style={{ margin: "4px 0" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: gray4, letterSpacing: "1.5px", marginBottom: "2px" }}>PASSAGEIRO</p>
        <Row label="Nome:" value={nomePassageiro.toUpperCase()} bold />
        <Row label="CPF:" value={formatCpf(documento)} />
        <Row label="Tipo:" value={tipoPassageiro} />
        <Row label="Localizador:" value={localizador} bold />
      </div>

      <Line />

      {/* Barcode */}
      <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1px" }} aria-hidden="true">
          {Array.from({ length: 60 }, (_, i) => (
            <div
              key={i}
              style={{
                width: i % 3 === 0 ? "2px" : "1px",
                height: `${20 + (i * 7) % 12}px`,
                background: gray9,
              }}
            />
          ))}
        </div>
      </div>

      <Line />

      {/* Financial */}
      <div style={{ margin: "4px 0" }}>
        <Row label="Tarifa" value={formatCurrency(tarifa)} />
        <Row label="Taxa de Embarque" value={formatCurrency(taxaEmbarque)} />
        <Row label="Seguro" value={formatCurrency(seguro)} />
        {desconto > 0 && <Row label="Desconto R$" value={formatCurrency(desconto)} />}
        <div style={{ borderTop: `1px solid ${gray3}`, margin: "4px 0" }} />
        <Row label="Valor Total R$" value={formatCurrency(valorTotal)} bold />
        <Row label="Valor a Pagar R$" value={formatCurrency(pago)} bold />
        <div style={{ borderTop: `1px solid ${gray3}`, margin: "4px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: mono }}>
          <span style={{ color: gray6 }}>FORMA DE PAGAMENTO</span>
          <span style={{ color: gray6 }}>VALOR PAGO R$</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, fontFamily: mono }}>
          <span>{formaPagamento.toUpperCase()}</span>
          <span>{formatCurrency(pago)}</span>
        </div>
      </div>

      <Line />

      {/* Payment status */}
      <div style={{ textAlign: "center", margin: "8px 0" }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "1px",
            borderRadius: "4px",
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

      {/* QR Code */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "12px 0" }}>
        <p style={{ fontSize: "9px", color: gray4, marginBottom: "4px", letterSpacing: "1.5px" }}>CONSULTA DA RESERVA</p>
        {qrValue ? (
          <QRCodeSVG value={qrValue} size={100} level="L" />
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              background: "#f3f4f6",
              border: `1px solid ${gray3}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "8px", color: gray4 }}>QR ILUSTRATIVO</span>
          </div>
        )}
        <p style={{ fontSize: "8px", color: gray4, marginTop: "4px" }}>Apenas para consulta interna</p>
      </div>

      <Line />

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "9px", color: "#6b7280", marginTop: "8px" }}>
        <p>Emissão: {emissao}</p>
        <p style={{ marginTop: "4px" }}>Pedido: {pedido}</p>
        <div style={{ borderTop: `1px solid ${gray3}`, margin: "4px 0" }} />
        <p style={{ fontSize: "9px", lineHeight: "1.4" }}>
          Apresente um documento oficial com foto no embarque.
        </p>
        <p style={{ fontSize: "9px", lineHeight: "1.4", marginTop: "4px" }}>
          Este é um comprovante de reserva e poderá ser atualizado após confirmação final.
        </p>
      </div>
    </div>
  );
};

export default ThermalTicket;
