import {
  BLUEPRINT_LIMITS,
  type BadgeIconKey,
  type TrainingQuestion,
} from '../types/portal';

/**
 * Conteúdo Institucional Oficial — Cavalcante & Rolim | Signature Spaces
 * Inclui os documentos, comunicados, código de conduta, plano de endomarketing,
 * guia de cadastro no sistema de RH e aniversariantes reais de Dezembro.
 */

export const OFFICIAL_CR_LOGO_PATH = '/assets/aistudio/PORTAL_RH_-_LOGO_C_R_eb82e443.jpg';
export const RH_SIGNUP_GUIDE_PATH =
  '/assets/aistudio/PORTAL_RH_-_Cadastro_no_sistema_de_RH_-_Passo_a_Passo_fc984600.jpeg';
export const ENDOMARKETING_PDF_PATH =
  '/assets/aistudio/PORTAL_RH_-_Apresentacao_Endomarketing_576c75fc.pdf';
export const CODIGO_CONDUTA_PDF_PATH =
  '/assets/aistudio/PORTAL_RH_-_CR_Codigo_de_Conduta_e_Etica_2448ff7d.pdf';

export const HERO_BANNER_PATH = '/src/assets/images/hero_luxury_skyscraper_1795630072365.jpg';
export const PENTHOUSE_IMAGE_PATH = '/src/assets/images/announcement_penthouse_launch_1795630073004.jpg';
export const TRAINING_IMAGE_PATH = '/src/assets/images/training_architecture_safety_1795630072791.jpg';
export const DIRECTOR_AVATAR_PATH = '/src/assets/images/avatar_director_portrait_1795630073050.jpg';
export const ENGINEER_AVATAR_PATH = '/src/assets/images/avatar_engineer_portrait_1795630073470.jpg';

export const INITIAL_BRAND_SETTINGS = {
  logoDataUrl: OFFICIAL_CR_LOGO_PATH,
  heroImageUrl: HERO_BANNER_PATH,
  heroHeadline: 'Arquitetura que atravessa gerações',
  heroSubheadline:
    'Portal oficial de pessoas, cultura construtiva, endomarketing, código de conduta e excelência Signature Spaces da Cavalcante & Rolim Empreendimentos.',
};

