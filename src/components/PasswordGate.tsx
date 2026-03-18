import { useState } from "react";
import { Lock } from "lucide-react";

interface PasswordGateProps {
  title: string;
  description: string;
  onAuthenticated: () => void;
  checkPassword: (password: string) => Promise<boolean>;
}

const PasswordGate = ({ title, description, onAuthenticated, checkPassword }: PasswordGateProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const valid = await checkPassword(password);
    if (valid) {
      onAuthenticated();
    } else {
      setError("Senha incorreta");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border p-8 w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite a senha"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring text-center"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={!password || loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg text-sm uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordGate;
