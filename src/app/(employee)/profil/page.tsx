// src/app/(employee)/profile/page.tsx
export default function ProfilePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Section Photo & Infos basiques */}
        <div className="md:col-span-1">
          {/* Photo de profil */}
          {/* Nom, poste, département */}
        </div>
        
        {/* Section Formulaires */}
        <div className="md:col-span-2">
          {/* Infos personnelles */}
          {/* Contact */}
          {/* Préférences */}
          {/* Sécurité */}
        </div>
      </div>
    </div>
  );
}