export const INITIAL_BADGE_DEFINITIONS: Array<{
  id: string;
  title: string;
  description: string;
  criteria: string;
  iconKey: BadgeIconKey;
  accentHex: string;
  active: boolean;
}> = [
  {
    id: 'badge_capacete_ouro_cr',
    title: 'Capacete de Ouro CR',
    description:
      'Reconhecimento máximo por segurança no uso de EPIs, assiduidade, trabalho em equipe e qualidade na obra.',
    criteria: 'Concluir trilha Capacete de Ouro ou destaque mensal.',
    iconKey: 'hardhat',
    accentHex: '#C5A467',
    active: true,
  },
  {
    id: 'badge_guardiao_etica',
    title: 'Guardião da Ética',
    description:
      'Aprovação integral no Código de Conduta e Ética Corporativa (MANU-RH-V001).',
    criteria: 'Acertar as 5 questões do Código de Conduta C&R.',
    iconKey: 'shield',
    accentHex: '#D8BC83',
    active: true,
  },
  {
    id: 'badge_mestre_signature',
    title: 'Mestre Signature',
    description:
      'Domínio do padrão construtivo de alto luxo na Rota Ecológica dos Milagres e Maceió/AL.',
    criteria: 'Concluir módulo Padrão Signature Spaces.',
    iconKey: 'crown',
    accentHex: '#C5A467',
    active: true,
  },
  {
    id: 'badge_leitor_assiduo',
    title: 'Leitor Assíduo',
    description:
      'Acompanhamento contínuo dos comunicados oficiais e acervo documental da construtora.',
    criteria: 'Confirmar leitura de 3 comunicados ou documentos.',
    iconKey: 'award',
    accentHex: '#D8BC83',
    active: true,
  },
  {
    id: 'badge_embaixador_cr',
    title: 'Embaixador C&R',
    description:
      'Presença ativa e adesão à cultura familiar e de excelência da Cavalcante & Rolim.',
    criteria: 'Realizar check-in diário ou atingir 100 pontos.',
    iconKey: 'star',
    accentHex: '#C5A467',
    active: true,
  },
  {
    id: 'badge_excelencia_operacional',
    title: 'Excelência Operacional',
    description:
      'Referência de engajamento contínuo e governança entre escritório e canteiro de obras.',
    criteria: 'Alcançar 300+ pontos no ranking interno.',
    iconKey: 'medal',
    accentHex: '#C5A467',
    active: true,
  },
];

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'comunicado_plano_endomarketing_2026_s2',
    title: 'Plano Oficial de Endomarketing — 2º Semestre 2026 (Escritório & Obra)',
    category: 'Cultura & Pessoas' as const,
    summary:
      'Duas frentes, um só propósito: ações recorrentes para Escritório (~20 colaboradores) e Obra (~200 colaboradores), incluindo Prêmio Capacete de Ouro CR.',
    content: `Prezados colaboradores,

Apresentamos o Plano de Endomarketing da Cavalcante & Rolim Empreendimentos para o 2º Semestre de 2026 (Julho a Dezembro). O programa foi estruturado para atender com precisão nossas duas frentes internas:

• FRENTE 1 — ESCRITÓRIO (~20 colaboradores): Cinco pilares de atuação (Reconhecimento, Bem-estar, Cultura & Integração, Comunicação & Escuta e Desenvolvimento), com Café com a Diretoria mensal, Destaque do Mês, Caixa de Sugestões e Pesquisa de Clima.

• FRENTE 2 — OBRA (~200 colaboradores): Ações práticas apoiadas nos rituais de canteiro, como DDS turbinado semanal, Mural da Obra, Kit de Boas-vindas, Marcos da Obra, Indique um Colega, Trilha de Crescimento CR e o Prêmio Capacete de Ouro CR.

Consulte a seção completa "Endomarketing & Cultura" neste portal para acompanhar o calendário e a trilha de crescimento.`,
    imageUrl: PENTHOUSE_IMAGE_PATH,
    authorName: 'RH & Endomarketing C&R',
    pointsReward: 35,
    featured: true,
    status: 'published' as const,
  },
  {
    id: 'comunicado_codigo_conduta_etica_manu_v001',
    title: 'Publicação do Código de Conduta e Ética Corporativa (MANU-RH-V001)',
    category: 'Comunicado Oficial' as const,
    summary:
      'Diretrizes de integridade, tolerância zero ao assédio, proteção de dados (LGPD), jornada de 44h e canal de denúncias anônimo aprovado pelo Jurídico.',
    content: `A Cavalcante & Rolim Empreendimentos disponibiliza a todos os empregados próprios (CLT), prestadores de serviços terceirizados, estagiários e aprendizes a versão oficial do Código de Conduta e Ética Corporativa (MANU-RH-V001 · Rev. 000 · Emissão 09/10/2026).

Destaques obrigatórios:
1. Tolerância zero a assédio moral, sexual e eleitoral (Lei nº 14.457/2022).
2. Canal seguro e anônimo via QR Code nos refeitórios e murais ou Comissão Externa.
3. Entrega de atestado médico ou comprovante de ausência ao RH em até 48 horas.
4. Devolução obrigatória de fardamento e EPIs em caso de desligamento.
5. Sigilo profissional e mesa limpa conforme diretrizes da LGPD.

Acesse o treinamento na Academia C&R para responder ao Questionário Oficial de Fixação (5 questões) e conquistar o selo "Guardião da Ética".`,
    imageUrl: HERO_BANNER_PATH,
    authorName: 'Compliance & Jurídico C&R',
    pointsReward: 40,
    featured: true,
    status: 'published' as const,
  },
  {
    id: 'comunicado_cadastro_sistema_rh_passo_a_passo',
    title: 'Guia Passo a Passo: Cadastro de Currículo e Acesso no Sistema de RH',
    category: 'Cultura & Pessoas' as const,
    summary:
      'Instruções oficiais em 6 etapas para cadastro no sistema de RH, envio de currículo em PDF e uso do programa Indique um Colega.',
    content: `Para facilitar o programa "Indique um Colega" e a padronização dos cadastros no sistema de RH, disponibilizamos o guia visual oficial em 6 passos:

1. Acesse o portal indicado ou o QR Code divulgado nos murais;
2. Clique em "Cadastre-se";
3. Preencha os dados pessoais completos e carregue o currículo em PDF;
4. Escolha o cargo desejado para aparecer nos filtros de seleção;
5. Crie sua senha de acesso e confirme em CADASTRAR;
6. Cadastro concluído e elegível para os processos seletivos vigentes.

Lembrando que, pelo programa Indique um Colega, colaboradores que indicarem candidatos contratados e retidos após o período de experiência (~90 dias) recebem bônus de reconhecimento.`,
    imageUrl: TRAINING_IMAGE_PATH,
    authorName: 'Gestão de Pessoas C&R',
    pointsReward: 25,
    featured: false,
    status: 'published' as const,
  },
];

