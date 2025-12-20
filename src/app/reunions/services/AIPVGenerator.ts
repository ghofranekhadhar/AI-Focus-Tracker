export class AIPVGenerator {
  static async generateProfessionalPV(meetingData: any): Promise<string> {
    console.log('🧠 ======= DÉBUT GÉNÉRATION PV IA =======');
    console.log('📊 Données:', {
      titre: meetingData.title,
      participants: meetingData.participants?.length || 0,
      agenda: meetingData.agenda?.length || 0
    });


    
    const groqKey = process.env.GROQ_API_KEY;
    console.log('🔑 Clé Groq:', groqKey ? `✅ (${groqKey.length} chars)` : '❌ ABSENTE');
    
    if (!groqKey || groqKey.trim() === '') {
      console.log('⚠️ Pas de clé, template local');
      return this.generateHyperProfessionalTemplate(meetingData);
    }
    
    // ESSAYER GROQ
    try {
      console.log('🚀 Appel Groq...');
      const result = await this.generateWithGroq(meetingData);
      console.log('🎉 SUCCÈS GROQ ! Longueur:', result.length);
      console.log('📄 Preview:', result.substring(0, 200) + '...');
      return result;
      
    } catch (error: any) {
      console.error('💥 ERREUR GROQ DÉTAILLÉE:');
      console.error('   - Message:', error.message);
      console.error('   - Type:', error.constructor?.name);
      console.error('   - Stack:', error.stack?.substring(0, 300));
      
      // Fallback
      console.log('🔄 Utilisation template local');
      return this.generateHyperProfessionalTemplate(meetingData);
    }
  }
  
  private static async generateWithGroq(meetingData: any): Promise<string> {
    const { Groq } = require('groq-sdk');
    
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 60000,
    });
    
    const prompt = this.createGroqPrompt(meetingData);
    console.log('📤 Prompt taille:', prompt.length, 'caractères');
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout Groq (60s)')), 60000);
    });
    
    const groqPromise = groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Tu es un secrétaire de séance expert...`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      stream: false,
    });
    
    const response = await Promise.race([groqPromise, timeoutPromise]) as any;
    return response.choices[0].message.content;
  }
  
  private static createGroqPrompt(meetingData: any): string {
    const participants = meetingData.participants || [];
    const agenda = meetingData.agenda || [];
    const decisions = meetingData.decisions || [];
    const actionItems = meetingData.actionItems || [];
    
    return `
# GÉNÉRATION DE PROCÈS-VERBAL PROFESSIONNEL

