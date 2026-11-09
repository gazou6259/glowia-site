// Transforme les réglages « Entraîner mon IA » d'un salon en consignes pour l'IA.
// Utilisé tel quel dans n8n (nœud « Compiler réglages ») et dans le portail (aperçu).
function compileReglages(r) {
  r = r || {};
  const t = (v) => String(v == null ? '' : v).trim();
  const L = [];
  const QUESTIONS = {
    prestation_precise: "Si la demande est vague (« un soin », « une coupe », « les ongles »), faire préciser la prestation exacte.",
    pose_a_retirer: "Demander s'il y a quelque chose à retirer ou à reprendre avant (pose d'ongles, extensions de cils ou de cheveux, ancienne couleur…).",
    origine_pose: "Si oui, demander si cela a été fait au salon ou ailleurs (le prix ou la durée peuvent changer).",
    options: "Demander si elle souhaite une option ou un supplément (décor, soin, brushing, couleur…).",
    longueur: "Demander la longueur ou l'état actuel (cheveux, ongles, cils…) quand cela change la durée ou le prix.",
    inspiration: "Proposer d'envoyer une photo d'inspiration si elle a une idée précise.",
    sensibilite: "Demander si elle a une sensibilité ou une allergie connue aux produits (coloration, épilation, cils, soins).",
    nb_personnes: "Demander pour combien de personnes est le rendez-vous si ce n'est pas clair (mariage, mère et fille…).",
    premiere_fois: "Demander si c'est sa première fois au salon."
  };

  if (r.registre === 'vous') L.push("- Vouvoie toujours les clientes.");
  else if (r.registre === 'tu') L.push("- Tutoie toujours les clientes.");
  else L.push("- Tu ou vous : adopte celui de la cliente ; en cas de doute, vouvoie.");
  if (r.emojis === 'aucun') L.push("- N'utilise aucun emoji.");
  else if (r.emojis === 'libres') L.push("- Tu peux utiliser quelques emojis, avec naturel.");
  else L.push("- Un seul emoji maximum par message, en fin de message.");
  if (r.longueur === 'detaille') L.push("- Tu peux faire des réponses un peu plus détaillées quand c'est utile.");
  else L.push("- Réponses courtes : 1 à 3 phrases.");

  if (t(r.presentation)) L.push("\nPRÉSENTATION DU SALON (à utiliser si on te demande qui est le salon ou ce qu'il propose) :\n" + t(r.presentation));

  const infos = [
    ['Moyens de paiement', r.paiement], ['Acompte', r.acompte], ['Retard', r.retard],
    ['Annulation', r.annulation], ['Accès et stationnement', r.acces], ['Autres informations', r.infos_autres]
  ].filter(x => t(x[1]));
  if (infos.length) L.push("\nINFOS PRATIQUES (donne-les telles quelles quand c'est utile, n'en invente pas d'autres) :\n" + infos.map(x => '- ' + x[0] + ' : ' + t(x[1])).join('\n'));

  const qs = (Array.isArray(r.questions) ? r.questions : []).map(k => QUESTIONS[k]).filter(Boolean);
  t(r.questions_perso).split('\n').map(t).filter(Boolean).forEach(q => qs.push(q));
  if (qs.length) L.push("\nAVANT DE PROPOSER UN CRÉNEAU, assure-toi d'avoir ces réponses (pose seulement les questions dont tu n'as pas la réponse, 2 maximum par message) :\n" + qs.map(q => '- ' + q).join('\n'));

  if (t(r.regles_prix)) L.push("\nRÈGLES DE PRIX DE LA GÉRANTE (elles priment sur tout calcul) :\n" + t(r.regles_prix));

  const faq = (Array.isArray(r.faq) ? r.faq : []).filter(x => x && t(x.q) && t(x.r));
  if (faq.length) L.push("\nRÉPONSES TYPES (si la cliente pose une question de ce genre, réponds dans ce sens, avec tes mots) :\n" + faq.map(x => '- Question : ' + t(x.q) + '\n  Réponse : ' + t(x.r)).join('\n'));

  const sp = (Array.isArray(r.speciales) ? r.speciales : []).filter(x => x && t(x.sujet) && t(x.reponse));
  if (sp.length) L.push("\nDEMANDES PARTICULIÈRES :\n" + sp.map(x => '- Si on te parle de « ' + t(x.sujet) + ' » : ' + t(x.reponse)).join('\n'));

  if (t(r.relais)) L.push("\nSUJETS À LAISSER À LA GÉRANTE (réponds seulement que tu lui transmets, sans rien promettre) :\n" + t(r.relais).split('\n').map(t).filter(Boolean).map(x => '- ' + x).join('\n'));

  if (t(r.interdits)) L.push("\nCE QUE TU NE DOIS JAMAIS DIRE OU FAIRE :\n" + t(r.interdits).split('\n').map(t).filter(Boolean).map(x => '- ' + x).join('\n'));

  const cor = (Array.isArray(r.corrections) ? r.corrections : []).filter(x => x && t(x.apres));
  if (cor.length) L.push("\nCORRECTIONS DE LA GÉRANTE (exemples réels à suivre absolument) :\n" + cor.slice(-15).map(x => (t(x.situation) ? '- Situation : ' + t(x.situation) + '\n  ' : '- ') + (t(x.avant) ? 'Ne réponds pas : « ' + t(x.avant) + ' »\n  ' : '') + 'Réponds plutôt : « ' + t(x.apres) + ' »').join('\n'));

  return L.join('\n').slice(0, 9000);
}
if (typeof module !== 'undefined') module.exports = { compileReglages };
