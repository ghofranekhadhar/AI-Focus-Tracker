import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 Test API Groq appelé');
  
  const groqKey = process.env.GROQ_API_KEY;
  
  // Debug complet
  console.log('=== DEBUG ENVIRONNEMENT ===');
  console.log('GROQ_API_KEY présent:', !!groqKey);
  console.log('GROQ_API_KEY longueur:', groqKey?.length || 0);
  console.log('GROQ_API_KEY début:', groqKey?.substring(0, 15) + '...');
  console.log('=== FIN DEBUG ===');
  
  if (!groqKey) {
    return NextResponse.json({
      status: 'error',
      message: '❌ GROQ_API_KEY non trouvée dans .env.local',
      instructions: [
        '1. Ouvrez .env.local',
        '2. Ajoutez: GROQ_API_KEY=votre_clé_groq',
        '3. Redémarrez le serveur (npm run dev)'
      ],
      envKeys: Object.keys(process.env).filter(key => key.includes('GROQ') || key.includes('API'))
    }, { status: 200 });
  }
  
  if (groqKey.trim() === '') {
    return NextResponse.json({
      status: 'error',
      message: '❌ GROQ_API_KEY est vide',
      fix: 'Ajoutez votre clé dans .env.local'
    }, { status: 200 });
  }
  
  if (!groqKey.startsWith('gsk_')) {
    return NextResponse.json({
      status: 'error',
      message: '❌ Format de clé incorrect',
      expected: 'Doit commencer par "gsk_"',
      actual: `Commence par: "${groqKey.substring(0, 10)}..."`,
      fullKeyPreview: groqKey
    }, { status: 200 });
  }
  
  // Tester l'appel à Groq
  try {
    const { Groq } = require('groq-sdk');
    const groq = new Groq({ apiKey: groqKey });
    
    // Test très simple
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Dis 'Bonjour' en français" }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 10,
      temperature: 0.1
    });
    
    const response = completion.choices[0]?.message?.content || 'Pas de réponse';
    
    return NextResponse.json({
      status: 'success',
      message: '✅ GROQ fonctionne !',
      groqResponse: response,
      keyInfo: {
        length: groqKey.length,
        validFormat: groqKey.startsWith('gsk_'),
        preview: `gsk_...${groqKey.substring(groqKey.length - 6)}`
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Erreur Groq:', error);
    
    return NextResponse.json({
      status: 'error',
      message: '❌ Échec connexion Groq',
      error: error.message,
      errorType: error.constructor.name,
      suggestions: [
        'Vérifiez votre clé sur https://console.groq.com',
        'Vérifiez votre connexion internet',
        'Essayez avec curl: curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer VOTRE_CLE"'
      ]
    }, { status: 200 });
  }
}