export const CODIGO_CONDUTA_EXAM_QUESTIONS: TrainingQuestion[] = [
  {
    question:
      'Questão 1: Qual é o prazo regulamentar para que o colaborador entregue ao RH o documento de justificativa de falta (atestado/comprovante)?',
    options: [
      'a) Até 24 horas após o retorno ao trabalho.',
      'b) Em até 48 horas a partir do início da ausência.',
      'c) No último dia útil do mês corrente.',
      'd) Apenas no momento da homologação da folha de pagamento.',
    ],
    correctIndex: 1,
  },
  {
    question:
      'Questão 2: Sobre o uso e devolução do fardamento (uniforme) corporativo, qual afirmativa está CORRETA?',
    options: [
      'a) O uniforme pode ser levado e mantido pelo colaborador após a demissão como item pessoal.',
      'b) O custo do primeiro uniforme é descontado na folha de pagamento.',
      'c) É obrigatória a devolução de todo o fardamento e EPIs no ato do desligamento para a assinatura da rescisão contratual.',
      'd) O colaborador pode trabalhar sem fardamento caso esteja em lavagem.',
    ],
    correctIndex: 2,
  },
  {
    question:
      'Questão 3: Como o Código de Conduta posiciona a prática de empréstimos financeiros entre colaboradores com características de agiotagem?',
    options: [
      'a) Permite, desde que o contrato seja registrado em cartório.',
      'b) É não recomendada e vedada; a empresa não assume a responsabilidade de intermediar a solução dessas situações.',
      'c) A empresa atua como fiadora dos empréstimos entre funcionários.',
      'd) É permitida apenas entre colaboradores de mesmo nível hierárquico.',
    ],
    correctIndex: 1,
  },
  {
    question:
      'Questão 4: Em relação aos colaboradores que possuem grau de parentesco entre si na área administrativa, qual é a regra imperativa?',
    options: [
      'a) Devem trabalhar em turnos opostos obrigatoriamente.',
      'b) Jamais podem trabalhar no mesmo prédio.',
      'c) Devem manter vínculo estritamente profissional e jamais exercer relação de subordinação direta ou hierárquica.',
      'd) Um dos parentes deve ser obrigatoriamente promovido para evitar conflitos.',
    ],
    correctIndex: 2,
  },
  {
    question:
      'Questão 5: Qual a tolerância e a sanção prevista para episódios comprovados de assédio sexual dentro da empresa?',
    options: [
      'a) Tolerância zero, aplicando-se demissão imediata por Justa Causa (CLT), além das implicações cíveis e criminais.',
      'b) Aplicação de suspensão de 3 dias sem remuneração.',
      'c) Mudança do funcionário infrator para outra obra da Rota Ecológica dos Milagres.',
      'd) Advertência verbal reservada conduzida pela diretoria.',
    ],
    correctIndex: 0,
  },
];