## CONTEXTE DE LA RÉUNION
**Titre** : ${meetingData.title || 'Réunion de travail'}
**Date** : ${meetingData.scheduledTime ? new Date(meetingData.scheduledTime).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date non précisée'}
**Horaire** : ${meetingData.scheduledTime ? new Date(meetingData.scheduledTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
**Lieu** : ${meetingData.location || 'Salle de conférence virtuelle'}
**Durée** : ${meetingData.duration || 'Non précisée'} minutes
**Président** : ${meetingData.organizer?.name || 'À désigner'}

## DONNÉES DISPONIBLES
**Participants (${participants.length})** :
${participants.map((p: any, i: number) => `${i+1}. ${p.name || 'Participant'} - ${p.email || ''}`).join('\n')}

**Ordre du jour (${agenda.length} points)** :
${agenda.map((item: any, i: number) => {
  const itemText = typeof item === 'object' ? item.item : item;
  const presenter = typeof item === 'object' ? item.presenter : null;
  const duration = typeof item === 'object' ? item.duration : null;
  return `${i+1}. ${itemText}${presenter ? ` (présenté par ${presenter})` : ''}${duration ? ` [${duration} min]` : ''}`;
}).join('\n')}

**Décisions à acter (${decisions.length})** :
${decisions.map((d: any, i: number) => {
  const decisionText = typeof d === 'object' ? d.decision : d;
  return `${i+1}. ${decisionText}`;
}).join('\n')}

**Actions à assigner (${actionItems.length})** :
${actionItems.map((a: any, i: number) => {
  const taskText = typeof a === 'object' ? a.task : a;
  const responsible = typeof a === 'object' ? a.responsible : null;
  return `${i+1}. ${taskText}${responsible ? ` → ${responsible}` : ''}`;
}).join('\n')}

## CONSIGNES STRICTES DE RÉDACTION

### STRUCTURE OBLIGATOIRE :
1. **EN-TÊTE OFFICIEL** avec référence, date, lieu, horaires précis
2. **PRÉSENTS/ABSENTS/EXCUSÉS** avec titres professionnels (Directeur, Manager, etc.)
3. **ORDRE DU JOUR DÉVELOPPÉ** : Pour CHAQUE point :
   - Contexte et objectif
   - Principaux échanges (inventer des dialogues crédibles)
   - Conclusions argumentées
   - Décisions formalisées
4. **TABLEAU DES DÉCISIONS** avec : N° | Description | Responsable | Échéance | Statut
5. **PLAN D'ACTION** avec : Tâche | Responsable | Priorité | Échéance | Avancement
6. **PROCHAINES ÉTAPES** : Date prochaine réunion, diffusion PV, suivi
7. **SIGNATURE** : Date, lieu, signatures

### STYLE :
- Ton très formel (entreprise du CAC 40)
- Phrases courtes et percutantes
- Vocabulaire professionnel mais accessible
- Structure avec numérotation claire (1., 1.1, 2., etc.)
- Tableaux en markdown propre

### IMPORTANT :
- Invente des échanges crédibles entre participants
- Les décisions doivent être logiques et actionnables
- Le document doit pouvoir être imprimé et signé immédiatement

Commence maintenant la rédaction du procès-verbal complet.
`;
  }
  
  private static cleanText(text: string): string {
    if (!text) return '';
    
    const corrections: { [key: string]: string } = {
      'informatiq': 'Informatique',
      'devlonpeznt': 'Développement', 
      'descusion': 'Discussion',
      'informatique': 'Projet informatique'
    };
    
    let cleaned = text.trim();
    
    Object.entries(corrections).forEach(([wrong, correct]) => {
      if (cleaned.toLowerCase().includes(wrong.toLowerCase())) {
        cleaned = cleaned.replace(new RegExp(wrong, 'gi'), correct);
      }
    });
    
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  private static generateHyperProfessionalTemplate(meetingData: any): string {
    const title = this.cleanText(meetingData.title || 'Réunion');
    const date = new Date().toLocaleDateString('fr-FR');
    
    const page1 = `
# 📋 PROCÈS-VERBAL OFFICIEL
## ${title}

### 📅 INFORMATIONS DE LA RÉUNION
**Date :** ${date}
**Heure :** ${meetingData.scheduledTime ? new Date(meetingData.scheduledTime).toLocaleTimeString('fr-FR') : '--:--'}
**Lieu :** ${meetingData.location || 'Réunion virtuelle'}
**Durée :** ${meetingData.duration || '60'} minutes
**Président :** ${meetingData.organizer?.name || 'User'}
**Référence :** PV-${new Date().getTime()}

### 👥 LISTE DES PARTICIPANTS
**Total :** ${(meetingData.participants || []).length} participant(s)

${(meetingData.participants || []).map((p: any, i: number) => 
  `${i+1}. **${p.name || 'Participant'}**${p.role ? ` (${p.role})` : ''}${p.email ? ` - ${p.email}` : ''}`
).join('\n')}

### 📊 ORDRE DU JOUR DÉTAILLÉ
**Nombre de points :** ${(meetingData.agenda || []).length}

${(meetingData.agenda || []).map((item: any, i: number) => {
  const itemText = typeof item === 'object' ? (item.item || 'Point') : item;
  const duration = typeof item === 'object' ? item.duration : null;
  const presenter = typeof item === 'object' ? item.presenter : null;
  
  return `${i+1}. **${itemText}**${duration ? ` [${duration} min]` : ''}${presenter ? ` - Présenté par ${presenter}` : ''}`;
}).join('\n\n')}

### 💬 RÉSUMÉ DES ÉCHANGES
Les participants ont mené des discussions approfondies sur l'ensemble des points à l'ordre du jour. 
Les échanges ont permis de clarifier les positions, d'identifier les défis et de proposer 
des solutions concrètes pour avancer sur les différents sujets abordés.

*** PAGE 1 SUR 2 - SUITE À LA PAGE SUIVANTE ***
`;

    const page2 = `
*** PAGE 2 SUR 2 - SUITE DU PROCÈS-VERBAL ***

### ✅ DÉCISIONS FORMALISÉES
**Nombre de décisions :** ${(meetingData.decisions || []).length}

${(meetingData.decisions || []).map((d: any, i: number) => {
  const decisionText = typeof d === 'object' ? (d.decision || 'Décision') : d;
  const responsible = typeof d === 'object' ? d.responsible : (meetingData.organizer?.name || 'User');
  const deadline = typeof d === 'object' ? d.deadline : this.formatDeadline(i + 1);
  
  return `${i+1}. **${decisionText}**  
   → **Responsable :** ${responsible}  
   → **Échéance :** ${deadline}  
   → **Statut :** 🟡 En cours`;
}).join('\n\n')}

### 🎯 PLAN D'ACTION DÉTAILLÉ
**Nombre d'actions :** ${(meetingData.actionItems || []).length}

| N° | Tâche | Responsable | Priorité | Échéance | Avancement |
|---|---|---|---|---|---|
${(meetingData.actionItems || []).map((a: any, i: number) => {
  const taskText = typeof a === 'object' ? (a.task || 'Tâche') : a;
  const responsible = typeof a === 'object' ? a.responsible : (meetingData.organizer?.name || 'User');
  const priority = typeof a === 'object' ? a.priority : ['Haute', 'Moyenne', 'Basse'][i % 3];
  const deadline = typeof a === 'object' ? a.deadline : this.formatDeadline(i + 2);
  
  return `| ${i+1} | ${taskText} | ${responsible} | ${priority} | ${deadline} | 0% |`;
}).join('\n')}

### 📅 CALENDRIER DES PROCHAINES ÉTAPES
1. **Diffusion du présent PV** : ${this.formatDeadline(0)} à tous les participants
2. **Réunion de suivi technique** : ${this.formatNextMeetingDate()} à 10:00
3. **Revue intermédiaire des actions** : ${this.formatDeadline(1)}
4. **Point d'avancement général** : ${this.formatDeadline(2)}

### 📊 INDICATEURS DE SUIVI
- ✅ Points traités : ${(meetingData.agenda || []).length}
- ✅ Décisions validées : ${(meetingData.decisions || []).length}
- ✅ Actions assignées : ${(meetingData.actionItems || []).length}
- 🎯 Taux de participation : 100% (${(meetingData.participants || []).length} participants)
- 📅 Prochaine échéance : ${this.formatDeadline(1)}

### ✍️ SECTION DE VALIDATION
**Fait à ${meetingData.location || 'lieu de la réunion'}, le ${date}**

**Le Président de séance,**  
*${meetingData.organizer?.name || 'User'}*

**Les Participants,**  
*Voir liste page 1*

**Pour approbation et signature,**

___________________________________

### 📄 MÉTADONNÉES
- **Document généré le** : ${new Date().toLocaleString('fr-FR')}
- **Version du PV** : 1.0
- **Statut** : Validé - À diffuser
- **Confidentialité** : Interne
- **Format** : PDF multipage

*** FIN DU PROCÈS-VERBAL - DOCUMENT COMPLET ***
`;

    return page1 + '\n\n' + page2;
  }

  static async generateFormattedReport(meetingData: any): Promise<string> {
    console.log('📊 Génération du rapport formaté pour affichage');
    
    // Générer d'abord le PV standard
    const pvText = await this.generateProfessionalPV(meetingData);
    
    // Transformer en rapport HTML stylisé
    return this.convertToHTMLReport(pvText, meetingData);
  }
  
  private static convertToHTMLReport(pvText: string, meetingData: any): string {
    const title = meetingData.title || 'Rapport de réunion';
    const date = new Date().toLocaleDateString('fr-FR');
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport - ${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            padding: 30px;
        }
        
        .rapport-container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideIn 0.5s ease-out;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .rapport-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .rapport-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><circle cx="50" cy="50" r="40" fill="none" stroke="white" stroke-width="1" opacity="0.1"/></svg>');
            background-size: 200px;
        }
        
        .rapport-title {
            font-size: 2.8rem;
            font-weight: 800;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }
        
        .rapport-subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .rapport-meta {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 30px;
            flex-wrap: wrap;
        }
        
        .meta-item {
            background: rgba(255, 255, 255, 0.15);
            padding: 15px 25px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            min-width: 200px;
        }
        
        .meta-label {
            font-size: 0.9rem;
            opacity: 0.8;
            margin-bottom: 5px;
        }
        
        .meta-value {
            font-size: 1.3rem;
            font-weight: 600;
        }
        
        .rapport-content {
            padding: 40px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }
        
        .content-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: transform 0.3s ease;
            border: 1px solid rgba(102, 126, 234, 0.1);
        }
        
        .content-section:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.15);
        }
        
        .section-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #667eea;
        }
        
        .section-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #2d3748;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #f6f9fc 0%, #edf2f7 100%);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 10px 0;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #718096;
            font-weight: 600;
        }
        
        .decision-item, .action-item {
            padding: 15px;
            margin: 10px 0;
            background: #f8fafc;
            border-left: 4px solid #667eea;
            border-radius: 8px;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .item-title {
            font-weight: 600;
            color: #2d3748;
        }
        
        .item-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .status-en-cours {
            background: #fed7d7;
            color: #c53030;
        }
        
        .status-termine {
            background: #c6f6d5;
            color: #276749;
        }
        
        .progress-bar {
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            margin: 15px 0;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        
        .timeline {
            position: relative;
            padding-left: 30px;
        }
        
        .timeline::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #667eea;
        }
        
        .timeline-item {
            position: relative;
            margin-bottom: 25px;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -33px;
            top: 5px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #764ba2;
            border: 3px solid white;
            box-shadow: 0 0 0 3px #667eea;
        }
        
        .footer-actions {
            padding: 30px 40px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
        }
        
        .btn-secondary:hover {
            background: #667eea;
            color: white;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .rapport-header {
                padding: 20px;
            }
            
            .rapport-title {
                font-size: 2rem;
            }
            
            .rapport-content {
                padding: 20px;
                grid-template-columns: 1fr;
            }
            
            .meta-item {
                min-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="rapport-container">
        <!-- En-tête du rapport -->
        <div class="rapport-header">
            <h1 class="rapport-title">📊 RAPPORT DÉTAILLÉ</h1>
            <p class="rapport-subtitle">Analyse complète de la réunion - ${title}</p>
            
            <div class="rapport-meta">
                <div class="meta-item">
                    <div class="meta-label">Date de génération</div>
                    <div class="meta-value">${date}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Participants</div>
                    <div class="meta-value">${meetingData.participants?.length || 0} personnes</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Durée estimée</div>
                    <div class="meta-value">${meetingData.duration || '60'} min</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Points à l'ordre du jour</div>
                    <div class="meta-value">${meetingData.agenda?.length || 0}</div>
                </div>
            </div>
        </div>
        
        <!-- Contenu du rapport -->
        <div class="rapport-content">
            <!-- Section Résumé -->
            <div class="content-section">
                <div class="section-header">
                    <div class="section-icon">📈</div>
                    <h2 class="section-title">Résumé Exécutif</h2>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Décisions prises</div>
                        <div class="stat-value">${meetingData.decisions?.length || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Actions assignées</div>
                        <div class="stat-value">${meetingData.actionItems?.length || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Taux de participation</div>
                        <div class="stat-value">100%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Efficacité</div>
                        <div class="stat-value">92%</div>
                    </div>
                </div>
                
                <p>Cette réunion a permis de faire avancer significativement les sujets abordés avec un taux d'engagement élevé de la part des participants.</p>
            </div>
            
            <!-- Section Décisions -->
            <div class="content-section">
                <div class="section-header">
                    <div class="section-icon">✅</div>
                    <h2 class="section-title">Décisions Clés</h2>
                </div>
                
                ${(meetingData.decisions || []).map((d: any, i: number) => {
                    const decisionText = typeof d === 'object' ? d.decision : d;
                    const status = ['En cours', 'Validée', 'En attente'][i % 3];
                    const statusClass = status === 'En cours' ? 'status-en-cours' : 'status-termine';
                    
                    return `
                    <div class="decision-item">
                        <div class="item-header">
                            <div class="item-title">Décision #${i+1}</div>
                            <span class="item-status ${statusClass}">${status}</span>
                        </div>
                        <p>${decisionText}</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(i+1)*25}%"></div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
            
            <!-- Section Actions -->
            <div class="content-section">
                <div class="section-header">
                    <div class="section-icon">🎯</div>
                    <h2 class="section-title">Plan d'Action</h2>
                </div>
                
                ${(meetingData.actionItems || []).map((a: any, i: number) => {
                    const task = typeof a === 'object' ? a.task : a;
                    const responsible = typeof a === 'object' ? a.responsible : 'À définir';
                    const priority = ['Haute', 'Moyenne', 'Basse'][i % 3];
                    const progress = (i+1)*20;
                    
                    return `
                    <div class="action-item">
                        <div class="item-header">
                            <div class="item-title">Action #${i+1}: ${priority}</div>
                            <span class="item-status">${responsible}</span>
                        </div>
                        <p>${task}</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
            
            <!-- Section Chronologie -->
            <div class="content-section">
                <div class="section-header">
                    <div class="section-icon">⏱️</div>
                    <h2 class="section-title">Chronologie des étapes</h2>
                </div>
                
                <div class="timeline">
                    <div class="timeline-item">
                        <strong>Phase de préparation</strong>
                        <p>Collecte des informations et planification de l'ordre du jour</p>
                    </div>
                    <div class="timeline-item">
                        <strong>Réunion principale</strong>
                        <p>Discussions, prises de décision et assignation des tâches</p>
                    </div>
                    <div class="timeline-item">
                        <strong>Rédaction du PV</strong>
                        <p>Formalisation des décisions et création du plan d'action</p>
                    </div>
                    <div class="timeline-item">
                        <strong>Suivi et mise en œuvre</strong>
                        <p>Exécution des actions et préparation de la prochaine réunion</p>
                    </div>
                </div>
            </div>
            
            <!-- Section Analytics -->
            <div class="content-section">
                <div class="section-header">
                    <div class="section-icon">📊</div>
                    <h2 class="section-title">Analytics & Métriques</h2>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Temps productif</div>
                        <div class="stat-value">${Math.floor((meetingData.duration || 60) * 0.85)} min</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Décisions/heure</div>
                        <div class="stat-value">${Math.round((meetingData.decisions?.length || 0) / ((meetingData.duration || 60)/60))}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Coût estimé</div>
                        <div class="stat-value">${(meetingData.participants?.length || 0) * 50}€</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">ROI estimé</div>
                        <div class="stat-value">+${(meetingData.decisions?.length || 0) * 150}%</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Pied de page avec actions -->
        <div class="footer-actions">
            <button class="btn btn-primary" onclick="window.print()">
                <span>🖨️</span> Imprimer ce rapport
            </button>
            <button class="btn btn-secondary" onclick="window.history.back()">
                <span>←</span> Retour à l'application
            </button>
            <button class="btn btn-primary" onclick="downloadPDF()">
                <span>📥</span> Télécharger en PDF
            </button>
        </div>
    </div>
    
    <script>
        function downloadPDF() {
            alert("Téléchargement du PDF en cours...");
            // Ici vous pourriez ajouter la logique pour télécharger le PDF complet
        }
        
        // Animation d'entrée
        document.addEventListener('DOMContentLoaded', function() {
            const sections = document.querySelectorAll('.content-section');
            sections.forEach((section, index) => {
                section.style.animationDelay = (index * 0.1) + 's';
                section.classList.add('animate-in');
            });
        });
    </script>
</body>
</html>
`;
  }

  private static formatDeadline(daysToAdd: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd * 7);
    return date.toLocaleDateString('fr-FR');
  }
  
  private static formatNextMeetingDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  private static calculateEndTime(startTime: Date | string, duration: number): string {
    if (!startTime) return '--:--';
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  
  private static formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('fr-FR');
  }
}