"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      // On vérifie le token auprès du backend
      fetch(`/api/auth/validate-invite?token=${token}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) setEmail(data.email);
          else setMessage("❌ Lien invalide ou expiré.");
        });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/complete-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fullName, password }),
      });

      const data = await res.json();
      if (res.ok) setMessage("✅ Compte créé avec succès !");
      else setMessage(`❌ ${data.error}`);
    } catch (error) {
      setMessage("❌ Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return <p>❌ Token manquant.</p>;

  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Créer votre compte</h2>

      {message && <p className="text-center mb-4">{message}</p>}

      {email && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="email"
            value={email}
            disabled
            className="border p-2 rounded-lg bg-gray-100"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
      )}
    </div>
  );
}