export const INITIAL_TRAININGS = [
  {
    id: 'treino_codigo_conduta_etica_cr',
    title: 'Código de Conduta e Ética Corporativa (MANU-RH-V001)',
    track: 'Compliance & Governança',
    durationMinutes: 25,
    pointsReward: 150,
    coverUrl: HERO_BANNER_PATH,
    summary:
      'Avaliação oficial de 5 questões sobre integridade, prevenção ao assédio, jornada de 44h, fardamento/EPIs, LGPD e direitos dos colaboradores.',
    lessons: [
      '01. Nossa História (25+ anos em Alagoas / Rota Ecológica dos Milagres), Missão, Visão e Valores.',
      '02. Vínculos Legais (CLT, Terceirizados, Estagiários Lei nº 11.788/2008 e Aprendizes CLT arts. 405/432).',
      '03. Tolerância Zero a Assédio Moral, Sexual e Eleitoral + Canal de Denúncias Anônimo.',
      '04. Jornada 44h, Fardamento/EPIs, Prazo de 48h para Atestados e Segurança da Informação (LGPD).',
    ],
    quizQuestion: CODIGO_CONDUTA_EXAM_QUESTIONS[0].question,
    quizOptions: CODIGO_CONDUTA_EXAM_QUESTIONS[0].options,
    correctOptionIndex: CODIGO_CONDUTA_EXAM_QUESTIONS[0].correctIndex,
    badgeAwarded: 'Guardião da Ética',
    status: 'published' as const,
  },
  {
    id: 'treino_capacete_ouro_trilha_obra',
    title: 'Programa Capacete de Ouro CR & Trilha de Crescimento',
    track: 'Obra & Reconhecimento',
    durationMinutes: 15,
    pointsReward: 110,
    coverUrl: TRAINING_IMAGE_PATH,
    summary:
      'Conheça os 4 critérios de avaliação mensal no canteiro (Segurança, Comportamento, Equipe e Qualidade) e o plano de carreira de Servente a Mestre de Obras.',
    lessons: [
      '01. Critérios do Capacete de Ouro CR: uso correto de EPIs, assiduidade, proatividade e capricho na entrega.',
      '02. Benefícios e anúncio no DDS no 1º dia útil do mês + Capacete de Ouro do Trimestre.',
      '03. Trilha de Crescimento CR: Servente → Oficial (3+ avaliações) → Encarregado de Frente → Mestre de Obras.',
    ],
    quizQuestion:
      'Quantas avaliações consistentes no Capacete de Ouro CR (segurança + qualidade) são base para a evolução de Servente para Oficial na Trilha de Crescimento?',
    quizOptions: [
      '3 ou mais avaliações consistentes no Capacete de Ouro CR',
      'Apenas indicação informal sem registro de segurança',
      '10 anos de empresa antes da primeira avaliação',
    ],
    correctOptionIndex: 0,
    badgeAwarded: 'Capacete de Ouro CR',
    status: 'published' as const,
  },
  {
    id: 'treino_padrao_signature_luxo_silencioso',
    title: 'Padrão Construtivo Signature Spaces & Luxo Silencioso',
    track: 'Arquitetura & Acabamento',
    durationMinutes: 18,
    pointsReward: 100,
    coverUrl: PENTHOUSE_IMAGE_PATH,
    summary:
      'Critérios de precisão milimétrica, seleção de pedras naturais, iluminação arquitetônica e vistoria impecável para os empreendimentos Signature Spaces.',
    lessons: [
      '01. Princípios do Luxo Silencioso na construção civil de alto padrão.',
      '02. Tolerâncias geométricas em alvenaria, esquadrias piso-teto e mármore travertino.',
      '03. Etiqueta de canteiro, preservação de peças entregues e vistoria final.',
    ],
    quizQuestion:
      'Qual é o pilar central do acabamento Signature Spaces durante a vistoria de entrega?',
    quizOptions: [
      'Rigor dimensional, harmonia de junções naturais e ausência de retrabalho visível',
      'Substituição de materiais naturais por revestimentos sintéticos para ganhar prazo',
      'Liberação da unidade antes da conferência acústica e lumínica',
    ],
    correctOptionIndex: 0,
    badgeAwarded: 'Mestre Signature',
    status: 'published' as const,
  },
];

export const INITIAL_DOCUMENTS = [
  {
    id: 'doc_codigo_conduta_etica_cr_2026',
    title: 'Código de Conduta e Ética Corporativa — Cavalcante & Rolim',
    docCode: 'MANU-RH-V001',
    sourceFormat: 'pdf' as const,
    category: 'Compliance & Jurídico',
    authorName: 'Aprovado pelo Jurídico · Diretoria C&R',
    isEncrypted: false,
    extractedContent: `# Código de Conduta e Ética Corporativa (MANU-RH-V001 · Rev. 000)

## 1. Apresentação, Missão, Visão e Valores
Com mais de 25 anos de experiência no mercado imobiliário alagoano, a Cavalcante & Rolim Empreendimentos consolidou-se como referência de alto padrão e luxo na região da Rota Ecológica dos Milagres/AL.

• Missão: Conceber empreendimentos imobiliários inovadores, com qualidade, segurança e rentabilidade, concretizando sonhos que atendam às expectativas de todos.
• Visão: Ser referência em empreendimentos imobiliários de médio e alto padrão em Alagoas, com sustentabilidade.
• Valores: Honestidade, Respeito, Comprometimento, Transparência nas relações, Ética, Competência técnica e Qualidade.

## 2. Distinções Legais de Vínculo
• Empregados Próprios (CLT): Aplicação compulsória a todos os níveis.
• Prestadores de Serviços e Terceirizados: Sujeitos às regras de integridade e segurança no ambiente de obra (disciplina conduzida pela empregadora direta mediante notificação formal).
• Estagiários (Lei nº 11.788/2008): Jornada máxima de 6h/dia e 30h/semana, sem punições disciplinares trabalhistas.
• Aprendizes e Menores de Idade (CLT, arts. 405 e 432): Vedado trabalho noturno, perigoso ou insalubre.

## 3. Fardamento, Ponto e Prazos Legais
| Tema | Diretriz Oficial Cavalcante & Rolim |
| --- | --- |
| Jornada Padrão | 44 horas semanais (ponto biométrico na sede e cartão manual nas obras) |
| Prazo de Atestados | Entrega ao RH em até 48 horas a contar do início da ausência |
| Fardamento & EPIs | Fornecimento gratuito; devolução obrigatória no ato do desligamento |
| Pagamento de Salário | Até o 5º dia útil do mês subsequente |
| 13º Salário | 1ª parcela até final de novembro; 2ª parcela até 20 de dezembro |

## 4. Combate ao Assédio, Canal de Denúncias e LGPD
Tolerância zero ao assédio moral, sexual (justa causa art. 482 CLT) e eleitoral. Denúncias podem ser registradas anonimamente via QR Code nos murais/refeitórios ou direcionadas à Comissão Externa, com apuração em rito de 5 etapas (triagem até 3 dias úteis, instrução até 15 dias úteis e decisão final em até 5 dias úteis) e garantia absoluta de não retaliação.`,
    pointsReward: 50,
    status: 'published' as const,
  },
  {
    id: 'doc_plano_endomarketing_2026',
    title: 'Plano de Endomarketing — 2º Semestre de 2026 (Julho a Dezembro)',
    docCode: 'CR-ENDO-2026-S2',
    sourceFormat: 'pdf' as const,
    category: 'Cultura & Endomarketing',
    authorName: 'RH & Marketing Interno C&R',
    isEncrypted: false,
    extractedContent: `# Plano de Endomarketing — 2º Semestre de 2026

## 1. Visão Geral & Duas Frentes
| Frente | Público Interno | Abordagem Estratégica |
| --- | --- | --- |
| Frente 1 — Escritório | Até 20 colaboradores | Alto-toque: Reconhecimento, Bem-estar, Cultura, Escuta e Desenvolvimento |
| Frente 2 — Obra | Cerca de 200 colaboradores | Simples, recorrente e apoiada em DDS turbinado, SIPAT e Capacete de Ouro |

## 2. Investimento Consolidado de Referência (Maceió/AL)
| Escopo | Estimativa do Semestre | Observação |
| --- | --- | --- |
| Escritório (20 pessoas) | R$ 6.000 – R$ 10.800 | Café, brindes, aniversariantes e datas comemorativas |
| Obra (~200 pessoas) | R$ 27.500 – R$ 44.000 | Inclui Kits de Boas-vindas, Kit Calor, DDS e Marcos da Obra |
| Total Consolidado | R$ 33.500 – R$ 54.800 | Compensado por retenção e economia via Indique um Colega |

## 3. Indicadores de Sucesso
• Escritório: ≥ 80% presença nos eventos coletivos · ≥ 70% resposta na pesquisa de clima · Redução de turnover nos primeiros 90 dias.
• Obra: ≥ 60% engajamento no DDS turbinado · Adesão dos encarregados ao Capacete de Ouro CR · Redução de incidentes/quase-acidentes · Promoções via Trilha de Crescimento CR.`,
    pointsReward: 40,
    status: 'published' as const,
  },
  {
    id: 'doc_planilha_aniversariantes_dezembro_2026',
    title: 'Relação Oficial de Aniversariantes de Dezembro — Matriz, Manta & Watal',
    docCode: 'CR-RH-ANIV-12',
    sourceFormat: 'xlsx' as const,
    category: 'Pessoas & Celebrações',
    authorName: 'Departamento Pessoal C&R',
    isEncrypted: false,
    extractedContent: `# Relação Oficial de Aniversariantes — Mês de Dezembro (2026)

| Colaborador | Data | Cargo | Unidade / SPE |
| --- | --- | --- | --- |
| LUIZ FARIAS COSTA NETO | 01/12 | PEDREIRO | Watal Patacho Eco Boutique Residence SPE |
| LUCAS AUGUSTO DE GUSMAO LIMA | 04/12 | SERVENTE DE PEDREIRO | Manta - Cavalcante e Rolim Design SPE |
| ADEILTON ANTONIO DA SILVA SANTOS FILHO | 04/12 | ENCARREGADO DE MANUTENÇÃO | Watal Patacho Eco Boutique Residence SPE |
| RONALDO SANTOS CANUTO | 05/12 | ENGENHEIRO CIVIL | Manta - Cavalcante e Rolim Design SPE |
| ALINE PATRICIA FERREIRA NUNES | 09/12 | SERVICOS GERAIS | Matriz - Cavalcante e Rolim Empreendimentos |
| FELIPE SEBASTIAO DA SILVA SANTOS | 14/12 | SERVENTE DE PEDREIRO | Manta - Cavalcante e Rolim Design SPE |
| ALESSANDRO SANTOS DA SILVA | 16/12 | SERVENTE DE PEDREIRO | Manta - Cavalcante e Rolim Design SPE |
| JOAO PAULO DOS SANTOS NASCIMENTO | 23/12 | AJUDANTE PRATICO | Watal Patacho Eco Boutique Residence SPE |
| JOSE EDSON TEIXEIRA | 24/12 | PEDREIRO | Watal Patacho Eco Boutique Residence SPE |`,
    pointsReward: 25,
    status: 'published' as const,
  },
];

export const INITIAL_BIRTHDAYS = [
  {
    id: 'bday_watal_luiz_farias',
    name: 'Luiz Farias Costa Neto',
    roleTitle: 'Pedreiro',
    department: 'Obra Watal',
    branch: 'Watal Patacho SPE',
    day: 1,
    month: 12,
    avatarUrl: '',
    active: true,
  },
  {
    id: 'bday_manta_lucas_augusto',
    name: 'Lucas Augusto de Gusmão Lima',
    roleTitle: 'Servente de Pedreiro',
    department: 'Obra Manta',
    branch: 'Manta Design SPE',
    day: 4,
    month: 12,
    avatarUrl: '',
    active: true,
  },
  {
    id: 'bday_watal_adeilton_antonio',
    name: 'Adeilton Antonio da Silva Santos Filho',
    roleTitle: 'Encarregado de Manutenção',
    department: 'Obra Watal',
    branch: 'Watal Patacho SPE',
    day: 4,
    month: 12,
    avatarUrl: '',
    active: true,
  },
  {
    id: 'bday_manta_ronaldo_canuto',
    name: 'Ronaldo Santos Canuto',
    roleTitle: 'Engenheiro Civil',
    department: 'Engenharia Manta',
    branch: 'Manta Design SPE',
    day: 5,
    month: 12,
    avatarUrl: DIRECTOR_AVATAR_PATH,
    active: true,
  },
  {
    id: 'bday_matriz_aline_patricia',
    name: 'Aline Patricia Ferreira Nunes',
    roleTitle: 'Serviços Gerais',
    department: 'Sede Matriz',
    branch: 'Matriz C&R',
    day: 9,
    month: 12,
    avatarUrl: ENGINEER_AVATAR_PATH,
    active: true,
  },
  {
    id: 'bday_manta_felipe_sebastiao',
    name: 'Felipe Sebastião da Silva Santos',
    roleTitle: 'Servente de Pedreiro',
    department: 'Obra Manta',
    branch: 'Manta Design SPE',
    day: 14,
    month: 12,
    avatarUrl: '',
    active: true,
  },
  {
    id: 'bday_manta_alessandro_santos',
    name: 'Alessandro Santos da Silva',
    roleTitle: 'Servente de Pedreiro',
    department: 'Obra Manta',
    branch: 'Manta Design SPE',
    day: 16,
    month: 12,
    avatarUrl: '',
    active: true,
  },
  {
    id: 'bday_watal_joao_paulo',
    name: 'João Paulo dos Santos Nascimento',
    roleTitle: 'Ajudante Prático',
    department: 'Obra Watal',
    branch: 'Watal Patacho SPE',
    day: 23,
    month: 12,
    avatarUrl: '',
    active: true,
  },
  {
    id: 'bday_watal_jose_edson',
    name: 'José Edson Teixeira',
    roleTitle: 'Pedreiro',
    department: 'Obra Watal',
    branch: 'Watal Patacho SPE',
    day: 24,
    month: 12,
    avatarUrl: '',
    active: true,
  },
];

export function clampText(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function validateAnnouncementPayload(title: string, summary: string, content: string): void {
  if (title.trim().length < 2 || title.length > BLUEPRINT_LIMITS.TITLE_MAX) {
    throw new Error(`Título deve ter entre 2 e ${BLUEPRINT_LIMITS.TITLE_MAX} caracteres.`);
  }
  if (summary.trim().length < 4 || summary.length > BLUEPRINT_LIMITS.SUMMARY_MAX) {
    throw new Error(`Resumo deve ter entre 4 e ${BLUEPRINT_LIMITS.SUMMARY_MAX} caracteres.`);
  }
  if (content.trim().length < 4 || content.length > BLUEPRINT_LIMITS.CONTENT_MAX) {
    throw new Error(`Conteúdo deve ter entre 4 e ${BLUEPRINT_LIMITS.CONTENT_MAX} caracteres.`);
  }
}
